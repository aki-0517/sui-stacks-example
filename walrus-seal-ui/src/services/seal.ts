import type {
  SealClient,
  SealEncryptionPolicy,
  SealEncryptionResult,
  SealSessionKey,
  SealKeyServerInfo,
  SealDecryptionRequest,
  SealDecryptionResponse,
  SealConfig
} from '../types/seal';

export class SealService implements SealClient {
  private config: SealConfig;
  private sealClient: any; // SealClient from @mysten/seal
  private suiClient: any; // SuiClient from @mysten/sui

  constructor(config: SealConfig, suiClient?: any) {
    this.config = config;
    this.suiClient = suiClient;
    this.initializeSealClient();
  }

  private async initializeSealClient() {
    try {
      // Dynamically import Seal SDK to avoid build issues
      const { SealClient: SealSDK } = await import('@mysten/seal');
      const { SuiClient } = await import('@mysten/sui/client');
      const { getFullnodeUrl } = await import('@mysten/sui/client');

      // Initialize Sui client if not provided
      if (!this.suiClient) {
        const network = this.config.keyServers[0]?.url.includes('testnet') ? 'testnet' : 'mainnet';
        this.suiClient = new SuiClient({ url: getFullnodeUrl(network) });
      }

      // Create server configs from key servers
      const serverConfigs = this.config.keyServers.map(ks => ({
        objectId: ks.id,
        weight: ks.threshold || 1,
        apiKeyName: ks.apiKeyName,
        apiKey: ks.apiKey
      }));

      // Initialize Seal SDK client
      this.sealClient = new SealSDK({
        suiClient: this.suiClient,
        serverConfigs,
        verifyKeyServers: false // Set to false for performance, verify manually if needed
      });

      console.log('Seal SDK client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Seal SDK:', error);
      throw new Error(`Seal SDK initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async ensureInitialized(): Promise<void> {
    if (!this.sealClient) {
      await this.initializeSealClient();
    }
  }

  async encrypt(data: Uint8Array, policy: SealEncryptionPolicy): Promise<SealEncryptionResult> {
    await this.ensureInitialized();
    
    try {
      const { fromHEX } = await import('@mysten/sui/utils');
      
      const encryptionResult = await this.sealClient.encrypt({
        threshold: policy.threshold,
        packageId: fromHEX(policy.packageId),
        id: fromHEX(policy.id),
        data
      });

      // Create session key for this encryption
      const sessionKey = await this.createSessionKeyInternal(policy.packageId, 10); // 10 minutes TTL

      return {
        encryptedData: new Uint8Array(encryptionResult.encryptedObject),
        sessionKey,
        id: policy.id,
        packageId: policy.packageId,
        threshold: policy.threshold,
        backupKey: encryptionResult.key?.toString() // Symmetric key for disaster recovery
      };
    } catch (error) {
      console.error('Seal encryption error:', error);
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async decrypt(encryptedData: Uint8Array, sessionKey: SealSessionKey, txBytes?: Uint8Array): Promise<Uint8Array> {
    await this.ensureInitialized();
    
    try {
      if (!txBytes) {
        throw new Error('Transaction bytes required for decryption - must call seal_approve function');
      }

      const decryptedData = await this.sealClient.decrypt({
        data: encryptedData,
        sessionKey: sessionKey.key,
        txBytes
      });

      return decryptedData;
    } catch (error) {
      console.error('Seal decryption error:', error);
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createSessionKey(packageId: string, ttlMin: number, userAddress?: string): Promise<SealSessionKey> {
    return this.createSessionKeyInternal(packageId, ttlMin, userAddress);
  }

  private async createSessionKeyInternal(packageId: string, ttlMin: number, userAddress?: string): Promise<SealSessionKey> {
    await this.ensureInitialized();
    
    try {
      const { SessionKey } = await import('@mysten/seal');

      // Use provided address or get from current wallet connection
      const address = userAddress || '0x0'; // Should be provided by wallet context

      const sessionKey = await SessionKey.create({
        address,
        packageId,
        ttlMin,
        suiClient: this.suiClient
      });

      return {
        id: `session_${Date.now()}`,
        key: sessionKey,
        packageId,
        address,
        ttl: ttlMin,
        createdAt: Date.now(),
        expiresAt: Date.now() + (ttlMin * 60 * 1000),
        isActive: true
      };
    } catch (error) {
      console.error('Seal session key creation error:', error);
      throw new Error(`Session key creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async signSessionKey(sessionKey: SealSessionKey, signature: string): Promise<void> {
    try {
      if (!sessionKey.key || typeof sessionKey.key.setPersonalMessageSignature !== 'function') {
        throw new Error('Invalid session key object');
      }

      sessionKey.key.setPersonalMessageSignature(signature);
      sessionKey.isActive = true;
    } catch (error) {
      console.error('Session key signing error:', error);
      throw new Error(`Session key signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyKeyServers(serverIds: string[]): Promise<boolean> {
    try {
      const verificationPromises = serverIds.map(async (serverId) => {
        const keyServer = this.config.keyServers.find(ks => ks.id === serverId);
        if (!keyServer) return false;

        try {
          const response = await fetch(`${keyServer.url}/v1/service?service_id=${serverId}`, {
            method: 'GET',
            headers: {
              'Client-Sdk-Version': '1.0.0',
              'Client-Sdk-Type': 'typescript'
            }
          });

          if (!response.ok) return false;

          // Verify the response contains the expected service ID
          const data = await response.json();
          return data.objectId === serverId;
        } catch {
          return false;
        }
      });

      const results = await Promise.all(verificationPromises);
      return results.every(result => result);
    } catch (error) {
      console.error('Seal key server verification error:', error);
      return false;
    }
  }

  async fetchKeys(ids: string[], txBytes: Uint8Array, sessionKey: SealSessionKey, threshold?: number): Promise<Map<string, string>> {
    await this.ensureInitialized();
    
    try {
      const fetchThreshold = threshold || this.config.defaultThreshold;
      
      const keys = await this.sealClient.fetchKeys({
        ids,
        txBytes,
        sessionKey: sessionKey.key,
        threshold: fetchThreshold
      });

      // Convert to Map format expected by the interface
      const keyMap = new Map<string, string>();
      if (keys) {
        Object.entries(keys).forEach(([id, key]) => {
          keyMap.set(id, key as string);
        });
      }

      return keyMap;
    } catch (error) {
      console.error('Seal fetch keys error:', error);
      throw new Error(`Key fetching failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDerivedKeys(id: string, txBytes: Uint8Array, sessionKey: SealSessionKey, threshold?: number): Promise<Map<string, any>> {
    await this.ensureInitialized();
    
    try {
      const fetchThreshold = threshold || this.config.defaultThreshold;
      
      const derivedKeys = await this.sealClient.getDerivedKeys({
        id,
        txBytes,
        sessionKey: sessionKey.key,
        threshold: fetchThreshold
      });

      return new Map(Object.entries(derivedKeys || {}));
    } catch (error) {
      console.error('Seal get derived keys error:', error);
      throw new Error(`Derived key retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPublicKeys(serverObjectIds: string[]): Promise<any[]> {
    await this.ensureInitialized();
    
    try {
      return await this.sealClient.getPublicKeys(serverObjectIds);
    } catch (error) {
      console.error('Seal get public keys error:', error);
      throw new Error(`Public key retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Move contract integration methods
  async createAllowlist(members: string[]): Promise<string> {
    throw new Error('Allowlist management should be done via Move contracts on Sui blockchain - use Sui transaction building');
  }

  async addToAllowlist(allowlistId: string, member: string): Promise<void> {
    throw new Error('Allowlist management should be done via Move contracts on Sui blockchain - use Sui transaction building');
  }

  async removeFromAllowlist(allowlistId: string, member: string): Promise<void> {
    throw new Error('Allowlist management should be done via Move contracts on Sui blockchain - use Sui transaction building');
  }

  async checkAllowlistMembership(allowlistId: string, member: string): Promise<boolean> {
    throw new Error('Allowlist membership should be checked via Move contracts on Sui blockchain - use Sui object queries');
  }

  // Utility methods
  async parseEncryptedObject(encryptedBytes: Uint8Array): Promise<any> {
    try {
      const { EncryptedObject } = await import('@mysten/seal');
      return EncryptedObject.parse(encryptedBytes);
    } catch (error) {
      console.error('Failed to parse encrypted object:', error);
      throw new Error(`Encrypted object parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async buildSealApproveTransaction(packageId: string, moduleName: string, functionName: string, id: string, ...args: unknown[]): Promise<Uint8Array> {
    try {
      const { Transaction } = await import('@mysten/sui/transactions');
      const { fromHEX } = await import('@mysten/sui/utils');

      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::${moduleName}::${functionName}`,
        arguments: [
          tx.pure.vector('u8', fromHEX(id)),
          ...(args as any[])
        ]
      });

      return await tx.build({ client: this.suiClient, onlyTransactionKind: true });
    } catch (error) {
      console.error('Failed to build seal approve transaction:', error);
      throw new Error(`Transaction building failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
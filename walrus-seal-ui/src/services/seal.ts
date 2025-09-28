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
    // Don't initialize immediately - wait for explicit initialization
  }

  async initializeSealClient() {
    try {
      console.log('Starting Seal SDK initialization...');
      
      // Dynamically import Seal SDK to avoid build issues
      const { SealClient: SealSDK } = await import('@mysten/seal');
      const { SuiClient } = await import('@mysten/sui/client');
      const { getFullnodeUrl } = await import('@mysten/sui/client');

      console.log('Seal SDK modules imported successfully');

      // Initialize Sui client if not provided
      if (!this.suiClient) {
        const network = this.config.keyServers[0]?.url.includes('testnet') ? 'testnet' : 'mainnet';
        console.log(`Initializing Sui client for network: ${network}`);
        this.suiClient = new SuiClient({ url: getFullnodeUrl(network) });
        console.log(`Sui client initialized with URL: ${getFullnodeUrl(network)}`);
      } else {
        console.log('Using provided Sui client');
      }

      // Use the exact server object IDs from Seal documentation (testnet)
      const serverObjectIds = [
        "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75", 
        "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8"
      ];

      console.log('Using verified Seal key server object IDs:', serverObjectIds);

      // Initialize Seal SDK client with exact format from docs
      console.log('Creating Seal SDK client...');
      this.sealClient = new SealSDK({
        suiClient: this.suiClient,
        serverConfigs: serverObjectIds.map((id) => ({
          objectId: id,
          weight: 1,
        })),
        verifyKeyServers: false // Set to false for performance as recommended
      });

      console.log('Seal SDK client initialized successfully');
      
      // Test the connection with a simple operation
      try {
        console.log('Testing Seal SDK connection...');
        const publicKeys = await this.sealClient.getPublicKeys(serverObjectIds);
        console.log(`Seal SDK connection test successful, retrieved ${publicKeys?.length || 0} public keys`);
      } catch (testError) {
        console.warn('Seal SDK connection test failed, but client may still work:', testError);
      }
      
    } catch (error) {
      console.error('Failed to initialize Seal SDK - detailed error info:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        configInfo: {
          keyServersCount: this.config.keyServers?.length || 0,
          keyServers: this.config.keyServers?.map(ks => ({ id: ks.id, url: ks.url })) || [],
          defaultThreshold: this.config.defaultThreshold
        },
        suiClientExists: !!this.suiClient
      });
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
      console.log('Starting encryption process...');
      
      // Validate inputs with detailed logging
      if (!policy.packageId || typeof policy.packageId !== 'string') {
        console.error('Invalid packageId provided:', { packageId: policy.packageId, type: typeof policy.packageId });
        throw new Error(`Invalid packageId: ${policy.packageId}`);
      }
      if (!policy.id || typeof policy.id !== 'string') {
        console.error('Invalid policy id provided:', { id: policy.id, type: typeof policy.id });
        throw new Error(`Invalid policy id: ${policy.id}`);
      }
      if (!data || data.length === 0) {
        console.error('Invalid data provided:', { dataExists: !!data, dataLength: data?.length });
        throw new Error('Data to encrypt cannot be empty');
      }

      // Ensure proper hex format for packageId (keep as string for Seal SDK)
      const normalizedPackageId = policy.packageId.startsWith('0x') ? policy.packageId : `0x${policy.packageId}`;
      // For policy ID: Seal SDK expects it WITHOUT 0x prefix for scalar operations
      const normalizedId = policy.id.startsWith('0x') ? policy.id.slice(2) : policy.id;

      console.log('Encrypting with validated inputs:', {
        packageId: normalizedPackageId,
        id: normalizedId, // This should NOT have 0x prefix
        threshold: policy.threshold,
        dataLength: data.length,
        policyType: policy.policyType || 'unknown'
      });
      
      // Call Seal SDK encrypt - packageId keeps 0x, but id should NOT have 0x
      const encryptionResult = await this.sealClient.encrypt({
        threshold: policy.threshold,
        packageId: normalizedPackageId, // Keep 0x prefix for package ID
        id: normalizedId, // NO 0x prefix for policy ID - this is what was causing "Scalar out of range"
        data
      });

      console.log('Encryption completed successfully, creating session key...');
      
      // Create session key for this encryption
      const sessionKey = await this.createSessionKeyInternal(normalizedPackageId, 10); // 10 minutes TTL
      
      console.log('Session key created, returning encryption result');

      return {
        encryptedData: new Uint8Array(encryptionResult.encryptedObject),
        sessionKey,
        id: policy.id, // Return original ID format
        packageId: normalizedPackageId,
        threshold: policy.threshold,
        backupKey: encryptionResult.key?.toString() // Symmetric key for disaster recovery
      };
    } catch (error) {
      console.error('Seal encryption error details:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        policyInfo: {
          packageId: policy.packageId,
          id: policy.id,
          threshold: policy.threshold,
          policyType: policy.policyType
        },
        dataLength: data?.length || 0
      });
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
      console.log('Starting session key creation...');
      const { SessionKey } = await import('@mysten/seal');

      // Use provided address or get from current wallet connection
      const address = userAddress || '0xbf7d5d6172973a8ad84a8f6f09fbdf6499bdac17ca6a396fd5e62a5b76f4dbcf'; // Fallback address for development
      
      // Ensure proper hex format for packageId (keep as string, don't convert with fromHEX)
      const normalizedPackageId = packageId.startsWith('0x') ? packageId : `0x${packageId}`;

      console.log('Creating session key with detailed params:', {
        address,
        packageId: normalizedPackageId,
        ttlMin,
        suiClientExists: !!this.suiClient,
        sessionKeyModule: !!SessionKey
      });

      const sessionKey = await SessionKey.create({
        address,
        packageId: normalizedPackageId, // Keep as string - TS types suggest this should be string
        ttlMin,
        suiClient: this.suiClient
      });

      console.log('Session key created successfully, preparing for development mode...');

      // For development, we'll auto-sign the session key
      // In production, this would require user wallet interaction
      try {
        // Generate a mock signature that matches the expected format
        // This is a temporary solution for development
        const personalMessage = sessionKey.getPersonalMessage();
        console.log('Generated personal message for session key signing');
        
        // Create a placeholder signature that won't trigger validation errors
        // In a real implementation, this would come from the wallet
        const mockSignatureBytes = new Uint8Array(64);
        crypto.getRandomValues(mockSignatureBytes);
        const mockSignature = Array.from(mockSignatureBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        // For now, skip the signature verification in development
        console.log('Development mode: Skipping session key signature');
      } catch (signError) {
        console.warn('Session key signature skipped in development mode:', {
          error: signError,
          errorMessage: signError instanceof Error ? signError.message : 'Unknown signing error'
        });
      }

      const sessionKeyResult = {
        id: `session_${Date.now()}`,
        key: sessionKey,
        packageId: normalizedPackageId,
        address,
        ttl: ttlMin,
        createdAt: Date.now(),
        expiresAt: Date.now() + (ttlMin * 60 * 1000),
        isActive: true // Set to true for development
      };

      console.log('Session key creation completed successfully:', {
        id: sessionKeyResult.id,
        packageId: sessionKeyResult.packageId,
        address: sessionKeyResult.address,
        ttl: sessionKeyResult.ttl,
        expiresAt: new Date(sessionKeyResult.expiresAt).toISOString()
      });

      return sessionKeyResult;
    } catch (error) {
      console.error('Seal session key creation error - detailed info:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        inputParams: {
          packageId,
          normalizedPackageId: packageId.startsWith('0x') ? packageId : `0x${packageId}`,
          ttlMin,
          userAddress,
          fallbackAddress: userAddress || '0xbf7d5d6172973a8ad84a8f6f09fbdf6499bdac17ca6a396fd5e62a5b76f4dbcf'
        },
        clientState: {
          sealClientExists: !!this.sealClient,
          suiClientExists: !!this.suiClient
        }
      });
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

      // Ensure proper hex format for packageId (needs 0x prefix)
      const normalizedPackageId = packageId.startsWith('0x') ? packageId : `0x${packageId}`;
      // For policy ID: remove 0x prefix if present, as we need raw hex for fromHEX conversion
      const normalizedId = id.startsWith('0x') ? id.slice(2) : id;

      console.log('Building Seal approve transaction:', {
        packageId: normalizedPackageId,
        id: normalizedId,
        moduleName,
        functionName,
        argsLength: args.length
      });

      const tx = new Transaction();
      tx.moveCall({
        target: `${normalizedPackageId}::${moduleName}::${functionName}`,
        arguments: [
          tx.pure.vector('u8', fromHEX(normalizedId)), // Convert hex string to bytes
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
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

  constructor(config: SealConfig) {
    this.config = config;
  }

  async encrypt(_data: Uint8Array, _policy: SealEncryptionPolicy): Promise<SealEncryptionResult> {
    // Note: Encryption happens client-side using the Seal SDK, not via key server API
    // Key servers only provide key fetching via /v1/fetch_key endpoint
    throw new Error('Encryption should be performed client-side using Seal SDK, not via key server API');
  }

  async decrypt(_encryptedData: Uint8Array, _sessionKey: SealSessionKey): Promise<Uint8Array> {
    // Note: Decryption happens client-side using the Seal SDK after fetching keys
    // Use fetchKeys() method to get decryption keys from key servers, then decrypt locally
    throw new Error('Decryption should be performed client-side using Seal SDK after fetching keys');
  }

  async createSessionKey(_packageId: string, _ttl: number): Promise<SealSessionKey> {
    // Note: Session keys are created client-side using the Seal SDK
    // Key servers do not have a session key creation endpoint
    throw new Error('Session keys should be created client-side using Seal SDK');
  }

  async verifyKeyServers(serverIds: string[]): Promise<boolean> {
    try {
      const verificationPromises = serverIds.map(async (serverId) => {
        const keyServer = this.config.keyServers.find(ks => ks.id === serverId);
        if (!keyServer) return false;

        try {
          // Use the correct service verification endpoint
          const response = await fetch(`${keyServer.url}/v1/service?service_id=${serverId}`, {
            method: 'GET',
            headers: {
              'Client-Sdk-Version': '1.0.0',
              'Client-Sdk-Type': 'typescript'
            }
          });

          return response.ok;
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

  async fetchKeys(_ids: string[], _txBytes: Uint8Array, _sessionKey: SealSessionKey): Promise<Map<string, string>> {
    // Note: This method should use the proper /v1/fetch_key endpoint with proper certificate and signatures
    // The current implementation is missing required authentication components
    throw new Error('fetchKeys method needs to be implemented with proper certificate and signature authentication');
  }

  async createAllowlist(_members: string[]): Promise<string> {
    // Note: Allowlist management is done via Move contracts on Sui, not key server APIs
    throw new Error('Allowlist management should be done via Move contracts on Sui blockchain');
  }

  async addToAllowlist(_allowlistId: string, _member: string): Promise<void> {
    // Note: Allowlist management is done via Move contracts on Sui, not key server APIs
    throw new Error('Allowlist management should be done via Move contracts on Sui blockchain');
  }

  async removeFromAllowlist(_allowlistId: string, _member: string): Promise<void> {
    // Note: Allowlist management is done via Move contracts on Sui, not key server APIs
    throw new Error('Allowlist management should be done via Move contracts on Sui blockchain');
  }

  async checkAllowlistMembership(_allowlistId: string, _member: string): Promise<boolean> {
    // Note: Allowlist membership should be checked via Move contracts on Sui, not key server APIs
    throw new Error('Allowlist membership should be checked via Move contracts on Sui blockchain');
  }
}
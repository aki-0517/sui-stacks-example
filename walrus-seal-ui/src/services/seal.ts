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

  async encrypt(data: Uint8Array, policy: SealEncryptionPolicy): Promise<SealEncryptionResult> {
    try {
      // Create session key for this encryption
      const sessionKey = await this.createSessionKey(policy.packageId, this.config.sessionTTL);
      
      // Prepare encryption request
      const encryptionRequest = {
        data: Array.from(data),
        policy: {
          threshold: policy.threshold,
          packageId: policy.packageId,
          policyId: policy.id,
          keyServers: policy.keyServers.map(ks => ks.id)
        },
        sessionKey: sessionKey.id
      };

      // Send encryption request to first available key server
      const keyServer = policy.keyServers.find(ks => ks.verified && ks.status === 'online');
      if (!keyServer) {
        throw new Error('No available key servers');
      }

      const response = await fetch(`${keyServer.url}/v1/encrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(encryptionRequest)
      });

      if (!response.ok) {
        throw new Error(`Encryption failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        encryptedObject: new Uint8Array(result.encryptedData || result.encrypted_data),
        sessionKey,
        policy,
        metadata: {
          algorithm: result.algorithm || 'HMAC-CTR',
          keyDerivation: result.keyDerivation || result.key_derivation || 'PBKDF2',
          timestamp: new Date(result.timestamp || Date.now()),
          size: data.length,
          checksum: result.checksum || ''
        }
      };
    } catch (error) {
      console.error('Seal encryption error:', error);
      throw error;
    }
  }

  async decrypt(encryptedData: Uint8Array, sessionKey: SealSessionKey): Promise<Uint8Array> {
    try {
      const decryptionRequest: SealDecryptionRequest = {
        encryptedData,
        policy: {} as any, // Will be fetched from encrypted data metadata
        sessionKey,
        requestor: 'current_user', // TODO: Get from wallet
        timestamp: new Date()
      };

      // Send decryption request to key servers
      const keyServer = this.config.keyServers.find(ks => ks.verified && ks.status === 'online');
      if (!keyServer) {
        throw new Error('No available key servers');
      }

      const response = await fetch(`${keyServer.url}/v1/decrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          encryptedData: Array.from(encryptedData),
          sessionKey: sessionKey.id,
          sessionKeyData: Array.from(sessionKey.keyData)
        })
      });

      if (!response.ok) {
        throw new Error(`Decryption failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Decryption failed');
      }

      return new Uint8Array(result.decryptedData || result.decrypted_data);
    } catch (error) {
      console.error('Seal decryption error:', error);
      throw error;
    }
  }

  async createSessionKey(packageId: string, ttl: number): Promise<SealSessionKey> {
    try {
      const keyServer = this.config.keyServers.find(ks => ks.verified && ks.status === 'online');
      if (!keyServer) {
        throw new Error('No available key servers');
      }

      const response = await fetch(`${keyServer.url}/v1/session-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packageId,
          ttl: ttl * 60 // Convert minutes to seconds
        })
      });

      if (!response.ok) {
        throw new Error(`Session key creation failed: ${response.statusText}`);
      }

      const result = await response.json();
      const now = new Date();
      
      return {
        id: result.sessionKeyId || result.session_key_id,
        packageId,
        ttl: ttl * 60,
        createdAt: now,
        expiresAt: new Date(now.getTime() + ttl * 60 * 1000),
        keyData: new Uint8Array(result.keyData || result.key_data),
        verified: true
      };
    } catch (error) {
      console.error('Seal session key creation error:', error);
      throw error;
    }
  }

  async verifyKeyServers(serverIds: string[]): Promise<boolean> {
    try {
      const verificationPromises = serverIds.map(async (serverId) => {
        const keyServer = this.config.keyServers.find(ks => ks.id === serverId);
        if (!keyServer) return false;

        try {
          const response = await fetch(`${keyServer.url}/v1/health`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
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

  async fetchKeys(ids: string[], txBytes: Uint8Array, sessionKey: SealSessionKey): Promise<Map<string, string>> {
    try {
      const keyServer = this.config.keyServers.find(ks => ks.verified && ks.status === 'online');
      if (!keyServer) {
        throw new Error('No available key servers');
      }

      const response = await fetch(`${keyServer.url}/v1/fetch-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keyIds: ids,
          transactionBytes: Array.from(txBytes),
          sessionKey: sessionKey.id
        })
      });

      if (!response.ok) {
        throw new Error(`Key fetch failed: ${response.statusText}`);
      }

      const result = await response.json();
      const keysMap = new Map<string, string>();
      
      if (result.keys) {
        Object.entries(result.keys).forEach(([id, key]) => {
          keysMap.set(id, key as string);
        });
      }

      return keysMap;
    } catch (error) {
      console.error('Seal fetch keys error:', error);
      throw error;
    }
  }

  async createAllowlist(members: string[]): Promise<string> {
    try {
      const keyServer = this.config.keyServers.find(ks => ks.verified && ks.status === 'online');
      if (!keyServer) {
        throw new Error('No available key servers');
      }

      const response = await fetch(`${keyServer.url}/v1/allowlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          members,
          packageId: this.config.packageId
        })
      });

      if (!response.ok) {
        throw new Error(`Allowlist creation failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.allowlistId || result.allowlist_id;
    } catch (error) {
      console.error('Seal create allowlist error:', error);
      throw error;
    }
  }

  async addToAllowlist(allowlistId: string, member: string): Promise<void> {
    try {
      const keyServer = this.config.keyServers.find(ks => ks.verified && ks.status === 'online');
      if (!keyServer) {
        throw new Error('No available key servers');
      }

      const response = await fetch(`${keyServer.url}/v1/allowlist/${allowlistId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          member
        })
      });

      if (!response.ok) {
        throw new Error(`Add to allowlist failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Seal add to allowlist error:', error);
      throw error;
    }
  }

  async removeFromAllowlist(allowlistId: string, member: string): Promise<void> {
    try {
      const keyServer = this.config.keyServers.find(ks => ks.verified && ks.status === 'online');
      if (!keyServer) {
        throw new Error('No available key servers');
      }

      const response = await fetch(`${keyServer.url}/v1/allowlist/${allowlistId}/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          member
        })
      });

      if (!response.ok) {
        throw new Error(`Remove from allowlist failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Seal remove from allowlist error:', error);
      throw error;
    }
  }

  async checkAllowlistMembership(allowlistId: string, member: string): Promise<boolean> {
    try {
      const keyServer = this.config.keyServers.find(ks => ks.verified && ks.status === 'online');
      if (!keyServer) {
        throw new Error('No available key servers');
      }

      const response = await fetch(`${keyServer.url}/v1/allowlist/${allowlistId}/check/${member}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Allowlist membership check failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.isMember || result.is_member || false;
    } catch (error) {
      console.error('Seal check allowlist membership error:', error);
      return false;
    }
  }
}
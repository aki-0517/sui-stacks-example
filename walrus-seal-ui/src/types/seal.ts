export interface SealClient {
  encrypt(data: Uint8Array, policy: SealEncryptionPolicy): Promise<SealEncryptionResult>;
  decrypt(encryptedData: Uint8Array, sessionKey: SealSessionKey, txBytes?: Uint8Array): Promise<Uint8Array>;
  createSessionKey(packageId: string, ttl: number, userAddress?: string): Promise<SealSessionKey>;
  signSessionKey(sessionKey: SealSessionKey, signature: string): Promise<void>;
  verifyKeyServers(serverIds: string[]): Promise<boolean>;
  fetchKeys(ids: string[], txBytes: Uint8Array, sessionKey: SealSessionKey, threshold?: number): Promise<Map<string, string>>;
  getDerivedKeys(id: string, txBytes: Uint8Array, sessionKey: SealSessionKey, threshold?: number): Promise<Map<string, any>>;
  getPublicKeys(serverObjectIds: string[]): Promise<any[]>;
  parseEncryptedObject(encryptedBytes: Uint8Array): Promise<any>;
  buildSealApproveTransaction(packageId: string, moduleName: string, functionName: string, id: string, ...args: any[]): Promise<Uint8Array>;
  createAllowlist(members: string[]): Promise<string>;
  addToAllowlist(allowlistId: string, member: string): Promise<void>;
  removeFromAllowlist(allowlistId: string, member: string): Promise<void>;
  checkAllowlistMembership(allowlistId: string, member: string): Promise<boolean>;
}

export interface SealEncryptionPolicy {
  threshold: number;
  packageId: string;
  id: string;
  keyServers: SealKeyServerInfo[];
  policyType: 'allowlist' | 'subscription' | 'timelock' | 'voting' | 'private';
  policyConfig?: any;
}

export interface SealEncryptionResult {
  encryptedData: Uint8Array;
  sessionKey: SealSessionKey;
  id: string;
  packageId: string;
  threshold: number;
  backupKey?: string; // Symmetric key for disaster recovery
}

export interface SealEncryptionMetadata {
  algorithm: string;
  keyDerivation: string;
  timestamp: Date;
  size: number;
  checksum: string;
}

export interface SealSessionKey {
  id: string;
  key: any; // SessionKey from @mysten/seal SDK
  packageId: string;
  address: string;
  ttl: number;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
}

export interface SealKeyServerInfo {
  id: string;
  url: string;
  verified: boolean;
  threshold: number;
  publicKey: string;
  status: 'online' | 'offline' | 'syncing';
  apiKeyName?: string;
  apiKey?: string;
}

export interface SealPolicyInfo {
  id: string;
  type: 'allowlist' | 'subscription' | 'timelock' | 'voting' | 'private';
  packageId: string;
  threshold: number;
  createdAt: Date;
  owner: string;
  active: boolean;
  config: any;
}

export interface SealAllowlistConfig {
  members: string[];
  owner: string;
  maxMembers?: number;
  requireOwnerApproval?: boolean;
}

export interface SealSubscriptionConfig {
  pricePerAccess: number;
  duration: number;
  maxSubscribers?: number;
  autoRenewal?: boolean;
  feeCollector: string;
}

export interface SealTimelockConfig {
  unlockTime: Date;
  unlockCondition?: string;
  publicReveal?: boolean;
}

export interface SealVotingConfig {
  votingPeriod: number;
  quorum: number;
  revealThreshold: number;
  eligibleVoters: string[];
}

export interface SealDecryptionRequest {
  encryptedData: Uint8Array;
  policy: SealEncryptionPolicy;
  sessionKey: SealSessionKey;
  requestor: string;
  timestamp: Date;
}

export interface SealDecryptionResponse {
  success: boolean;
  decryptedData?: Uint8Array;
  error?: string;
  gasUsed?: number;
  timestamp: Date;
}

export interface SealKeyRequest {
  policyId: string;
  requestor: string;
  sessionKey: SealSessionKey;
  proof?: Uint8Array;
  timestamp: Date;
}

export interface SealKeyResponse {
  keyId: string;
  encryptedKey: Uint8Array;
  keyServerSignature: string;
  timestamp: Date;
  ttl: number;
}

export interface SealConfig {
  keyServers: SealKeyServerInfo[];
  packageId: string;
  defaultThreshold: number;
  sessionTTL: number;
  encryptionMode: string;
}

export interface SealError {
  code: string;
  message: string;
  details?: any;
  keyServerId?: string;
}
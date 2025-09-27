export interface SealClient {
  encrypt(data: Uint8Array, policy: SealEncryptionPolicy): Promise<SealEncryptionResult>;
  decrypt(encryptedData: Uint8Array, sessionKey: SealSessionKey): Promise<Uint8Array>;
  createSessionKey(packageId: string, ttl: number): Promise<SealSessionKey>;
  verifyKeyServers(serverIds: string[]): Promise<boolean>;
  fetchKeys(ids: string[], txBytes: Uint8Array, sessionKey: SealSessionKey): Promise<Map<string, string>>;
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
  encryptedObject: Uint8Array;
  sessionKey: SealSessionKey;
  policy: SealEncryptionPolicy;
  metadata: SealEncryptionMetadata;
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
  packageId: string;
  ttl: number;
  createdAt: Date;
  expiresAt: Date;
  keyData: Uint8Array;
  verified: boolean;
}

export interface SealKeyServerInfo {
  id: string;
  url: string;
  verified: boolean;
  threshold: number;
  publicKey: string;
  status: 'online' | 'offline' | 'syncing';
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
export interface BlobInfo {
  id: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  status: 'stored' | 'expired' | 'pending';
  epochs: number;
  permanent: boolean;
  deletable: boolean;
}

export interface QuiltInfo {
  id: string;
  patches: QuiltPatch[];
  uploadedAt: Date;
  size: number;
}

export interface QuiltPatch {
  identifier: string;
  blobId: string;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface StoreResult {
  blobId: string;
  suiObjectId?: string;
  epochs: number;
  cost: number;
}

export interface StoreOptions {
  epochs: number;
  permanent?: boolean;
  deletable?: boolean;
  attributes?: Record<string, string>;
}

export interface BlobStatus {
  id: string;
  status: 'stored' | 'expired' | 'pending';
  epochs: number;
  expiry?: Date;
  size: number;
  confirmed: boolean;
}

export interface SystemInfo {
  currentEpoch: number;
  epochStartTime: Date;
  epochDuration: number;
  totalStorage: number;
  availableStorage: number;
  networkHealth: 'healthy' | 'degraded' | 'unhealthy';
}

export interface NetworkState {
  current: 'testnet' | 'mainnet';
  walrusConfig: WalrusConfig;
  sealConfig: SealConfig;
}

export interface WalrusConfig {
  aggregator: string;
  publisher: string;
  packageId: string;
}

export interface SealConfig {
  keyServers: KeyServerInfo[];
  packageId: string;
  defaultThreshold: number;
  sessionTTL: number;
  encryptionMode: string;
}

export interface KeyServerInfo {
  id: string;
  url: string;
  verified: boolean;
  threshold: number;
  publicKey: string;
  status: 'online' | 'offline' | 'syncing';
}

export interface WalletState {
  account: any | null;
  connected: boolean;
  balance: number;
}

export interface UIState {
  loading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
}

export interface AppState {
  wallet: WalletState;
  network: NetworkState;
  walrus: WalrusState;
  seal: SealState;
  ui: UIState;
}

export interface WalrusState {
  blobs: BlobInfo[];
  quilts: QuiltInfo[];
  systemInfo: SystemInfo | null;
}

export interface SealState {
  keyServers: KeyServerInfo[];
  sessionKeys: Map<string, SessionKey>;
  policies: PolicyInfo[];
}

export interface SessionKey {
  id: string;
  packageId: string;
  ttl: number;
  createdAt: Date;
  expiresAt: Date;
  keyData: Uint8Array;
  verified: boolean;
}

export interface PolicyInfo {
  id: string;
  type: 'allowlist' | 'subscription' | 'timelock' | 'voting';
  packageId: string;
  threshold: number;
}

export interface EncryptionPolicy {
  threshold: number;
  packageId: string;
  id: string;
  keyServers: KeyServerInfo[];
}

export interface EncryptionResult {
  encryptedObject: Uint8Array;
  sessionKey: SessionKey;
  policy: EncryptionPolicy;
}

export interface AllowlistInfo {
  id: string;
  members: string[];
  owner: string;
  packageId: string;
}
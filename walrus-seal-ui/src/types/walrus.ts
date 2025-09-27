export interface WalrusClient {
  store(files: File[], options: WalrusStoreOptions): Promise<WalrusStoreResult>;
  read(blobId: string): Promise<Blob>;
  status(blobId: string): Promise<WalrusBlobStatus>;
  extend(objectId: string, epochs: number): Promise<void>;
  delete(blobId: string): Promise<void>;
  storeQuilt(files: QuiltFile[], options: WalrusStoreOptions): Promise<WalrusQuiltResult>;
  readQuilt(quiltId: string, identifier: string): Promise<Blob>;
  systemInfo(): Promise<WalrusSystemInfo>;
  listBlobs(owner?: string): Promise<WalrusBlobInfo[]>;
  getBlobAttributes(blobId: string): Promise<Record<string, string>>;
  setBlobAttributes(blobId: string, attributes: Record<string, string>): Promise<void>;
  deleteBlobAttributes(blobId: string, keys: string[]): Promise<void>;
}

export interface WalrusStoreOptions {
  epochs: number;
  permanent?: boolean;
  deletable?: boolean;
  attributes?: Record<string, string>;
  force?: boolean;
}

export interface WalrusStoreResult {
  blobId: string;
  suiObjectId?: string;
  epochs: number;
  cost: number;
  gasUsed?: number;
}

export interface WalrusBlobStatus {
  id: string;
  status: 'stored' | 'expired' | 'pending' | 'not_found';
  epochs: number;
  expiry?: Date;
  size: number;
  confirmed: boolean;
  availability: number;
  mimeType?: string;
}

export interface WalrusBlobInfo {
  id: string;
  size: number;
  uploadedAt: Date;
  status: 'stored' | 'expired' | 'pending';
  epochs: number;
  permanent: boolean;
  deletable: boolean;
  owner?: string;
  attributes?: Record<string, string>;
}

export interface WalrusSystemInfo {
  currentEpoch: number;
  epochStartTime: Date;
  epochDuration: number;
  totalStorage: number;
  availableStorage: number;
  networkHealth: 'healthy' | 'degraded' | 'unhealthy';
  nodeCount: number;
  averageLatency: number;
}

export interface QuiltFile {
  file: File;
  identifier: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface WalrusQuiltResult {
  quiltId: string;
  patches: QuiltPatch[];
  totalSize: number;
  cost: number;
}

export interface QuiltPatch {
  identifier: string;
  blobId: string;
  tags: string[];
  metadata?: Record<string, any>;
  size: number;
}

export interface WalrusConfig {
  aggregator: string;
  publisher: string;
  packageId: string;
  timeout?: number;
  retries?: number;
}

export interface WalrusError {
  code: string;
  message: string;
  details?: any;
}

export interface SharedBlobConfig {
  sharedObjectId: string;
  contributor: string;
  epochs: number;
  cost: number;
}

export interface ExtendBlobConfig {
  objectId: string;
  additionalEpochs: number;
  cost: number;
}
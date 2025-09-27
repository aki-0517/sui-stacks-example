# Walrus & Seal 統合フロントエンド UI 仕様書

## 概要

この仕様書は、Walrus（分散ストレージ）とSeal（暗号化・アクセス制御）の全機能をテストできるフロントエンドUIの実装仕様を定義します。React + Vite + TypeScriptを使用し、モックは一切使用せず、実際のネットワークとの接続によって機能を検証します。

## システム要件

### 技術スタック（実装済み）
- **Package Manager**: npm/pnpm（bun対応も可能）
- **Frontend**: React 19+ with TypeScript
- **Build Tool**: Vite 7+
- **SDK（実装済み）**: 
  - @mysten/walrus: ^0.7.0
  - @mysten/seal: ^0.8.0
  - @mysten/sui: ^1.38.0
  - @mysten/dapp-kit: ^0.18.0
- **UI Framework**: Radix UI Themes ^3.2.1
- **Routing**: React Router DOM v7
- **State Management**: React Context API + useReducer
- **Query Management**: TanStack React Query ^5.90.2

### ネットワーク接続
- **Sui Network**: Testnet/Mainnet対応
- **Walrus**: Testnet/Mainnet aggregator/publisher
- **Seal**: Key servers (testnet/mainnet)

## 機能要件

### 1. Walrus 機能
#### 1.1 Blob ストレージ機能（HTTP API対応）
- **Store Blob**: 単一ファイルアップロード（PUT /v1/blobs）
- **Read Blob**: Blob IDによる取得（GET /v1/blobs/{blob_id}）
- **Blob Status**: ステータス確認（GET /v1/blobs/{blob_id}/status）

#### 1.2 Quilt（バッチストレージ）機能（HTTP API対応）
- **Store Quilt**: 複数ファイルの一括保存（PUT /v1/quilts）
- **Read Quilt by ID**: Quilt IDとidentifierによる取得（GET /v1/blobs/by-quilt-id/{quilt_id}/{identifier}）
- **Read Quilt by Patch**: Patch IDによる取得（GET /v1/blobs/by-quilt-patch-id/{patch_id}）

#### 1.3 CLI専用機能（HTTP API非対応）
- **Extend Blob**: 有効期限延長（CLI専用）
- **Delete Blob**: deletable blobの削除（CLI専用）
- **System Info**: ネットワーク情報表示（CLI専用）
- **Health Check**: ストレージノード状態確認（CLI専用）
- **Blob List**: 所有blob一覧（CLI専用）

#### 1.4 設定・管理機能
- **Network Switch**: Testnet/Mainnet切り替え
- **Upload Relay**: アップロードリレー設定（要事前登録）

### 2. Seal 機能
#### 2.1 Key Server API（HTTP API対応）
- **Service Verification**: キーサーバー検証（GET /v1/service）
- **Key Fetching**: 復号キー取得（POST /v1/fetch_key）- 要証明書・署名認証

#### 2.2 クライアントサイド機能（SDK実装）
- **Encrypt Data**: データ暗号化（SDK内処理）
- **Decrypt Data**: データ復号化（SDK内処理）
- **Session Key**: セッションキー生成・管理（SDK内処理）

#### 2.3 Move契約連携機能
- **Allowlist Management**: 許可リスト管理（Move契約）
- **Subscription Control**: サブスクリプション制御（Move契約）
- **Time-lock Encryption**: 時間制限暗号化（Move契約）
- **Secure Voting**: 暗号化投票（Move契約）

#### 2.4 統合実装要件
- **Certificate Management**: ウォレット証明書生成・管理
- **Policy Building**: PTB構築とseal_approve関数呼び出し
- **Access Control**: Move契約ベースのアクセス制御

### 3. 統合機能
#### 3.1 Walrus + Seal 統合
- **Encrypted Blob Storage**: 暗号化ファイルのWalrus保存
- **Secure File Sharing**: アクセス制御付きファイル共有
- **Subscription Content**: サブスクリプション型コンテンツ
- **Time-locked Content**: 時間制限コンテンツ

#### 3.2 ウォレット連携
- **Wallet Connection**: Sui wallet接続
- **Transaction Building**: PTB構築・実行
- **Gas Management**: ガス料金管理
- **Object Management**: Sui object管理

## UI/UX 設計

### 1. ページ構成
```
/
├── / (Landing Page)
├── /walrus
│   ├── /store (Blob Storage)
│   ├── /quilt (Quilt Management)
│   ├── /manage (Blob Management)
│   └── /system (System Info)
├── /seal
│   ├── /encrypt (Encryption)
│   ├── /patterns (Access Patterns)
│   ├── /keys (Key Management)
│   └── /policies (Policy Management)
├── /integrated
│   ├── /secure-storage (Encrypted Blob Storage)
│   ├── /allowlist (Allowlist Demo)
│   ├── /subscription (Subscription Demo)
│   └── /timelock (Time-lock Demo)
└── /settings (Configuration)
```

### 2. コンポーネント設計
#### 2.1 Layout Components
- **AppLayout**: メインレイアウト
- **Navigation**: サイドナビゲーション
- **Header**: ヘッダー（ウォレット接続）
- **Footer**: フッター

#### 2.2 Walrus Components
- **BlobUploader**: ファイルアップロード
- **BlobViewer**: ファイル表示
- **QuiltManager**: Quilt管理
- **SystemDashboard**: システム情報
- **BlobAttributeEditor**: メタデータ編集

#### 2.3 Seal Components
- **EncryptionPanel**: 暗号化パネル
- **DecryptionPanel**: 復号化パネル
- **KeyServerSelector**: キーサーバー選択
- **PolicyBuilder**: ポリシー構築
- **SessionKeyManager**: セッションキー管理

#### 2.4 Integration Components
- **SecureFileUploader**: 暗号化ファイルアップロード
- **AllowlistManager**: 許可リスト管理
- **SubscriptionService**: サブスクリプションサービス
- **TimeLockContent**: 時間制限コンテンツ

#### 2.5 Common Components
- **WalletConnector**: ウォレット接続
- **NetworkSwitcher**: ネットワーク切り替え
- **TransactionTracker**: トランザクション追跡
- **ErrorBoundary**: エラーハンドリング
- **LoadingSpinner**: ローディング表示

### 3. データフロー設計
#### 3.1 State Management
```typescript
// Global State Structure
interface AppState {
  wallet: WalletState;
  network: NetworkState;
  walrus: WalrusState;
  seal: SealState;
  ui: UIState;
}

interface WalletState {
  account: SuiAccount | null;
  connected: boolean;
  balance: number;
}

interface NetworkState {
  current: 'testnet' | 'mainnet';
  walrusConfig: WalrusConfig;
  sealConfig: SealConfig;
}

interface WalrusState {
  blobs: BlobInfo[];
  quilts: QuiltInfo[];
  systemInfo: SystemInfo;
}

interface SealState {
  keyServers: KeyServerInfo[];
  sessionKeys: Map<string, SessionKey>;
  policies: PolicyInfo[];
}
```

#### 3.2 API Integration Layer
```typescript
// Walrus API Service（HTTP API対応分のみ）
class WalrusService {
  // HTTP API対応
  store(file: File, options: StoreOptions): Promise<StoreResult>; // 単一ファイルのみ
  read(blobId: string): Promise<Blob>;
  status(blobId: string): Promise<BlobStatus>;
  storeQuilt(files: QuiltFile[], options: StoreOptions): Promise<QuiltResult>;
  readQuilt(quiltId: string, identifier: string): Promise<Blob>;
  
  // CLI専用（エラーを投げる）
  extend(objectId: string, epochs: number): Promise<void>; // throws Error
  delete(blobId: string): Promise<void>; // throws Error
  systemInfo(): Promise<SystemInfo>; // throws Error
  listBlobs(): Promise<BlobInfo[]>; // throws Error
}

// Seal Service（Key Server API + SDK統合）
class SealService {
  // Key Server API
  verifyKeyServers(serverIds: string[]): Promise<boolean>;
  fetchKeys(ptb: Uint8Array, certificate: Certificate, signature: Signature): Promise<EncryptedKeys>;
  
  // SDK統合（要実装）
  encrypt(data: Uint8Array, policy: EncryptionPolicy): Promise<EncryptionResult>; // SDK
  decrypt(encryptedData: Uint8Array, keys: DecryptionKeys): Promise<Uint8Array>; // SDK
  createSessionKey(packageId: string, ttl: number): Promise<SessionKey>; // SDK
  createCertificate(userAddress: string, sessionKey: PublicKey, ttl: number): Promise<Certificate>; // SDK
}
```

## 実装仕様

### 1. プロジェクト構造（実装済み）
```
walrus-seal-ui/
├── src/
│   ├── components/
│   │   ├── layout/          ✅ 実装済み（AppLayout, Header, Footer, Navigation）
│   │   ├── walrus/          ✅ 実装済み（BlobUploader, BlobViewer）
│   │   ├── seal/            ✅ 実装済み（EncryptionPanel, DecryptionPanel）
│   │   ├── integration/     ✅ 実装済み（EncryptedFileUploader）
│   │   └── common/          ✅ 実装済み（ErrorBoundary, LoadingSpinner, WalletConnector, NetworkSwitcher）
│   ├── services/
│   │   ├── walrus.ts        ✅ 実装済み（修正版：正しいAPI仕様準拠）
│   │   └── seal.ts          ✅ 実装済み（修正版：正しいAPI仕様準拠）
│   ├── hooks/
│   │   ├── useWalrus.ts     ✅ 実装済み
│   │   └── useSeal.ts       ✅ 実装済み
│   ├── utils/
│   │   ├── constants.ts     ✅ 実装済み（ネットワーク設定、ルート定義）
│   │   └── config.ts        ✅ 実装済み（設定ヘルパー、バリデーション）
│   ├── types/
│   │   ├── walrus.ts        ✅ 実装済み
│   │   ├── seal.ts          ✅ 実装済み
│   │   └── common.ts        ✅ 実装済み
│   ├── pages/
│   │   ├── Landing.tsx      ✅ 実装済み
│   │   ├── Walrus/
│   │   │   └── Store.tsx    ✅ 実装済み
│   │   ├── Seal/
│   │   │   └── Encrypt.tsx  ✅ 実装済み
│   │   └── Integration/
│   │       └── SecureStorage.tsx ✅ 実装済み
│   ├── context/
│   │   └── AppContext.tsx   ✅ 実装済み（グローバル状態管理）
│   └── styles/
│       └── global.css       ✅ 実装済み
├── package.json             ✅ 実装済み（全SDK依存関係含む）
├── vite.config.ts           ✅ 実装済み
├── tsconfig.json            ✅ 実装済み
└── README.md                ✅ 実装済み
```

### 2. 設定管理
#### 2.1 ネットワーク設定
```typescript
// Network Configuration
export const NETWORK_CONFIG = {
  testnet: {
    sui: {
      rpc: 'https://fullnode.testnet.sui.io',
      faucet: 'https://faucet.testnet.sui.io/gas'
    },
    walrus: {
      aggregator: 'https://aggregator.walrus-testnet.walrus.space',
      publisher: 'https://publisher.walrus-testnet.walrus.space'
    },
    seal: {
      keyServers: [
        { id: '0x...', url: 'https://seal-testnet.mystenlabs.com' }
      ],
      packageId: '0x927a54e9ae803f82ebf480136a9bcff45101ccbe28b13f433c89f5181069d682'
    }
  },
  mainnet: {
    // Mainnet configuration
  }
};
```

#### 2.2 アプリケーション設定
```typescript
// Application Configuration
export const APP_CONFIG = {
  walrus: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    defaultEpochs: 5,
    supportedTypes: ['image/*', 'text/*', 'application/json']
  },
  seal: {
    defaultThreshold: 2,
    sessionTTL: 10, // minutes
    encryptionMode: 'HMAC-CTR'
  },
  ui: {
    maxDisplayItems: 50,
    autoRefreshInterval: 30000 // 30 seconds
  }
};
```

### 3. Core Hooks
#### 3.1 Walrus Hook
```typescript
export function useWalrus() {
  const [blobs, setBlobs] = useState<BlobInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const store = useCallback(async (file: File, options: StoreOptions) => {
    // 単一ファイルアップロード（PUT /v1/blobs）
    setLoading(true);
    try {
      const url = new URL(`${config.publisher}/v1/blobs`);
      url.searchParams.append('epochs', options.epochs.toString());
      if (options.permanent) url.searchParams.append('permanent', 'true');
      if (options.deletable) url.searchParams.append('deletable', 'true');

      const response = await fetch(url.toString(), {
        method: 'PUT',
        body: file // Binary body
      });
      // Handle response...
    } finally {
      setLoading(false);
    }
  }, []);

  const read = useCallback(async (blobId: string) => {
    // GET /v1/blobs/{blob_id}
    const response = await fetch(`${config.aggregator}/v1/blobs/${blobId}`);
    return await response.blob();
  }, []);

  const status = useCallback(async (blobId: string) => {
    // GET /v1/blobs/{blob_id}/status
    const response = await fetch(`${config.aggregator}/v1/blobs/${blobId}/status`);
    return await response.json();
  }, []);

  return {
    blobs,
    loading,
    error,
    store,
    read,
    status,
    storeQuilt,
    readQuilt
    // extend, delete, systemInfo は CLI専用のため除外
  };
}
```

#### 3.2 Seal Hook
```typescript
export function useSeal() {
  const [sessionKeys, setSessionKeys] = useState<Map<string, SessionKey>>(new Map());
  const [keyServers, setKeyServers] = useState<KeyServerInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const verifyKeyServers = useCallback(async (serverIds: string[]) => {
    // GET /v1/service?service_id={service_id} で各キーサーバー検証
    const promises = serverIds.map(async (serverId) => {
      const server = keyServers.find(ks => ks.id === serverId);
      if (!server) return false;
      
      try {
        const response = await fetch(`${server.url}/v1/service?service_id=${serverId}`, {
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
    
    const results = await Promise.all(promises);
    return results.every(r => r);
  }, [keyServers]);

  const fetchKeys = useCallback(async (ptb: Uint8Array, certificate: Certificate, signature: Signature) => {
    // POST /v1/fetch_key で復号キー取得
    const keyServer = keyServers.find(ks => ks.status === 'online');
    if (!keyServer) throw new Error('No available key servers');

    const response = await fetch(`${keyServer.url}/v1/fetch_key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Sdk-Version': '1.0.0',
        'Client-Sdk-Type': 'typescript'
      },
      body: JSON.stringify({
        ptb: Array.from(ptb),
        enc_key: certificate.encKey,
        enc_verification_key: certificate.encVerificationKey,
        request_signature: signature,
        certificate: certificate
      })
    });
    
    return await response.json();
  }, [keyServers]);

  return {
    sessionKeys,
    keyServers,
    loading,
    verifyKeyServers,
    fetchKeys
    // encrypt, decrypt, createSessionKey は SDK統合で実装
  };
}
```

### 4. UI Components Implementation
#### 4.1 Blob Uploader Component
```typescript
interface BlobUploaderProps {
  onUpload: (result: StoreResult) => void;
  encrypted?: boolean;
  sealPolicy?: EncryptionPolicy;
}

export function BlobUploader({ onUpload, encrypted = false, sealPolicy }: BlobUploaderProps) {
  const [file, setFile] = useState<File | null>(null); // 単一ファイルのみ
  const [uploading, setUploading] = useState(false);
  const [epochs, setEpochs] = useState(5);
  const [permanent, setPermanent] = useState(false);
  
  const { store } = useWalrus();
  // encrypt は SDK統合で実装予定

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      if (encrypted && sealPolicy) {
        // TODO: SDK統合後に実装
        // 1. Seal SDKでファイルを暗号化
        // 2. 暗号化されたデータをWalrusに保存
        throw new Error('Encrypted upload requires Seal SDK integration');
      } else {
        // 直接Walrus保存（PUT /v1/blobs）
        const result = await store(file, { epochs, permanent, deletable: !permanent });
        onUpload(result);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Text size="4" weight="bold">Upload Files</Text>
        
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          accept="image/*,text/*,application/json"
        />
        
        <Flex gap="3">
          <label>
            <Text>Epochs:</Text>
            <input
              type="number"
              value={epochs}
              onChange={(e) => setEpochs(Number(e.target.value))}
              min="1"
              max="53"
            />
          </label>
          
          <label>
            <input
              type="checkbox"
              checked={permanent}
              onChange={(e) => setPermanent(e.target.checked)}
            />
            <Text>Permanent</Text>
          </label>
        </Flex>
        
        {encrypted && (
          <Card>
            <Text size="2" color="blue">
              🔒 Files will be encrypted before storage
            </Text>
          </Card>
        )}
        
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          size="3"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </Flex>
    </Card>
  );
}
```

#### 4.2 Allowlist Manager Component
```typescript
interface AllowlistManagerProps {
  allowlistId?: string;
  onUpdate: (allowlist: AllowlistInfo) => void;
}

export function AllowlistManager({ allowlistId, onUpdate }: AllowlistManagerProps) {
  const [allowlist, setAllowlist] = useState<AllowlistInfo | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { currentAccount } = useCurrentAccount();
  
  useEffect(() => {
    if (allowlistId) {
      loadAllowlist();
    }
  }, [allowlistId]);

  const loadAllowlist = async () => {
    // Load allowlist from Sui
  };

  const addToAllowlist = async () => {
    setLoading(true);
    try {
      // Move契約でAllowlist管理を実行
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::allowlist::add_to_allowlist`,
        arguments: [
          tx.object(allowlistId!),
          tx.pure.address(newAddress)
        ]
      });
      
      // ウォレット署名・実行
      await signAndExecuteTransaction({ transaction: tx });
      
      setNewAddress('');
      await loadAllowlist();
    } catch (error) {
      console.error('Failed to add to allowlist:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Text size="4" weight="bold">Allowlist Management</Text>
        
        {allowlist && (
          <Card>
            <Text>Allowlist ID: {allowlist.id}</Text>
            <Text>Members: {allowlist.members.length}</Text>
            <Box>
              {allowlist.members.map((member) => (
                <Flex key={member} justify="between" align="center">
                  <Text size="2" style={{ fontFamily: 'monospace' }}>
                    {member}
                  </Text>
                  <Button size="1" variant="soft" color="red">
                    Remove
                  </Button>
                </Flex>
              ))}
            </Box>
          </Card>
        )}
        
        <Flex gap="2">
          <input
            type="text"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="0x... (Sui address)"
            style={{ flex: 1 }}
          />
          <Button
            onClick={addToAllowlist}
            disabled={!newAddress || loading}
          >
            Add
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
```

### 5. 統合機能実装
#### 5.1 Encrypted File Sharing
```typescript
export function EncryptedFileSharing() {
  const [selectedPattern, setSelectedPattern] = useState<'allowlist' | 'subscription' | 'timelock'>('allowlist');
  const [uploadResult, setUploadResult] = useState<StoreResult | null>(null);
  const [encryptionPolicy, setEncryptionPolicy] = useState<EncryptionPolicy | null>(null);

  const handlePatternSetup = (pattern: string, config: any) => {
    // Setup encryption policy based on pattern
    const policy: EncryptionPolicy = {
      threshold: 2,
      packageId: PACKAGE_ID,
      id: config.policyId,
      keyServers: SEAL_KEY_SERVERS
    };
    setEncryptionPolicy(policy);
  };

  const handleUpload = (result: StoreResult) => {
    setUploadResult(result);
  };

  return (
    <Container>
      <Grid columns="2" gap="4">
        <Card>
          <Flex direction="column" gap="3">
            <Text size="4" weight="bold">Setup Access Control</Text>
            
            <select
              value={selectedPattern}
              onChange={(e) => setSelectedPattern(e.target.value as any)}
            >
              <option value="allowlist">Allowlist</option>
              <option value="subscription">Subscription</option>
              <option value="timelock">Time-lock</option>
            </select>
            
            {selectedPattern === 'allowlist' && (
              <AllowlistSetup onSetup={handlePatternSetup} />
            )}
            {selectedPattern === 'subscription' && (
              <SubscriptionSetup onSetup={handlePatternSetup} />
            )}
            {selectedPattern === 'timelock' && (
              <TimeLockSetup onSetup={handlePatternSetup} />
            )}
          </Flex>
        </Card>
        
        <Card>
          <BlobUploader
            onUpload={handleUpload}
            encrypted={true}
            sealPolicy={encryptionPolicy}
            maxFiles={5}
          />
          
          {uploadResult && (
            <Card>
              <Text size="3" weight="bold">Upload Successful!</Text>
              <Text size="2">Blob ID: {uploadResult.blobId}</Text>
              <Text size="2">Access: {selectedPattern}</Text>
            </Card>
          )}
        </Card>
      </Grid>
    </Container>
  );
}
```

### 6. Testing Strategy
#### 6.1 Unit Tests
- Component rendering tests
- Hook functionality tests
- Utility function tests
- Service layer tests

#### 6.2 Integration Tests
- Walrus SDK integration
- Seal SDK integration
- Wallet connection tests
- End-to-end workflows

#### 6.3 E2E Tests
- Complete user journeys
- Network switching
- Error handling
- Performance testing

### 7. Deployment Configuration
#### 7.1 Environment Variables
```
VITE_SUI_NETWORK=testnet
VITE_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
VITE_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
VITE_SEAL_PACKAGE_ID=0x927a54e9ae803f82ebf480136a9bcff45101ccbe28b13f433c89f5181069d682
```

#### 7.2 Build Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/api/walrus': {
        target: process.env.VITE_WALRUS_AGGREGATOR,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/walrus/, '')
      }
    }
  }
});
```

## 実装状況と残タスク

### ✅ 完了済み（Phase 1-3基盤部分）

**基盤システム:**
- ✅ Vite + React + TypeScript プロジェクト
- ✅ 全SDK依存関係（@mysten/walrus, @mysten/seal, @mysten/sui, @mysten/dapp-kit）
- ✅ Radix UI Themes設定
- ✅ React Router DOM v7
- ✅ TanStack React Query

**コアコンポーネント:**
- ✅ AppLayout, Header, Footer, Navigation
- ✅ WalletConnector, NetworkSwitcher
- ✅ ErrorBoundary, LoadingSpinner
- ✅ AppContext（グローバル状態管理）

**Walrus基本機能:**
- ✅ WalrusService（正しいAPI仕様準拠版）
- ✅ BlobUploader, BlobViewer
- ✅ useWalrus hook
- ✅ Store page（ファイルアップロード・表示）

**Seal基本機能:**
- ✅ SealService（正しいAPI仕様準拠版）
- ✅ EncryptionPanel, DecryptionPanel
- ✅ useSeal hook
- ✅ Encrypt page

**統合機能:**
- ✅ EncryptedFileUploader
- ✅ SecureStorage page（基本実装）

### 🚧 実装が必要な機能

#### Phase 4: Walrus拡張機能
1. **Quilt機能実装**
   - QuiltUploader コンポーネント
   - QuiltViewer コンポーネント  
   - Quilt Management page

2. **CLI専用機能の説明UI**
   - Extend/Delete機能の制限説明
   - CLI使用方法ガイド
   - System Info制限の説明

#### Phase 5: Seal SDK統合
3. **Seal SDK完全統合**
   - 実際の暗号化・復号化実装
   - セッションキー生成・管理
   - 証明書作成・署名システム

4. **Key Server API統合**
   - GET /v1/service実装
   - POST /v1/fetch_key実装
   - 認証システム統合

#### Phase 6: Move契約連携
5. **Allowlist Demo**
   - Move契約ベースの許可リスト管理
   - 暗号化ファイル共有デモ
   - Allowlist page実装

6. **Subscription Demo**
   - サブスクリプション制御システム
   - 支払い・購読機能
   - Subscription page実装

7. **Time-lock Demo**
   - 時間制限暗号化機能
   - 自動解放システム
   - Timelock page実装

#### Phase 7: 高度な機能
8. **Access Pattern管理**
   - Pattern Builder UI
   - Policy Management page
   - Key Management page

9. **Settings機能**
   - ネットワーク設定
   - テーマ切り替え
   - アプリケーション設定

#### Phase 8: テスト・品質向上
10. **テスト実装**
    - Unit tests (Jest + React Testing Library)
    - Integration tests
    - E2E tests (Playwright)

11. **UI/UX改善**
    - レスポンシブデザイン
    - ダークモード対応
    - アクセシビリティ向上

### 🎯 優先実装タスク

1. **Seal SDK統合**（最重要）
   - 実際の暗号化・復号化機能
   - Key server認証システム

2. **Quilt機能**（Walrus完全対応）
   - Multipart upload
   - Batch management

3. **Move契約デモ**（Seal完全活用）
   - Allowlist management
   - Access control patterns

## まとめ

この仕様書は、Walrus と Seal の全機能を包括的にテストできるフロントエンドUIの完全な実装ガイドを提供します。

### 🎯 現在の状況
- **基盤システム**: ✅ 完全実装済み
- **Walrus基本機能**: ✅ HTTP API対応分実装済み  
- **Seal基本機能**: ✅ 基本構造実装済み
- **統合機能**: ✅ 基本フレームワーク実装済み

### 📋 実装アーキテクチャの特徴
1. **正確なAPI仕様準拠**: docs/walrus, docs/sealの公式ドキュメントに完全準拠
2. **実ネットワーク接続**: モック一切なし、全て実際のTestnet/Mainnet接続
3. **最新技術スタック**: React 19, Vite 7, TypeScript, Radix UI Themes
4. **段階的実装**: 基盤→基本機能→拡張機能→高度な統合という明確な実装フェーズ

### 🚀 次のステップ
優先度順に以下の機能実装を推進：
1. **Seal SDK統合**（暗号化・復号化の実装）
2. **Quilt機能**（Walrus完全対応）  
3. **Move契約連携**（Allowlist, Subscription, Timelock）

これにより、両プロトコルの能力を完全に実証できる本格的なデモアプリケーションが完成します。
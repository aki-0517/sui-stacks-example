# Walrus & Seal 統合フロントエンド UI 仕様書

## 概要

この仕様書は、Walrus（分散ストレージ）とSeal（暗号化・アクセス制御）の全機能をテストできるフロントエンドUIの実装仕様を定義します。React + Vite + TypeScriptを使用し、モックは一切使用せず、実際のネットワークとの接続によって機能を検証します。

## システム要件

### 技術スタック
- **Package Manager**: bun
- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite 5+
- **SDK**: 
  - @mysten/walrus: Walrus TypeScript SDK
  - @mysten/seal: Seal TypeScript SDK
  - @mysten/sui: Sui TypeScript SDK
  - @mysten/dapp-kit: Wallet connection
- **UI Framework**: Radix UI Themes
- **Routing**: React Router v6
- **State Management**: React hooks + Context API

### ネットワーク接続
- **Sui Network**: Testnet/Mainnet対応
- **Walrus**: Testnet/Mainnet aggregator/publisher
- **Seal**: Key servers (testnet/mainnet)

## 機能要件

### 1. Walrus 機能
#### 1.1 Blob ストレージ機能
- **Store Blob**: ファイルアップロード（単一・複数対応）
- **Read Blob**: Blob IDによる取得
- **Blob Status**: ステータス確認
- **Extend Blob**: 有効期限延長
- **Delete Blob**: deletable blobの削除
- **Shared Blob**: 共有blob作成・資金提供

#### 1.2 Quilt（バッチストレージ）機能
- **Store Quilt**: 複数ファイルの一括保存
- **Read Quilt**: Quilt内のblob取得
- **List Patches**: Quilt内パッチ一覧
- **Tag Filtering**: タグによるフィルタリング

#### 1.3 システム情報機能
- **System Info**: ネットワーク情報表示
- **Health Check**: ストレージノード状態確認
- **Blob List**: 所有blob一覧

#### 1.4 設定・管理機能
- **Blob Attributes**: メタデータ設定・取得・削除
- **Network Switch**: Testnet/Mainnet切り替え
- **Upload Relay**: アップロードリレー設定

### 2. Seal 機能
#### 2.1 暗号化・復号化機能
- **Encrypt Data**: データ暗号化
- **Decrypt Data**: データ復号化
- **Session Key**: セッションキー管理
- **Key Server**: キーサーバー選択・検証

#### 2.2 アクセス制御パターン
- **Private Data**: 単一所有者制御
- **Allowlist**: 許可リスト管理
- **Subscription**: サブスクリプション制御
- **Time-lock**: 時間制限暗号化
- **Secure Voting**: 暗号化投票

#### 2.3 Move パッケージ連携
- **Package Deployment**: アクセス制御パッケージのデプロイ
- **Policy Management**: ポリシー関数実行
- **On-chain Decryption**: チェーン上復号化

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
// Walrus API Service
class WalrusService {
  store(files: File[], options: StoreOptions): Promise<StoreResult>;
  read(blobId: string): Promise<Blob>;
  status(blobId: string): Promise<BlobStatus>;
  extend(objectId: string, epochs: number): Promise<void>;
  delete(blobId: string): Promise<void>;
  storeQuilt(files: QuiltFile[], options: StoreOptions): Promise<QuiltResult>;
  readQuilt(quiltId: string, identifier: string): Promise<Blob>;
  systemInfo(): Promise<SystemInfo>;
}

// Seal API Service
class SealService {
  encrypt(data: Uint8Array, policy: EncryptionPolicy): Promise<EncryptionResult>;
  decrypt(encryptedData: Uint8Array, sessionKey: SessionKey): Promise<Uint8Array>;
  createSessionKey(packageId: string, ttl: number): Promise<SessionKey>;
  verifyKeyServers(serverIds: string[]): Promise<boolean>;
  fetchKeys(ids: string[], txBytes: Uint8Array, sessionKey: SessionKey): Promise<Map<string, string>>;
}
```

## 実装仕様

### 1. プロジェクト構造
```
src/
├── components/
│   ├── layout/
│   ├── walrus/
│   ├── seal/
│   ├── integration/
│   └── common/
├── services/
│   ├── walrus.ts
│   ├── seal.ts
│   └── sui.ts
├── hooks/
│   ├── useWalrus.ts
│   ├── useSeal.ts
│   └── useWallet.ts
├── utils/
│   ├── constants.ts
│   ├── config.ts
│   └── helpers.ts
├── types/
│   ├── walrus.ts
│   ├── seal.ts
│   └── common.ts
├── pages/
│   ├── Landing.tsx
│   ├── Walrus/
│   ├── Seal/
│   └── Integration/
├── context/
│   ├── AppContext.tsx
│   ├── WalrusContext.tsx
│   └── SealContext.tsx
└── styles/
    └── global.css
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

  const store = useCallback(async (files: File[], options: StoreOptions) => {
    // Implementation
  }, []);

  const read = useCallback(async (blobId: string) => {
    // Implementation
  }, []);

  const status = useCallback(async (blobId: string) => {
    // Implementation
  }, []);

  return {
    blobs,
    loading,
    error,
    store,
    read,
    status,
    extend,
    delete: deleteBl ob,
    storeQuilt,
    readQuilt
  };
}
```

#### 3.2 Seal Hook
```typescript
export function useSeal() {
  const [sessionKeys, setSessionKeys] = useState<Map<string, SessionKey>>(new Map());
  const [keyServers, setKeyServers] = useState<KeyServerInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const encrypt = useCallback(async (data: Uint8Array, policy: EncryptionPolicy) => {
    // Implementation
  }, []);

  const decrypt = useCallback(async (encryptedData: Uint8Array, sessionKey: SessionKey) => {
    // Implementation
  }, []);

  const createSessionKey = useCallback(async (packageId: string, ttl: number) => {
    // Implementation
  }, []);

  return {
    sessionKeys,
    keyServers,
    loading,
    encrypt,
    decrypt,
    createSessionKey,
    verifyKeyServers,
    fetchKeys
  };
}
```

### 4. UI Components Implementation
#### 4.1 Blob Uploader Component
```typescript
interface BlobUploaderProps {
  onUpload: (result: StoreResult) => void;
  maxFiles?: number;
  encrypted?: boolean;
  sealPolicy?: EncryptionPolicy;
}

export function BlobUploader({ onUpload, maxFiles = 1, encrypted = false, sealPolicy }: BlobUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [epochs, setEpochs] = useState(5);
  const [permanent, setPermanent] = useState(false);
  
  const { store } = useWalrus();
  const { encrypt } = useSeal();

  const handleUpload = async () => {
    setUploading(true);
    try {
      if (encrypted && sealPolicy) {
        // Encrypt files first, then store on Walrus
        const encryptedFiles = await Promise.all(
          files.map(async (file) => {
            const data = await file.arrayBuffer();
            const encrypted = await encrypt(new Uint8Array(data), sealPolicy);
            return new File([encrypted.encryptedObject], `${file.name}.encrypted`);
          })
        );
        const result = await store(encryptedFiles, { epochs, permanent });
        onUpload(result);
      } else {
        // Direct Walrus storage
        const result = await store(files, { epochs, permanent });
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
          multiple={maxFiles > 1}
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
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
          disabled={files.length === 0 || uploading}
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
      // Build transaction to add address to allowlist
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::allowlist::add_to_allowlist`,
        arguments: [
          tx.object(allowlistId!),
          tx.pure.address(newAddress)
        ]
      });
      
      // Execute transaction
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

## 実装TODO

以下は、AI Agent が自立的に実装できるように詳細に分解したタスクリストです：

### Phase 1: プロジェクトセットアップ
1. **Vite + React + TypeScript プロジェクト作成**
   - `npm create vite@latest walrus-seal-ui -- --template react-ts`
   - 必要なSDKの依存関係追加
   - Radix UI Themes設定

2. **基本プロジェクト構造作成**
   - ディレクトリ構造作成
   - 基本的なファイル配置
   - TypeScript設定調整

3. **ネットワーク設定・定数定義**
   - ネットワーク設定ファイル作成
   - Walrus/Seal設定定数
   - 型定義ファイル作成

### Phase 2: 基盤機能実装
4. **ウォレット接続機能**
   - @mysten/dapp-kit セットアップ
   - ウォレット接続コンポーネント
   - ネットワーク切り替え機能

5. **基本Layout・Navigation**
   - AppLayout コンポーネント
   - Navigation コンポーネント
   - ルーティング設定

6. **共通コンポーネント**
   - ErrorBoundary
   - LoadingSpinner
   - TransactionTracker

### Phase 3: Walrus機能実装
7. **Walrus Service Layer**
   - WalrusService クラス実装
   - HTTP API ラッパー実装
   - エラーハンドリング

8. **Blob Storage UI**
   - BlobUploader コンポーネント
   - BlobViewer コンポーネント
   - BlobList コンポーネント

9. **Blob Management UI**
   - BlobStatus 表示
   - Blob Extension 機能
   - Blob Deletion 機能
   - Blob Attributes 管理

10. **Quilt機能**
    - QuiltUploader コンポーネント
    - QuiltViewer コンポーネント
    - QuiltManager コンポーネント

11. **System Information**
    - SystemDashboard コンポーネント
    - Health Check 機能
    - ネットワーク情報表示

### Phase 4: Seal機能実装
12. **Seal Service Layer**
    - SealService クラス実装
    - SessionKey 管理
    - キーサーバー通信

13. **暗号化・復号化UI**
    - EncryptionPanel コンポーネント
    - DecryptionPanel コンポーネント
    - KeyServerSelector コンポーネント

14. **SessionKey管理**
    - SessionKeyManager コンポーネント
    - セッション持続化
    - TTL管理

15. **アクセス制御パターン実装**
    - AllowlistManager コンポーネント
    - SubscriptionManager コンポーネント
    - TimeLockManager コンポーネント

### Phase 5: 統合機能実装
16. **暗号化ファイルストレージ**
    - EncryptedFileUploader コンポーネント
    - 暗号化 + Walrus保存フロー
    - 復号化 + Walrus取得フロー

17. **Allowlist Demo**
    - 許可リスト作成・管理
    - 暗号化ファイル共有
    - アクセス制御デモ

18. **Subscription Demo**
    - サブスクリプションサービス作成
    - 支払い・購読機能
    - コンテンツアクセス制御

19. **Time-lock Demo**
    - 時間制限暗号化設定
    - 時間制限コンテンツ作成
    - 自動解放デモ

### Phase 6: 高度な機能
20. **Secure Voting Demo**
    - 投票システム作成
    - 暗号化投票収集
    - 集計・結果表示

21. **On-chain Decryption**
    - Move integration
    - オンチェーン復号化デモ
    - 検証結果表示

22. **Upload Relay機能**
    - Upload Relay設定
    - プロキシアップロード
    - Tip支払い機能

### Phase 7: UI/UX改善
23. **レスポンシブデザイン**
    - モバイル対応
    - タブレット対応
    - デスクトップ最適化

24. **ダークモード**
    - テーマ切り替え
    - 設定持続化
    - アクセシビリティ

25. **パフォーマンス最適化**
    - 遅延読み込み
    - キャッシュ戦略
    - バンドル最適化

### Phase 8: テスト・品質
26. **単体テスト**
    - コンポーネントテスト
    - Hookテスト
    - Serviceテスト

27. **統合テスト**
    - SDK統合テスト
    - ワークフローテスト
    - エラーシナリオテスト

28. **E2Eテスト**
    - Cypressセットアップ
    - ユーザージャーニーテスト
    - ネットワーク切り替えテスト

### Phase 9: ドキュメント・デプロイ
29. **ドキュメント作成**
    - README作成
    - API ドキュメント
    - ユーザーガイド

30. **デプロイメント**
    - Vercel設定
    - 環境変数設定
    - CI/CD パイプライン

## まとめ

この仕様書は、Walrus と Seal の全機能を包括的にテストできるフロントエンドUIの完全な実装ガイドを提供します。React + Vite + TypeScript の最新技術スタックを使用し、実際のネットワークとの接続により、両プロトコルの能力を実証できる本格的なアプリケーションとなります。

30個の詳細なTODOアイテムにより、AI Agent が段階的かつ自立的に実装を進められるよう設計されています。各フェーズは独立性を保ちながら、全体として統合された機能豊富なUIを構築できます。
export const NETWORK_CONFIG = {
  testnet: {
    sui: {
      rpc: 'https://fullnode.testnet.sui.io',
      faucet: 'https://faucet.testnet.sui.io/gas'
    },
    walrus: {
      aggregator: 'https://aggregator.walrus-testnet.walrus.space',
      publisher: 'https://publisher.walrus-testnet.walrus.space',
      packageId: '0x618c6d4e8e5c08c2885e17c00b0983b0dc2c3b57a2a7a28b86cbb6b5f6b9f0f1'
    },
    seal: {
      keyServers: [
        { 
          id: '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75', 
          url: 'https://seal-testnet.mystenlabs.com',
          verified: true,
          threshold: 1,
          publicKey: '0x03a...',
          status: 'online' as const
        },
        { 
          id: '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8', 
          url: 'https://seal-testnet.mystenlabs.com',
          verified: true,
          threshold: 1,
          publicKey: '0x03b...',
          status: 'online' as const
        }
      ],
      packageId: '0x8afa5d31dbaa0a8fb07082692940ca3d56b5e856c5126cb5a3693f0a4de63b82',
      defaultThreshold: 2,
      sessionTTL: 10,
      encryptionMode: 'HMAC-CTR'
    }
  },
  mainnet: {
    sui: {
      rpc: 'https://fullnode.mainnet.sui.io',
      faucet: ''
    },
    walrus: {
      aggregator: 'https://aggregator.walrus.space',
      publisher: 'https://publisher.walrus.space',
      packageId: '0x618c6d4e8e5c08c2885e17c00b0983b0dc2c3b57a2a7a28b86cbb6b5f6b9f0f1'
    },
    seal: {
      keyServers: [
        { 
          id: '0x1bf28f8ff9e12bafcbe3b2e42a1db1d4b8a1e9b8c5d6e7f8a9b0c1d2e3f4a5b6', 
          url: 'https://seal.mystenlabs.com',
          verified: true,
          threshold: 2,
          publicKey: '0x03b...',
          status: 'online' as const
        }
      ],
      packageId: '0x1bf28f8ff9e12bafcbe3b2e42a1db1d4b8a1e9b8c5d6e7f8a9b0c1d2e3f4a5b6',
      defaultThreshold: 2,
      sessionTTL: 10,
      encryptionMode: 'HMAC-CTR'
    }
  }
};;

export const APP_CONFIG = {
  walrus: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    defaultEpochs: 5,
    supportedTypes: ['image/*', 'text/*', 'application/json', 'video/*', 'audio/*']
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

export const ROUTES = {
  HOME: '/',
  WALRUS: {
    ROOT: '/walrus',
    STORE: '/walrus/store',
    QUILT: '/walrus/quilt',
    MANAGE: '/walrus/manage',
    SYSTEM: '/walrus/system'
  },
  SEAL: {
    ROOT: '/seal',
    ENCRYPT: '/seal/encrypt',
    PATTERNS: '/seal/patterns',
    KEYS: '/seal/keys',
    POLICIES: '/seal/policies'
  },
  INTEGRATED: {
    ROOT: '/integrated',
    SECURE_STORAGE: '/integrated/secure-storage',
    ALLOWLIST: '/integrated/allowlist',
    SUBSCRIPTION: '/integrated/subscription',
    TIMELOCK: '/integrated/timelock'
  },
  SETTINGS: '/settings'
};

export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  NETWORK_ERROR: 'Network error occurred. Please try again.',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this operation',
  FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
  INVALID_FILE_TYPE: 'File type is not supported',
  ENCRYPTION_FAILED: 'Failed to encrypt data',
  DECRYPTION_FAILED: 'Failed to decrypt data',
  UPLOAD_FAILED: 'Failed to upload file',
  DOWNLOAD_FAILED: 'Failed to download file'
};

export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: 'File uploaded successfully',
  FILE_DOWNLOADED: 'File downloaded successfully',
  ENCRYPTION_SUCCESS: 'Data encrypted successfully',
  DECRYPTION_SUCCESS: 'Data decrypted successfully',
  WALLET_CONNECTED: 'Wallet connected successfully',
  NETWORK_SWITCHED: 'Network switched successfully'
};
# Codebase Structure

## Project Root
```
sui-stacks-example/
├── .git/                    # Git repository
├── .gitignore              # Git ignore rules
├── CLAUDE.md               # Project instructions for Claude
├── docs/                   # Documentation
│   ├── seal/              # Seal protocol documentation
│   ├── walrus/            # Walrus protocol documentation
│   ├── ts-sdks/           # TypeScript SDK documentation
│   └── walrus-seal-frontend-spec.md  # Complete UI specification (in Japanese)
└── walrus-seal-ui/        # Main React application
```

## Main Application Structure (walrus-seal-ui/)
```
walrus-seal-ui/
├── src/
│   ├── components/
│   │   ├── layout/          # Layout components (✅ implemented)
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   ├── walrus/          # Walrus-specific UI (✅ implemented)
│   │   │   ├── BlobUploader.tsx
│   │   │   └── BlobViewer.tsx
│   │   ├── seal/            # Seal-specific UI (✅ implemented)
│   │   │   ├── EncryptionPanel.tsx
│   │   │   └── DecryptionPanel.tsx
│   │   ├── integration/     # Combined functionality (✅ implemented)
│   │   │   └── EncryptedFileUploader.tsx
│   │   └── common/          # Shared components (✅ implemented)
│   │       ├── WalletConnector.tsx
│   │       ├── NetworkSwitcher.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   ├── services/            # API service classes (✅ implemented)
│   │   ├── walrus.ts       # WalrusService - direct HTTP API
│   │   └── seal.ts         # SealService - key server integration
│   ├── hooks/               # Custom React hooks (✅ implemented)
│   │   ├── useWalrus.ts    # Walrus operations hook
│   │   └── useSeal.ts      # Seal operations hook
│   ├── types/               # TypeScript definitions (✅ implemented)
│   │   ├── common.ts       # Shared types
│   │   ├── walrus.ts       # Walrus-specific types
│   │   └── seal.ts         # Seal-specific types
│   ├── utils/               # Utility functions (✅ implemented)
│   │   ├── constants.ts    # Network configs, routes, messages
│   │   └── config.ts       # Configuration helpers
│   ├── context/             # React Context (✅ implemented)
│   │   └── AppContext.tsx  # Global state management
│   ├── pages/               # Route components (✅ partially implemented)
│   │   ├── Landing.tsx     # Main landing page
│   │   ├── Walrus/
│   │   │   └── Store.tsx   # Walrus storage page
│   │   ├── Seal/
│   │   │   └── Encrypt.tsx # Seal encryption page
│   │   └── Integration/
│   │       └── SecureStorage.tsx  # Combined features
│   ├── styles/              # Global styles (✅ implemented)
│   │   └── global.css
│   ├── App.tsx             # Main app component (✅ implemented)
│   └── main.tsx            # React entry point (✅ implemented)
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript project references
├── tsconfig.app.json       # TypeScript app config
├── tsconfig.node.json      # TypeScript node config
└── eslint.config.js        # ESLint configuration
```

## Implementation Status

### ✅ Fully Implemented (Phase 1-3)
- **Base infrastructure**: Vite + React + TypeScript setup
- **All SDK dependencies**: Walrus, Seal, Sui, dapp-kit
- **Core service layer**: Real API integration (no mocks)
- **State management**: React Context with network switching
- **Basic UI components**: Layout, common components, basic pages
- **Wallet integration**: Sui wallet connection with network awareness

### 🚧 Partially Implemented
- **Walrus features**: Basic blob storage ✅, Quilt management ⏳
- **Seal features**: Basic UI ✅, Full SDK integration ⏳
- **Integration features**: Basic encrypted storage ✅, Advanced patterns ⏳

### ⏳ Future Implementation
- **Move contract integration**: Allowlist, subscription, time-lock patterns
- **Advanced UI**: Settings page, system monitoring, comprehensive error handling
- **Testing**: Unit tests, integration tests, E2E tests

## Key Files to Know

### Configuration
- `src/utils/constants.ts`: Network endpoints and configuration
- `vite.config.ts`: Build configuration
- `tsconfig.app.json`: TypeScript compiler settings

### Core Services
- `src/services/walrus.ts`: Direct HTTP API integration with Walrus
- `src/services/seal.ts`: Key server and SDK integration
- `src/context/AppContext.tsx`: Global state management

### Entry Points
- `src/main.tsx`: React application entry point
- `src/App.tsx`: Main app component with routing
- `package.json`: Scripts and dependencies

## Documentation Resources
- `docs/walrus-seal-frontend-spec.md`: Complete technical specification (Japanese)
- `docs/walrus/`: Official Walrus protocol documentation
- `docs/seal/`: Official Seal protocol integration guides
- `docs/ts-sdks/`: TypeScript SDK documentation and examples
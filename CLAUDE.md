# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive React + TypeScript frontend application that integrates **Walrus** (decentralized storage) and **Seal** (encryption & access control) protocols. **CRITICAL: This application uses NO MOCKS whatsoever** - all functionality connects directly to real Walrus and Seal networks (testnet/mainnet) for authentic testing and demonstration.

## Development Commands

**Package Manager**: This project uses `bun` exclusively.

```bash
# Development
bun install          # Install dependencies
bun run dev         # Start development server (http://localhost:5173)
bun run build       # Build for production
bun run lint        # Run ESLint
bun run preview     # Preview production build
```

## Architecture Overview

### Real Network Integration (NO MOCKS)
The application connects directly to live networks:
- **Walrus**: `aggregator.walrus-testnet.walrus.space` and `publisher.walrus-testnet.walrus.space`
- **Seal**: `seal-testnet.mystenlabs.com` key servers
- **Sui**: `fullnode.testnet.sui.io` RPC endpoint

All network configurations are in `src/utils/constants.ts` with both testnet and mainnet endpoints.

### Core Architecture Layers

1. **Service Layer** (`src/services/`):
   - `WalrusService`: Direct HTTP API integration with Walrus aggregator/publisher
   - `SealService`: Direct integration with Seal key servers for encryption/decryption
   - Both services implement real network calls using fetch() - no simulation

2. **State Management**:
   - React Context API with useReducer in `src/context/AppContext.tsx`
   - Centralized state for wallet, network, Walrus blobs, and Seal session keys
   - Network switching updates all service configurations dynamically

3. **Custom Hooks** (`src/hooks/`):
   - `useWalrus()`: Manages Walrus operations (store, read, status, extend, delete)
   - `useSeal()`: Manages Seal operations (encrypt, decrypt, session keys, policies)
   - Both hooks wrap service calls with loading states and error handling

4. **Component Structure**:
   - **Walrus Components**: File upload/download, blob management, system monitoring
   - **Seal Components**: Encryption/decryption panels, policy management
   - **Integration Components**: Combined workflows (encrypt → store on Walrus)

### Key Integration Patterns

**Encrypted File Storage Workflow**:
1. User selects files and access policy
2. Files are encrypted locally using Seal with chosen policy
3. Encrypted data is uploaded to Walrus network
4. Session keys stored for later decryption
5. Blob ID returned for sharing encrypted files

**Network Configuration**:
- Dynamic switching between testnet/mainnet
- All endpoints and package IDs update automatically
- Wallet connection maintains state across network changes

### Real Data Flow Examples

**Walrus Store Operation**:
```typescript
// Real API call to Walrus publisher
const response = await fetch(`${this.config.publisher}/v1/store`, {
  method: 'POST',
  body: formData // Actual file data
});
```

**Seal Encryption**:
```typescript
// Real encryption request to Seal key server
const response = await fetch(`${keyServer.url}/v1/encrypt`, {
  method: 'POST',
  body: JSON.stringify({
    data: Array.from(data),
    policy: policy,
    sessionKey: sessionKey.id
  })
});
```

### TypeScript Configuration Notes

- `verbatimModuleSyntax: false` - Required for compatibility with SDK imports
- `noUnusedLocals: false` - Relaxed for development convenience
- Node.js types included for process.env access in error boundaries

### Wallet Integration

Uses `@mysten/dapp-kit` for Sui wallet connectivity:
- Auto-connect on app load
- Network-aware wallet state
- Transaction building for Sui interactions
- Balance monitoring and gas management

### Development Considerations

**Real Network Dependencies**:
- Requires actual wallet with testnet SUI for transactions
- Network latency affects UI responsiveness
- Error handling includes real network failure scenarios
- Rate limiting and timeout handling implemented

**Environment Variables**:
Network endpoints are hardcoded in constants but can be overridden via environment variables following the pattern:
- `VITE_WALRUS_AGGREGATOR`
- `VITE_WALRUS_PUBLISHER` 
- `VITE_SEAL_PACKAGE_ID`

**Security Notes**:
- No private keys or sensitive data in code
- All encryption happens client-side
- Session keys managed securely through Seal's key servers
- Network configurations use HTTPS endpoints only

The application serves as a complete integration test suite for both Walrus and Seal protocols, demonstrating real-world usage patterns without any mocked functionality.
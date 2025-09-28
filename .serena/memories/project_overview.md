# Project Overview: Sui + Stacks Example (Walrus & Seal Integration)

## Purpose
This is a comprehensive React + TypeScript frontend application that integrates **Walrus** (decentralized storage) and **Seal** (encryption & access control) protocols. The application connects directly to real Walrus and Seal networks (testnet/mainnet) for authentic testing and demonstration - **NO MOCKS whatsoever**.

## Tech Stack
- **Package Manager**: `bun` (exclusively)
- **Frontend**: React 19+ with TypeScript
- **Build Tool**: Vite 7+
- **UI Framework**: Radix UI Themes ^3.2.1
- **Routing**: React Router DOM v7
- **State Management**: React Context API + useReducer
- **Query Management**: TanStack React Query ^5.90.2

## Key SDKs
- `@mysten/walrus`: ^0.7.0
- `@mysten/seal`: ^0.8.0
- `@mysten/sui`: ^1.38.0
- `@mysten/dapp-kit`: ^0.18.0

## Real Network Integration
The application connects directly to live networks:
- **Walrus**: `aggregator.walrus-testnet.walrus.space` and `publisher.walrus-testnet.walrus.space`
- **Seal**: `seal-testnet.mystenlabs.com` key servers
- **Sui**: `fullnode.testnet.sui.io` RPC endpoint

## Core Features
### Walrus Features
- Blob storage (single file upload via HTTP API)
- Quilt management (batch storage)
- Status checking and blob reading
- Note: CLI-only features like extend/delete are marked as unavailable

### Seal Features
- Client-side encryption/decryption
- Key server verification and key fetching
- Session key management
- Move contract integration for access control

### Integration Features
- Encrypted file storage workflow
- Access control patterns (allowlist, subscription, time-lock)
- Secure file sharing with policy-based access

## Architecture
- **Service Layer**: Direct HTTP API integration with Walrus/Seal
- **State Management**: Centralized React Context with network switching
- **Custom Hooks**: `useWalrus()` and `useSeal()` for operations
- **Component Structure**: Modular components for Walrus, Seal, and integration features

## Documentation
The project includes comprehensive documentation in `docs/` directory:
- `docs/walrus/`: Complete Walrus protocol documentation
- `docs/seal/`: Comprehensive Seal protocol integration guides
- `docs/ts-sdks/`: TypeScript SDK documentation and examples
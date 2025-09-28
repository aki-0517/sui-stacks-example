# Network Architecture and Real API Integration

## Core Principle: NO MOCKS
This application connects directly to real Walrus and Seal networks. There are **NO MOCKS whatsoever** - all functionality uses authentic network connections for testing and demonstration.

## Network Configuration

### Testnet Configuration
```typescript
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
    keyServers: [{
      id: '0x927a54e9ae803f82ebf480136a9bcff45101ccbe28b13f433c89f5181069d682',
      url: 'https://seal-testnet.mystenlabs.com'
    }],
    packageId: '0x927a54e9ae803f82ebf480136a9bcff45101ccbe28b13f433c89f5181069d682'
  }
}
```

### Mainnet Configuration
Similar structure with mainnet endpoints for production use.

## Service Architecture

### Walrus Service (HTTP API Integration)
**Real API calls to Walrus networks:**

```typescript
// Store blob - PUT /v1/blobs
const response = await fetch(`${this.config.publisher}/v1/blobs`, {
  method: 'PUT',
  body: file // Actual file data
});

// Read blob - GET /v1/blobs/{blob_id}
const response = await fetch(`${this.config.aggregator}/v1/blobs/${blobId}`);

// Store quilt - PUT /v1/quilts  
const response = await fetch(`${this.config.publisher}/v1/quilts`, {
  method: 'PUT',
  body: formData // Multiple files
});
```

**API Limitations Handled:**
- CLI-only features (extend, delete, systemInfo) throw descriptive errors
- Status checking uses HEAD requests since direct status API not available on aggregator
- Blob listing not available in public HTTP API

### Seal Service (Key Server + SDK Integration)
**Real key server API calls:**

```typescript
// Service verification - GET /v1/service
const response = await fetch(`${server.url}/v1/service?service_id=${serverId}`);

// Key fetching - POST /v1/fetch_key
const response = await fetch(`${keyServer.url}/v1/fetch_key`, {
  method: 'POST',
  body: JSON.stringify({
    ptb: Array.from(ptb),
    certificate: certificate,
    request_signature: signature
  })
});
```

**SDK Integration Points:**
- Client-side encryption/decryption (to be implemented)
- Session key generation and management
- Certificate creation and signing

## Data Flow Patterns

### Encrypted File Storage Workflow
1. **User selects files** and access policy in UI
2. **Files encrypted locally** using Seal with chosen policy
3. **Encrypted data uploaded** to Walrus network via HTTP API
4. **Session keys stored** for later decryption
5. **Blob ID returned** for sharing encrypted files

### Network Switching
- Dynamic endpoint updates when switching testnet/mainnet
- Wallet connection maintains state across network changes
- All service configurations update automatically
- Session keys reset when changing networks

## Real Network Dependencies

### Requirements for Testing
- **Actual wallet** with testnet SUI for transactions
- **Internet connectivity** to testnet/mainnet endpoints
- **Gas fees** for Sui transactions
- **Network latency** affects UI responsiveness

### Error Handling for Real Networks
- **Timeout handling** for slow network responses
- **Rate limiting** respect for API endpoints
- **Network failure scenarios** with user-friendly messages
- **Authentication errors** for Seal key server access

### Performance Considerations
- **Caching strategies** for blob metadata
- **Progress indicators** for file uploads
- **Optimistic UI updates** where appropriate
- **Background syncing** for network state

## Security Implementation

### Client-Side Security
- **No private keys** stored in application code
- **All encryption** happens client-side before transmission
- **Session keys** managed securely through Seal's key servers
- **HTTPS endpoints** only for all network communication

### Access Control
- **Policy-based encryption** using Seal's Move contracts
- **Allowlist management** through on-chain contracts
- **Time-locked content** with automatic release
- **Subscription control** for paid content access

## Development Considerations

### Environment Variables
Network endpoints can be overridden via environment variables:
- `VITE_WALRUS_AGGREGATOR`
- `VITE_WALRUS_PUBLISHER`
- `VITE_SEAL_PACKAGE_ID`

### Testing Strategy
- **Integration testing** with real networks
- **Error scenario testing** with network failures
- **Performance testing** under network load
- **Security testing** for encryption/decryption flows

### Debugging Network Issues
- Check browser network tab for failed requests
- Verify wallet has sufficient testnet SUI
- Confirm network endpoints are accessible
- Review error messages from service classes
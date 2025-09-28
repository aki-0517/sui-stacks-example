# Code Style and Conventions

## TypeScript Configuration
- **Target**: ES2022
- **Module**: ESNext with bundler resolution
- **JSX**: react-jsx
- **Strict mode**: Enabled
- **Special settings**:
  - `verbatimModuleSyntax: false` (required for SDK compatibility)
  - `noUnusedLocals: false` (relaxed for development)
  - Node.js types included for process.env access

## ESLint Configuration
- **Base**: @eslint/js recommended + typescript-eslint recommended
- **React**: react-hooks recommended-latest + react-refresh/vite
- **Target**: Browser environment with ES2020 features
- **Files**: `**/*.{ts,tsx}`
- **Ignores**: `dist/` directory

## Code Patterns

### Service Classes
```typescript
export class WalrusService implements WalrusClient {
  private config: WalrusConfig;
  
  constructor(config: WalrusConfig) {
    this.config = config;
  }
  
  async store(files: File[], options: WalrusStoreOptions): Promise<WalrusStoreResult> {
    // Implementation with proper error handling
  }
}
```

### Custom Hooks
```typescript
export function useWalrus() {
  const [state, setState] = useState<WalrusState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const operation = useCallback(async (params) => {
    // Implementation
  }, [dependencies]);
  
  return { state, loading, error, operation };
}
```

### Configuration Objects
```typescript
export const NETWORK_CONFIG = {
  testnet: {
    walrus: {
      aggregator: 'https://aggregator.walrus-testnet.walrus.space',
      publisher: 'https://publisher.walrus-testnet.walrus.space'
    }
  }
} as const;
```

## Component Patterns
- **Functional components** with TypeScript interfaces for props
- **Radix UI** components for consistent styling
- **Error boundaries** for robust error handling
- **Loading states** with spinner components
- **Network switching** support throughout

## File Organization
```
src/
├── components/
│   ├── layout/     # AppLayout, Header, Footer, Navigation
│   ├── walrus/     # Walrus-specific components
│   ├── seal/       # Seal-specific components
│   ├── integration/ # Combined functionality
│   └── common/     # Shared components
├── services/       # API service classes
├── hooks/          # Custom React hooks
├── types/          # TypeScript type definitions
├── utils/          # Utility functions and constants
├── context/        # React Context providers
└── pages/          # Route components
```

## Naming Conventions
- **Files**: kebab-case (e.g., `blob-uploader.tsx`)
- **Components**: PascalCase (e.g., `BlobUploader`)
- **Hooks**: camelCase starting with 'use' (e.g., `useWalrus`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `NETWORK_CONFIG`)
- **Types/Interfaces**: PascalCase (e.g., `WalrusConfig`)

## Error Handling
- Services throw errors with descriptive messages
- Components use error boundaries for graceful degradation
- Hooks include error state management
- Network errors specifically handled for real API calls

## Comments Policy
- **DO NOT ADD COMMENTS** unless explicitly requested
- Code should be self-documenting through clear naming
- Use TypeScript types for documentation instead of comments
# Suggested Commands for Development

## Package Management
This project uses **bun exclusively** as the package manager.

```bash
# Install dependencies
bun install

# Start development server (http://localhost:5173)
bun run dev

# Build for production
bun run build

# Lint code
bun run lint

# Preview production build
bun run preview
```

## System Utilities (Darwin/macOS)
Since this runs on Darwin (macOS), use these commands:

```bash
# File operations
ls -la                    # List files with details
find . -name "*.ts"       # Find TypeScript files
grep -r "pattern" src/    # Search for patterns

# Git operations
git status               # Check git status
git log --oneline -10    # View recent commits
git diff                 # View changes

# Development utilities
open http://localhost:5173   # Open app in browser
lsof -i :5173               # Check what's using port 5173
```

## Task Completion Commands
When a development task is completed, run these commands in order:

1. **Lint check**: `bun run lint`
2. **TypeScript check**: `bun run build` (includes tsc -b)
3. **Manual testing**: `bun run dev` and test the changes

## Important Notes
- Always use `bun` instead of npm/yarn/pnpm
- The build command includes TypeScript compilation (`tsc -b`)
- No separate typecheck command - use `bun run build` to verify TypeScript
- Development server runs on port 5173 by default
- Project connects to real networks, so wallet with testnet SUI is needed for testing
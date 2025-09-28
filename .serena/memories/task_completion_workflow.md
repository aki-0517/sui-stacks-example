# Task Completion Workflow

## When a Development Task is Completed

### 1. Code Quality Checks (REQUIRED)
Run these commands in sequence before considering a task complete:

```bash
# 1. Lint check - ensure code style compliance
bun run lint

# 2. TypeScript compilation - verify type safety
bun run build
```

**Important**: The `bun run build` command includes TypeScript compilation (`tsc -b`) so there's no separate typecheck command needed.

### 2. Manual Testing (REQUIRED)
```bash
# Start development server for testing
bun run dev
```

- Navigate to http://localhost:5173
- Test the implemented functionality manually
- Verify wallet connection works (requires testnet SUI)
- Test network switching if applicable
- Verify error handling and loading states

### 3. Error Resolution
If lint or build fails:
- Fix all TypeScript errors before proceeding
- Resolve ESLint warnings and errors
- Re-run the commands until they pass

### 4. Documentation Updates (if needed)
- Update CLAUDE.md if new patterns or conventions are introduced
- Document any new environment variables or configuration

### 5. Git Operations (only if explicitly requested)
**NEVER commit changes unless the user explicitly asks**
- User may request committing changes
- If requested, use conventional commit messages
- Include all relevant files in the commit

## Special Considerations

### Real Network Dependencies
- Application connects to real Walrus/Seal networks
- Testing requires actual wallet with testnet SUI
- Network latency may affect testing
- Some features are CLI-only and will show appropriate error messages

### File Locations
Main application is in `walrus-seal-ui/` subdirectory:
- Run all commands from `walrus-seal-ui/` directory
- Source code is in `walrus-seal-ui/src/`

### Package Manager
- **Only use bun** - never npm, yarn, or pnpm
- All scripts are configured for bun

### TypeScript Strict Mode
- Project uses strict TypeScript settings
- All type errors must be resolved
- No `any` types unless absolutely necessary
- Proper error handling with typed exceptions

## Verification Checklist
Before marking a task complete:
- [ ] `bun run lint` passes without errors
- [ ] `bun run build` completes successfully
- [ ] Manual testing confirms functionality works
- [ ] No TypeScript errors in IDE
- [ ] Error handling works as expected
- [ ] Loading states display properly
- [ ] Network switching works (if applicable)
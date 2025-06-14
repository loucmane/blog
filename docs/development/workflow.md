# Development Workflow

## Best Practices Guidelines (2025)

### Always Use Latest Standards
**CRITICAL**: Before implementing any configuration or setup, ALWAYS:

1. **Check Current Versions**: Verify actual package versions in `package.json` before making assumptions
2. **Use Context7 First**: Query Context7 for latest 2025 best practices before implementing configs
3. **Ask for Examples**: When user has modern examples, use those instead of defaulting to "safe" older configs
4. **Web Search Latest**: For 2025 standards, search for "framework-name 2025 best practices" or similar
5. **Verify Documentation**: Check official docs for latest features and configurations

### 2025 Configuration Standards
- **TypeScript**: Use latest TS 5.0+ features (ES2022+ target, strict checks, modern module resolution)
- **Next.js 15**: Always use latest App Router patterns, React Server Components, and performance features
- **React 19**: Leverage React 19 features (compiler, concurrent features, new hooks)
- **Build Tools**: Use modern bundler settings and performance optimizations

## Optimal Development Workflow (MCP-Enhanced)

**ALWAYS follow this workflow to avoid hallucination, outdated patterns, and suboptimal solutions:**

### 1. Task Planning Phase
- Use `taskmaster-ai` MCP to break down complex tasks into manageable subtasks
- Track progress with task status updates (pending → in-progress → done)
- Maintain visibility into project scope and dependencies

### 2. Research Phase
- **FIRST**: Use Context7 MCP to get latest, authoritative documentation
- **SECOND**: Web search for 2025-specific best practices if needed
- Always prefer Context7 results over assumptions or memory

### 3. Implementation Standards
- Query Context7 for specific library configurations before implementing
- Use exact code examples from Context7 when available
- Verify compatibility between packages using Context7 docs

### 4. Quality Assurance
- Update taskmaster-ai tasks as work progresses
- Use Context7 to verify implementation patterns match current standards
- Keep documentation current with architectural decisions

### 5. Anti-Patterns to Avoid
- ❌ Using outdated boilerplate configs without verification
- ❌ Implementing without checking Context7 for latest patterns
- ❌ Completing tasks without updating taskmaster-ai status
- ❌ Assuming package compatibility without research

## When in Doubt
1. **Ask First**: "Do you have a preferred modern 2025 setup for [technology]?"
2. **Research**: Use Context7 and web search to find latest standards
3. **Explain Choices**: Always explain why specific configurations were chosen
4. **Stay Current**: Aim for top-tier, not just "working" solutions

## Common Commands

### Development
```bash
# Always use pnpm, never npm
pnpm install              # Install dependencies
pnpm dev                  # Run development server
pnpm build                # Build all packages
pnpm lint                 # Run linting
pnpm type-check           # TypeScript checking

# Package-specific commands
cd packages/web && pnpm dev    # Run Next.js dev server
cd packages/ui && pnpm build   # Build UI package
```

### Git Workflow
```bash
git status                # Check current changes
git add .                 # Stage all changes
git commit -m "..."       # Commit with descriptive message
git push origin branch    # Push to remote
```

### Testing
```bash
# Run from project root
pnpm test                 # Run all tests
pnpm test:watch          # Watch mode
pnpm test:coverage       # Coverage report
```
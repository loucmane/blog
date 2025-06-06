# MCP Setup & Troubleshooting

## Available MCP Servers
- `taskmaster-ai`: Project task management (configured locally)
- `claude-code-bridge`: Code analysis tools (configured globally)
- `context7`: External context service (configured globally)

## Context7 Tools Usage

### Available Tools
- `resolve-library-id`: Resolves a general library name into a Context7-compatible library ID
  - `libraryName` (required): The name of the library to search for
- `get-library-docs`: Fetches documentation for a library using a Context7-compatible library ID
  - `context7CompatibleLibraryID` (required): Exact Context7-compatible library ID (e.g., /mongodb/docs, /vercel/next.js)
  - `topic` (optional): Focus the docs on a specific topic (e.g., "routing", "hooks")
  - `tokens` (optional, default 10000): Max number of tokens to return

### Best Practice Workflow
1. Use `resolve-library-id` first to get the exact Context7 ID for any library
2. Then use `get-library-docs` with that ID to fetch current documentation
3. Specify `topic` parameter to focus on relevant sections
4. Increase `tokens` for complex implementations requiring more context

## Troubleshooting Context7 Access

### Issue: Documentation Not Found
**Problem**: `get-library-docs` often returns "Documentation not found" even when `resolve-library-id` shows thousands of snippets

**Root Cause**: Connection sensitivity to parameters and topic complexity

**Step-by-Step Solution**:
1. First try: Use ONLY the exact library ID with NO other parameters
   ```
   context7CompatibleLibraryID="/vercel/next.js" (no topic, no tokens)
   ```
2. If that works, THEN add topic and tokens for focused results
   ```
   context7CompatibleLibraryID="/vercel/next.js"
   topic="TypeScript configuration"
   tokens=12000
   ```

**Failed Approaches**: 
- Version-specific IDs (`/vercel/next.js/v15.1.8`)
- Complex topics on first attempt

**Success Pattern**: Start minimal, then add specificity once connection is confirmed

### Topic Strategy Lessons Learned

**❌ Suboptimal Approach**: Multi-keyword topics like `"TypeScript configuration, Next.js 15, App Router migration, create-next-app"`
- **Problem**: Context7 tries to match ALL keywords, returns mixed/noisy results
- **Result**: Relevant information gets buried in less relevant snippets
- **Example**: Got middleware, authentication, draft mode when we just needed basic setup

**✅ Better Approach**: Single, general topics with manual filtering
- **Strategy**: `topic="TypeScript"` then manually sift through results for Next.js relevance
- **Benefits**: Cleaner results, less noise, easier to spot relevant patterns
- **Process**: Let Context7 focus on one concept, then apply human intelligence to filter

**Recommended Topic Examples**:
```
topic="TypeScript"           # Then find Next.js + TS combinations
topic="App Router"          # Then find setup/configuration patterns  
topic="create-next-app"     # Then find CLI + TypeScript specific usage
topic="configuration"       # Then find Next.js config patterns
```

## MCP Connection Issues

### claude-code-bridge Connection Error

**Problem**: MCP server failing with "Connection closed" error

**Root Cause**: Global config in `~/.claude.json` had incorrect package name
- Was using: `claude-code-mcp` 
- Fixed to: `@steipete/claude-code-mcp@latest`

**Steps Taken**:
1. Checked global `~/.claude.json` config file
2. Located `claude-code-bridge` server config for this project
3. Updated package name in global config
4. Verified package works with test run

**If Issues Persist**:
1. **Option 1**: Remove failing server from global config
2. **Option 2**: Copy working MCP configs to local `.claude.json`
3. **Option 3**: Check MCP logs in `/home/loucmane/.cache/claude-cli-nodejs/*/mcp-logs-*/`
4. **Option 4**: Restart Claude session to reload configs

**Verification**:
- Run `/mcp` command to check server status
- All servers should show as "connected"
- Restart Claude if configs were changed
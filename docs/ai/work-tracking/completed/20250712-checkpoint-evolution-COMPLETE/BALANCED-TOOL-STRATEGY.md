# Balanced Tool Selection Strategy

## The Problem
We've gone from one extreme (using Serena for everything) to another (avoiding Serena even where beneficial). We need balance.

## When to Use Each Tool

### 🔍 Serena IS BEST FOR:
1. **Code Understanding & Navigation**
   - Finding symbol definitions (`find_symbol`)
   - Finding references to symbols (`find_referencing_symbols`)
   - Understanding code structure (`get_symbols_overview`)
   - Semantic code searches

2. **Complex Code Analysis**
   - "How does authentication work in this codebase?"
   - "Where is the database connection established?"
   - "What classes implement this interface?"
   - "Show me all error handlers"

3. **Refactoring Support**
   - Symbol renaming (`replace_symbol_body`)
   - Finding all usages before changes
   - Understanding dependencies

4. **Project Exploration**
   - Initial codebase understanding
   - Architecture discovery
   - Finding implementation patterns

### ✏️ Edit/Write ARE BEST FOR:
1. **All File Modifications**
   - Creating new files
   - Editing existing files
   - Simple find/replace operations
   - Configuration changes

2. **Documentation Updates**
   - README files
   - Comments
   - Markdown files

3. **Why**: Direct, predictable, no language server overhead

### 🔎 Grep IS BEST FOR:
1. **Simple Text Searches**
   - Finding TODO comments
   - Searching for specific strings
   - Log message searches
   - Configuration value lookups

2. **Pattern Matching**
   - Error patterns in logs
   - Simple regex searches
   - Finding imports/requires

3. **Why**: Fast, lightweight, no setup needed

### 📁 LS/Glob ARE BEST FOR:
1. **File System Operations**
   - Listing directory contents
   - Finding files by pattern
   - Checking file existence
   - Project structure overview

## The Balanced Approach

### For Code Understanding Tasks:
```
User: "How does the payment system work?"
→ Use Serena (get_symbols_overview, find_symbol)
→ This is semantic understanding, Serena's strength

User: "Find all files that import PaymentService"
→ Use Grep first (simple pattern)
→ If need more context, then Serena
```

### For Code Modification Tasks:
```
User: "Add a new method to PaymentService"
→ Use Serena to find the class (find_symbol)
→ Use Edit to modify the file
→ Never use Serena for the actual edit
```

### For Search Tasks:
```
User: "Find all TODO comments"
→ Use Grep (simple text pattern)

User: "Find all classes that handle user authentication"
→ Use Serena (semantic understanding needed)
```

## Updated Execution Engine Rules

### SEARCH PROTOCOL Enhancement:
```
TASK: Handle search request "${request}"

Determine search type:
- Simple text/pattern → Use Grep
- Code structure/semantics → Use Serena
- File names/paths → Use Glob
- Implementation details → Use Serena

Examples:
- "Find TODO" → Grep
- "Find error messages" → Grep
- "How does X work" → Serena
- "What implements Y" → Serena
- "Find *.test.js files" → Glob
```

### DEVELOPMENT PROTOCOL Enhancement:
```
TASK: Handle development request "${request}"

For code understanding phase:
- Use Serena to understand existing code
- find_symbol for locating targets
- get_symbols_overview for structure

For modification phase:
- ALWAYS use Edit/Write
- Never use Serena for edits
```

## Key Principle: Right Tool for Right Job

**Not**: "Never use Serena" or "Always use Serena"
**But**: "Use each tool where it excels"

- Serena = Code intelligence
- Edit/Write = File modifications
- Grep = Text searches
- Glob = File system queries

## Implementation in CLAUDE.md

Update the Tool Selection section:
```
### 🔧 Tool Selection
TASK: Select appropriate tool

Load TOOLS.md Section "Tool Selection Handlers" for tool rules:
- Code understanding → Serena (find_symbol, get_overview)
- File modifications → Edit/Write (NOT Serena)
- Text searches → Grep (simple patterns)
- Code semantics → Serena (search_for_pattern)
- File listing → LS or Glob
```

This balanced approach ensures we use each tool's strengths without falling into extremes!
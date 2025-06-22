# Serena MCP Documentation

## Overview

Serena is a semantic code navigation tool that understands your code's meaning and structure. Instead of hunting through files, you describe what you're looking for and Serena finds it intelligently.

## 🚀 Quick Start

```bash
# First time
"Activate project /home/loucmane/dev/javascript/MomsBlog/blog"
"Show me all memories for this project"

# Find code
"Find the Button component"
"Show me authentication logic"
"Find all React hooks"

# Understand relationships  
"What calls this function?"
"Find all imports from shared"
"Show me component dependencies"
```

## 📚 Documentation Structure

### 📝 prompts/
Ready-to-use prompts for common Serena workflows:
- `find-and-refactor.md` - Systematic refactoring with Serena
- `explore-codebase.md` - Understanding new code areas
- `debug-with-semantics.md` - Semantic debugging approach

### 💡 examples/
Real-world usage examples with lessons learned:
- `theme-system-exploration.md` - How we explored the theme implementation
- `button-refactoring.md` - 44px accessibility refactoring
- `cross-package-navigation.md` - Monorepo dependency tracing

### 📋 guidelines/
Best practices and integration patterns:
- `serena-workflows.md` - Common workflows and integration patterns
- `serena-monorepo-guide.md` - MomsBlog-specific usage patterns

### 📚 reference/
Technical documentation and capabilities:
- `serena-overview.md` - Capabilities, when to use, integration points
- `serena-commands.md` - Complete command reference with examples

### Related Documentation
- **[Semantic Workflow Protocol](/docs/ai/protocols/semantic-workflow-protocol.md)** - Step-by-step semantic navigation guide
- **[TWES Test Scenarios](/docs/ai/twes-tests/scenarios/)** - Practice scenarios for Serena usage

## 🎯 When to Use Serena

### ✅ Perfect For:
- **Finding code semantically** - "Where is user authentication?"
- **Understanding relationships** - "What depends on this?"
- **Refactoring safely** - "Update all references"
- **Exploring codebases** - "Show me the architecture"
- **Debugging flows** - "Trace this error"

### ❌ Use Other Tools For:
- **File operations** - Creating, deleting files (use Edit/Write)
- **Running commands** - Use Bash tool
- **Simple edits** - Use Edit for known locations
- **Non-code files** - Images, configs, etc.

## 🔧 Key Capabilities

### 1. Semantic Navigation
```bash
# Instead of: "Is it in src/components/Button.tsx or packages/ui/Button?"
"Find the Button component"

# Instead of: "grep -r 'authenticate' ."
"Find authentication logic"
```

### 2. Relationship Understanding
```bash
# Find usage
"What calls validateUser?"
"Find all imports of Animal type"

# Find dependencies
"What does this component depend on?"
"Show me the call hierarchy"
```

### 3. Memory System
```bash
# Create memories
"Create memory about authentication architecture"

# Read context
"Show me all memories"
"Read the session memory from yesterday"
```

### 4. Intelligent Refactoring
```bash
# Rename across codebase
"Rename UserAuth to AuthenticationService everywhere"

# Update patterns
"Replace old theme pattern with new one"
```

## 🏃 Common Workflows

### Starting Work
```bash
1. Activate project
2. Read memories for context
3. Find relevant code areas
4. Create working memory
```

### Feature Development
```bash
1. Find similar features
2. Understand patterns
3. Find right location
4. Implement with context
5. Verify references
```

### Debugging
```bash
1. Search for error
2. Trace call stack
3. Find related code
4. Understand flow
5. Document findings
```

### Refactoring
```bash
1. Find all instances
2. Check references
3. Plan approach
4. Update systematically
5. Verify completeness
```

## 💡 Best Practices

### DO:
- Think semantically, not in paths
- Use memories for context
- Start broad, then narrow
- Verify changes with references
- Trust Serena's search

### DON'T:
- Hardcode file paths
- Skip onboarding
- Ignore language server warnings
- Fight semantic navigation
- Forget to check references

## 🚀 Performance Tips

1. **Scope searches** when possible: `--relative_path "packages/web"`
2. **Omit body** unless needed: `--include_body false`
3. **Use overview** before details: `get_symbols_overview`
4. **Create memories** to avoid re-searching
5. **Let indexing complete** on first run

## 🔗 Integration Examples

### With TaskMaster
```bash
# Analyze before planning
"Find existing patterns" → Create informed tasks
```

### With Desktop Commander  
```bash
# Find location first
"Find similar component" → Create new file in right place
```

### With Zen
```bash
# Gather context
"Find performance bottlenecks" → Deep analysis with Zen
```

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Symbol not found" | Try `--substring_matching true` |
| "Too many results" | Add `--relative_path` to narrow |
| "Language server out of sync" | Run `restart_language_server` |
| "Slow performance" | Scope search or reduce `max_answer_chars` |

## 📖 Learning Path

1. Start with **[reference/serena-overview.md](./reference/serena-overview.md)** - Understand capabilities
2. Practice with **[reference/serena-commands.md](./reference/serena-commands.md)** - Learn command syntax
3. Master **[guidelines/serena-workflows.md](./guidelines/serena-workflows.md)** - Build efficient patterns
4. Apply to **[guidelines/serena-monorepo-guide.md](./guidelines/serena-monorepo-guide.md)** - Project-specific usage
5. Try **[prompts/](./prompts/)** - Use ready-made prompts
6. Study **[examples/](./examples/)** - Learn from real usage
7. Test with **[TWES scenarios](/docs/ai/twes-tests/scenarios/)** - Validate understanding

## 🎯 Quick Wins

Try these to see Serena's power:

```bash
# Find all TODOs with context
"Search for TODO comments with 2 lines of context"

# Understand a feature
"Find all components related to blog posts"

# Check code quality
"Find all console.log statements"

# Explore architecture
"Show me the structure of the auth module"
```

Remember: Serena turns code navigation from a treasure hunt into a conversation. Think about what you want to find, not where it might be!
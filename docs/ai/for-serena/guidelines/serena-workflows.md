# Serena MCP - Integration Workflows

## Overview

This guide demonstrates how to integrate Serena's semantic capabilities into your development workflow. Learn to combine Serena with other tools for maximum productivity.

## Core Workflows

### 🚀 Feature Development Workflow

#### 1. Discovery Phase
```bash
# Start by understanding existing patterns
"Find all components similar to what I'm building"
"Show me the authentication flow implementation"
"Find examples of form validation in the codebase"
```

#### 2. Planning Phase
```bash
# Create a memory for your architectural decisions
"Create a memory called 'feature_user_profile_architecture' with my design decisions"

# Find the right location for new code
"Show me the structure of the user module"
"Find where user-related components are located"
```

#### 3. Implementation Phase
```bash
# Use semantic operations for modifications
"Replace the UserProfile component with new implementation"
"Insert new validation method after the constructor"
"Find all places that need updating for this feature"
```

#### 4. Integration Phase
```bash
# Track references and dependencies
"Find all components that import UserProfile"
"Show me what calls the validateUser function"
"Find all tests related to user functionality"
```

### 🐛 Debugging Workflow

#### Step 1: Trace the Error
```bash
# Find potential error sources
"Search for 'Cannot read property' in all code files"
"Find the ErrorBoundary implementation"
"Show me all try-catch blocks in the auth module"
```

#### Step 2: Understand Context
```bash
# Navigate the call stack
"Find what calls the failing function"
"Show me the parent component of this error"
"Find all references to the problematic variable"
```

#### Step 3: Fix and Verify
```bash
# Apply the fix
"Replace the error handling in AuthService"

# Verify the fix
"Find all similar patterns that might have the same issue"
"Check if this pattern exists elsewhere"
```

### 🔄 Refactoring Workflow

#### Planning
```bash
# Understand current implementation
"Find all instances of the old pattern"
"Show me components using deprecated methods"
"Get overview of affected modules"
```

#### Execution
```bash
# Systematic refactoring
"Replace all occurrences of oldMethod with newMethod"
"Update imports from old/path to new/path"
"Rename UserAuth class to AuthenticationService"
```

#### Validation
```bash
# Ensure completeness
"Find any remaining references to the old name"
"Search for TODO comments related to refactoring"
"Check for broken imports"
```

### 📝 Code Review Workflow

#### Initial Analysis
```bash
# Get high-level understanding
"Show me the structure of the changed files"
"Find what these changes affect"
"Get overview of the new components"
```

#### Deep Dive
```bash
# Examine specific changes
"Show me the new authentication logic with body"
"Find if similar patterns exist elsewhere"
"Check what calls these new methods"
```

#### Impact Assessment
```bash
# Understand implications
"Find all components that depend on changed code"
"Show me tests that might need updating"
"Find documentation that references old behavior"
```

## Integration Patterns

### 🔗 Serena + Desktop Commander

**When**: Need to create new files based on semantic understanding

```bash
# 1. Use Serena to find patterns
"Find a good example of a React component with tests"

# 2. Use Desktop Commander to create files
dc create src/components/NewFeature/NewFeature.tsx

# 3. Use Serena to verify integration
"Find if NewFeature is properly imported"
```

### 🎯 Serena + TaskMaster

**When**: Planning implementation based on code analysis

```bash
# 1. Analyze codebase with Serena
"Find all authentication-related components"
"Show me the current auth flow"

# 2. Create informed tasks
mcp__taskmaster-ai__add_task --prompt "Refactor auth to use new pattern found in codebase"

# 3. Track progress with memories
"Create memory about auth refactoring decisions"
```

### 🧠 Serena + Zen

**When**: Need deep analysis of code patterns

```bash
# 1. Gather context with Serena
"Find all performance-critical components"
"Show me current optimization patterns"

# 2. Deep analysis with Zen
mcp__zen__thinkdeep --prompt "Analyze these patterns and suggest improvements" 
                    --files [files from Serena]

# 3. Implement improvements
"Replace the rendering logic in critical components"
```

### 📚 Serena + Context7

**When**: Implementing framework-specific features

```bash
# 1. Find current implementation
"Show me how we currently use React hooks"

# 2. Get latest docs
mcp__context7__get-library-docs --library "react" --topic "hooks"

# 3. Update implementation
"Replace old hook pattern with new best practices"
```

## Advanced Workflows

### 🏗️ Monorepo Navigation

```bash
# Cross-package analysis
"Find where shared types are used across packages"
"Show me components that import from @app/ui"
"Find all cross-package dependencies"

# Package-specific operations
"Find all components in the web package"
"Show me API endpoints in the backend package"
"Find shared utilities used by multiple packages"
```

### 🎨 Pattern Detection

```bash
# Find patterns
"Search for components using render props pattern"
"Find all implementations of factory pattern"
"Show me all custom hooks"

# Analyze consistency
"Find components not following our naming convention"
"Search for inline styles (anti-pattern)"
"Find console.log statements (cleanup)"
```

### 🔍 Intelligent Search Strategies

#### Broad to Narrow
```bash
1. "Get symbols overview for src/"
2. "Find all components related to user"
3. "Show me the UserProfile component specifically"
4. "Find what calls updateUserProfile method"
```

#### Reference Tracing
```bash
1. "Find the main API client"
2. "Show me all references to APIClient"
3. "Find which components make API calls"
4. "Trace data flow from API to UI"
```

#### Pattern Matching
```bash
1. "Search for 'TODO|FIXME|HACK' comments"
2. "Find all deprecated method calls"
3. "Search for hardcoded values that should be config"
```

## Best Practices

### ✅ DO:
- Let Serena complete initial indexing
- Use semantic names over file paths
- Create memories for important decisions
- Combine with other tools for complete workflows
- Trust Serena's search capabilities

### ❌ DON'T:
- Specify exact file paths when unsure
- Try to use Serena for non-code files
- Skip the onboarding process
- Ignore language server restart suggestions
- Fight against semantic navigation

## Common Scenarios

### Starting Fresh on Existing Codebase
```bash
1. Activate project /path/to/project
2. Run onboarding
3. Get symbols overview for main directories
4. Create memory about discovered patterns
5. Start specific exploration
```

### Joining Ongoing Development
```bash
1. Activate project
2. List and read existing memories
3. Find recently modified components
4. Understand current patterns
5. Continue where team left off
```

### Emergency Bug Fix
```bash
1. Search for error message
2. Find the failing component
3. Trace references to understand impact
4. Apply minimal fix
5. Find similar code that might have same issue
```

## Performance Tips

### 🚀 Speed Optimization
1. Use `relative_path` to limit search scope
2. Start with overview before detailed searches
3. Avoid `include_body=true` unless necessary
4. Let initial indexing complete fully
5. Use memories to avoid repeated searches

### 💾 Memory Management
1. Create descriptive memory names
2. Keep memories focused and concise
3. Update memories when patterns change
4. Delete obsolete memories
5. Use date prefixes for session memories

## Troubleshooting

### Issue: "No symbol found"
```bash
# Try broader search
"Find Button" → "Find components with 'button' in name"

# Enable substring matching
"Find exact ButtonComponent" → "Find button with substring matching"

# Check different locations
"Find in components/" → "Find in src/"
```

### Issue: "Language server out of sync"
```bash
# After external file changes
"Restart the language server"

# Then retry your operation
"Find the updated component"
```

### Issue: "Too many results"
```bash
# Add more context
"Find Button" → "Find Button in components/ui"

# Use more specific patterns
"Find all components" → "Find React components in auth module"

# Filter by symbol type
"Find all exports" → "Find all function exports"
```

## Quick Reference Card

| Task | Serena Command |
|------|----------------|
| Find component | `Find the [Component] implementation` |
| Check usage | `Find all references to [symbol]` |
| Explore module | `Get symbols overview for [path]` |
| Refactor name | `Rename [old] to [new] everywhere` |
| Find pattern | `Search for "[pattern]" in code` |
| Create memory | `Create memory "[name]" about [topic]` |
| Read memory | `Read the [memory_name] memory` |

## Integration Checklist

When working on a feature:
- [ ] Found similar existing patterns
- [ ] Created memory for decisions
- [ ] Identified all affected files
- [ ] Tracked all references
- [ ] Verified no broken imports
- [ ] Updated related tests
- [ ] Checked for documentation updates
- [ ] Created session memory

## Summary

Serena transforms code navigation from path-based searching to semantic understanding. By combining it with other TWES tools, you create powerful workflows that understand your code's meaning, not just its location. Master these patterns to dramatically improve your development efficiency.
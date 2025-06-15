# AI Documentation Structure Plan

## Overview

This document outlines the plan for creating a modular documentation system that provides MCP tools and AI assistants with comprehensive context while keeping CLAUDE.md focused on core principles.

## Core Concept

**Layered Context Approach**:
1. **Prompt**: Specific task instructions
2. **Reference Docs**: Deep context about project patterns, rules, and philosophy
3. **Result**: Tools have both immediate direction AND complete understanding

## Proposed Directory Structure

```
/docs/ai/
├── documentation-structure-plan.md    # This file
├── README.md                         # Guide to using AI docs
│
├── core/                             # Core project rules
│   ├── file-structure.md            # Where everything lives
│   ├── theme-system.md              # 4-theme implementation
│   ├── component-patterns.md        # Component best practices
│   └── performance-standards.md     # Lighthouse targets
│
├── tools/                            # Tool-specific guides
│   ├── claude-bridge-mockup.md      # Mockup creation guide
│   ├── claude-bridge-components.md  # Component creation guide
│   ├── taskmaster-patterns.md       # Task structuring guide
│   └── mcp-tool-selection.md       # When to use which tool
│
├── workflows/                        # Process documentation
│   ├── session-protocol.md          # SESSION.md management
│   ├── git-workflow.md              # Branches, commits, PRs
│   ├── testing-protocol.md          # How to test features
│   └── review-checklist.md          # PR review process
│
└── reference/                        # Quick references
    ├── component-registry.md         # All available components
    ├── design-tokens.md             # Colors, spacing, typography
    ├── project-glossary.md          # Terms and concepts
    └── code-snippets.md             # Common patterns

```

## Document Templates

### Core Document Template
```markdown
# [Document Title]

## Purpose
Brief description of what this document covers and when to reference it.

## When to Use This Document
- Specific scenarios
- Tool contexts
- Task types

## Key Rules
1. Must-follow rules
2. Important patterns
3. Critical constraints

## Examples
Concrete examples with code/structure

## Related Documents
- Links to other relevant docs
```

### Tool-Specific Guide Template
```markdown
# [Tool Name] - [Purpose] Guide

## Tool Context
What this tool should know about our project.

## File Locations
- Where to read: /path/to/source
- Where to write: /path/to/output
- Config files: /path/to/config

## Required Patterns
Specific patterns this tool must follow.

## Integration Points
How this tool's output connects with other parts.

## Example Usage
Complete example showing desired output.
```

## Implementation Priority

### Phase 1: Core Documentation (Immediate)
1. `file-structure.md` - Critical for all tools
2. `theme-system.md` - Essential for UI work
3. `component-patterns.md` - For mockup creation
4. `claude-bridge-mockup.md` - For upcoming mockup task

### Phase 2: Workflow Documentation (Next Session)
1. `session-protocol.md` - Extract from CLAUDE.md
2. `git-workflow.md` - Consolidate git practices
3. `component-registry.md` - Living document of components

### Phase 3: Enhancement (As Needed)
1. Additional tool guides
2. Workflow refinements
3. Reference materials

## Usage Pattern

### For Simple Tasks
```
AI reads CLAUDE.md → Executes task
```

### for Complex MCP Tool Operations
```
AI reads CLAUDE.md → 
Creates detailed prompt → 
References relevant /docs/ai/ files →
Passes both to MCP tool →
Tool has full context
```

### Example: Creating Mockup with Claude Code Bridge
```javascript
// AI's instruction to Claude Code Bridge:
"Create a modern blog mockup page implementing bento grid layout.

For complete context, refer to:
- /docs/ai/core/file-structure.md
- /docs/ai/core/theme-system.md  
- /docs/ai/core/component-patterns.md
- /docs/ai/tools/claude-bridge-mockup.md
- /docs/design/modern-blog-mockup-brief.md

Focus on: [specific task details]"
```

## Benefits

1. **Modularity**: Update specific docs without touching others
2. **Reusability**: Multiple tools can reference same docs
3. **Scalability**: Add new docs as project grows
4. **Clarity**: Each doc has single responsibility
5. **Context**: Tools get complete understanding

## CLAUDE.md Updates

Add reference section:
```markdown
## 📚 AI Documentation System

For detailed guidance, see /docs/ai/:
- **Core Rules**: `/docs/ai/core/` - Project patterns and standards
- **Tool Guides**: `/docs/ai/tools/` - MCP tool-specific instructions  
- **Workflows**: `/docs/ai/workflows/` - Process documentation
- **Reference**: `/docs/ai/reference/` - Quick lookup materials

When using MCP tools for complex tasks, reference relevant documentation.
```

## Success Criteria

- [ ] MCP tools can create consistent outputs using docs
- [ ] Documentation is easy to maintain and update
- [ ] New team members can understand system quickly
- [ ] CLAUDE.md remains under 500 lines
- [ ] All critical information is documented

## Next Steps

1. Create `/docs/ai/` directory structure
2. Write Phase 1 core documents
3. Test with Claude Code Bridge for mockup creation
4. Refine based on results
5. Extract relevant sections from CLAUDE.md

---

Created: 2025-06-10
Status: Planning Phase
Author: AI Assistant with user collaboration
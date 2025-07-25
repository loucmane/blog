# Documentation Organization Plan

## Current Location
All documentation currently in: `docs/ai/work-tracking/active/20250725-template-refinement-ACTIVE/`

## Recommended Organization with Cross-References

### 1. Create New Template File: USER-GUIDE.md
Location: `.claude/templates/USER-GUIDE.md`

**Contents:**
- How to Use Claude Effectively (main guide)
- Common Search Patterns 
- If You Want To X, Say Y
- Troubleshooting Guide

**Cross-References FROM this file:**
- → REGISTRY.md (for full handler list)
- → WORKFLOWS.md#common-workflows (for examples)
- → BUILDING-BETTER.md#creating-handlers (for adding new handlers)

**Cross-References TO this file:**
- REGISTRY.md → "New users start here"
- WORKFLOWS.md → "See USER-GUIDE for basics"
- CONVENTIONS.md → "Usage patterns in USER-GUIDE"

### 2. Add to BUILDING-BETTER.md
Section: "Creating and Managing Handlers"

**Contents:**
- Handler Documentation Format Standard
- Handler Creation Guide
- Enhanced Keywords Additions (as reference)

**Cross-References FROM this section:**
- → REGISTRY.md (to add new handlers)
- → USER-GUIDE.md#troubleshooting (when things go wrong)
- → WORKFLOWS.md (for handler examples)

**Cross-References TO this section:**
- REGISTRY.md → "Add new handlers: see BUILDING-BETTER"
- USER-GUIDE.md → "Create handlers: see BUILDING-BETTER"

### 3. Add to WORKFLOWS.md
New Section: "Common Development Workflows"

**Contents:**
- Common Workflows Documentation (the 6 examples)

**Cross-References FROM this section:**
- → Individual handlers in other files
- → USER-GUIDE.md (for troubleshooting)
- → REGISTRY.md (for handler details)

**Cross-References TO this section:**
- USER-GUIDE.md → "See real examples in WORKFLOWS"
- REGISTRY.md → "Workflow examples in WORKFLOWS"

### 4. Update REGISTRY.md
Add new section at top:

```markdown
## 📚 Essential Documentation
- **New to Claude?** → Start with [USER-GUIDE.md](USER-GUIDE.md)
- **Common workflows?** → See [WORKFLOWS.md#common-workflows](WORKFLOWS.md#common-workflows)
- **Creating handlers?** → See [BUILDING-BETTER.md#creating-handlers](BUILDING-BETTER.md#creating-handlers)
- **Having issues?** → Check [USER-GUIDE.md#troubleshooting](USER-GUIDE.md#troubleshooting)

## 🔍 Quick Navigation
- Jump to: [Development](#development-handlers) | [Search](#search-operations) | [Git](#git-operations) | [Testing](#testing-handlers)
- Find by keyword: Use Ctrl+F with terms from USER-GUIDE.md#common-patterns
```

### 5. Update CLAUDE.md
Add section near the top:

```markdown
## 📖 Documentation Hub
- **User Guide**: `.claude/templates/USER-GUIDE.md` - Start here if you're new
- **Handler Registry**: `.claude/templates/REGISTRY.md` - Complete handler list
- **Workflows**: `.claude/templates/WORKFLOWS.md` - See handlers in action
- **Conventions**: `.claude/templates/CONVENTIONS.md` - Standards and rules
- **Improving System**: `.claude/templates/BUILDING-BETTER.md` - Extend and enhance
```

## Cross-Reference Matrix

| From → | REGISTRY | USER-GUIDE | WORKFLOWS | BUILDING-BETTER | CONVENTIONS |
|---------|----------|------------|-----------|-----------------|-------------|
| **REGISTRY** | - | Quick start | Examples | Add handlers | Standards |
| **USER-GUIDE** | Full list | - | Examples | Extend | Rules |
| **WORKFLOWS** | Handler details | Basics | - | Patterns | Standards |
| **BUILDING-BETTER** | Update | Help | Examples | - | Follow |
| **CONVENTIONS** | Validate | Usage | Apply | Improve | - |

## Benefits of Cross-Referencing

1. **Multiple Entry Points** - Users can start anywhere and find what they need
2. **Context Switching** - Easy to jump between reference and examples
3. **Progressive Discovery** - Basic → Advanced naturally
4. **Reduced Duplication** - Link instead of repeat
5. **Maintenance** - Update in one place, referenced everywhere

## Implementation Notes

1. Use anchor links for sections: `[link text](FILE.md#section-anchor)`
2. Keep descriptions brief but clear about what's found there
3. Bidirectional links when it makes sense
4. Group related cross-references together
5. Use consistent formatting for cross-reference sections

## Search Enhancement

Add to each file's keywords section:
- USER-GUIDE: [help, start, new, learn, howto, tutorial]
- BUILDING-BETTER: [extend, create, add, improve, enhance]
- WORKFLOWS: [example, workflow, chain, sequence, process]

This ensures ULTRATHINK can find the right documentation based on user intent.
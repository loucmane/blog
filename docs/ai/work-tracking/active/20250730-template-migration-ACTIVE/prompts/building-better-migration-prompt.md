# BUILDING-BETTER.md Migration - Detailed Instructions

## File Overview
- **Location**: `.claude/templates/BUILDING-BETTER.md`
- **Size**: ~800 lines
- **Status**: Handlers already migrated
- **Task**: Extract all integration and extension documentation

## 🚨 CRITICAL PATH REQUIREMENTS 🚨

ALL modules MUST be created under:
`/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/integration/`

NOT under:
- ❌ `.claude/integration/` (WRONG - missing templates/)
- ❌ `.claude/templates/` (WRONG - missing integration/)
- ❌ `.claude/templates/building-better/` (WRONG - should be integration/)
- ✅ `.claude/templates/integration/` (CORRECT)

## Content Map to Extract

### 1. Handler Creation Guide (estimate lines 50-200)
**Extract to**: `integration/guides/`
- `creating-handlers.md` - Complete handler creation guide
- Include YAML frontmatter requirements
- Include role/domain/trigger specifications
- Include examples of good handlers

### 2. Template Extension (estimate lines 200-350)
**Extract to**: `integration/guides/`
- `extending-templates.md` - How to extend template system
- `adding-agents.md` - Adding new agents to system
- `system-integration.md` - Integrating with overall system

### 3. Cross-System Integration (estimate lines 350-500)
**Extract to**: `integration/cross-system/`
- `mcp-integration.md` - Integrating with MCP tools
- `tool-integration.md` - Adding new tools
- `agent-coordination.md` - Multi-agent coordination

### 4. Pattern Composition (estimate lines 500-650)
**Extract to**: `integration/composition/`
- `workflow-composition.md` - Composing complex workflows
- `handler-chaining.md` - Chaining handlers together
- `pattern-composition.md` - Combining patterns

### 5. Best Practices (estimate lines 650-750)
**Extract to**: `integration/best-practices/`
- `handler-design.md` - Handler design best practices
- `template-design.md` - Template design principles
- `integration-patterns.md` - Integration best practices

### 6. Architecture (estimate lines 750-800)
**Extract to**: `integration/architecture/`
- `system-architecture.md` - Overall system architecture
- `handler-architecture.md` - Handler system design
- `template-architecture.md` - Template system design

### 7. Handler Definitions (if any remain)
**DO NOT EXTRACT** - Already migrated
**DO ADD NOTE**: `[Handler: handler-name migrated to handlers/role/domain/handler-name.md]`

## Module Format Template

```yaml
---
id: unique-module-id
type: integration-guide
category: [guides|cross-system|composition|best-practices|architecture]
title: Module Title
audience: [developer|architect|contributor]
complexity: [beginner|intermediate|advanced]
dependencies:
  - related modules
prerequisites:
  - knowledge prerequisites
version: 1.0.0
status: stable
---

# Module Title

## Overview
[What this guide covers]

## Prerequisites
[What you need to know before reading]

## Main Content
[The actual guide content, well-structured]

## Examples
[Concrete examples and code samples]

## Common Pitfalls
[What to avoid]

## Testing Your Implementation
[How to verify it works]

## Related Resources
[Links to other relevant modules]
```

## New BUILDING-BETTER.md Index Structure

```markdown
# Building Better: System Extension Guide

This file has been modularized. All integration guides are now in `.claude/templates/integration/`

## 📁 Module Organization

### Development Guides
- [Creating Handlers](integration/guides/creating-handlers.md) - Handler creation guide
- [Extending Templates](integration/guides/extending-templates.md) - Template extension
- [Adding Agents](integration/guides/adding-agents.md) - New agent integration
- [System Integration](integration/guides/system-integration.md) - Overall integration

### Cross-System Integration
- [MCP Integration](integration/cross-system/mcp-integration.md) - MCP tool integration
- [Tool Integration](integration/cross-system/tool-integration.md) - Adding tools
- [Agent Coordination](integration/cross-system/agent-coordination.md) - Multi-agent

### Composition Patterns
- [Workflow Composition](integration/composition/workflow-composition.md) - Complex workflows
- [Handler Chaining](integration/composition/handler-chaining.md) - Chain handlers
- [Pattern Composition](integration/composition/pattern-composition.md) - Combine patterns

### Best Practices
- [Handler Design](integration/best-practices/handler-design.md) - Design principles
- [Template Design](integration/best-practices/template-design.md) - Template practices
- [Integration Patterns](integration/best-practices/integration-patterns.md) - Integration tips

### Architecture
- [System Architecture](integration/architecture/system-architecture.md) - Overall design
- [Handler Architecture](integration/architecture/handler-architecture.md) - Handler system
- [Template Architecture](integration/architecture/template-architecture.md) - Template system

## Quick Start
1. Read [Creating Handlers](integration/guides/creating-handlers.md) first
2. Review [Handler Design](integration/best-practices/handler-design.md)
3. Check existing handlers in `.claude/templates/handlers/` for examples

## Handler Migration Notice
All handlers have been migrated to `.claude/templates/handlers/`
```

## Validation Checklist

- [ ] All integration documentation extracted
- [ ] No handlers re-migrated
- [ ] Handler creation guide comprehensive
- [ ] Architecture docs clear
- [ ] All cross-references updated
- [ ] Module format followed
- [ ] Index file created (<100 lines)
- [ ] No content lost
- [ ] All paths use `.claude/templates/integration/`

## Special Considerations

Since BUILDING-BETTER.md is about extending the system, ensure:
1. **Handler creation guide** includes ALL requirements from handler-validator findings
2. **Integration guides** reference actual system structure
3. **Architecture docs** reflect the NEW modular structure
4. **Examples** use real handlers from `.claude/templates/handlers/`

## Output

1. Create all modules in appropriate directories
2. Update BUILDING-BETTER.md to slim index
3. Create migration report: `migration-report-building-better-20250808.md`

Report should include:
- Sections extracted with line numbers
- Modules created with sizes
- Any updates for new structure
- Integration with existing system
- Any issues or decisions made
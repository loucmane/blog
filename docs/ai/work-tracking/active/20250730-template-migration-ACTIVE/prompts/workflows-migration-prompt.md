# WORKFLOWS.md Migration - Detailed Instructions

## File Overview
- **Location**: `.claude/templates/WORKFLOWS.md`
- **Size**: 2,943 lines
- **Status**: Handlers already migrated (lines 1-17 have migration notice)
- **Task**: Extract all non-handler workflow documentation

## 🚨 CRITICAL PATH REQUIREMENTS 🚨

ALL modules MUST be created under:
`/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/workflows/`

NOT under:
- ❌ `.claude/workflows/` (WRONG - missing templates/)
- ❌ `.claude/templates/` (WRONG - missing workflows/)
- ✅ `.claude/templates/workflows/` (CORRECT)

## Content Map to Extract

### 1. ULTRATHINK System (lines 38-135)
**IMPORTANT**: Check if this duplicates `.claude/templates/shared/patterns/ultrathink-format.md`
- If duplicate → Reference shared pattern, don't create new
- If unique content → Extract to `workflows/core/ultrathink-system.md`

### 2. Universal Flight Protocol (estimate lines 200-400)
**Extract to**: `workflows/protocols/universal-flight.md`
- Pre-flight checks
- During-flight monitoring
- Post-flight validation
- Include all examples

### 3. Task Management Patterns (estimate lines 400-600)
**Extract to**: `workflows/patterns/task-management.md`
- TodoWrite patterns
- Task state management
- Progress tracking
- Task dependencies

### 4. Session Management (estimate lines 600-800)
**Extract to**: `workflows/session/`
- `lifecycle.md` - Session start/end
- `compaction.md` - Compaction detection
- `continuation.md` - Session continuation
- `state.md` - State management

### 5. Memory Management (estimate lines 800-1000)
**Extract to**: `workflows/memory/`
- `serena-patterns.md` - Serena memory usage
- `memory-lifecycle.md` - When to write/read
- `memory-format.md` - Memory file format

### 6. Evidence-Based Analysis (estimate lines 1000-1200)
**Extract to**: `workflows/analysis/`
- `evidence-gathering.md` - How to gather evidence
- `claim-validation.md` - Making accurate claims
- `analysis-patterns.md` - Analysis workflows

### 7. Testing Workflows (estimate lines 1200-1500)
**Extract to**: `workflows/testing/`
- `simulation-testing.md` - Simulation patterns
- `validation-workflows.md` - Validation processes
- `test-checkpoints.md` - Checkpoint creation

### 8. Behavioral Templates (estimate lines 1500-1800)
**Extract to**: `workflows/templates/`
- Pre-composed tool sequences
- Common task patterns
- Quick action templates

### 9. Common Mistakes (estimate lines 2800-2943)
**Extract to**: `workflows/guides/common-mistakes.md`
- Session-breaking mistakes
- Anti-patterns
- What to avoid

### 10. Handler Definitions (scattered throughout)
**DO NOT EXTRACT** - Already migrated
**DO ADD NOTE**: `[Handler: handler-name migrated to handlers/role/domain/handler-name.md]`

## Module Format Template

```yaml
---
id: unique-module-id
type: workflow-component
category: [core|protocols|patterns|session|memory|analysis|testing|templates|guides]
title: Module Title
dependencies:
  - .claude/templates/shared/patterns/ultrathink-format.md (if needed)
  - other dependencies
related:
  - related modules
version: 1.0.0
status: stable
---

# Module Title

[Extracted content with preserved formatting]
```

## New WORKFLOWS.md Index Structure

```markdown
# Universal Development Workflows

This file has been modularized. All workflow components are now in `.claude/templates/workflows/`

## 📁 Module Organization

### Core Components
- [ULTRATHINK System](workflows/core/ultrathink-system.md) - Foundation of all workflows
- [Universal Flight Protocol](workflows/protocols/universal-flight.md) - Pre/during/post checks

### Workflow Patterns
- [Task Management](workflows/patterns/task-management.md) - TodoWrite patterns
- [Session Management](workflows/session/) - Session lifecycle and state
- [Memory Management](workflows/memory/) - Serena memory patterns
- [Evidence Analysis](workflows/analysis/) - Evidence-based workflows

### Testing & Validation
- [Testing Workflows](workflows/testing/) - Simulation and validation
- [Behavioral Templates](workflows/templates/) - Pre-composed sequences

### Guides
- [Common Mistakes](workflows/guides/common-mistakes.md) - What to avoid

## Handler Migration Notice
All handlers have been migrated to `.claude/templates/handlers/`
To find a handler: Use Serena search in handlers directory
```

## Validation Checklist

- [ ] All workflow documentation extracted
- [ ] No handlers re-migrated
- [ ] ULTRATHINK checked against shared pattern
- [ ] All cross-references updated
- [ ] Module format followed
- [ ] Index file created (<100 lines)
- [ ] No content lost
- [ ] All paths use `.claude/templates/`

## Output

1. Create all modules in appropriate directories
2. Update WORKFLOWS.md to slim index
3. Create migration report: `migration-report-workflows-20250808.md`

Report should include:
- Sections extracted with line numbers
- Modules created with sizes
- Deduplication performed
- Any issues or decisions made
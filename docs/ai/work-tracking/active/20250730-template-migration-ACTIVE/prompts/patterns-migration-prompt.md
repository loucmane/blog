# PATTERNS.md Migration - Detailed Instructions

## File Overview
- **Location**: `.claude/templates/PATTERNS.md`
- **Size**: ~1,200 lines
- **Status**: Handlers already migrated
- **Task**: Extract all pattern documentation into modular format

## 🚨 CRITICAL PATH REQUIREMENTS 🚨

ALL modules MUST be created under:
`/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/patterns/`

NOT under:
- ❌ `.claude/patterns/` (WRONG - missing templates/)
- ❌ `.claude/templates/` (WRONG - missing patterns/)
- ✅ `.claude/templates/patterns/` (CORRECT)

## Content Map to Extract

### 1. Meta-Routing Patterns (estimate lines 50-250)
**Extract to**: `patterns/routing/`
- `meta-routing.md` - High-level routing decisions
- `request-analysis.md` - Analyzing user requests
- `intent-detection.md` - Detecting user intent
**CHECK**: May overlap with handlers - don't duplicate

### 2. Selection Patterns (estimate lines 250-450)
**Extract to**: `patterns/selection/`
- `handler-selection.md` - How to choose handlers
- `tool-selection.md` - Tool choice patterns
  **IMPORTANT**: Check if duplicates `.claude/templates/shared/tools/tool-selection-matrix.md`
  If duplicate → Reference shared pattern
- `agent-selection.md` - When to use which agent

### 3. Evidence Patterns (estimate lines 450-650)
**Extract to**: `patterns/evidence/`
- `evidence-patterns.md` - Evidence collection methods
- `validation-patterns.md` - Validation approaches
- `proof-patterns.md` - What constitutes proof

### 4. Work Tracking Patterns (estimate lines 650-850)
**Extract to**: `patterns/work-tracking/`
- `work-patterns.md` - Work tracking approaches
- `progress-patterns.md` - Progress measurement
- `documentation-patterns.md` - Documentation patterns
**CHECK**: May overlap with conventions - distinguish pattern vs rule

### 5. Session Patterns (estimate lines 850-1000)
**Extract to**: `patterns/session/`
- `session-patterns.md` - Session management patterns
- `state-patterns.md` - State tracking approaches
- `continuation-patterns.md` - Session continuation patterns

### 6. Integration Patterns (estimate lines 1000-1200)
**Extract to**: `patterns/integration/`
- `cross-system.md` - Cross-system integration patterns
- `composition.md` - Pattern composition strategies

### 7. Handler Definitions (if any remain)
**DO NOT EXTRACT** - Already migrated
**DO ADD NOTE**: `[Handler: handler-name migrated to handlers/role/domain/handler-name.md]`

## Module Format Template

```yaml
---
id: unique-module-id
type: pattern
category: [routing|selection|evidence|work-tracking|session|integration]
title: Module Title
pattern_type: [behavioral|structural|operational]
complexity: [simple|moderate|complex]
dependencies:
  - .claude/templates/shared/patterns/ultrathink-format.md (if needed)
  - other patterns
related:
  - related patterns or handlers
version: 1.0.0
status: stable
---

# Module Title

## Pattern Description
[What this pattern does and when to use it]

## Pattern Structure
[The components and flow of the pattern]

## When to Use
[Specific triggers or conditions]

## When NOT to Use
[Anti-conditions or alternatives]

## Examples
[Concrete examples of the pattern in action]

## Variations
[Different ways to implement the pattern]

## Related Patterns
[Patterns that work well with this one]
```

## New PATTERNS.md Index Structure

```markdown
# System Patterns Library

This file has been modularized. All patterns are now in `.claude/templates/patterns/`

## 📁 Module Organization

### Routing Patterns
- [Meta-Routing](patterns/routing/meta-routing.md) - High-level routing
- [Request Analysis](patterns/routing/request-analysis.md) - Request parsing
- [Intent Detection](patterns/routing/intent-detection.md) - Intent patterns

### Selection Patterns
- [Handler Selection](patterns/selection/handler-selection.md) - Choosing handlers
- [Tool Selection](patterns/selection/tool-selection.md) - Tool choice patterns
- [Agent Selection](patterns/selection/agent-selection.md) - Agent selection

### Evidence Patterns
- [Evidence Collection](patterns/evidence/evidence-patterns.md) - Gathering evidence
- [Validation](patterns/evidence/validation-patterns.md) - Validation methods
- [Proof Requirements](patterns/evidence/proof-patterns.md) - Proof standards

### Work Tracking Patterns
- [Work Patterns](patterns/work-tracking/work-patterns.md) - Work approaches
- [Progress Tracking](patterns/work-tracking/progress-patterns.md) - Progress patterns
- [Documentation](patterns/work-tracking/documentation-patterns.md) - Doc patterns

### Session Patterns
- [Session Management](patterns/session/session-patterns.md) - Session patterns
- [State Tracking](patterns/session/state-patterns.md) - State management
- [Continuation](patterns/session/continuation-patterns.md) - Continuation

### Integration Patterns
- [Cross-System](patterns/integration/cross-system.md) - Integration patterns
- [Composition](patterns/integration/composition.md) - Pattern composition

## Shared Patterns
Some patterns are used across multiple systems and are stored in:
- [ULTRATHINK Format](../shared/patterns/ultrathink-format.md)
- [Tool Selection Matrix](../shared/tools/tool-selection-matrix.md)

## Handler Migration Notice
All handlers have been migrated to `.claude/templates/handlers/`
```

## Validation Checklist

- [ ] All pattern documentation extracted
- [ ] No handlers re-migrated
- [ ] Checked for duplicates with shared patterns
- [ ] Pattern vs convention distinction maintained
- [ ] All cross-references updated
- [ ] Module format followed
- [ ] Index file created (<100 lines)
- [ ] No content lost
- [ ] All paths use `.claude/templates/patterns/`

## Output

1. Create all modules in appropriate directories
2. Update PATTERNS.md to slim index
3. Create migration report: `migration-report-patterns-20250808.md`

Report should include:
- Sections extracted with line numbers
- Modules created with sizes
- Deduplication against shared patterns
- Distinction from conventions
- Any issues or decisions made
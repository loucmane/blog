# Template System 2.0 - Revised Proposal

## Core Philosophy
**Evolution, not revolution.** Keep what works, fix what doesn't, connect everything.

## Why Keep CLAUDE.md Monolithic

### Current Benefits We Preserve
- **Single entry point** - Load one file, get everything needed
- **Context coherence** - All core logic in one place
- **No startup confusion** - Don't need to know which files to load
- **Natural flow** - Read top to bottom, understand system

### The Problem Isn't Size, It's Organization
- CLAUDE.md works well as central command
- Just needs better internal structure
- Some content could move out (like detailed flows)
- But core engine must stay together

## 7 Key Enhancements (Revised)

### 1. Handler Prerequisites (Structural Enforcement)
Add to each handler in template files:
```yaml
Prerequisites:
  - check: conventions#naming-rules
  - verify: tests-passing
  - require: git-clean-status
```
**Impact**: Can't skip important checks - system enforces them

### 2. Tool Manifests (Declare Upfront)
```yaml
Tools Required:
  - serena: find_symbol, search_pattern
  - bash: date, git status
  - edit: multifile
```
**Impact**: Know all tools needed before starting any handler

### 3. Related Sections (Web of Connections)
```yaml
Related:
  conventions: [naming, commit-message]
  tools: [serena-search, git-operations]
  common-next: [run-tests, commit-changes]
  common-errors: [see behaviors#file-ops]
```
**Impact**: Everything connected, no more island hopping

### 4. FLOWS.md (New File for Common Sequences)
Move detailed sequences OUT of CLAUDE.md into dedicated file:
```markdown
# Common Development Flows

## Bug Fix Flow
1. reproduce-issue → 
2. search-codebase →
3. analyze-cause →
4. implement-fix →
5. test-fix →
6. commit-changes

When to use: User reports unexpected behavior
Time estimate: 15-30 minutes
Success rate: 85%
```
**Impact**: CLAUDE.md stays focused, flows get dedicated space

### 5. Enhanced CLAUDE.md Organization
**NOT splitting, but restructuring:**
```markdown
# CLAUDE.md

## Table of Contents
- [Quick Start](#quick-start)
- [Execution Engine](#execution-engine)
- [Common Flows](#common-flows) → Links to FLOWS.md
- [Documentation Hub](#documentation-hub)
- [Configuration](#configuration)

## Quick Start {#quick-start}
[Most important stuff first]

## Execution Engine {#execution-engine}
[Core logic with clear sections]
```
**Impact**: Same file, better navigation

### 6. Enhanced REGISTRY.md (Multiple Indexes)
Add multiple views for discovery:
```markdown
## By Frequency
1. edit-file (used 50x/day)
2. search-code (used 30x/day)

## By Intent
Fix something: [debug-issue, analyze-error, fix-bug]
Build something: [create-component, implement-feature]

## By Phase
Planning: [create-todos, design-approach]
Implementing: [edit-file, create-component]
```
**Impact**: Find handlers how you think

### 7. Checkpoints & Metrics
Add to handlers for complex flows:
```yaml
Checkpoint: bug-reproduced
Context Saved:
  - error_message: "Login timeout"
  - test_case: "test/auth/login.test.js:45"
Resume With: analyze-root-cause

Metrics:
  avg_time: 2 minutes
  success_rate: 95%
  common_failures: ["Permission denied (15%)"]
```
**Impact**: Pauseable work + self-improvement

## What Moves OUT of CLAUDE.md
- Detailed flow sequences → FLOWS.md
- Long handler lists → Enhanced REGISTRY.md
- Example workflows → FLOWS.md

## What Stays IN CLAUDE.md
- Core execution engine
- S:W:H:E protocols
- ULTRATHINK enforcement
- Key behavioral rules
- Documentation hub (with links out)

## Migration Path
1. **Phase 1**: Create FLOWS.md with common sequences
2. **Phase 2**: Reorganize CLAUDE.md with TOC and anchors
3. **Phase 3**: Add Prerequisites to top handlers
4. **Phase 4**: Implement Related sections
5. **Phase 5**: Add checkpoints and metrics

## Benefits of This Approach

### For CLAUDE.md
- Remains the single source of truth
- Better organized, not split
- Lighter without detailed sequences
- Clear navigation with TOC

### For the System
- Connected through Related sections
- Enforced through Prerequisites
- Discoverable through multiple indexes
- Measurable through Metrics

### For Users
- One place to start (CLAUDE.md)
- Clear flows when needed (FLOWS.md)
- Better discovery (enhanced REGISTRY)
- System guides itself

## Example: Bug Fix in System 2.0

1. **User**: "Fix the login bug"
2. **CLAUDE.md**: Points to FLOWS.md for bug fix flow
3. **FLOWS.md**: Shows 6-step bug fix sequence
4. **Handler**: Shows Prerequisites (must have clean git)
5. **Handler**: Shows Tools Required (loads all upfront)
6. **Related**: Links to relevant conventions
7. **Checkpoint**: Can pause after reproducing
8. **Metrics**: "This usually takes 15 minutes"

## What This Solves

1. **Monolithic CLAUDE.md** → Better organized, focused
2. **Disconnected files** → Related sections connect everything
3. **Poor discovery** → Multiple indexes in REGISTRY
4. **No enforcement** → Prerequisites can't be skipped
5. **Lost context** → Checkpoints save progress
6. **No improvement** → Metrics drive optimization

## What We Avoid

1. **Splitting core logic** - CLAUDE.md stays unified
2. **Breaking changes** - All current files work
3. **Complex routing** - Simple connections
4. **Hidden magic** - Everything visible

## Summary

Keep CLAUDE.md as the monolithic engine it needs to be, but:
- Better organize it internally
- Move detailed flows to FLOWS.md
- Connect everything through Related sections
- Enforce through Prerequisites
- Track through Metrics

This gives us System 2.0: Connected, enforced, discoverable, measurable - but still simple.
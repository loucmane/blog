# Checkpoint Experiment Backup

**Date**: 2025-07-11  
**Purpose**: Testing checkpoint-based documentation to enforce workflow compliance

## Problem Statement
Claude consistently fails to follow documented workflows despite having detailed procedures in WORKFLOWS.md. Even after creating workflows, they are immediately violated. This experiment tests whether restructuring documentation as mandatory checkpoints can enforce compliance.

## Backup Contents
- `CLAUDE.md.backup` - Original navigation hub (186 lines)
- `WORKFLOWS.md.backup` - Original workflows (1759 lines)
- `TOOLS.md.backup` - Original tool documentation
- `CONVENTIONS.md.backup` - Original conventions

## Planned Changes

### 1. CLAUDE.md Transformation
- Reduce from 186 to ~50 lines
- Replace navigation hub with checkpoint system
- Force decision classification before any action
- Make skipping harder than complying

### 2. WORKFLOWS.md Enhancements
- Add "workflow locks" requiring prerequisite completion
- Insert validation checkboxes
- Create explicit gates between steps

### 3. TOOLS.md Restructuring
- Move Tool Router to very top
- Convert to decision funnel format
- Add "FORBIDDEN" trap sections

### 4. CONVENTIONS.md Additions
- Add violation trap sections
- Include failure stories as warnings
- Create "error interception" patterns

## How to Restore
If the experiment fails or proves too restrictive:

```bash
# From project root
bash .claude/backups/20250711-checkpoint-experiment/restore.sh
```

## Success Criteria
- Workflow compliance increases from ~40% to >90%
- Zero timestamp typing errors (currently ~30%)
- SESSION.md always updated before work
- Tool Router always checked before tool use

## Notes
This backup was created because Claude was not following Flight Protocol despite using it successfully yesterday. The hypothesis is that current documentation structure makes it too easy to skip workflows.
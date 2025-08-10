# Project Cleanup Decisions

## Decision Log

### Decision 001: Move Templates to Root
**Date**: 2025-08-09
**Status**: APPROVED
**Rationale**: 
- Serena MCP cannot access .claude directory (marked as ignored for safety)
- Templates are core to the system and need semantic tool access
- Root-level templates are more discoverable
**Implementation**:
- Move .claude/templates/ → templates/
- Update all references in CLAUDE.md
- Update all internal handler references

### Decision 002: Use Subagents for Scanning
**Date**: 2025-08-09
**Status**: APPROVED
**Rationale**:
- Parallel scanning is more efficient
- Specialized agents can focus on specific aspects
- Creates documented evidence before deletion
**Implementation**:
- Deploy 4 specialized scanning agents
- Consolidate reports before action
- Manual review required before execution

### Decision 003: Keep .claude for Configuration
**Date**: 2025-08-09
**Status**: PENDING
**Rationale**:
- .claude can remain for configs, hooks, settings
- Separates configuration from content
- Maintains some backward compatibility
**Considerations**:
- What stays in .claude?
- What moves to root?
- How to handle migration?

## Decision Framework

### For File Deletion
**Safe to Delete**:
- Outdated backups with stable current version
- Completed migration/staging files
- Test files with no references

**Archive Instead**:
- Historical work tracking
- Important deprecated handlers with learnings
- Session files with key discoveries

**Never Delete**:
- Core engine files
- Active handlers
- Current work tracking
- Dependencies of active components

## Pending Decisions
- [ ] Archive location (docs/archive/ or separate?)
- [ ] Backup retention period (30 days?)
- [ ] Version control for removed files?
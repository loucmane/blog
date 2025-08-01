# 🚨 COMPACTION MESSAGE FOR CLAUDE - TEMPLATE MIGRATION

## Copy/paste this entire message after compaction:

---

Activate project /home/loucmane/dev/javascript/MomsBlog/blog

We're continuing the template migration from monolithic files to folder-based handlers. Everything is prepared but NOT executed.

## CRITICAL CONTEXT

**Current Status**: 0/75 handlers migrated (69 existing + 6 to create)
**Branch**: test/claude-execution-engine-handlers
**Staging**: Empty and ready to start
**Todo**: Task #3 is next (create migration-state.json)

## READ THESE FILES IN THIS EXACT ORDER

### 1. First - Memory Context
```
Read memory: template-migration-pipeline-complete
Read memory: session_2025-07-31_template-migration-preparation-complete
```

### 2. Second - Work Tracking Folder
```
Read file: /home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/work-tracking/active/20250730-template-migration-ACTIVE/HANDOFF.md
Read file: /home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/work-tracking/active/20250730-template-migration-ACTIVE/TRACKER.md
Read file: /home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/work-tracking/active/20250730-template-migration-ACTIVE/IMPLEMENTATION.md
```

### 3. Third - Quick Reference
```
Read file: /home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/work-tracking/active/20250730-template-migration-ACTIVE/reports/SCANNER-ISSUES.md
```

## WHAT YOU NEED TO KNOW

### The Migration Plan
- We're moving 69 handlers from 4 monolithic template files to a folder structure
- Plus creating 6 missing handlers (fix-bug, debug-issue, explain-code, code-review, optimize-code, create-docs)
- Total: 75 handlers organized by role (trigger/orchestrator/operator) and domain

### What's Been Done
- All preparation complete (TRACKER.md has 380+ line checklist)
- IMPLEMENTATION.md has exact prompts for all 15 agents
- Staging directory is empty and ready
- 18 TOOLS.md handlers were test migrated yesterday then cleaned

### What's Next
1. Create staging directory structure
2. Create migration-state.json 
3. Start with WORKFLOWS.md (~25 handlers)
4. Use exact agent prompts from IMPLEMENTATION.md

### Key Files Explained
- **TRACKER.md** - Your execution checklist with checkboxes for every step
- **IMPLEMENTATION.md** - Exact agent prompts to copy/paste
- **HANDOFF.md** - Detailed next steps and commands
- **SCANNER-ISSUES.md** - The 6 missing handlers to create

### Agent Order Per File
1. template-scanner - Map what's in the file
2. security-validator - Check for vulnerabilities  
3. template-migrator - Extract all handlers (batch)
4. handler-validator - Validate everything
5. integration-tester - Test connections

### Critical Reminders
- Staging path: .claude/staging/
- Handler format: YAML frontmatter + original content
- File placement: handlers/[role]/[domain]/[handler-id].md
- Update migration-state.json after EVERY operation
- Check TRACKER.md boxes as you complete steps

## YOUR FIRST ACTIONS

After reading the files above:

1. Check staging is empty:
```bash
ls -la .claude/staging/
```

2. Create directory structure:
```bash
mkdir -p .claude/staging/handlers/{triggers,orchestrators,operators}/{development,git,search,debug,test,docs,workflow,external,file,session,analysis}
mkdir -p .claude/staging/{reports,backups,shared}
```

3. Create migration-state.json (see HANDOFF.md for exact JSON)

4. Start WORKFLOWS.md migration using prompts from IMPLEMENTATION.md

## SUCCESS LOOKS LIKE
- 75 total handlers migrated/created
- All validation passing
- Ready for production cutover
- Updated CLAUDE.md and REGISTRY.md

Start by reading the files listed above. Everything is prepared, you just need to execute!

---
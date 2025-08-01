# 🚨 POST-COMPACTION: TEMPLATE MIGRATION READY TO EXECUTE

## Critical Context
You are continuing template migration work. The pipeline is DESIGNED but NOT EXECUTED. We cleaned staging and are ready to start.

## Immediate Actions Required
1. **Read memory**: `template-migration-pipeline-complete`
2. **Check**: `/docs/ai/work-tracking/active/20250730-template-migration-ACTIVE/ALL-MIGRATION-FILES.md`
3. **Execute**: Commands in `READY-TO-EXECUTE.md`

## What Happened Before Compaction

### Session 1 (11:56-15:38)
- Test migrated 18 handlers from TOOLS.md
- Created all migration agents
- Identified 6 missing critical handlers

### Session 2 (16:51-18:05) 
- **CRITICAL BUG FOUND**: Template-migrator tried to spawn itself (infinite recursion)
- **FIXED**: Added "NEVER spawn other agents" constraint to all 19 agents
- **DESIGNED**: Complete 7-phase migration pipeline
- **CLEANED**: Staging directory is empty and ready

## Current State
```
Location: .claude/staging/ (EMPTY - ready to start)
Handlers to migrate: 69 + 6 to create = 75 total
Files pending: WORKFLOWS.md, CONVENTIONS.md, PATTERNS.md, BUILDING-BETTER.md
Pipeline: Fully designed, not started
```

## First Commands to Run
```bash
# 1. Create structure
mkdir -p .claude/staging/handlers/{triggers,orchestrators,operators}/{development,git,search,debug,test,docs,workflow,external,file,session,analysis}
mkdir -p .claude/staging/{reports,backups}

# 2. Create state tracker
echo '{"version":"1.0","started":"'$(date -Iseconds)'","phase":"migration","files":{},"handlers":{},"checkpoints":[]}' > .claude/staging/migration-state.json

# 3. Start with WORKFLOWS.md
Task: template-scanner "Analyze .claude/templates/WORKFLOWS.md and map all handlers"
```

## Pipeline Overview
```
For each file:
1. template-scanner → Map handlers
2. security-validator → Check vulnerabilities  
3. template-migrator → Extract each handler
4. handler-validator → Validate immediately
5. integration-tester → Test interactions
6. Create checkpoint → Update todo
```

## Handler Format You're Creating
```yaml
---
id: handler-name
name: Human Readable Name
role: trigger|orchestrator|operator
domain: development|git|search|etc
triggers: ["user says X", "user says Y"]
tools: [Tool1, Tool2]
dependencies: [other-handler]
version: 1.0.0
---

# Handler Name
## Purpose
## Process
1. Step one
2. Step two
## Success Criteria
- [ ] Criteria
```

## Missing Handlers to Create
1. `fix-bug` - "fix bug in X"
2. `debug-issue` - "debug this"  
3. `explain-code` - "explain this code"
4. `code-review` - "review this code"
5. `optimize-code` - "optimize this"
6. `create-docs` - "document this"

## Recovery If Interrupted
Check `migration-state.json` for last successful handler and resume from there.

## Critical Files
- **Pipeline**: `/docs/.../plans/MIGRATION-PIPELINE-BACKUP.md`
- **Commands**: `/docs/.../plans/MIGRATION-COMMANDS.md`
- **Todo List**: 13 tasks tracked in TodoWrite

## Expected Progress
- Each handler: 1-2 minutes
- WORKFLOWS.md: ~45 minutes
- Total: 4-6 hours

## ⚠️ Important Notes
1. Agents CANNOT spawn other agents (bug fixed)
2. Work in staging ONLY until cutover
3. Validate EVERY handler immediately
4. Create memory after each file

**START WITH**: Read memory, then execute first commands above!
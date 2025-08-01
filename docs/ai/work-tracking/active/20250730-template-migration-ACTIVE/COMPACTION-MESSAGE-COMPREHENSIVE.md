# 🚨 COMPREHENSIVE POST-COMPACTION MESSAGE - TEMPLATE MIGRATION

## 🎯 IMMEDIATE CONTEXT RECOVERY

### You are continuing the template migration project. Here's EVERYTHING you need to know:

**Project**: MomsBlog - `/home/loucmane/dev/javascript/MomsBlog/blog`
**Branch**: `test/claude-execution-engine-handlers`
**Task**: Migrate 69 handlers from monolithic files to folder structure + create 6 missing handlers = 75 total

### CRITICAL STATUS
- **Preparation**: ✅ COMPLETE (TRACKER.md created, IMPLEMENTATION.md has all prompts)
- **Migration**: ⏳ NOT STARTED (0/75 handlers)
- **Staging**: 🧹 EMPTY (ready to start fresh)
- **Next Step**: Create directories and migration-state.json

## 📚 ESSENTIAL READING ORDER

### 1. First - Understand Context
```bash
# Activate project
mcp__serena__activate_project project="blog"

# Read pipeline design
mcp__serena__read_memory memory_file_name="template-migration-pipeline-complete"

# Read preparation work
mcp__serena__read_memory memory_file_name="session_2025-07-31_template-migration-preparation-complete"
```

### 2. Second - Read Work Tracking Files
```bash
# Read handoff (has exact commands)
Read file_path="/home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/work-tracking/active/20250730-template-migration-ACTIVE/HANDOFF.md"

# Read tracker (your checklist)
Read file_path="/home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/work-tracking/active/20250730-template-migration-ACTIVE/TRACKER.md"

# Read implementation (agent prompts)
Read file_path="/home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/work-tracking/active/20250730-template-migration-ACTIVE/IMPLEMENTATION.md"
```

## 🚀 EXACT FIRST COMMANDS TO RUN

### Step 1: Create Staging Structure
```bash
# Navigate to project root
cd /home/loucmane/dev/javascript/MomsBlog/blog

# Create all directories at once
mkdir -p .claude/staging/handlers/{triggers,orchestrators,operators}/{development,git,search,debug,test,docs,workflow,external,file,session,analysis}
mkdir -p .claude/staging/{reports,backups,shared}

# Verify structure
tree .claude/staging/
```

### Step 2: Create State Tracking File
```bash
cat > .claude/staging/migration-state.json << 'EOF'
{
  "version": "1.0",
  "started": "$(date -Iseconds)",
  "last_updated": "$(date -Iseconds)",
  "phase": "migration",
  "current_file": "",
  "files": {
    "WORKFLOWS.md": {"status": "pending", "handlers_found": 0, "handlers_migrated": 0},
    "CONVENTIONS.md": {"status": "pending", "handlers_found": 0, "handlers_migrated": 0},
    "PATTERNS.md": {"status": "pending", "handlers_found": 0, "handlers_migrated": 0},
    "BUILDING-BETTER.md": {"status": "pending", "handlers_found": 0, "handlers_migrated": 0}
  },
  "handlers": {},
  "errors": [],
  "checkpoints": []
}
EOF

# Fix the date command issue
DATE=$(date -Iseconds)
sed -i "s/\$(date -Iseconds)/$DATE/g" .claude/staging/migration-state.json

# Verify JSON is valid
jq . .claude/staging/migration-state.json
```

### Step 3: Update Todo #2 as Complete
```bash
# Mark task complete after creating migration-state.json
TodoWrite - Update task #2 as completed
```

## 📋 WHAT YOU'RE MIGRATING

### Files and Handler Counts
1. **WORKFLOWS.md** - ~25 handlers (largest, do first)
2. **CONVENTIONS.md** - ~15 handlers
3. **PATTERNS.md** - ~8 handlers
4. **BUILDING-BETTER.md** - ~3 handlers
5. **TOOLS.md** - Already tested, skip (18 handlers were test migrated then cleaned)

### Missing Handlers to Create
1. **fix-bug** (domain: debug) - "fix bug", "bug in X"
2. **debug-issue** (domain: debug) - "debug this", "why failing"
3. **explain-code** (domain: analysis) - "explain this code"
4. **code-review** (domain: analysis) - "review code"
5. **optimize-code** (domain: development) - "optimize this"
6. **create-docs** (domain: docs) - "document this"

## 🤖 AGENT EXECUTION SEQUENCE

### For EACH file (start with WORKFLOWS.md):

#### 1. Scanner - Maps what's there
```bash
Task: template-scanner "Analyze .claude/templates/WORKFLOWS.md and create a detailed report with:
1. List every handler found with exact line numbers
2. Determine handler role (trigger/orchestrator/operator) based on:
   - trigger: Has user-facing triggers/entry points
   - orchestrator: Coordinates multiple operations
   - operator: Single atomic operation
3. Classify domain: development, git, search, debug, test, docs, workflow, external, file, session, analysis
4. Extract all trigger phrases from handler content
5. List all MCP tools used by each handler
6. Identify any cross-handler dependencies
7. Save report to .claude/staging/reports/WORKFLOWS-scan.md
8. Update migration-state.json with handler count found"
```

#### 2. Security Check - Find vulnerabilities
```bash
Task: security-validator "Scan .claude/templates/WORKFLOWS.md for security vulnerabilities:
1. Check for exposed secrets, API keys, or credentials in examples
2. Identify unsafe command execution patterns (especially with Bash tool)
3. Find potential path traversal risks in file operations
4. Detect injection vulnerabilities in tool parameter usage
5. Check for missing input validation in handlers
6. Report issues with severity levels: CRITICAL, HIGH, MEDIUM, LOW
7. Save security report to .claude/staging/reports/WORKFLOWS-security.md
8. Block migration if CRITICAL issues found"
```

#### 3. Migrator - Extract all handlers
```bash
Task: template-migrator "Extract ALL handlers from .claude/templates/WORKFLOWS.md following these exact rules:
1. For each handler found, create a new file with this EXACT frontmatter format:
---
id: handler-name-in-kebab-case
name: Human Readable Handler Name
role: trigger|orchestrator|operator (based on scanner report)
domain: appropriate-domain (from scanner report)
stability: stable
triggers:
  - "exact trigger phrase 1"
  - "exact trigger phrase 2"
dependencies: []
tools:
  - Tool1
  - Tool2
version: 1.0.0
---

2. Preserve ALL original handler content after frontmatter
3. Place files in: .claude/staging/handlers/[role]/[domain]/[handler-id].md
4. For cross-domain handlers, use primary domain for placement
5. Report any extraction issues to .claude/staging/reports/migration-errors.md
6. Update migration-state.json after each handler
7. Create checkpoint every 5 handlers"
```

#### 4. Validator - Check everything
```bash
Task: handler-validator "Validate ALL handlers migrated from WORKFLOWS.md with these checks:
1. YAML frontmatter is valid and parseable
2. Required fields present: id, name, role, domain, stability, triggers (for trigger role), tools, version
3. id field matches filename exactly (without .md extension)
4. role is one of: trigger, orchestrator, operator
5. domain is valid: development, git, search, debug, test, docs, workflow, external, file, session, analysis
6. File is in correct folder: handlers/[role]/[domain]/
7. triggers array exists and non-empty for trigger role
8. tools array exists and contains valid MCP tool names
9. Report results: .claude/staging/reports/WORKFLOWS-validation.md
10. List each handler with PASS/FAIL and specific issues"
```

#### 5. Integration Test - Verify connections
```bash
Task: integration-tester "Test handler interactions for WORKFLOWS.md handlers:
1. Verify all handler cross-references resolve correctly
2. Check trigger phrases don't conflict between handlers
3. Test orchestrator→operator call paths work
4. Ensure no circular dependencies between handlers
5. Validate tool availability for each handler
6. Simulate common user requests to test routing
7. Report results to .claude/staging/reports/WORKFLOWS-integration.md
8. Flag any handlers that would fail in production"
```

## ⚠️ CRITICAL REMINDERS

### 1. Agent Prompts Are EXACT
- Copy the FULL prompts from IMPLEMENTATION.md
- Don't paraphrase or shorten
- Agents know exactly where to place files

### 2. File Placement Rules
```
handlers/
├── triggers/[domain]/[handler-id].md     # User-facing entry points
├── orchestrators/[handler-id].md         # Multi-step workflows
└── operators/[domain]/[handler-id].md    # Atomic operations
```

### 3. YAML Frontmatter MUST Have
- id: kebab-case matching filename
- name: Human readable
- role: trigger|orchestrator|operator
- domain: from valid list
- stability: stable (for all migrated)
- triggers: array for trigger role
- tools: MCP tool list
- version: 1.0.0

### 4. Update State After EVERY Operation
```bash
# After each agent completes, update:
- migration-state.json
- TRACKER.md checkboxes
- SESSION.md progress log
```

## 📊 PROGRESS TRACKING

### Todo List Status (12 remaining)
1. ✅ Clean staging directory 
2. ✅ Prepare agent prompts
3. ⏳ Create migration-state.json ← YOU ARE HERE
4. ⏳ Run scanner on WORKFLOWS.md
5. ⏳ Migrate WORKFLOWS.md (~25)
6. ⏳ Create memory after WORKFLOWS
7. ⏳ Migrate CONVENTIONS.md (~15)
8. ⏳ Migrate PATTERNS.md (~8)
9. ⏳ Migrate BUILDING-BETTER.md (~3)
10. ⏳ Create 6 missing handlers
11. ⏳ Run validation suite
12. ⏳ Optimize patterns
13. ⏳ Update CLAUDE.md/REGISTRY.md
14. ⏳ Execute cutover

### Expected Timeline
- **WORKFLOWS.md**: ~45 minutes (25 handlers)
- **CONVENTIONS.md**: ~30 minutes (15 handlers)
- **PATTERNS.md**: ~15 minutes (8 handlers)
- **BUILDING-BETTER.md**: ~10 minutes (3 handlers)
- **Create missing**: ~30 minutes (6 handlers)
- **Validation/Optimization**: ~1 hour
- **Total**: 3-4 hours

## 🚨 ERROR RECOVERY

### If Agent Fails
1. Check error in agent output
2. Log in migration-state.json errors array
3. Try fix and re-run (max 2 attempts)
4. If still failing:
   - Document in TRACKER.md notes
   - Continue with next operation
   - Add to "fix-later" list

### If Session Interrupted
1. Check migration-state.json for last operation
2. Review TRACKER.md for last checkbox
3. Resume from that exact point
4. Re-validate any partial work

## 🎯 SUCCESS CRITERIA

Migration complete when:
- [ ] 75 handlers in staging (69 migrated + 6 created)
- [ ] Zero validation errors
- [ ] All integration tests pass
- [ ] Performance metrics acceptable
- [ ] Documentation generated
- [ ] CLAUDE.md updated for new paths
- [ ] REGISTRY.md updated with locations

## 💡 QUICK REFERENCE

### Check Progress
```bash
# Count handlers
find .claude/staging/handlers -name "*.md" | wc -l

# Check state
jq '.files' .claude/staging/migration-state.json

# View errors
jq '.errors' .claude/staging/migration-state.json
```

### Common Issues
- **"Handler not found"** → Check scanner report for exact name
- **"Invalid YAML"** → Ensure proper indentation (2 spaces)
- **"Wrong folder"** → Check role/domain mapping
- **"Duplicate handler"** → Skip and note in tracker

## 🔄 READY TO START!

1. Read this message completely
2. Read HANDOFF.md for more detail
3. Check TRACKER.md for your checklist
4. Start with Step 1 above
5. Update progress constantly

**You've got this! Everything is prepared and ready for execution.**

---
*Last updated: 2025-07-31 10:50 CEST*
*Next action: Create staging directories and migration-state.json*
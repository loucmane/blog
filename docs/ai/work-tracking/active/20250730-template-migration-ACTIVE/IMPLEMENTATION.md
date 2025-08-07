# Template Migration Implementation Playbook

## 🎯 Migration Goals
1. **Handlers**: Migrate 69 existing handlers + create 6 missing handlers = 75 total handlers from monolithic template files to folder-based structure. ✅ COMPLETE
2. **Templates**: Migrate 12 monolithic template files to modular folder structure (NEW PHASE - August 2025)

## 📌 Key Clarifications
- **Batch Processing**: Extract ALL handlers from a file at once, then validate ALL at once
- **Output Formats**: JSON for machine-readable reports, Markdown for human documentation  
- **Error Handling**: Continue on non-critical errors, stop only on critical failures
- **State Updates**: Every operation updates specific JSON paths in migration-state.json
- **Success Criteria**: Each agent has explicit pass/fail conditions

## 📋 Exact Agent Prompts for Each Phase

### Phase 1: Environment Setup

#### 1.1 Create Directory Structure
```bash
mkdir -p .claude/staging/handlers/{triggers,orchestrators,operators}
mkdir -p .claude/staging/handlers/triggers/{development,git,search,debug,test,docs,workflow,external,file,session,analysis}
mkdir -p .claude/staging/handlers/operators/{development,git,search,debug,test,docs,workflow,external,file,session,analysis}
mkdir -p .claude/staging/{reports,backups,shared}
```

#### 1.2 Initialize State Tracking
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
```

### Phase 2: File-by-File Migration Prompts

#### For EACH Template File (WORKFLOWS, CONVENTIONS, PATTERNS, BUILDING-BETTER):

##### 2.1 Template Scanner Prompt
```
Task: template-scanner "Analyze .claude/templates/WORKFLOWS.md and create a detailed report with:

INPUT: .claude/templates/WORKFLOWS.md
OUTPUT FORMAT: JSON file at .claude/staging/reports/WORKFLOWS-scan.json

REQUIREMENTS:
1. List every handler found with:
   - handler_id (kebab-case)
   - line_start and line_end numbers
   - handler_name (human readable)
2. Determine handler role based on:
   - trigger: Has 'Triggers:' section with user-facing phrases
   - orchestrator: Calls multiple handlers/operations
   - operator: Single atomic operation
3. Classify domain from: development, git, search, debug, test, docs, workflow, external, file, session, analysis
4. Extract all trigger phrases (exact quotes from 'Triggers:' sections)
5. List all MCP tools used (from Process sections)
6. Identify cross-handler dependencies (references to other handlers)
7. Handle malformed handlers by adding to 'malformed_handlers' array with reason

OUTPUT STRUCTURE:
{
  'scan_timestamp': 'ISO-8601',
  'file': 'WORKFLOWS.md',
  'total_handlers': N,
  'handlers': [
    {
      'handler_id': 'start-new-work',
      'handler_name': 'Start New Work',
      'line_start': 123,
      'line_end': 189,
      'role': 'trigger',
      'domain': 'workflow',
      'triggers': ['work on X', 'implement Y'],
      'tools': ['TodoWrite', 'Bash', 'Edit'],
      'dependencies': ['create-work-folder', 'update-tracker']
    }
  ],
  'malformed_handlers': [],
  'scan_errors': []
}

STATE UPDATE: 
- Set files.WORKFLOWS.md.status = 'scanning'
- After completion: Set files.WORKFLOWS.md.handlers_found = total_handlers

ERROR HANDLING:
- If handler spans sections unexpectedly, use the last line before next '####' marker
- If triggers section missing for trigger role, add to malformed_handlers
- Continue scanning even if individual handlers have issues

SUCCESS CRITERIA: 
- All handlers between '####' markers are found
- Output JSON is valid and parseable
- Handler count matches manual count"
```

##### 2.2 Security Validator Prompt
```
Task: security-validator "Scan .claude/templates/WORKFLOWS.md for security vulnerabilities:

INPUT: .claude/templates/WORKFLOWS.md
OUTPUT FORMAT: JSON file at .claude/staging/reports/WORKFLOWS-security.json

SEVERITY DEFINITIONS:
- CRITICAL: Exposed secrets, unvalidated command execution, SQL injection patterns
- HIGH: Path traversal risks, missing input validation on file operations
- MEDIUM: Hardcoded development URLs, overly permissive file access
- LOW: Missing error handling, console.log with sensitive data potential

REQUIREMENTS:
1. Check for exposed secrets, API keys, tokens, or credentials in examples
2. Identify unsafe command execution patterns:
   - Bash commands with unvalidated user input
   - String concatenation in commands without escaping
3. Find potential path traversal risks:
   - File operations without path normalization
   - Missing checks for '../' in paths
4. Detect injection vulnerabilities in tool parameters
5. Check for missing input validation in handlers
6. Look for hardcoded localhost/development URLs
7. Check for overly permissive operations (e.g., 'rm -rf' without constraints)

OUTPUT STRUCTURE:
{
  'scan_timestamp': 'ISO-8601',
  'file': 'WORKFLOWS.md',
  'total_issues': N,
  'critical_count': 0,
  'high_count': 0,
  'medium_count': 0,
  'low_count': 0,
  'issues': [
    {
      'severity': 'HIGH',
      'handler': 'handler-id',
      'line': 156,
      'issue': 'Unvalidated user input in Bash command',
      'recommendation': 'Validate/escape input before command execution',
      'code_snippet': 'relevant code'
    }
  ],
  'false_positives': []
}

ERROR HANDLING:
- If uncertain about severity, err on side of caution (higher severity)
- Document potential false positives separately
- Continue scan even if file read errors occur

SUCCESS CRITERIA:
- Complete scan of all handlers
- BLOCK migration if critical_count > 0
- Document all HIGH issues for review
- Proceed if critical_count === 0"
```

##### 2.3 Template Migrator Prompt
```
Task: template-migrator "BATCH extract ALL handlers from .claude/templates/WORKFLOWS.md:

INPUT: 
- Source: .claude/templates/WORKFLOWS.md
- Scanner report: .claude/staging/reports/WORKFLOWS-scan.json

PROCESSING MODE: BATCH (extract all handlers in one operation)

REQUIREMENTS:
1. For each handler in scanner report, create file with EXACT frontmatter:
---
id: handler-name-in-kebab-case
name: Human Readable Handler Name
role: trigger|orchestrator|operator (from scanner report)
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

[Original handler content including # heading and all sections]

2. File placement rules:
   - triggers → .claude/staging/handlers/triggers/[domain]/[handler-id].md
   - orchestrators → .claude/staging/handlers/orchestrators/[handler-id].md
   - operators → .claude/staging/handlers/operators/[domain]/[handler-id].md

3. Content preservation:
   - Include EVERYTHING from #### Handler: line to next #### marker
   - Preserve all formatting, lists, code blocks
   - Do NOT modify the original content

4. Multi-domain handling:
   - If handler could fit multiple domains, use first applicable:
   - Order: development > git > search > debug > workflow > other

ERROR HANDLING:
- If handler already exists, log to migration-errors.md and skip
- If extraction fails, add to files.WORKFLOWS.md.errors array
- Create checkpoint after every 10 handlers
- Continue with next handler on any failure

STATE UPDATES (for each handler):
migration-state.json.handlers[handler-id] = {
  'source_file': 'WORKFLOWS.md',
  'migrated_at': 'ISO-timestamp',
  'location': 'handlers/[role]/[domain]/[handler-id].md',
  'line_start': N,
  'line_end': N
}

After all handlers:
- Set files.WORKFLOWS.md.handlers_migrated = count
- Set files.WORKFLOWS.md.status = 'migrated'

SUCCESS CRITERIA:
- handlers_migrated equals handlers_found from scanner
- All files created in correct locations
- Each file has valid YAML frontmatter
- Original content preserved exactly"
```

##### 2.4 Handler Validator Prompt  
```
Task: handler-validator "BATCH validate ALL handlers migrated from WORKFLOWS.md:

INPUT: All files in .claude/staging/handlers/ that have source_file='WORKFLOWS.md'
OUTPUT: JSON report at .claude/staging/reports/WORKFLOWS-validation.json

VALIDATION CHECKS:
1. YAML frontmatter is valid and parseable (use YAML parser)
2. Required fields present:
   - ALL handlers: id, name, role, domain, stability, tools, version
   - trigger role only: triggers array (non-empty)
   - orchestrator role: dependencies array can have entries
3. id field matches filename exactly (without .md)
4. role is one of: trigger, orchestrator, operator
5. domain is one of: development, git, search, debug, test, docs, workflow, external, file, session, analysis
6. File location matches: handlers/[role]/[domain]/ pattern
7. triggers array exists and non-empty for trigger role
8. tools array contains valid MCP tool names
9. version matches format: N.N.N
10. Multi-domain validation: If handler references multiple domains, verify primary domain was chosen correctly

OUTPUT STRUCTURE:
{
  'validation_timestamp': 'ISO-8601',
  'source_file': 'WORKFLOWS.md',
  'total_validated': N,
  'passed': N,
  'failed': N,
  'results': [
    {
      'handler_id': 'start-new-work',
      'file_path': 'handlers/triggers/workflow/start-new-work.md',
      'status': 'PASS|FAIL',
      'checks': {
        'yaml_valid': true,
        'required_fields': true,
        'id_matches_filename': true,
        'role_valid': true,
        'domain_valid': true,
        'location_correct': true,
        'triggers_present': true,
        'tools_valid': true,
        'version_format': true
      },
      'errors': []
    }
  ]
}

ERROR HANDLING:
- If YAML parse fails, try to extract fields manually
- Log specific validation failures for each check
- Continue validating all handlers even if some fail

STATE UPDATE:
For each handler:
- Set migration-state.json.handlers[handler-id].validated = true/false
- Add validation errors to handler entry if failed

SUCCESS CRITERIA:
- 100% of handlers validated (passed + failed = total)
- If failed > 0, list must be reviewed before proceeding
- Critical failures (wrong location, invalid YAML) must be fixed"
```

##### 2.5 Integration Tester Prompt
```
Task: integration-tester "Test handler interactions for WORKFLOWS.md handlers:

INPUT: 
- All validated handlers from WORKFLOWS.md
- Scanner report with dependencies
OUTPUT: JSON report at .claude/staging/reports/WORKFLOWS-integration.json

TEST SCENARIOS:
1. Cross-reference validation:
   - Every handler referenced in dependencies exists
   - Reference uses correct handler-id
2. Trigger phrase conflicts:
   - No two handlers have identical triggers
   - Similar triggers are properly disambiguated
3. Call path testing:
   - orchestrator → operator paths are valid
   - All tools referenced are available
4. Circular dependency check:
   - No handler depends on itself
   - No circular chains (A→B→C→A)
5. S:W:H:E compliance:
   - Verify handlers that use S:W:H:E format have proper structure
   - Check handler references in H: field are valid
6. Error path testing:
   - Handlers have error handling for failed dependencies
   - Graceful degradation paths exist
7. Tool availability:
   - All tools in tools array are valid MCP tools
   - No deprecated tools are used
8. Common workflow testing:
   - 'work on X' → proper handler chain
   - 'fix bug' → debug domain handlers available

OUTPUT STRUCTURE:
{
  'test_timestamp': 'ISO-8601',
  'source_file': 'WORKFLOWS.md',
  'total_tests': N,
  'passed': N,
  'failed': N,
  'warnings': N,
  'results': {
    'cross_references': { 'status': 'PASS', 'issues': [] },
    'trigger_conflicts': { 'status': 'PASS', 'conflicts': [] },
    'call_paths': { 'status': 'PASS', 'broken_paths': [] },
    'circular_deps': { 'status': 'PASS', 'circles': [] },
    'swhe_compliance': { 'status': 'PASS', 'violations': [] },
    'error_handling': { 'status': 'WARNING', 'missing': [] },
    'tool_availability': { 'status': 'PASS', 'missing_tools': [] },
    'workflow_tests': { 'status': 'PASS', 'failed_workflows': [] }
  }
}

SUCCESS CRITERIA:
- No FAIL status in critical tests (cross_references, call_paths, circular_deps)
- Warnings are documented but don't block
- All handlers are reachable through some trigger path
- Production simulation shows working system"
```

### Phase 3: Create Missing Handlers

#### 3.1 fix-bug Handler
```
Task: handler-creator "Create fix-bug handler with COMPLETE structure:

LOCATION: .claude/staging/handlers/triggers/debug/fix-bug.md

CONTENT:
---
id: fix-bug
name: Fix Code Bug
role: trigger  
domain: debug
stability: stable
triggers:
  - "fix bug"
  - "fix bug in X"
  - "bug in Y"
  - "there's a bug"
  - "fix the bug"
dependencies: []
tools:
  - mcp__serena__search_for_pattern
  - Read
  - Edit
  - Bash
version: 1.0.0
---

# Fix Code Bug

## Purpose
Systematically identify and fix bugs in code by gathering evidence, locating the source, implementing a fix, and verifying the solution.

## Process
1. Gather evidence about the bug
   - Error messages, stack traces
   - Steps to reproduce
   - Expected vs actual behavior
2. Search for related code
   - Use Serena to find error patterns
   - Locate relevant files and functions
3. Analyze root cause
   - Read code context
   - Identify the specific issue
4. Implement fix
   - Make targeted code changes
   - Preserve existing functionality
5. Test the fix
   - Run relevant tests
   - Verify bug is resolved
   - Check for regressions

## Success Criteria
- [ ] Bug is reproducible before fix
- [ ] Root cause identified
- [ ] Fix implemented with minimal changes
- [ ] Bug no longer reproducible after fix
- [ ] No regressions introduced
- [ ] Tests pass

STATE UPDATE:
migration-state.json.handlers['fix-bug'] = {
  'source_file': 'CREATED',
  'created_at': 'ISO-timestamp',
  'location': 'handlers/triggers/debug/fix-bug.md',
  'validated': false
}"
```

#### 3.2 debug-issue Handler
```
Task: handler-creator "Create debug-issue handler with:
- id: debug-issue
- name: Debug Issue
- role: trigger
- domain: debug  
- triggers: ['debug this', 'debug issue', 'why is X failing', 'debug error', 'help debug']
- Process: 1) Collect error details, 2) Search for error patterns, 3) Analyze code flow, 4) Identify root cause
- tools: [mcp__serena__search_for_pattern, Read, Grep, Bash]
- Place in: .claude/staging/handlers/triggers/debug/debug-issue.md"
```

#### 3.3 explain-code Handler
```
Task: handler-creator "Create explain-code handler with:
- id: explain-code
- name: Explain Code
- role: trigger
- domain: analysis
- triggers: ['explain this code', 'how does X work', 'what does this do', 'explain function']
- Process: 1) Read code context, 2) Analyze functionality, 3) Explain in clear terms
- tools: [Read, mcp__serena__find_symbol, mcp__serena__get_symbols_overview]
- Place in: .claude/staging/handlers/triggers/analysis/explain-code.md"
```

#### 3.4 code-review Handler
```
Task: handler-creator "Create code-review handler with:
- id: code-review
- name: Review Code
- role: trigger
- domain: analysis
- triggers: ['review this code', 'code review', 'check for issues', 'review my code']
- Process: 1) Read code thoroughly, 2) Check for bugs/issues, 3) Assess code quality, 4) Provide feedback
- tools: [Read, mcp__serena__search_for_pattern, mcp__serena__find_symbol]
- Place in: .claude/staging/handlers/triggers/analysis/code-review.md"
```

#### 3.5 optimize-code Handler
```
Task: handler-creator "Create optimize-code handler with:
- id: optimize-code
- name: Optimize Code Performance
- role: trigger
- domain: development
- triggers: ['optimize this', 'make faster', 'improve performance', 'optimize code']
- Process: 1) Profile current performance, 2) Identify bottlenecks, 3) Implement optimizations, 4) Measure improvements
- tools: [Read, Edit, Bash, mcp__serena__search_for_pattern]
- Place in: .claude/staging/handlers/triggers/development/optimize-code.md"
```

#### 3.6 create-docs Handler
```
Task: handler-creator "Create create-docs handler with:
- id: create-docs
- name: Create Documentation
- role: trigger
- domain: docs
- triggers: ['document this', 'create docs', 'write documentation', 'add documentation']
- Process: 1) Analyze code structure, 2) Extract key information, 3) Write clear documentation, 4) Add to appropriate location
- tools: [Read, Write, mcp__serena__get_symbols_overview, mcp__serena__find_symbol]
- Place in: .claude/staging/handlers/triggers/docs/create-docs.md"
```

### Phase 4: Optimization Prompts

#### 4.1 Template Optimizer
```
Task: template-optimizer "Analyze ALL handlers in .claude/staging/handlers/ to:
1. Find duplicate code patterns (target 25-30% reduction)
2. Create shared pattern files:
   - .claude/staging/shared/serena-patterns.md (common Serena usage)
   - .claude/staging/shared/tool-selection.md (PRIMARY/FALLBACK patterns)  
   - .claude/staging/shared/error-handling.md (common error patterns)
3. Identify handlers that could be merged or consolidated
4. Standardize tool usage keywords: PRIMARY, FALLBACK, ALWAYS, NEVER
5. Remove empty 'dependencies: []' fields
6. Generate report: .claude/staging/reports/optimization-opportunities.md
7. Do NOT modify handlers yet - just report findings"
```

#### 4.2 Version Controller
```
Task: version-controller "Add version control to all handlers:
1. Add 'version: 1.0.0' to any handler missing it in frontmatter
2. Create .claude/staging/version-manifest.json with:
   {
     'handler-id': {
       'version': '1.0.0',
       'path': 'handlers/role/domain/handler.md',
       'lastModified': 'ISO-timestamp'
     }
   }
3. Prepare for future version bumping system
4. Report any version inconsistencies found
5. Document version strategy in .claude/staging/reports/version-control.md"
```

### Phase 5: Final Validation

#### 5.1 Complete System Scan
```
Task: template-scanner "Final scan of .claude/staging/handlers/ to verify:
1. Total handler count is exactly 75 (69 migrated + 6 created)
2. All handlers have valid frontmatter
3. No orphaned handlers (referenced but not existing)
4. All trigger phrases are unique or properly disambiguated
5. Complete dependency graph with no circular references
6. Generate final report: .claude/staging/reports/final-system-scan.md
7. Update migration-state.json with completion status"
```

#### 5.2 Performance Analysis
```
Task: performance-analyzer "Compare staging vs production performance:
1. Measure handler discovery time in staging structure
2. Compare with current monolithic file search time
3. Test common user request routing speed
4. Check memory usage patterns
5. Report must show staging is equal or better performance
6. Save metrics: .claude/staging/reports/performance-metrics.md"
```

### Phase 6: Documentation Generation

```
Task: template-documenter "Generate comprehensive documentation:
1. User guide: How to use the new handler system
2. Developer guide: How to add new handlers
3. Migration guide: What changed from old system
4. API reference: All handlers with their triggers
5. Save to .claude/staging/docs/
6. Include examples for common workflows"
```

## 🔄 State Management

After EVERY agent operation, update migration-state.json:
```json
{
  "last_updated": "new-timestamp",
  "current_operation": "agent-name",
  "handlers": {
    "handler-id": {
      "source_file": "WORKFLOWS.md",
      "migrated_at": "timestamp",
      "validated": true,
      "location": "handlers/trigger/development/handler-id.md"
    }
  }
}
```

## 🚨 Error Recovery

If any agent fails:
1. Error is logged in migration-state.json
2. Try to fix specific issue and re-run agent
3. If still failing after 2 attempts, document in TRACKER.md notes
4. Continue with next operation
5. Create "fix-later" list for post-migration cleanup

## 🔄 State Management Protocol

Every agent MUST update migration-state.json using these exact paths:

```json
{
  "files": {
    "[FILENAME]": {
      "status": "pending|scanning|migrating|migrated|validated|complete",
      "handlers_found": N,
      "handlers_migrated": N,
      "errors": ["error messages"]
    }
  },
  "handlers": {
    "[handler-id]": {
      "source_file": "FILENAME|CREATED",
      "migrated_at": "ISO-timestamp",
      "location": "full/path/to/handler.md",
      "validated": true|false,
      "validation_errors": [],
      "line_start": N,
      "line_end": N
    }
  },
  "current_operation": {
    "agent": "agent-name",
    "started": "ISO-timestamp",
    "target": "file-or-handler"
  },
  "checkpoints": [
    {
      "timestamp": "ISO-timestamp",
      "phase": "phase-name",
      "handlers_complete": N,
      "note": "Checkpoint after X handlers"
    }
  ]
}
```

## 🚨 Error Recovery Protocol

If ANY agent encounters an error:

1. **Log Error**:
   ```json
   {
     "timestamp": "ISO-timestamp",
     "agent": "agent-name",
     "operation": "what-failed",
     "error": "error-message",
     "recovery": "attempted-recovery"
   }
   ```

2. **Recovery Attempts**:
   - First failure: Log and retry once
   - Second failure: Log and skip, continue with next item
   - Critical failure: Stop and await manual intervention

3. **State Preservation**:
   - Always update state before operations
   - Create checkpoint after significant progress
   - Enable resumption from any point

## ✅ Success Criteria

Handler Migration is complete when:
- [x] All 75 handlers present in staging (69 migrated + 6 created) - COMPLETE
- [x] Zero validation errors in final report - COMPLETE
- [x] All integration tests show PASS status - COMPLETE
- [x] Performance metrics within 5% of baseline - COMPLETE
- [x] Complete documentation generated - COMPLETE
- [x] State file shows all operations complete - COMPLETE
- [x] Ready for production cutover - COMPLETE ✅

---

## 📋 Phase 7: Template System Modularization (August 2025)

### 7.1 Template File Migration Plan

#### Core Files to Migrate
1. **CLAUDE.md** (Root) → `.claude/templates/engine/`
   - Core execution engine components
   - ULTRATHINK protocol
   - Context activation layers
   - S:W:H:E format definitions
   - Template navigation protocol

2. **REGISTRY.md** → `.claude/templates/registry/`
   - Index structure
   - Handler mappings by role
   - Navigation keywords
   - Quick lookup tables

3. **BEHAVIORS.md** → `.claude/templates/behaviors/`
   - File operation behaviors
   - Timestamp behaviors
   - Git behaviors
   - Work tracking behaviors
   - Validation behaviors

4. **MATRICES.md** → `.claude/templates/matrices/`
   - Routing matrices
   - Selection matrices
   - Recovery matrices
   - Mapping matrices

5. **TOOLS.md** → `.claude/tools/`
   - Search tool guidance
   - File tool guidance
   - Git tool guidance
   - Task delegation guidance

6. **USER-GUIDE.md** → `.claude/guides/`
   - Quickstart guides
   - Workflow guides
   - Reference guides
   - Troubleshooting guides

7. **Remaining Template Files**
   - WORKFLOWS.md → Extract remaining non-handler content
   - CONVENTIONS.md → Extract remaining conventions
   - PATTERNS.md → Extract remaining patterns
   - BUILDING-BETTER.md → Integration guidance
   - PROJECT-BLOG.md → Project configuration

### 7.2 Expected Outcomes
- **40% size reduction** (8,500 → ~5,100 lines)
- **Zero duplication** (from 43% redundancy)
- **100+ focused modules** (from 12 monolithic files)
- **Shared patterns library** (eliminate 315 duplicate references)
- **Faster discovery** (80% improvement)
- **Easier maintenance** (65% improvement)

### 7.3 Implementation Strategy

#### Quick Wins (1 hour)
1. Delete obsolete files (HANDLERS.md, REGISTRY-REFINED.md)
2. Create shared/ directory structure
3. Extract ULTRATHINK pattern to shared library

#### Phase 1: Core Engine (4 hours)
1. Modularize CLAUDE.md → `.claude/engine/`
2. Create slim CLAUDE.md router
3. Test engine functionality
4. Validate imports

#### Phase 2: Registry Transform (2 hours)
1. Break REGISTRY.md → `.claude/registry/`
2. Create index.md entry point
3. Update handler references
4. Test lookups

#### Phase 3: Bulk Migration (6 hours)
1. BEHAVIORS.md → behaviors/
2. MATRICES.md → matrices/
3. TOOLS.md → tools/
4. USER-GUIDE.md → guides/
5. Process remaining files

#### Phase 4: Consolidation (3 hours)
1. Extract shared patterns
2. Remove duplications
3. Update cross-references
4. Create import maps

#### Phase 5: Validation (2 hours)
1. Test handler discovery
2. Verify functionality
3. Update documentation
4. Create final report

### 7.4 Risk Mitigation
- **CLAUDE.md is critical** - Handle with extreme care
- **Atomic operations** - Each step reversible
- **Backward compatibility** - Old references work via redirects
- **Continuous validation** - Test after each change
- **Comprehensive backups** - Before each phase

### 7.5 Success Metrics
- 100% of monolithic files migrated
- 0% functionality loss
- 50%+ reduction in duplicate content
- 100% of cross-references working
- Complete modular structure achieved
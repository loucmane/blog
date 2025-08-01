# Handler Migration Mapping

This file tracks the migration of handlers from monolithic template files to the new folder-based structure.

## Migration Log

### 2025-01-30 - TOOLS.md Migration

**Migration Summary**:
- **Source File**: `.claude/templates/TOOLS.md`
- **Total Handlers**: 17
- **All Type**: triggers (100%)
- **Target**: `.claude/staging/handlers/`

#### Search Domain (4 handlers)
- **search-code**: TOOLS.md#search-code → staging/handlers/triggers/search/search-code.md ✅
- **find-symbol**: TOOLS.md#find-symbol → staging/handlers/triggers/search/find-symbol.md ✅
- **find-references**: TOOLS.md#find-references → staging/handlers/triggers/search/find-references.md ✅
- **grep-pattern**: TOOLS.md#grep-pattern → staging/handlers/triggers/search/grep-pattern.md ✅

#### File Domain (4 handlers)
- **read-file**: TOOLS.md#read-file → staging/handlers/triggers/file/read-file.md ✅
- **edit-file**: TOOLS.md#edit-file → staging/handlers/triggers/file/edit-file.md ✅
- **create-file**: TOOLS.md#create-file → staging/handlers/triggers/file/create-file.md ✅
- **delete-file**: TOOLS.md#delete-file → staging/handlers/triggers/file/delete-file.md ✅

#### Git Domain (4 handlers)
- **check-status**: TOOLS.md#check-status → staging/handlers/triggers/git/check-status.md ✅
- **commit-changes**: TOOLS.md#commit-changes → staging/handlers/triggers/git/commit-changes.md ✅
- **create-branch**: TOOLS.md#create-branch → staging/handlers/triggers/git/create-branch.md ✅
- **view-history**: TOOLS.md#view-history → staging/handlers/triggers/git/view-history.md ✅

#### Analysis Domain (3 handlers)
- **analyze-code**: TOOLS.md#analyze-code → staging/handlers/triggers/analysis/analyze-code.md ✅
- **check-dependencies**: TOOLS.md#check-dependencies → staging/handlers/triggers/analysis/check-dependencies.md ✅
- **measure-complexity**: TOOLS.md#measure-complexity → staging/handlers/triggers/analysis/measure-complexity.md ✅

#### External Domain (3 handlers)
- **run-tests**: TOOLS.md#run-tests → staging/handlers/triggers/external/run-tests.md ✅
- **check-lint**: TOOLS.md#check-lint → staging/handlers/triggers/external/check-lint.md ✅
- **build-project**: TOOLS.md#build-project → staging/handlers/triggers/external/build-project.md ✅

### 2025-01-30 - WORKFLOWS.md Migration

**Migration Summary**:
- **Source File**: `.claude/templates/WORKFLOWS.md`
- **Total Handlers**: 30
- **Handler Types**: triggers (20), orchestrators (5), operators (5)
- **Target**: `.claude/staging/handlers/`

#### Workflow Domain (8 handlers)
- **resolve-work-void**: WORKFLOWS.md#resolve-work-void → staging/handlers/operators/workflow/resolve-work-void.md ✅
- **start-new-work**: WORKFLOWS.md#start-new-work → staging/handlers/triggers/workflow/start-new-work.md ✅
- **continue-work**: WORKFLOWS.md#continue-work → staging/handlers/triggers/workflow/continue-work.md ✅
- **create-todos**: WORKFLOWS.md#create-todos → staging/handlers/triggers/workflow/create-todos.md ✅
- **update-todos**: WORKFLOWS.md#update-todos → staging/handlers/triggers/workflow/update-todos.md ✅
- **check-progress**: WORKFLOWS.md#check-progress → staging/handlers/triggers/workflow/check-progress.md ✅
- **create-work-folder**: WORKFLOWS.md#create-work-folder → staging/handlers/operators/workflow/create-work-folder.md ✅
- **update-tracker**: WORKFLOWS.md#update-tracker → staging/handlers/operators/workflow/update-tracker.md ✅

#### Development Domain (5 handlers)
- **standard-dev-workflow**: WORKFLOWS.md#standard-dev-workflow → staging/handlers/orchestrators/development/standard-dev-workflow.md ✅
- **create-component**: WORKFLOWS.md#create-component → staging/handlers/triggers/development/create-component.md ✅
- **refactor-code**: WORKFLOWS.md#refactor-code → staging/handlers/triggers/development/refactor-code.md ✅
- **code-review**: WORKFLOWS.md#code-review → staging/handlers/triggers/development/code-review.md ✅
- **optimize-code**: WORKFLOWS.md#optimize-code → staging/handlers/triggers/development/optimize-code.md ✅

#### Documentation Domain (5 handlers)
- **show-capabilities**: WORKFLOWS.md#show-capabilities → staging/handlers/triggers/docs/show-capabilities.md ✅
- **document-findings**: WORKFLOWS.md#document-findings → staging/handlers/operators/docs/document-findings.md ✅
- **record-decision**: WORKFLOWS.md#record-decision → staging/handlers/operators/docs/record-decision.md ✅
- **explain-code**: WORKFLOWS.md#explain-code → staging/handlers/triggers/docs/explain-code.md ✅
- **create-docs**: WORKFLOWS.md#create-docs → staging/handlers/triggers/docs/create-docs.md ✅

#### Session Domain (4 handlers)
- **start-session**: WORKFLOWS.md#start-session → staging/handlers/triggers/session/start-session.md ✅
- **update-session**: WORKFLOWS.md#update-session → staging/handlers/triggers/session/update-session.md ✅
- **end-session**: WORKFLOWS.md#end-session → staging/handlers/triggers/session/end-session.md ✅
- **checkpoint-session**: WORKFLOWS.md#checkpoint-session → staging/handlers/operators/session/checkpoint-session.md ✅

#### Orchestration Domain (3 handlers)
- **deploy-ultrathink**: WORKFLOWS.md#deploy-ultrathink → staging/handlers/orchestrators/workflow/deploy-ultrathink.md ✅
- **deploy-specialist**: WORKFLOWS.md#deploy-specialist → staging/handlers/orchestrators/workflow/deploy-specialist.md ✅
- **orchestrate-complex**: WORKFLOWS.md#orchestrate-complex → staging/handlers/orchestrators/workflow/orchestrate-complex.md ✅

#### Test Domain (3 handlers)
- **create-test-checkpoint**: WORKFLOWS.md#create-test-checkpoint → staging/handlers/triggers/test/create-test-checkpoint.md ✅
- **simulation-test**: WORKFLOWS.md#simulation-test → staging/handlers/orchestrators/test/simulation-test.md ✅
- **validate-changes**: WORKFLOWS.md#validate-changes → staging/handlers/triggers/test/validate-changes.md ✅

#### Debug Domain (2 handlers)
- **fix-bug**: WORKFLOWS.md#fix-bug → staging/handlers/triggers/debug/fix-bug.md ✅
- **debug-issue**: WORKFLOWS.md#debug-issue → staging/handlers/triggers/debug/debug-issue.md ✅

### 2025-08-01 - CONVENTIONS.md Migration

**Migration Summary**:
- **Source File**: `.claude/templates/CONVENTIONS.md`
- **Total Handlers**: 17
- **Handler Types**: operators (13), orchestrators (4)
- **Target**: `.claude/staging/handlers/`

#### Analysis Domain (3 handlers)
- **verify-claim**: CONVENTIONS.md#verify-claim → staging/handlers/operators/analysis/verify-claim.md ✅
- **gather-evidence**: CONVENTIONS.md#gather-evidence → staging/handlers/operators/analysis/gather-evidence.md ✅
- **cite-source**: CONVENTIONS.md#cite-source → staging/handlers/operators/analysis/cite-source.md ✅

#### Development Domain (5 handlers)
- **check-naming**: CONVENTIONS.md#check-naming → staging/handlers/operators/development/check-naming.md ✅
- **suggest-name**: CONVENTIONS.md#suggest-name → staging/handlers/operators/development/suggest-name.md ✅
- **check-style**: CONVENTIONS.md#check-style → staging/handlers/operators/development/check-style.md ✅
- **format-code**: CONVENTIONS.md#format-code → staging/handlers/operators/development/format-code.md ✅
- **review-patterns**: CONVENTIONS.md#review-patterns → staging/handlers/operators/development/review-patterns.md ✅

#### File Domain (1 handler)
- **validate-path**: CONVENTIONS.md#validate-path → staging/handlers/operators/file/validate-path.md ✅

#### Git Domain (2 handlers)
- **check-commit-msg**: CONVENTIONS.md#check-commit-msg → staging/handlers/operators/git/check-commit-msg.md ✅
- **suggest-commit-type**: CONVENTIONS.md#suggest-commit-type → staging/handlers/operators/git/suggest-commit-type.md ✅

#### Documentation Domain (2 handlers)
- **check-docs-needed**: CONVENTIONS.md#check-docs-needed → staging/handlers/operators/docs/check-docs-needed.md ✅
- **validate-comments**: CONVENTIONS.md#validate-comments → staging/handlers/operators/docs/validate-comments.md ✅

#### Session Domain (2 handlers)
- **session-start**: CONVENTIONS.md#session-start → staging/handlers/orchestrators/session-start.md ✅
- **resolve-session-void**: CONVENTIONS.md#resolve-session-void → staging/handlers/orchestrators/resolve-session-void.md ✅

#### Workflow Domain (2 handlers)
- **check-conventions-first**: CONVENTIONS.md#check-conventions-first → staging/handlers/orchestrators/check-conventions-first.md ✅
- **enforce-pre-flight**: CONVENTIONS.md#enforce-pre-flight → staging/handlers/orchestrators/enforce-pre-flight.md ✅

### 2025-08-01 - PATTERNS.md Migration

**Migration Summary**:
- **Source File**: `.claude/templates/PATTERNS.md`
- **Total Handlers**: 14
- **Handler Types**: orchestrators (13), operators (1)
- **Target**: `.claude/staging/handlers/`

#### Workflow Domain (6 handlers)
- **execute-ultrathink**: PATTERNS.md#execute-ultrathink → staging/handlers/orchestrators/execute-ultrathink.md ✅
- **work-activity**: PATTERNS.md#work-activity → staging/handlers/orchestrators/work-activity.md ✅
- **work-continuation**: PATTERNS.md#work-continuation → staging/handlers/orchestrators/work-continuation.md ✅
- **ambiguous-request**: PATTERNS.md#ambiguous-request → staging/handlers/orchestrators/ambiguous-request.md ✅
- **multi-step-request**: PATTERNS.md#multi-step-request → staging/handlers/orchestrators/multi-step-request.md ✅
- **system-improvement**: PATTERNS.md#system-improvement → staging/handlers/orchestrators/system-improvement.md ✅

#### File Domain (2 handlers)
- **file-operation**: PATTERNS.md#file-operation → staging/handlers/orchestrators/file-operation.md ✅
- **file-creation**: PATTERNS.md#file-creation → staging/handlers/orchestrators/file-creation.md ✅

#### Analysis Domain (2 handlers)
- **evidence-check**: PATTERNS.md#evidence-check → staging/handlers/orchestrators/evidence-check.md ✅
- **architecture-claim**: PATTERNS.md#architecture-claim → staging/handlers/orchestrators/architecture-claim.md ✅

#### Development Domain (1 handler)
- **code-creation**: PATTERNS.md#code-creation → staging/handlers/orchestrators/code-creation.md ✅

#### Search Domain (1 handler)
- **tool-selection**: PATTERNS.md#tool-selection → staging/handlers/orchestrators/tool-selection.md ✅

#### Session Domain (1 handler)
- **lost-context**: PATTERNS.md#lost-context → staging/handlers/orchestrators/lost-context.md ✅

#### External Domain (1 handler)
- **time-capture**: PATTERNS.md#time-capture → staging/handlers/operators/external/time-capture.md ✅

### 2025-01-29

#### start-new-work
- **Original Location**: WORKFLOWS.md#start-new-work (line 2006)
- **New Location**: handlers/triggers/development/start-new-work.md
- **Type**: trigger (responds to user requests)
- **Domain**: development (work initialization)
- **Dependencies**: standard-dev-workflow
- **Tools**: Write, TodoWrite, MultiEdit
- **Status**: ✅ Migrated

## Mapping Reference

| Handler ID | Original File | Original Anchor | New Path | Type | Domain |
|------------|---------------|-----------------|----------|------|---------|
| search-code | TOOLS.md | #search-code | staging/handlers/triggers/search/search-code.md | trigger | search |
| find-symbol | TOOLS.md | #find-symbol | staging/handlers/triggers/search/find-symbol.md | trigger | search |
| find-references | TOOLS.md | #find-references | staging/handlers/triggers/search/find-references.md | trigger | search |
| grep-pattern | TOOLS.md | #grep-pattern | staging/handlers/triggers/search/grep-pattern.md | trigger | search |
| read-file | TOOLS.md | #read-file | staging/handlers/triggers/file/read-file.md | trigger | file |
| edit-file | TOOLS.md | #edit-file | staging/handlers/triggers/file/edit-file.md | trigger | file |
| create-file | TOOLS.md | #create-file | staging/handlers/triggers/file/create-file.md | trigger | file |
| delete-file | TOOLS.md | #delete-file | staging/handlers/triggers/file/delete-file.md | trigger | file |
| check-status | TOOLS.md | #check-status | staging/handlers/triggers/git/check-status.md | trigger | git |
| commit-changes | TOOLS.md | #commit-changes | staging/handlers/triggers/git/commit-changes.md | trigger | git |
| create-branch | TOOLS.md | #create-branch | staging/handlers/triggers/git/create-branch.md | trigger | git |
| view-history | TOOLS.md | #view-history | staging/handlers/triggers/git/view-history.md | trigger | git |
| analyze-code | TOOLS.md | #analyze-code | staging/handlers/triggers/analysis/analyze-code.md | trigger | analysis |
| check-dependencies | TOOLS.md | #check-dependencies | staging/handlers/triggers/analysis/check-dependencies.md | trigger | analysis |
| measure-complexity | TOOLS.md | #measure-complexity | staging/handlers/triggers/analysis/measure-complexity.md | trigger | analysis |
| run-tests | TOOLS.md | #run-tests | staging/handlers/triggers/external/run-tests.md | trigger | external |
| check-lint | TOOLS.md | #check-lint | staging/handlers/triggers/external/check-lint.md | trigger | external |
| build-project | TOOLS.md | #build-project | staging/handlers/triggers/external/build-project.md | trigger | external |
| start-new-work | WORKFLOWS.md | #start-new-work | handlers/triggers/development/start-new-work.md | trigger | development |
| verify-claim | CONVENTIONS.md | #verify-claim | staging/handlers/operators/analysis/verify-claim.md | operator | analysis |
| gather-evidence | CONVENTIONS.md | #gather-evidence | staging/handlers/operators/analysis/gather-evidence.md | operator | analysis |
| cite-source | CONVENTIONS.md | #cite-source | staging/handlers/operators/analysis/cite-source.md | operator | analysis |
| check-naming | CONVENTIONS.md | #check-naming | staging/handlers/operators/development/check-naming.md | operator | development |
| suggest-name | CONVENTIONS.md | #suggest-name | staging/handlers/operators/development/suggest-name.md | operator | development |
| validate-path | CONVENTIONS.md | #validate-path | staging/handlers/operators/file/validate-path.md | operator | file |
| check-style | CONVENTIONS.md | #check-style | staging/handlers/operators/development/check-style.md | operator | development |
| format-code | CONVENTIONS.md | #format-code | staging/handlers/operators/development/format-code.md | operator | development |
| review-patterns | CONVENTIONS.md | #review-patterns | staging/handlers/operators/development/review-patterns.md | operator | development |
| check-commit-msg | CONVENTIONS.md | #check-commit-msg | staging/handlers/operators/git/check-commit-msg.md | operator | git |
| suggest-commit-type | CONVENTIONS.md | #suggest-commit-type | staging/handlers/operators/git/suggest-commit-type.md | operator | git |
| session-start | CONVENTIONS.md | #session-start | staging/handlers/orchestrators/session-start.md | orchestrator | session |
| resolve-session-void | CONVENTIONS.md | #resolve-session-void | staging/handlers/orchestrators/resolve-session-void.md | orchestrator | session |
| check-docs-needed | CONVENTIONS.md | #check-docs-needed | staging/handlers/operators/docs/check-docs-needed.md | operator | docs |
| validate-comments | CONVENTIONS.md | #validate-comments | staging/handlers/operators/docs/validate-comments.md | operator | docs |
| check-conventions-first | CONVENTIONS.md | #check-conventions-first | staging/handlers/orchestrators/check-conventions-first.md | orchestrator | workflow |
| enforce-pre-flight | CONVENTIONS.md | #enforce-pre-flight | staging/handlers/orchestrators/enforce-pre-flight.md | orchestrator | workflow |
| execute-ultrathink | PATTERNS.md | #execute-ultrathink | staging/handlers/orchestrators/execute-ultrathink.md | orchestrator | workflow |
| work-activity | PATTERNS.md | #work-activity | staging/handlers/orchestrators/work-activity.md | orchestrator | workflow |
| work-continuation | PATTERNS.md | #work-continuation | staging/handlers/orchestrators/work-continuation.md | orchestrator | workflow |
| file-operation | PATTERNS.md | #file-operation | staging/handlers/orchestrators/file-operation.md | orchestrator | file |
| file-creation | PATTERNS.md | #file-creation | staging/handlers/orchestrators/file-creation.md | orchestrator | file |
| tool-selection | PATTERNS.md | #tool-selection | staging/handlers/orchestrators/tool-selection.md | orchestrator | search |
| code-creation | PATTERNS.md | #code-creation | staging/handlers/orchestrators/code-creation.md | orchestrator | development |
| evidence-check | PATTERNS.md | #evidence-check | staging/handlers/orchestrators/evidence-check.md | orchestrator | analysis |
| architecture-claim | PATTERNS.md | #architecture-claim | staging/handlers/orchestrators/architecture-claim.md | orchestrator | analysis |
| time-capture | PATTERNS.md | #time-capture | staging/handlers/operators/external/time-capture.md | operator | external |
| ambiguous-request | PATTERNS.md | #ambiguous-request | staging/handlers/orchestrators/ambiguous-request.md | orchestrator | workflow |
| multi-step-request | PATTERNS.md | #multi-step-request | staging/handlers/orchestrators/multi-step-request.md | orchestrator | workflow |
| lost-context | PATTERNS.md | #lost-context | staging/handlers/orchestrators/lost-context.md | orchestrator | session |
| system-improvement | PATTERNS.md | #system-improvement | staging/handlers/orchestrators/system-improvement.md | orchestrator | workflow |
| workflow-to-tool | BUILDING-BETTER.md | #workflow-to-tool | staging/handlers/orchestrators/workflow-to-tool.md | orchestrator | workflow |
| tool-to-convention | BUILDING-BETTER.md | #tool-to-convention | staging/handlers/orchestrators/tool-to-convention.md | orchestrator | workflow |
| convention-to-workflow | BUILDING-BETTER.md | #convention-to-workflow | staging/handlers/orchestrators/convention-to-workflow.md | orchestrator | workflow |
| save-context | BUILDING-BETTER.md | #save-context | staging/handlers/operators/session/save-context.md | operator | session |
| restore-context | BUILDING-BETTER.md | #restore-context | staging/handlers/operators/session/restore-context.md | operator | session |
| switch-context | BUILDING-BETTER.md | #switch-context | staging/handlers/orchestrators/switch-context.md | orchestrator | session |

## Cross-Reference Updates Needed

The following references to migrated handlers need updating:

1. **REGISTRY.md** - Update handler location references
2. **WORKFLOWS.md** - Update internal handler links
3. **CLAUDE.md** - Update example handler paths
4. Any handlers that depend on migrated handlers

## Verification Checklist

For TOOLS.md migration:
- [x] All 17 handlers extracted
- [x] Handler content preserved exactly
- [x] YAML frontmatter includes all metadata
- [x] Handler ID matches filename
- [x] Proper folder placement (all triggers)
- [x] Domain classification correct
- [x] Dependencies identified
- [x] Tools listed
- [x] Trigger phrases captured
- [x] Examples maintained
- [x] Process steps complete

For CONVENTIONS.md migration:
- [x] All 17 handlers extracted
- [x] Handler content preserved exactly
- [x] YAML frontmatter includes all metadata
- [x] Handler ID matches filename
- [x] Proper folder placement (operators/orchestrators)
- [x] Domain classification correct
- [x] Dependencies identified
- [x] Tools listed
- [x] Trigger phrases captured
- [x] Examples maintained
- [x] Process steps complete

For PATTERNS.md migration:
- [x] All 14 handlers extracted
- [x] Handler content preserved exactly
- [x] YAML frontmatter includes all metadata
- [x] Handler ID matches filename
- [x] Proper folder placement (orchestrators/operators)
- [x] Domain classification correct
- [x] Dependencies identified
- [x] Tools listed
- [x] Trigger phrases captured
- [x] Examples maintained
- [x] Process steps complete

### 2025-08-01 - BUILDING-BETTER.md Migration

**Migration Summary**:
- **Source File**: `.claude/templates/BUILDING-BETTER.md`
- **Total Handlers**: 6
- **Handler Types**: orchestrators (4), operators (2)
- **Target**: `.claude/staging/handlers/`

#### Workflow Domain (3 handlers)
- **workflow-to-tool**: BUILDING-BETTER.md#workflow-to-tool → staging/handlers/orchestrators/workflow-to-tool.md ✅
- **tool-to-convention**: BUILDING-BETTER.md#tool-to-convention → staging/handlers/orchestrators/tool-to-convention.md ✅
- **convention-to-workflow**: BUILDING-BETTER.md#convention-to-workflow → staging/handlers/orchestrators/convention-to-workflow.md ✅

#### Session Domain (3 handlers)
- **save-context**: BUILDING-BETTER.md#save-context → staging/handlers/operators/session/save-context.md ✅
- **restore-context**: BUILDING-BETTER.md#restore-context → staging/handlers/operators/session/restore-context.md ✅
- **switch-context**: BUILDING-BETTER.md#switch-context → staging/handlers/orchestrators/switch-context.md ✅

For BUILDING-BETTER.md migration:
- [x] All 6 handlers extracted
- [x] Handler content preserved exactly
- [x] YAML frontmatter includes all metadata
- [x] Handler ID matches filename
- [x] Proper folder placement (orchestrators/operators)
- [x] Domain classification correct
- [x] Dependencies identified
- [x] Tools listed
- [x] Trigger phrases captured
- [x] Examples maintained
- [x] Process steps complete
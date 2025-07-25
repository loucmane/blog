# Registry Anchor Audit Report

## Summary
Audited all handler links in REGISTRY.md against actual anchors in template files.

## Results by Template File

### WORKFLOWS.md
**Status**: 11/23 anchors exist (48% match rate)

#### ✅ Working Anchors:
- `start-new-work` → {#start-new-work}
- `continue-work` → {#continue-work}
- `standard-dev-workflow` → {#standard-dev-workflow}
- `create-component` → {#create-component}
- `refactor-code` → {#refactor-code}
- `create-work-folder` → {#create-work-folder}
- `show-capabilities` → {#show-capabilities}
- `check-progress` → {#check-progress}
- `update-tracker` → {#update-tracker}
- `create-todos` → {#create-todos}
- `create-test-checkpoint` → {#create-test-checkpoint}

#### ❌ Missing/Mismatched:
- `implement-feature` → Not found
- `fix-problem` → Actually {#bug-fix-template}
- `debug` → Actually {#emergency-debug}
- `test-implementation` → Not found
- `analyze-error` → Not found
- `root-cause-analysis` → Not found
- `session-end` → Not found (might be {#end-session})
- `orchestrate-task` → Not found
- `sequential-processing` → Exists as section, not handler
- `create-commit-message` → Not found
- `create-pr` → Not found
- `tag-release` → Not found

### TOOLS.md
**Status**: 18/18 anchors exist (100% match rate)
All anchors in REGISTRY correctly match TOOLS.md!

### CONVENTIONS.md
**Status**: 11/14 anchors exist (79% match rate)

#### ✅ Working Anchors:
- `session-start` → {#session-start}
- `verify-claim` → {#verify-claim}
- `gather-evidence` → {#gather-evidence}
- `cite-source` → {#cite-source}
- `check-naming` → {#check-naming}
- `suggest-name` → {#suggest-name}
- `check-style` → {#check-style}
- `check-commit-msg` → {#check-commit-msg}
- `suggest-commit-type` → {#suggest-commit-type}
- `check-conventions-first` → {#check-conventions-first}
- `enforce-pre-flight` → {#enforce-pre-flight}

#### ❌ Missing:
- `format-commit` → Not found
- `tracker-md-editing-rules` → Not found
- `findings-md-editing-rules` → Not found
- `session-md-editing-rules` → Not found

### PATTERNS.md
**Status**: 10/10 anchors exist (100% match rate)
All anchors in REGISTRY correctly match PATTERNS.md!

### BUILDING-BETTER.md
**Status**: Not checked yet (need to verify)

## Fix Strategy

### Priority 1: Update REGISTRY.md
Fix these known mismatches:
1. `fix-problem` → `bug-fix-template`
2. `debug` → `emergency-debug`
3. `session-end` → Check if it's `end-session`

### Priority 2: Add Missing Handlers
These handlers are referenced but don't exist:
1. `implement-feature` - Could add or remove from REGISTRY
2. `test-implementation` - Could add or remove from REGISTRY
3. `analyze-error` - Could add or remove from REGISTRY
4. `root-cause-analysis` - Could add or remove from REGISTRY
5. Git handlers (`create-commit-message`, `create-pr`, `tag-release`)

### Priority 3: Add Missing Convention Rules
1. `format-commit` - Might exist under different name
2. Special file rules (tracker-md, findings-md, session-md)

## Recommendation
1. First pass: Update REGISTRY to match existing anchors
2. Second pass: Identify which missing handlers are actually needed
3. Third pass: Either add handlers or remove from REGISTRY
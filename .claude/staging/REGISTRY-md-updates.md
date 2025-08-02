# REGISTRY.md Updates for Handler Migration

## Handler Link Updates (73 handlers)

### Development Domain
```markdown
# OLD
[start-new-work](WORKFLOWS.md#start-new-work)
[create-component](WORKFLOWS.md#create-component)  
[refactor-code](WORKFLOWS.md#refactor-code)
[optimize-code](CREATED) → [optimize-code](handlers/triggers/development/optimize-code.md)

# NEW
[start-new-work](handlers/triggers/development/start-new-work.md)
[create-component](handlers/triggers/development/create-component.md)
[refactor-code](handlers/triggers/development/refactor-code.md)
[optimize-code](handlers/triggers/development/optimize-code.md)
```

### Debug Domain
```markdown
# OLD
[fix-bug](MISSING) → [fix-bug](handlers/triggers/debug/fix-bug.md)
[debug-issue](MISSING) → [debug-issue](handlers/triggers/debug/debug-issue.md)

# NEW
[fix-bug](handlers/triggers/debug/fix-bug.md)
[debug-issue](handlers/triggers/debug/debug-issue.md)
```

### Analysis Domain
```markdown
# OLD
[deploy-ultrathink](WORKFLOWS.md#deploy-ultrathink)
[explain-code](MISSING) → [explain-code](handlers/triggers/analysis/explain-code.md)
[code-review](MISSING) → [code-review](handlers/triggers/analysis/code-review.md)

# NEW
[deploy-ultrathink](handlers/triggers/analysis/deploy-ultrathink.md)
[explain-code](handlers/triggers/analysis/explain-code.md)
[code-review](handlers/triggers/analysis/code-review.md)
```

### Git Domain
```markdown
# OLD
[check-commit-msg](CONVENTIONS.md#check-commit-msg)
[suggest-commit-type](CONVENTIONS.md#suggest-commit-type)

# NEW
[check-commit-msg](handlers/operators/git/check-commit-msg.md)
[suggest-commit-type](handlers/operators/git/suggest-commit-type.md)
```

### Session Domain
```markdown
# OLD
[show-capabilities](WORKFLOWS.md#show-capabilities)
[start-session](WORKFLOWS.md#start-session)
[update-session](WORKFLOWS.md#update-session)
[end-session](WORKFLOWS.md#end-session)

# NEW
[show-capabilities](handlers/triggers/session/show-capabilities.md)
[start-session](handlers/triggers/session/start-session.md) 
[update-session](handlers/triggers/session/update-session.md)
[end-session](handlers/triggers/session/end-session.md)
```

### Workflow Domain
```markdown
# OLD
[create-todos](WORKFLOWS.md#create-todos)
[update-todos](WORKFLOWS.md#update-todos)
[check-progress](WORKFLOWS.md#check-progress)
[continue-work](WORKFLOWS.md#continue-work)
[deploy-specialist](WORKFLOWS.md#deploy-specialist)
[update-tracker](WORKFLOWS.md#update-tracker)
[create-work-folder](WORKFLOWS.md#create-work-folder)
[resolve-work-void](WORKFLOWS.md#resolve-work-void)
[resolve-handler-void](CREATED) → [resolve-handler-void](handlers/operators/workflow/resolve-handler-void.md)

# NEW
[create-todos](handlers/triggers/workflow/create-todos.md)
[update-todos](handlers/triggers/workflow/update-todos.md)
[check-progress](handlers/triggers/workflow/check-progress.md)
[continue-work](handlers/triggers/workflow/continue-work.md)
[deploy-specialist](handlers/triggers/workflow/deploy-specialist.md)
[update-tracker](handlers/triggers/workflow/update-tracker.md)
[create-work-folder](handlers/operators/workflow/create-work-folder.md)
[resolve-work-void](handlers/operators/workflow/resolve-work-void.md)
[resolve-handler-void](handlers/operators/workflow/resolve-handler-void.md)
```

### Docs Domain
```markdown
# OLD
[document-findings](WORKFLOWS.md#document-findings)
[record-decision](WORKFLOWS.md#record-decision)
[create-docs](MISSING) → [create-docs](handlers/triggers/docs/create-docs.md)
[check-docs-needed](CONVENTIONS.md#check-docs-needed)
[validate-comments](CONVENTIONS.md#validate-comments)

# NEW
[document-findings](handlers/triggers/docs/document-findings.md)
[record-decision](handlers/triggers/docs/record-decision.md)
[create-docs](handlers/triggers/docs/create-docs.md)
[check-docs-needed](handlers/operators/docs/check-docs-needed.md)
[validate-comments](handlers/operators/docs/validate-comments.md)
```

### Test Domain
```markdown
# OLD
[create-test-checkpoint](WORKFLOWS.md#create-test-checkpoint)
[simulation-test](WORKFLOWS.md#simulation-test)
[validate-changes](WORKFLOWS.md#validate-changes)

# NEW
[create-test-checkpoint](handlers/triggers/test/create-test-checkpoint.md)
[simulation-test](handlers/triggers/test/simulation-test.md)
[validate-changes](handlers/triggers/test/validate-changes.md)
```

### File Domain
```markdown
# OLD
[validate-path](CONVENTIONS.md#validate-path)

# NEW
[validate-path](handlers/operators/file/validate-path.md)
```

### External Domain
```markdown
# OLD
[time-capture](PATTERNS.md#time-capture)

# NEW
[time-capture](handlers/operators/external/time-capture.md)
```

### Orchestrators
```markdown
# OLD
[standard-dev-workflow](WORKFLOWS.md#standard-dev-workflow)
[orchestrate-complex](WORKFLOWS.md#orchestrate-complex)
[execute-ultrathink](PATTERNS.md#execute-ultrathink)
[work-activity](PATTERNS.md#work-activity)
[work-continuation](PATTERNS.md#work-continuation)
[file-operation](PATTERNS.md#file-operation)
[file-creation](PATTERNS.md#file-creation)
[tool-selection](PATTERNS.md#tool-selection)
[code-creation](PATTERNS.md#code-creation)
[evidence-check](PATTERNS.md#evidence-check)
[architecture-claim](PATTERNS.md#architecture-claim)
[ambiguous-request](PATTERNS.md#ambiguous-request)
[multi-step-request](PATTERNS.md#multi-step-request)
[lost-context](PATTERNS.md#lost-context)
[system-improvement](PATTERNS.md#system-improvement)
[session-start](CONVENTIONS.md#session-start)
[resolve-session-void](CONVENTIONS.md#resolve-session-void)
[check-conventions-first](CONVENTIONS.md#check-conventions-first)
[enforce-pre-flight](CONVENTIONS.md#enforce-pre-flight)

# NEW
[standard-dev-workflow](handlers/orchestrators/standard-dev-workflow.md)
[orchestrate-complex](handlers/orchestrators/orchestrate-complex.md)
[execute-ultrathink](handlers/orchestrators/execute-ultrathink.md)
[work-activity](handlers/orchestrators/work-activity.md)
[work-continuation](handlers/orchestrators/work-continuation.md)
[file-operation](handlers/orchestrators/file-operation.md)
[file-creation](handlers/orchestrators/file-creation.md)
[tool-selection](handlers/orchestrators/tool-selection.md)
[code-creation](handlers/orchestrators/code-creation.md)
[evidence-check](handlers/orchestrators/evidence-check.md)
[architecture-claim](handlers/orchestrators/architecture-claim.md)
[ambiguous-request](handlers/orchestrators/ambiguous-request.md)
[multi-step-request](handlers/orchestrators/multi-step-request.md)
[lost-context](handlers/orchestrators/lost-context.md)
[system-improvement](handlers/orchestrators/system-improvement.md)
[session-start](handlers/orchestrators/session-start.md)
[resolve-session-void](handlers/orchestrators/resolve-session-void.md)
[check-conventions-first](handlers/orchestrators/check-conventions-first.md)
[enforce-pre-flight](handlers/orchestrators/enforce-pre-flight.md)
```

### Operators
```markdown
# OLD
[checkpoint-session](WORKFLOWS.md#checkpoint-session)
[verify-claim](CONVENTIONS.md#verify-claim)
[gather-evidence](CONVENTIONS.md#gather-evidence)
[cite-source](CONVENTIONS.md#cite-source)
[check-naming](CONVENTIONS.md#check-naming)
[suggest-name](CONVENTIONS.md#suggest-name)
[check-style](CONVENTIONS.md#check-style)
[format-code](CONVENTIONS.md#format-code)
[review-patterns](CONVENTIONS.md#review-patterns)

# NEW
[checkpoint-session](handlers/operators/session/checkpoint-session.md)
[verify-claim](handlers/operators/analysis/verify-claim.md)
[gather-evidence](handlers/operators/analysis/gather-evidence.md)
[cite-source](handlers/operators/analysis/cite-source.md)
[check-naming](handlers/operators/development/check-naming.md)
[suggest-name](handlers/operators/development/suggest-name.md)
[check-style](handlers/operators/development/check-style.md)
[format-code](handlers/operators/development/format-code.md)
[review-patterns](handlers/operators/development/review-patterns.md)
```

## Navigation Keywords Section Update

Update all entries to use new paths:

```markdown
### Navigation Keywords
Quick lookup for common requests:

- "work on X", "implement Y", "build Z" → handlers/triggers/development/start-new-work.md
- "continue", "resume work", "pick up where" → handlers/triggers/workflow/continue-work.md
- "create component", "new component" → handlers/triggers/development/create-component.md
- "fix bug", "bug in" → handlers/triggers/debug/fix-bug.md
- "debug", "why is X failing" → handlers/triggers/debug/debug-issue.md
- "explain code", "how does X work" → handlers/triggers/analysis/explain-code.md
- "review code", "check for issues" → handlers/triggers/analysis/code-review.md
- "optimize", "make faster" → handlers/triggers/development/optimize-code.md
- "document", "create docs" → handlers/triggers/docs/create-docs.md
[... continue for all entries ...]
```

## Update Summary

1. Update 73 handler links from template anchors to file paths
2. Update Navigation Keywords section with new paths
3. Preserve REGISTRY.md location in templates/
4. Test handler discovery after updates
5. Verify all links are valid file paths
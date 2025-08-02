# Error Handling Patterns

Common error handling and failure mode patterns across handlers.

## Standard Failure Modes

### Insufficient Evidence
```
**Failure**: Limited evidence available
**Response**: "I need to verify this"
**Recovery**: Gather more debugging data
```
Used in: gather-evidence, verify-claim, cite-source

### Context Unclear
```
**Failure**: Context unclear, needs clarification
**Response**: "Could you clarify what you're referring to?"
**Recovery**: Ask for specific guidance
```
Used in: ambiguous-request, lost-context, continue-work

### Resource Not Found
```
**Failure**: No matching work found, show available options
**Response**: List alternatives or create new
**Recovery**: Route to creation handler
```
Used in: continue-work, resolve-work-void, validate-path

### Validation Failures
```
**Failure**: Format violations found
**Response**: Provide pass/fail with fixes
**Recovery**: Show specific violations and corrections
```
Used in: check-commit-msg, validate-comments, check-style

## Error Response Templates

### Evidence Insufficient
```
if insufficient_evidence:
    return "I need to verify this by searching for [specific_target]. Let me gather evidence first."
```

### Context Missing
```
if ambiguous_reference:
    return "Could you clarify what you're referring to? I can see [list_available_options]."
```

### Resource Missing
```
if resource_not_found:
    return "No [resource_type] found matching '[query]'. Available options: [list_alternatives]"
```

### Validation Failed
```
if validation_failed:
    return "Validation failed: [specific_violations]. Suggested fixes: [corrections]"
```

## Recovery Patterns

### Evidence Gathering Recovery
1. Identify what evidence is needed
2. Use Serena to search for proof
3. If no evidence found, state clearly
4. Suggest alternative approaches

### Context Resolution Recovery
1. Check TodoWrite for active context
2. Check recent operations
3. If still unclear, ask for clarification
4. Provide available options

### Resource Creation Recovery
1. Offer to create missing resource
2. Use appropriate creation handler
3. Follow standard creation patterns
4. Update tracking systems

### Validation Recovery
1. List specific violations
2. Provide corrected examples
3. Offer to apply fixes automatically
4. Re-validate after corrections

## Silent Failure Patterns

### Checkpoint Operations
```
**Success**: Progress preserved
**Failure**: Silent skip (no interruption to flow)
```
Used in: checkpoint-session, time-capture

### Auto-save Operations
```
**Success**: State saved
**Failure**: Continue without save (log warning)
```
Used in: save-context, update-tracker

## Best Practices

1. **Be Specific**: Always explain what failed and why
2. **Provide Options**: Offer alternatives when possible
3. **Show Evidence**: Demonstrate what was checked
4. **Enable Recovery**: Guide user to resolution
5. **Fail Gracefully**: Preserve system state on errors
6. **Log Appropriately**: Record failures for improvement

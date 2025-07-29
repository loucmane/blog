# Pilot Orchestration: 3 Handler Transformations

## Selected Handlers for Pilot
1. **edit-file** - Most commonly used, touches multiple concerns
2. **commit-changes** - Cross-cutting concerns, good test case
3. **create-component** - Complex creation flow, uses patterns

## Handler 1: edit-file

### Current Implementation (TOOLS.md)
```yaml
Handler: edit-file
Triggers: "change X to Y", "update Z", "modify file"
Process:
  1. Read file first (mandatory)
  2. Use Edit/Write for modifications
  3. Verify changes
```

### Orchestrated Implementation
```yaml
Handler: edit-file
Purpose: Orchestrate safe file editing across all templates
Triggers: "change X to Y", "update Z", "modify file"

Pre-execution Checks:
  - File path extracted from request
  - Edit description clear

Orchestration Flow:
  1. MATRICES.md#file-type-matrix
     - Input: file extension
     - Output: file type category (component/config/test/doc)
     - Evidence: "type:component"

  2. PATTERNS.md#edit-safety-pattern
     - Input: file type from step 1
     - Pattern: safe-edit-sequence
     - Output: required checks and steps
     - Evidence: "pattern:safe-edit-3"

  3. BEHAVIORS.md#before-file-edit
     - Checks: file exists, not locked, conventions apply
     - Gate: CANNOT PROCEED if checks fail
     - Evidence: "behavior:pre-edit-passed"

  4. CONVENTIONS.md#file-editing-rules
     - Input: file type and change description
     - Checks: naming preserved, structure valid
     - Output: validation rules
     - Evidence: "conventions:validated"

  5. TOOLS.md#edit-execution
     - Tool selection: Edit vs MultiEdit
     - Execute: Apply changes
     - Evidence: "tool:Edit,lines:45-67"

  6. WORKFLOWS.md#post-edit-validation
     - Run applicable validators
     - Check for side effects
     - Update tracking if needed
     - Evidence: "validation:passed"

Success Criteria:
  - All 6 templates consulted
  - File successfully edited
  - No convention violations

S:W:H:E Format:
  H:edit-file|E:6/"matrix:component,pattern:safe-edit-3,behavior:passed,conventions:valid,tool:Edit,validation:complete"
```

## Handler 2: gac (git add . && commit)

### Current Implementation (CONVENTIONS.md)
```yaml
Critical Convention: gac='git add . && git commit -m'
- MUST use double quotes around message
- MUST use single quotes inside message
- Give ONLY raw message text when asked
```

### Orchestrated Implementation
```yaml
Handler: gac
Purpose: Orchestrate safe gac usage ensuring quote compliance and conventions
Triggers: "commit", "gac", "commit changes", "save changes"

Pre-execution Checks:
  - Git repository active
  - Changes exist to commit
  - User intent clear

Orchestration Flow:
  1. BEHAVIORS.md#before-gac
     - Check: git status shows changes
     - Check: No .env or secrets in changes
     - Check: No debug/console.log statements
     - Gate: CANNOT PROCEED if violations
     - Evidence: "behavior:pre-gac-safe"

  2. TOOLS.md#analyze-changes
     - Run: git status and git diff
     - Understand what's being committed
     - Use Serena to check for patterns
     - Evidence: "tools:changes-analyzed"

  3. MATRICES.md#commit-type-matrix
     - Input: Changed files analysis
     - Matrix: Changes → Type
     - Output: feat/fix/docs/style/refactor/test/chore
     - Evidence: "matrix:type-feat"

  4. CONVENTIONS.md#gac-format
     - CRITICAL: Check quote rules
     - Transform: User message → proper format
     - Rule: type(scope): message with 'single quotes'
     - Format: gac "type: message with 'quotes' inside"
     - Evidence: "convention:gac-quotes-valid"

  5. PATTERNS.md#conventional-commit-pattern
     - Apply: Conventional commit structure
     - Scope: Extract from context if applicable
     - Message: Clear, imperative mood
     - Evidence: "pattern:conventional-applied"

  6. WORKFLOWS.md#commit-message-generation
     - Generate: Complete message
     - Validate: Follows all rules
     - Output: Raw text only (no formatting)
     - Evidence: "workflow:message-generated"

  7. TOOLS.md#gac-execution
     - Tool: Bash
     - Command: gac "feat: add 'user auth' module"
     - Verify: Commit created successfully
     - Evidence: "tool:gac-executed"

  8. BUILDING-BETTER.md#post-commit-tracking
     - Update: SESSION.md with commit
     - Link: To current work folder
     - Track: What was included
     - Evidence: "context:commit-tracked"

Success Criteria:
  - All 8 templates consulted
  - Quotes properly formatted
  - Conventional commit format
  - No sensitive files committed

S:W:H:E Format:
  H:gac|E:8/"behavior:safe,tools:analyzed,matrix:feat,convention:quotes-valid,pattern:conventional,workflow:generated,tool:executed,context:tracked"
```

### Critical gac Rules (from CONVENTIONS.md)
1. **Quote Format**: `gac "message with 'single quotes' inside"`
2. **Never**: Double quotes inside the message
3. **Output**: When asked for message, give ONLY raw text
4. **Alias**: `gac='git add . && git commit -m'` 
5. **Safety**: Since it adds ALL files, extra validation needed

## Handler 3: create-component

### Current Implementation (WORKFLOWS.md)
```yaml
Handler: create-component
Triggers: "create a new component", "build component X"
Process:
  1. Extract component name
  2. Determine component type
  3. Create file with template
  4. Update exports
```

### Orchestrated Implementation
```yaml
Handler: create-component
Purpose: Orchestrate component creation across all templates
Triggers: "create a new component", "build component X"

Pre-execution Checks:
  - Component name extracted
  - Target location determinable

Orchestration Flow:
  1. MATRICES.md#component-type-matrix
     - Input: Component description
     - Matrix: Purpose → Type (functional/class/hook/provider)
     - Output: Component type and structure
     - Evidence: "matrix:type-functional"

  2. CONVENTIONS.md#component-naming
     - Input: Raw name from request
     - Apply: PascalCase, prefix/suffix rules
     - Validate: No conflicts
     - Evidence: "convention:name-valid-UserProfile"

  3. PATTERNS.md#component-creation-pattern
     - Input: Type from step 1
     - Pattern: functional-component-pattern
     - Template: Full component structure
     - Evidence: "pattern:functional-with-hooks"

  4. BEHAVIORS.md#before-creating-component
     - Check: Directory exists
     - Check: No naming conflicts
     - Check: Dependencies available
     - Gate: CANNOT PROCEED if issues
     - Evidence: "behavior:creation-checks-passed"

  5. BUILDING-BETTER.md#component-integration
     - Determine: Export strategy
     - Setup: Test file location
     - Plan: Documentation needs
     - Evidence: "integration:barrel-export"

  6. TOOLS.md#file-creation
     - Tool: Write for new file
     - Template: From pattern step 3
     - Execute: Create component file
     - Evidence: "tool:Write,file:UserProfile.tsx"

  7. WORKFLOWS.md#component-setup-flow
     - Create test file
     - Update barrel exports
     - Add to component index
     - Evidence: "workflow:fully-integrated"

  8. CONVENTIONS.md#component-structure
     - Validate: Final structure
     - Check: All conventions met
     - Evidence: "convention:structure-valid"

Success Criteria:
  - All 8 templates consulted (some twice)
  - Component created and integrated
  - Tests and exports updated

S:W:H:E Format:
  H:create-component|E:8/"matrix:functional,convention:UserProfile,pattern:hooks,behavior:passed,integration:barrel,tool:Write,workflow:complete,structure:valid"
```

## Implementation Notes

### Evidence Format
Each step produces evidence in format: `template:value`
- Keep evidence concise but traceable
- Show actual values not just "success"
- Build evidence string as you go

### Gate Enforcement
BEHAVIORS.md creates "cannot proceed" gates:
```
if (!behaviorCheck.passed) {
  return {
    error: "Cannot proceed: " + behaviorCheck.failureReason,
    evidence: evidenceSoFar
  };
}
```

### Template Dependencies
Some templates may reference others:
- PATTERNS.md might load patterns that reference CONVENTIONS.md
- WORKFLOWS.md might trigger BEHAVIORS.md checks
- This creates natural integration

### Performance Considerations
- Cache template sections after first load
- Parallel consultation where possible
- Skip irrelevant matrices based on context

## Next Steps

1. Implement these 3 orchestrated handlers
2. Test in real scenarios
3. Measure template utilization
4. Gather evidence examples
5. Refine based on results
6. Expand to more handlers if successful

## Success Metrics

1. **All templates used**: Each handler touches 6-8 templates
2. **Clear evidence**: Can trace what was consulted
3. **Natural flow**: Templates reference each other
4. **No skipping**: Cannot bypass required checks
5. **Better outcomes**: Fewer errors, more consistent results
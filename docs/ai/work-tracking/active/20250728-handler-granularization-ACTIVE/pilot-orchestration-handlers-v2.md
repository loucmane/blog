# Pilot Orchestration: 3 Handler Transformations (Accurate Version)

## Selected Handlers for Pilot
1. **edit-file** - File modification orchestration
2. **gac** - Git commit orchestration  
3. **create-component** - Component creation orchestration

## Handler 1: edit-file

### Current Implementation (TOOLS.md#edit-file)
```
Process:
1. Read file first (mandatory)
2. Use Serena ONLY for understanding
3. Use Edit/Write for actual changes
4. Verify changes
```

### Orchestrated Implementation
```yaml
Handler: edit-file
Purpose: Orchestrate safe file editing across all templates
Triggers: "change X to Y", "update Z", "modify file"

Orchestration Flow:
  1. BEHAVIORS.md#before-any-file-edit
     - TRIGGER: About to use Edit/Write/MultiEdit
     - ACTION: Check file-specific conventions
     - BLOCKS: Cannot edit until conventions checked
     - Evidence: "behavior:pre-edit-check"

  2. CONVENTIONS.md#file-specific-rules
     - Search: "[filename] conventions"
     - Example: "SESSION.md conventions" if editing SESSION.md
     - Check: Special rules, append-only sections
     - Evidence: "convention:rules-checked"

  3. TOOLS.md#file-understanding
     - Read file with Read tool
     - If code file: Use Serena find_symbol
     - If structure needed: Use get_symbols_overview
     - Evidence: "tools:file-understood"

  4. MATRICES.md#edit-decision-matrix
     - Input: File type + change type
     - Decision: Edit vs MultiEdit vs Write
     - Output: Tool selection
     - Evidence: "matrix:tool-selected-Edit"

  5. PATTERNS.md#safe-edit-pattern
     - Pattern: Read → Understand → Edit → Verify
     - Guards: Exact string matching
     - Recovery: If edit fails, try MultiEdit
     - Evidence: "pattern:safe-edit-applied"

  6. TOOLS.md#execute-edit
     - Tool: Selected from matrix (Edit/MultiEdit)
     - Execute: Apply changes
     - Verify: Changes applied correctly
     - Evidence: "tools:edit-executed"

  7. WORKFLOWS.md#post-edit-tasks
     - If test files exist: Note to run tests
     - If docs needed: Note to update
     - Track edit in work folder
     - Evidence: "workflow:post-edit-complete"

Success Criteria:
  - File successfully edited
  - Conventions followed
  - Changes verified

S:W:H:E Format:
  H:edit-file|E:7/"behavior:checked,convention:SESSION.md-rules,tools:understood,matrix:Edit,pattern:safe,tools:executed,workflow:complete"
```

## Handler 2: gac (git add . && commit)

### Current Implementation (CONVENTIONS.md#gac-format)
```
Critical Rules:
- gac='git add . && git commit -m'
- MUST use double quotes around message
- MUST use single quotes inside message
- Output ONLY raw text when asked
```

### Orchestrated Implementation
```yaml
Handler: gac
Purpose: Orchestrate safe gac usage with proper formatting
Triggers: "commit", "gac", "commit changes"

Orchestration Flow:
  1. BEHAVIORS.md#git-operations
     - Check: Git repo active
     - Check: Changes exist
     - Gate: Cannot proceed without changes
     - Evidence: "behavior:git-ready"

  2. TOOLS.md#analyze-changes
     - Run: git status
     - Run: git diff (if needed)
     - Understand: What files changed
     - Evidence: "tools:changes-analyzed"

  3. MATRICES.md#commit-type-matrix
     - Input: Changed files
     - Matrix: File type → Commit type
     - Output: feat/fix/docs/style/refactor/test/chore
     - Evidence: "matrix:type-feat"

  4. CONVENTIONS.md#gac-format
     - CRITICAL: Apply quote rules
     - Format: gac "type: message with 'single quotes'"
     - Never: Double quotes inside
     - Evidence: "convention:gac-formatted"

  5. PATTERNS.md#conventional-commit
     - Structure: type(scope): description
     - Scope: From context if clear
     - Description: Imperative mood
     - Evidence: "pattern:conventional"

  6. BEHAVIORS.md#before-commit-checklist
     - Check: No debug statements
     - Check: No console.logs
     - Check: No .env files
     - Evidence: "behavior:pre-commit-clean"

  7. TOOLS.md#execute-gac
     - Tool: Bash
     - Command: gac "feat: add 'auth module' to system"
     - Capture: Success/failure
     - Evidence: "tools:gac-executed"

  8. WORKFLOWS.md#post-commit
     - Update: SESSION.md progress
     - Track: In work folder CHANGELOG
     - Note: If push needed
     - Evidence: "workflow:tracked"

Success Criteria:
  - Commit created with proper format
  - No sensitive files committed
  - Tracking updated

S:W:H:E Format:
  H:gac|E:8/"behavior:ready,tools:analyzed,matrix:feat,convention:quotes,pattern:conventional,behavior:clean,tools:executed,workflow:tracked"
```

## Handler 3: create-component

### Current Implementation (WORKFLOWS.md#create-component)
```
Process:
1. Check existing patterns
2. Determine component type
3. Create component file(s)
4. Add imports/exports
5. Create basic tests
6. Update component index
```

### Orchestrated Implementation
```yaml
Handler: create-component
Purpose: Orchestrate component creation across all templates
Triggers: "create component", "new component X"

Orchestration Flow:
  1. BEHAVIORS.md#before-creating-new-files
     - Check: Component doesn't exist
     - Check: Valid location
     - Gate: Cannot create duplicates
     - Evidence: "behavior:can-create"

  2. TOOLS.md#check-existing
     - Search: Existing components
     - Tool: Serena find_symbol
     - Verify: No conflicts
     - Evidence: "tools:no-conflicts"

  3. MATRICES.md#component-type-matrix
     - Input: Component description
     - Matrix: Purpose → Type
     - Output: UI/Logic/Hybrid/Provider/Hook
     - Evidence: "matrix:type-UI"

  4. CONVENTIONS.md#component-naming
     - Rule: PascalCase for components
     - Rule: use prefix for hooks
     - Apply: Naming conventions
     - Evidence: "convention:name-Button"

  5. PATTERNS.md#component-patterns
     - Select: Pattern based on type
     - Template: Component structure
     - Includes: TypeScript, tests, exports
     - Evidence: "pattern:functional-component"

  6. TOOLS.md#create-files
     - Tool: Write for component file
     - Tool: Write for test file
     - Tool: Edit for barrel export
     - Evidence: "tools:files-created"

  7. WORKFLOWS.md#component-setup
     - Task: Update component index
     - Task: Add to exports
     - Task: Document if complex
     - Evidence: "workflow:fully-integrated"

  8. BUILDING-BETTER.md#component-integration
     - Consider: State management needs
     - Consider: API connections
     - Document: Integration points
     - Evidence: "integration:documented"

Success Criteria:
  - Component created with tests
  - Follows project patterns
  - Properly exported

S:W:H:E Format:
  H:create-component|E:8/"behavior:can-create,tools:verified,matrix:UI,convention:Button,pattern:functional,tools:created,workflow:integrated,integration:complete"
```

## Key Corrections Made

### 1. Based on Actual Templates
- Checked real handler definitions
- Used actual behavior triggers
- Referenced correct conventions

### 2. Realistic Orchestration
- BEHAVIORS.md provides gates/checks
- TOOLS.md shows actual tool usage
- CONVENTIONS.md has specific rules
- MATRICES.md for decisions (even if not yet created)

### 3. Evidence Format
- More specific evidence values
- Shows actual decisions made
- Traceable through templates

### 4. Natural Flow
- Templates reference each other naturally
- Not forced connections
- Based on actual needs

## Implementation Notes

### Template Gaps to Fill
1. **MATRICES.md** needs these matrices:
   - Edit Decision Matrix (file type → tool)
   - Commit Type Matrix (changes → type)
   - Component Type Matrix (purpose → type)

2. **PATTERNS.md** needs these patterns:
   - safe-edit-pattern
   - conventional-commit
   - component-patterns (by type)

3. **BEHAVIORS.md** already has most gates needed

### Success Metrics
1. Each handler uses 7-8 templates naturally
2. Evidence shows real orchestration
3. Gates prevent common errors
4. Templates work together

## Next Steps
1. Implement these orchestrated handlers
2. Create missing matrices/patterns
3. Test with real scenarios
4. Measure improvement in consistency
5. Expand if successful
# Template Extraction Strategy

## Overview
Extract reusable template components while preserving project-specific elements.

## Core Templates (Portable)

### Essential Files
Location: `.claude/templates/`

1. **CLAUDE.md** (partial extraction)
   - Execution engine logic
   - Handler routing system
   - ULTRATHINK protocol
   - Remove: Project-specific paths, git info

2. **REGISTRY.md** (full extraction)
   - All handler definitions
   - Navigation matrix
   - Add: Custom handler section

3. **WORKFLOWS.md** (full extraction)
   - Development workflows
   - Testing patterns
   - Handler examples

4. **TOOLS.md** (full extraction)
   - Tool selection guide
   - Usage patterns
   - Best practices

5. **CONVENTIONS.md** (partial extraction)
   - General conventions
   - Work tracking rules
   - Add: Project override section

6. **PATTERNS.md** (full extraction)
   - Meta routing patterns
   - Ambiguous handling
   - Decision trees

7. **BUILDING-BETTER.md** (full extraction)
   - Extension guide
   - Handler creation
   - Integration patterns

8. **MATRICES.md** (full extraction)
   - Decision matrices
   - Quick lookups
   - Error recovery

9. **BEHAVIORS.md** (full extraction)
   - Behavioral hooks
   - Enforcement gates
   - Cannot-proceed rules

10. **USER-GUIDE.md** (full extraction)
    - User documentation
    - Common patterns
    - Troubleshooting

## Project-Specific (Not Extracted)

### Stays in Project
- SESSION.md / sessions/
- Work tracking folders
- Project memories
- CHANGELOG.md
- HANDOFF.md
- Custom handlers
- Project-specific docs

## Customization Points

### 1. Project Info Block
```markdown
## PROJECT INFO (Customize This)
- **Project**: [Your Project Name]
- **Type**: [Web App / CLI / Library]
- **Language**: [TypeScript / Python / etc]
- **Framework**: [React / Django / etc]
```

### 2. Custom Handlers Section
```markdown
## CUSTOM HANDLERS (Project-Specific)
Add your project's unique handlers here...
```

### 3. Override Conventions
```markdown
## PROJECT CONVENTIONS (Overrides)
Your project's specific rules...
```

## Extraction Process

1. **Identify Dependencies**
   - Find project references
   - Mark for removal/generalization
   
2. **Create Generic Versions**
   - Replace specific with placeholders
   - Add customization hooks
   
3. **Test Portability**
   - Try in fresh project
   - Verify all handlers work
   - Check search/navigation

4. **Package for Distribution**
   - Clean template folder
   - Installation scripts
   - Documentation

## Success Criteria
- Zero project-specific references
- All handlers remain functional
- Clear customization points
- Works in multiple project types
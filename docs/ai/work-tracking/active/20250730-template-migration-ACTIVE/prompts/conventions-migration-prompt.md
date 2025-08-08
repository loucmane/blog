# CONVENTIONS.md Migration - Detailed Instructions

## File Overview
- **Location**: `.claude/templates/CONVENTIONS.md`
- **Size**: ~1,500 lines
- **Status**: Handlers already migrated
- **Task**: Extract all convention documentation into modular format

## 🚨 CRITICAL PATH REQUIREMENTS 🚨

ALL modules MUST be created under:
`/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/conventions/`

NOT under:
- ❌ `.claude/conventions/` (WRONG - missing templates/)
- ❌ `.claude/templates/` (WRONG - missing conventions/)
- ✅ `.claude/templates/conventions/` (CORRECT)

## Content Map to Extract

### 1. Naming Conventions (estimate lines 50-250)
**Extract to**: `conventions/naming/`
- `files.md` - File naming conventions (SESSION.md, TRACKER.md, etc.)
- `variables.md` - Variable naming standards
- `functions.md` - Function naming patterns
- Include examples and anti-patterns

### 2. File Organization (estimate lines 250-450)
**Extract to**: `conventions/files/`
- `organization.md` - General file organization
- `special-files.md` - SESSION.md, TRACKER.md, HANDOFF.md rules
- `directory-structure.md` - Project structure conventions

### 3. Git Conventions (estimate lines 450-650)
**Extract to**: `conventions/git/`
- `commit-format.md` - gac format and emoji usage
- `branch-naming.md` - Branch naming conventions
- `pr-conventions.md` - Pull request format

### 4. Code Style (estimate lines 650-850)
**Extract to**: `conventions/code-style/`
- `javascript.md` - JS specific conventions
- `typescript.md` - TS specific conventions
- `general.md` - Language-agnostic style

### 5. Documentation Standards (estimate lines 850-1050)
**Extract to**: `conventions/docs/`
- `documentation-standards.md` - General doc format
- `comment-format.md` - Code comment conventions
- `readme-format.md` - README standards

### 6. Testing Conventions (estimate lines 1050-1200)
**Extract to**: `conventions/testing/`
- `test-naming.md` - Test file and function naming
- `test-structure.md` - Test organization

### 7. Work Tracking (estimate lines 1200-1350)
**Extract to**: `conventions/work-tracking/`
- `folder-structure.md` - Work folder format (YYYYMMDD-name-STATUS)
- `tracker-format.md` - TRACKER.md format and sections
- `handoff-format.md` - HANDOFF.md format

### 8. Timestamps (estimate lines 1350-1500)
**Extract to**: `conventions/timestamps/`
- `format-rules.md` - ISO 8601 and other formats
- `usage-patterns.md` - When and where to use timestamps

### 9. Handler Definitions (if any remain)
**DO NOT EXTRACT** - Already migrated
**DO ADD NOTE**: `[Handler: handler-name migrated to handlers/role/domain/handler-name.md]`

## Module Format Template

```yaml
---
id: unique-module-id
type: convention
category: [naming|files|git|code-style|docs|testing|work-tracking|timestamps]
title: Module Title
applies_to: [files|code|documentation|all]
enforcement: [required|recommended|optional]
dependencies:
  - related conventions
version: 1.0.0
status: stable
---

# Module Title

## Convention
[Clear statement of the convention]

## Examples
[Good examples following the convention]

## Anti-patterns
[What NOT to do]

## Rationale
[Why this convention exists]
```

## New CONVENTIONS.md Index Structure

```markdown
# Development Conventions & Standards

This file has been modularized. All conventions are now in `.claude/templates/conventions/`

## 📁 Module Organization

### Naming Conventions
- [File Naming](conventions/naming/files.md) - File naming standards
- [Variable Naming](conventions/naming/variables.md) - Variable conventions
- [Function Naming](conventions/naming/functions.md) - Function standards

### File Organization
- [General Organization](conventions/files/organization.md) - File structure
- [Special Files](conventions/files/special-files.md) - SESSION.md, TRACKER.md
- [Directory Structure](conventions/files/directory-structure.md) - Project layout

### Git Conventions
- [Commit Format](conventions/git/commit-format.md) - gac format
- [Branch Naming](conventions/git/branch-naming.md) - Branch standards
- [PR Conventions](conventions/git/pr-conventions.md) - PR format

### Code Style
- [JavaScript](conventions/code-style/javascript.md) - JS conventions
- [TypeScript](conventions/code-style/typescript.md) - TS conventions
- [General](conventions/code-style/general.md) - Universal style

### Documentation
- [Standards](conventions/docs/documentation-standards.md) - Doc format
- [Comments](conventions/docs/comment-format.md) - Comment style
- [README](conventions/docs/readme-format.md) - README format

### Testing
- [Test Naming](conventions/testing/test-naming.md) - Test conventions
- [Test Structure](conventions/testing/test-structure.md) - Test organization

### Work Tracking
- [Folder Structure](conventions/work-tracking/folder-structure.md) - Work folders
- [TRACKER Format](conventions/work-tracking/tracker-format.md) - Tracker standards
- [HANDOFF Format](conventions/work-tracking/handoff-format.md) - Handoff format

### Timestamps
- [Format Rules](conventions/timestamps/format-rules.md) - Timestamp formats
- [Usage Patterns](conventions/timestamps/usage-patterns.md) - When to use

## Handler Migration Notice
All handlers have been migrated to `.claude/templates/handlers/`
```

## Validation Checklist

- [ ] All convention documentation extracted
- [ ] No handlers re-migrated
- [ ] Enforcement levels specified
- [ ] Examples and anti-patterns included
- [ ] All cross-references updated
- [ ] Module format followed
- [ ] Index file created (<100 lines)
- [ ] No content lost
- [ ] All paths use `.claude/templates/conventions/`

## Output

1. Create all modules in appropriate directories
2. Update CONVENTIONS.md to slim index
3. Create migration report: `migration-report-conventions-20250808.md`

Report should include:
- Sections extracted with line numbers
- Modules created with sizes
- Any consolidation performed
- Any issues or decisions made
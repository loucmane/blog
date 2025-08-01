# Handler Validation Report - CONVENTIONS.md

**Validation Timestamp**: 2025-08-01T15:35:00+02:00  
**Source File**: CONVENTIONS.md  
**Validator**: handler-validator agent  
**Scope**: Batch migration validation  

## Executive Summary

- **Total handlers validated**: 17
- **Passed**: 0 ❌
- **Failed**: 17 ❌
- **Critical Issues**: 2 categories affecting all handlers
- **Overall Status**: FAILED - Critical issues require resolution before deployment

## Critical Issues (Must Fix)

### 1. Incorrect Triggers Field Usage
**Severity**: CRITICAL  
**Handlers Affected**: All 17 handlers  
**Issue**: Non-trigger role handlers (operators and orchestrators) have `triggers` field in frontmatter

**Root Cause**: The migration process incorrectly copied triggers field to all handler types, but according to the validation specification:
- **trigger role**: MUST have non-empty triggers array
- **operator role**: MUST NOT have triggers field
- **orchestrator role**: MUST NOT have triggers field

**Impact**: 
- Violates handler specification
- Could cause routing confusion
- Breaks semantic distinction between handler roles

**Resolution**: Remove the entire `triggers:` field (including array) from all operator and orchestrator handlers:

**Affected Handlers**:
- **Operators (11)**: verify-claim, gather-evidence, cite-source, check-naming, suggest-name, validate-path, check-style, format-code, review-patterns, check-commit-msg, suggest-commit-type, check-docs-needed, validate-comments
- **Orchestrators (4)**: session-start, resolve-session-void, check-conventions-first, enforce-pre-flight

### 2. Invalid Tool Names
**Severity**: CRITICAL  
**Handlers Affected**: 15 handlers  
**Issue**: Handlers use simplified 'Serena' instead of proper MCP tool names

**Root Cause**: The migration used 'Serena' as shorthand, but the validation specification requires valid MCP tool names.

**Current Invalid Usage**:
```yaml
tools:
  - Serena
```

**Required Fix Options**:
```yaml
tools:
  - mcp__serena__search_for_pattern  # For code search
  - mcp__serena__extract_symbols     # For symbol extraction
  - Read                             # For file reading
  - Grep                             # For text search
```

**Affected Handlers**: All except session-start and one other handler with valid tools.

## Validation Details by Handler

### Operators - Analysis Domain (3 handlers)

#### verify-claim
- **Location**: `handlers/operators/analysis/verify-claim.md`
- **Status**: FAIL ❌
- **Issues**: 
  - Triggers field present (should be removed)
  - Invalid tool: 'Serena' (should be MCP tool names)
- **Structure**: Valid frontmatter, correct location

#### gather-evidence  
- **Location**: `handlers/operators/analysis/gather-evidence.md`
- **Status**: FAIL ❌
- **Issues**: Same as verify-claim

#### cite-source
- **Location**: `handlers/operators/analysis/cite-source.md`
- **Status**: FAIL ❌  
- **Issues**: Same as verify-claim

### Operators - Development Domain (5 handlers)

#### check-naming
- **Location**: `handlers/operators/development/check-naming.md`
- **Status**: FAIL ❌
- **Issues**: Triggers field + invalid Serena tool

#### suggest-name
- **Location**: `handlers/operators/development/suggest-name.md`
- **Status**: FAIL ❌
- **Issues**: Triggers field + invalid Serena tool

#### check-style
- **Location**: `handlers/operators/development/check-style.md`
- **Status**: FAIL ❌
- **Issues**: Triggers field + invalid Serena tool

#### format-code
- **Location**: `handlers/operators/development/format-code.md`
- **Status**: FAIL ❌
- **Issues**: Triggers field + invalid Serena tool

#### review-patterns
- **Location**: `handlers/operators/development/review-patterns.md`
- **Status**: FAIL ❌
- **Issues**: Triggers field + invalid Serena tool

### Operators - File Domain (1 handler)

#### validate-path
- **Location**: `handlers/operators/file/validate-path.md`
- **Status**: FAIL ❌
- **Issues**: Triggers field + invalid Serena tool

### Operators - Git Domain (2 handlers)

#### check-commit-msg
- **Location**: `handlers/operators/git/check-commit-msg.md`
- **Status**: FAIL ❌
- **Issues**: Triggers field + invalid Serena tool

#### suggest-commit-type
- **Location**: `handlers/operators/git/suggest-commit-type.md`
- **Status**: FAIL ❌
- **Issues**: Triggers field + invalid Serena tool

### Operators - Docs Domain (2 handlers)

#### check-docs-needed
- **Location**: `handlers/operators/docs/check-docs-needed.md`
- **Status**: FAIL ❌
- **Issues**: Triggers field + invalid Serena tool

#### validate-comments
- **Location**: `handlers/operators/docs/validate-comments.md`
- **Status**: FAIL ❌
- **Issues**: Triggers field + invalid Serena tool

### Orchestrators (4 handlers)

#### session-start
- **Location**: `handlers/orchestrators/session-start.md`
- **Status**: FAIL ❌
- **Issues**: Triggers field present (orchestrators should not have triggers)
- **Note**: Tools are valid (date, git)

#### resolve-session-void
- **Location**: `handlers/orchestrators/resolve-session-void.md`
- **Status**: FAIL ❌
- **Issues**: Triggers field + invalid Serena tool

#### check-conventions-first
- **Location**: `handlers/orchestrators/check-conventions-first.md`
- **Status**: FAIL ❌
- **Issues**: Triggers field + invalid Serena tool

#### enforce-pre-flight
- **Location**: `handlers/orchestrators/enforce-pre-flight.md`
- **Status**: FAIL ❌
- **Issues**: Triggers field + invalid Serena tool

## What Passed Validation

✅ **YAML Syntax**: All 17 handlers have valid YAML frontmatter  
✅ **Required Fields**: All handlers have required fields (id, name, role, domain, stability, tools, version)  
✅ **ID Matching**: All handler IDs match their filenames  
✅ **Role Values**: All role values are valid (trigger/operator/orchestrator)  
✅ **Domain Values**: All domain values are valid  
✅ **File Locations**: All handlers are in correct role/domain folder structure  
✅ **Version Format**: All versions follow N.N.N format  

## Impact Assessment

### Deployment Blocking Issues
- **Cannot deploy**: All 17 handlers fail validation
- **Routing will fail**: Invalid triggers configuration could break handler selection
- **Tool execution will fail**: Invalid tool names will cause runtime errors

### Migration Status
- **Structure Migration**: ✅ Complete and correct
- **Content Migration**: ✅ Content properly extracted
- **Frontmatter Migration**: ❌ Critical issues in metadata

## Recommended Actions (Priority Order)

### 1. IMMEDIATE - Fix Critical Issues
**Estimated Time**: 30 minutes

**Step 1: Remove Triggers from Non-Trigger Handlers**
```bash
# Remove triggers field from all operators and orchestrators
for file in handlers/operators/**/*.md handlers/orchestrators/*.md; do
  # Remove lines 7-10 (triggers field and array)
  sed -i '7,10d' "$file"
done
```

**Step 2: Fix Tool Names**
Replace 'Serena' with appropriate MCP tools in each handler based on usage:
- Code search operations → `mcp__serena__search_for_pattern`
- Symbol extraction → `mcp__serena__extract_symbols` 
- File operations → `Read`, `Write`, `Edit`
- Text search → `Grep`

### 2. VALIDATION - Re-run Validation
**Estimated Time**: 5 minutes

Run handler-validator again to confirm all issues resolved.

### 3. TESTING - Integration Test
**Estimated Time**: 15 minutes

Run integration tests to ensure handlers work with corrected metadata.

## Files Requiring Updates

**All 17 handlers in these locations**:
```
handlers/operators/analysis/verify-claim.md
handlers/operators/analysis/gather-evidence.md
handlers/operators/analysis/cite-source.md
handlers/operators/development/check-naming.md
handlers/operators/development/suggest-name.md
handlers/operators/file/validate-path.md
handlers/operators/development/check-style.md
handlers/operators/development/format-code.md
handlers/operators/development/review-patterns.md
handlers/operators/git/check-commit-msg.md
handlers/operators/git/suggest-commit-type.md
handlers/orchestrators/session-start.md
handlers/orchestrators/resolve-session-void.md
handlers/operators/docs/check-docs-needed.md
handlers/operators/docs/validate-comments.md
handlers/orchestrators/check-conventions-first.md
handlers/orchestrators/enforce-pre-flight.md
```

## Lessons Learned

1. **Role-Based Validation**: Need clearer validation rules for different handler roles
2. **Tool Name Standards**: Establish clear mapping from logical tools to MCP tool names
3. **Migration Validation**: Run validation immediately after migration to catch systematic issues
4. **Template Consistency**: Ensure source templates follow the same standards as target structure

---

**Next Steps**: Fix critical issues and re-validate before proceeding with deployment pipeline.

**Reports Generated**:
- JSON Report: `.claude/staging/reports/CONVENTIONS-validation.json`
- Markdown Report: `.claude/agent-outputs/handler-validator/CONVENTIONS-validation-report-20250801.md`
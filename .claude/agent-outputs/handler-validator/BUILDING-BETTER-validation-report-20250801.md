# Handler Validation Report: BUILDING-BETTER.md

**Validation Date**: 2025-08-01 16:10:00+02:00  
**Source File**: BUILDING-BETTER.md  
**Validator**: handler-validator agent  
**Scope**: Batch validation of 6 handlers from BUILDING-BETTER.md migration  

## Summary

- **Total handlers validated**: 6
- **Passed**: 0 ✗
- **Failed**: 6 ✗
- **Warnings**: 0 ⚠️

**Overall Status**: ❌ FAILED - Critical issues found in all handlers

## Critical Issues (Must fix)

### 1. Role Constraint Violations
**Issue**: Non-trigger role handlers contain triggers field  
**Location**: All 6 handlers  
**Impact**: Violates role-based design constraints - operators and orchestrators should not have triggers  
**Fix**: Remove the `triggers:` field from YAML frontmatter in:
- `workflow-to-tool.md` (orchestrator)
- `tool-to-convention.md` (orchestrator) 
- `convention-to-workflow.md` (orchestrator)
- `save-context.md` (operator)
- `restore-context.md` (operator)
- `switch-context.md` (orchestrator)

### 2. Invalid MCP Tool Names
**Issue**: Tools field contains non-MCP tool names  
**Location**: All 6 handlers  
**Impact**: Handlers cannot execute - tools don't exist in MCP environment  
**Fix**: Replace conceptual tool names with valid MCP tools:

**Current Invalid Tools** → **Valid MCP Tools**
- `TOOLS.md tool selection` → `Read, Grep`
- `CONVENTIONS.md checks` → `Read, Grep`
- `correction workflow` → `Read, Edit, MultiEdit`
- `timestamp workflow` → `Read, Edit`
- `evidence gathering` → `Read, Grep, Glob`
- `work tracking files` → `Read, Edit, MultiEdit`
- `memory snapshot` → `Read, Edit`
- `work folder files` → `Read, Glob`
- `save-context` → `Read, Edit, MultiEdit`
- `load target context` → `Read, Glob`

### 3. Location Pattern Issues
**Issue**: File locations don't follow expected patterns  
**Location**: 4 handlers  
**Impact**: Inconsistent file organization, harder to maintain  
**Fix**: 
- Orchestrators should be in `handlers/orchestrators/` (currently correct)
- But domain-specific orchestrators could be in `handlers/orchestrators/[domain]/`
- Current locations are acceptable but need consistency decision

## Validation Details

### Handler: workflow-to-tool
**File**: `handlers/orchestrators/workflow-to-tool.md`  
**Status**: ❌ FAIL  

**Checks**:
- ✅ YAML valid
- ✅ Required fields present
- ✅ ID matches filename
- ✅ Role valid (orchestrator)
- ✅ Domain valid (workflow)
- ❌ Location correct (orchestrator location ambiguous)
- ❌ Triggers present (should not have triggers)
- ❌ Tools valid (invalid MCP tool names)
- ✅ Version format correct

**Errors**:
1. orchestrator role handlers should not have triggers field
2. tools contains invalid MCP tool name: 'TOOLS.md tool selection'
3. location pattern needs clarification for orchestrators

### Handler: tool-to-convention
**File**: `handlers/orchestrators/tool-to-convention.md`  
**Status**: ❌ FAIL  

**Checks**:
- ✅ YAML valid
- ✅ Required fields present
- ✅ ID matches filename
- ✅ Role valid (orchestrator)
- ✅ Domain valid (workflow)
- ❌ Location correct (orchestrator location ambiguous)
- ❌ Triggers present (should not have triggers)
- ❌ Tools valid (invalid MCP tool names)
- ✅ Version format correct

**Errors**:
1. orchestrator role handlers should not have triggers field
2. tools contains invalid MCP tool name: 'CONVENTIONS.md checks'
3. location pattern needs clarification for orchestrators

### Handler: convention-to-workflow
**File**: `handlers/orchestrators/convention-to-workflow.md`  
**Status**: ❌ FAIL  

**Checks**:
- ✅ YAML valid
- ✅ Required fields present
- ✅ ID matches filename
- ✅ Role valid (orchestrator)
- ✅ Domain valid (workflow)
- ❌ Location correct (orchestrator location ambiguous)
- ❌ Triggers present (should not have triggers)
- ❌ Tools valid (invalid MCP tool names)
- ✅ Version format correct

**Errors**:
1. orchestrator role handlers should not have triggers field
2. tools contains invalid MCP tool names: 'correction workflow', 'timestamp workflow', 'evidence gathering'
3. location pattern needs clarification for orchestrators

### Handler: save-context
**File**: `handlers/operators/session/save-context.md`  
**Status**: ❌ FAIL  

**Checks**:
- ✅ YAML valid
- ✅ Required fields present
- ✅ ID matches filename
- ✅ Role valid (operator)
- ✅ Domain valid (session)
- ✅ Location correct (follows operators/domain pattern)
- ❌ Triggers present (should not have triggers)
- ❌ Tools valid (invalid MCP tool names)
- ✅ Version format correct

**Errors**:
1. operator role handlers should not have triggers field
2. tools contains invalid MCP tool names: 'work tracking files', 'memory snapshot'

### Handler: restore-context
**File**: `handlers/operators/session/restore-context.md`  
**Status**: ❌ FAIL  

**Checks**:
- ✅ YAML valid
- ✅ Required fields present
- ✅ ID matches filename
- ✅ Role valid (operator)
- ✅ Domain valid (session)
- ✅ Location correct (follows operators/domain pattern)
- ❌ Triggers present (should not have triggers)
- ❌ Tools valid (invalid MCP tool names)
- ✅ Version format correct

**Errors**:
1. operator role handlers should not have triggers field
2. tools contains invalid MCP tool name: 'work folder files'

### Handler: switch-context
**File**: `handlers/orchestrators/switch-context.md`  
**Status**: ❌ FAIL  

**Checks**:
- ✅ YAML valid
- ✅ Required fields present
- ✅ ID matches filename
- ✅ Role valid (orchestrator)
- ❌ Domain valid (session domain in orchestrators directory)
- ❌ Location correct (domain mismatch)
- ❌ Triggers present (should not have triggers)
- ❌ Tools valid (invalid MCP tool names)
- ✅ Version format correct

**Errors**:
1. orchestrator role handlers should not have triggers field
2. tools contains invalid MCP tool names: 'save-context', 'load target context'
3. domain 'session' does not match location 'handlers/orchestrators/'
4. location should be handlers/orchestrators/ but domain suggests session-specific

## Recommended Actions

### Immediate Priority (Blockers)

1. **Remove triggers fields from all non-trigger handlers**:
   ```bash
   # Remove lines 7-8 from workflow-to-tool.md
   # Remove lines 7-8 from tool-to-convention.md  
   # Remove lines 7-8 from convention-to-workflow.md
   # Remove lines 7-10 from save-context.md
   # Remove lines 7-10 from restore-context.md
   # Remove lines 7-10 from switch-context.md
   ```

2. **Replace all invalid tool names with valid MCP tools**:
   ```yaml
   # Example for workflow-to-tool.md:
   tools:
     - Read
     - Grep
     - Edit
   
   # Example for save-context.md:
   tools:
     - Read
     - Edit
     - MultiEdit
     - Glob
   ```

### Medium Priority (Improvements)

3. **Clarify orchestrator location pattern**:
   - Decision needed: domain-specific vs cross-domain orchestrators
   - Current locations are acceptable but need consistency
   - Document the chosen pattern in migration guidelines

4. **Update migration process**:
   - Add validation rules to prevent these issues
   - Create mapping from conceptual tools to MCP tools
   - Add role constraint checking during extraction

### Low Priority (Enhancements)

5. **Improve documentation**:
   - Add examples of valid vs invalid tool names
   - Document role constraints more clearly
   - Create handler creation checklist

## Files Analyzed

1. `/home/loucmane/dev/javascript/MomsBlog/blog/.claude/staging/handlers/orchestrators/workflow-to-tool.md`
2. `/home/loucmane/dev/javascript/MomsBlog/blog/.claude/staging/handlers/orchestrators/tool-to-convention.md`
3. `/home/loucmane/dev/javascript/MomsBlog/blog/.claude/staging/handlers/orchestrators/convention-to-workflow.md`
4. `/home/loucmane/dev/javascript/MomsBlog/blog/.claude/staging/handlers/operators/session/save-context.md`
5. `/home/loucmane/dev/javascript/MomsBlog/blog/.claude/staging/handlers/operators/session/restore-context.md`
6. `/home/loucmane/dev/javascript/MomsBlog/blog/.claude/staging/handlers/orchestrators/switch-context.md`

## Next Steps

1. Fix all critical issues identified above
2. Re-run validation to confirm fixes
3. Update migration state with corrected validation status
4. Consider establishing validation rules to prevent these issues
5. Document lessons learned for future handler migrations

---

**Validation Complete**: All 6 handlers from BUILDING-BETTER.md have been validated with critical issues identified. Immediate fixes required before deployment.
# Migration Commands Reference

## Current Migration Status
- **Completed**: TOOLS.md (18 handlers)
- **Remaining**: WORKFLOWS.md (~25), CONVENTIONS.md (~15), PATTERNS.md (~8), BUILDING-BETTER.md (~3)

## Phase 1: Complete Migration

### Migrate Remaining Files
```bash
# WORKFLOWS.md - Largest file
/agent template-migrator "Extract all handlers from .claude/templates/WORKFLOWS.md and migrate to staging"

# CONVENTIONS.md
/agent template-migrator "Extract all handlers from .claude/templates/CONVENTIONS.md and migrate to staging"

# PATTERNS.md
/agent template-migrator "Extract all handlers from .claude/templates/PATTERNS.md and migrate to staging"

# BUILDING-BETTER.md
/agent template-migrator "Extract all handlers from .claude/templates/BUILDING-BETTER.md and migrate to staging"
```

## Phase 2: Create Missing Handlers

### Critical Missing Handlers
```bash
/agent handler-creator "Create fix-bug handler - user says 'fix bug X' or 'bug in Y'"
/agent handler-creator "Create debug-issue handler - user says 'debug this' or 'why is X failing'"
/agent handler-creator "Create explain-code handler - user says 'explain this code' or 'how does X work'"
/agent handler-creator "Create code-review handler - user says 'review this code' or 'check for issues'"
/agent handler-creator "Create optimize-code handler - user says 'optimize this' or 'make this faster'"
/agent handler-creator "Create create-docs handler - user says 'document this' or 'create docs for X'"
```

## Phase 3: Validation Suite

### Full Validation
```bash
# Structure validation
/agent handler-validator "Validate all handlers in .claude/staging/handlers/"

# Security check
/agent security-validator "Check all handlers in .claude/staging/handlers/ for security issues"

# Integration testing
/agent integration-tester "Test handler connections and dependencies in staging"

# Version check
/agent version-controller "Add version metadata to all handlers in staging"
```

## Phase 4: Optimization

### Pattern Extraction
```bash
# Create shared patterns
/agent template-optimizer "Create shared pattern files in .claude/staging/handlers/shared/"

# Consolidate Serena patterns
/agent template-optimizer "Consolidate Serena usage patterns across all handlers"

# Standardize tool selection
/agent template-optimizer "Standardize tool selection keywords to PRIMARY/FALLBACK/ALWAYS/NEVER"
```

## Phase 5: Pre-Cutover Verification

### Final Checks
```bash
# Dependency validation
/agent template-scanner "Scan .claude/staging/handlers/ for broken references"

# Performance check
/agent performance-analyzer "Measure search performance in staging vs production"
```
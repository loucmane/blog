# Template Migration Workflow

## Overview
A safe, staged approach to migrating the template system from monolithic files to the new folder-based structure without disrupting the live system.

## Core Principle
**Never modify live files** - All work happens in staging until explicitly approved.

## Migration Pipeline

```
SCAN → MAP → EXTRACT → TRANSFORM → STAGE → VALIDATE → OPTIMIZE → TEST → REVIEW → ACTIVATE
  ↑      ↓
  └──────┘ (Scanner creates map used by all other agents)
```

## Staging Directory Structure

```bash
.claude/staging/
├── handlers/
│   ├── triggers/       # User-facing handlers
│   ├── orchestrators/  # Workflow coordinators
│   └── operators/      # Atomic operations
├── reports/
│   ├── migration-report.md
│   ├── validation-results.md
│   ├── optimization-recommendations.md
│   └── system-map.json
└── backups/
    └── original-templates/
```

## Agent Pipeline

### Phase 1: Analysis (No Changes)
1. **template-scanner** - Creates comprehensive system map
   - Dependency graph
   - Trigger mappings
   - Execution flows
   - Orphaned handlers
   - Circular dependencies

### Phase 2: Migration (To Staging)
2. **template-migrator** - Extracts and transforms handlers
   - Uses system map for safe migration
   - Preserves all connections
   - Generates YAML frontmatter
   - Places in correct folders

### Phase 3: Validation (In Staging)
3. **handler-validator** - Checks each migrated handler
   - Syntax validation
   - Frontmatter completeness
   - Connection integrity
   - Cross-references

4. **integration-tester** - Tests handler interactions
   - Validates dependencies work
   - Tests trigger routing
   - Checks execution flows

### Phase 4: Optimization (Recommendations Only)
5. **template-optimizer** - Analyzes for improvements
   - Identifies redundancies
   - Suggests consolidations
   - Finds unused handlers
   - Proposes abstractions

### Phase 5: Review & Activation
6. **agent-coordinator** - Orchestrates the workflow
   - Generates comprehensive reports
   - Requires explicit approval
   - Manages activation process

## Usage Commands

### Step 1: Initial Analysis
```bash
# Create system map first
"Use template-scanner to analyze the entire template system"

# Review the map
"Show me the system dependency graph and any issues found"
```

### Step 2: Test Migration
```bash
# Test with one handler
"Use template-migrator to migrate edit-file handler to staging"

# Validate the test
"Use handler-validator to check the staged edit-file handler"
```

### Step 3: Full Migration
```bash
# Migrate entire template file
"Use template-migrator to migrate all handlers from TOOLS.md to staging"

# Validate all migrated handlers
"Use handler-validator to check all handlers in staging"

# Test interactions
"Use integration-tester to verify handler connections in staging"
```

### Step 4: Optimization
```bash
# Get recommendations
"Use template-optimizer to analyze staged handlers for improvements"

# Review suggestions
"Show optimization report with specific recommendations"
```

### Step 5: Final Review
```bash
# Generate comprehensive report
"Create migration report with validation results and optimization recommendations"

# Review before activation
"Show me what will change if we activate the staged handlers"
```

## Safety Features

1. **Original Files Untouched** - All work in `.claude/staging/`
2. **Comprehensive Reports** - Full visibility before changes
3. **Validation Gates** - Must pass before proceeding
4. **Explicit Approval** - No automatic activation
5. **Rollback Ready** - Original structure preserved
6. **Incremental Testing** - Start small, expand gradually

## Output Artifacts

### System Map (template-scanner)
```json
{
  "handlers": {
    "edit-file": {
      "location": "TOOLS.md#edit-file",
      "type": "operator",
      "triggers": ["edit", "modify", "change"],
      "dependencies": ["read-file", "serena-tools"],
      "referenced_by": ["update-component", "refactor-code"]
    }
  },
  "execution_flows": [...],
  "orphaned_handlers": [...],
  "circular_dependencies": [...]
}
```

### Migration Report (template-migrator)
```markdown
## Migration Summary
- Total handlers processed: 69
- Successfully migrated: 67
- Failed: 2 (details below)
- Warnings: 5

## Handler Distribution
- Triggers: 23
- Orchestrators: 18
- Operators: 28
```

### Validation Report (handler-validator)
```markdown
## Validation Results
- Total validated: 67
- Passed: 65
- Failed: 2
- Warnings: 12
```

## When to Use This Workflow

1. **Major Template Restructuring** - Moving to folder structure
2. **System Optimization** - Finding and fixing redundancies
3. **Documentation Generation** - Creating system maps
4. **Impact Analysis** - Before making changes
5. **System Health Check** - Regular maintenance

## Integration with Existing Workflow

This migration workflow integrates with the existing template system by:
- Preserving all current functionality
- Maintaining S:W:H:E compliance
- Respecting existing handlers
- Enabling gradual transition
- Providing rollback capability

## Next Steps

1. Create staging directory structure
2. Run template-scanner for initial analysis
3. Review system map for issues
4. Plan migration based on dependencies
5. Execute staged migration
6. Validate and test thoroughly
7. Get approval before activation
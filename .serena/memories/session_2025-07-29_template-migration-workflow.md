# Template Migration Workflow Design

## Session Overview
Designed comprehensive migration workflow for moving templates from monolithic to folder structure using staged approach with no live file modifications.

## Key Innovation: Template Scanner
Created template-scanner agent - the "cartographer" that creates system maps all other agents need. This was a critical gap identified during discussion about how agents would know dependencies.

## Migration Pipeline
SCAN → MAP → EXTRACT → TRANSFORM → STAGE → VALIDATE → OPTIMIZE → TEST → REVIEW → ACTIVATE

Key principle: All work happens in `.claude/staging/` until explicitly approved.

## Staging Structure
```
.claude/staging/
├── handlers/
│   ├── triggers/
│   ├── orchestrators/
│   └── operators/
├── reports/
└── backups/
```

## Agent Workflow
1. **template-scanner** - Creates dependency graph, trigger mappings, execution flows
2. **template-migrator** - Extracts handlers to staging
3. **handler-validator** - Validates each handler
4. **template-optimizer** - Analyzes for improvements
5. **integration-tester** - Tests connections
6. **agent-coordinator** - Orchestrates workflow

## Documentation Created
- TEMPLATE-MIGRATION-WORKFLOW.md - Complete workflow guide
- Updated AGENT-REGISTRY.md with scanner and workflow
- Updated DECISIONS.md with staging approach rationale

## Safety Features
- Original files untouched
- Comprehensive reports before changes
- Validation gates at each step
- Explicit approval required
- Rollback capability
- Incremental testing

## Current Agent Count
16 total agents:
- 8 Core Template Management (added template-scanner)
- 4 Analysis & Optimization
- 3 Documentation & Testing
- 1 Workflow Coordination

## Next Priority
1. Create staging directory structure
2. Run template-scanner for initial system map
3. Test migration with small batch
4. Create security-validator and version-controller agents
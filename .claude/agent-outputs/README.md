# Agent Output Directory Structure

This directory contains outputs from all template system agents. Each agent has its own subfolder to keep outputs organized.

## Directory Structure

```
.claude/agent-outputs/
├── README.md (this file)
├── template-migrator/
│   ├── migration-mapping.md     # Tracks all handler migrations
│   └── reports/                 # Migration reports
├── trigger-router/
│   └── routing-{timestamp}.md   # Routing decisions (if saved)
├── swhe-enforcer/
│   └── compliance-report-{timestamp}.md
├── orchestration-conductor/
│   └── workflow-{timestamp}.md  # Complete workflow logs
├── handler-validator/
│   └── validation-report-{handler-id}-{timestamp}.md
├── operator-executor/
│   └── operation-{operator-name}-{timestamp}.md
└── handler-creator/
    └── creation-log-{handler-name}-{timestamp}.md
```

## Agent File Creation Summary

### Files Created in Template Directories
- **handler-creator**: Creates handlers at `.claude/templates/handlers/[role]/[handler-name].md`
- **template-migrator**: Creates handlers at `.claude/templates/handlers/[type]/[domain]/[handler-id].md`

### Files Created in Agent Output Directories
- **template-migrator**: Migration mapping and reports in its output folder
- **handler-validator**: Validation reports with issues and fixes
- **swhe-enforcer**: Compliance reports for S:W:H:E validation
- **orchestration-conductor**: Workflow execution logs
- **operator-executor**: Operation execution reports
- **trigger-router**: Routing decisions (optional)

### Files Created in Project Root
- **meta-agent**: Creates new agents at `.claude/agents/[agent-name].md`

## Timestamps

All timestamp formats should use: `YYYYMMDD-HHMMSS` for consistency.

## Notes

1. Agents should NEVER create files directly in `.claude/templates/` root
2. All reports and logs go in agent-specific output folders
3. Only handler files go in the template handler structure
4. Migration mapping stays centralized in template-migrator folder
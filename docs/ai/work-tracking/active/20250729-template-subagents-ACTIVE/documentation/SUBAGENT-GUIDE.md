# Template System Subagent Guide

## Overview

The template system uses 15 specialized subagents to manage, validate, optimize, and maintain the Claude Code template ecosystem. This guide explains how to use these agents effectively.

## Architecture

### Key Constraint: Orchestration Model

**Important**: Subagents cannot spawn other subagents. Claude (the main assistant) acts as the orchestrator, reading workflow definitions and executing agents in sequence.

```
User Request → Claude → Agent 1 → Result → Claude → Agent 2 → Final Result
```

## Agent Categories

### 1. Core Template Management (7 agents)
- **template-migrator**: Converts monolithic to folder structure
- **handler-creator**: Creates new handlers from requirements
- **trigger-router**: Routes requests to appropriate handlers
- **swhe-enforcer**: Validates S:W:H:E compliance
- **orchestration-conductor**: Manages complex workflows
- **handler-validator**: Validates handler syntax
- **operator-executor**: Executes atomic operations

### 2. Analysis & Optimization (4 agents)
- **template-optimizer**: Finds redundancy and optimization opportunities
- **claude-md-specialist**: Analyzes CLAUDE.md execution engine
- **performance-analyzer**: Monitors system performance
- **pattern-extractor**: Learns from usage patterns

### 3. Documentation & Testing (3 agents)
- **template-documenter**: Auto-generates documentation
- **integration-tester**: Tests handler interactions
- **template-debugger**: Debugs execution failures

### 4. Workflow Coordination (1 agent)
- **agent-coordinator**: Defines multi-agent workflows

## How to Use Subagents

### Method 1: Direct Request
```
"Use the handler-creator agent to create a new handler for user authentication"
```

### Method 2: Via Task Tool (in code)
```python
Task(
    description="Create new handler",
    prompt="Create a handler for user authentication with JWT",
    subagent_type="handler-creator"
)
```

### Method 3: Proactive Triggers
Agents marked "Use proactively" will be automatically suggested when their trigger conditions are met.

## Common Multi-Agent Workflows

### 1. Create and Validate Handler
```yaml
workflow: create-validated-handler
steps:
  1. handler-creator → Creates new handler
  2. handler-validator → Validates syntax
  3. template-documenter → Generates documentation
```

### 2. Full System Migration
```yaml
workflow: full-migration
steps:
  1. template-migrator → Migrates handlers
  2. handler-validator → Validates all handlers
  3. integration-tester → Tests interactions
  4. template-documenter → Updates documentation
```

### 3. System Optimization
```yaml
workflow: optimize-system
steps:
  1. template-optimizer → Finds redundancies
  2. pattern-extractor → Analyzes patterns
  3. performance-analyzer → Measures improvements
```

### 4. Debug Failed Execution
```yaml
workflow: debug-failure
steps:
  1. template-debugger → Traces execution
  2. swhe-enforcer → Checks compliance
  3. handler-validator → Verifies syntax
```

## Agent Output Structure

All agents save outputs to organized directories:
```
.claude/agent-outputs/
├── template-migrator/
│   ├── migration-mapping.md
│   └── reports/
├── trigger-router/
│   └── routing-{timestamp}.md
├── swhe-enforcer/
│   └── compliance-report-{timestamp}.md
├── [agent-name]/
│   └── [agent-specific-outputs]
```

## Best Practices

### 1. Agent Selection
- Choose the most specific agent for your task
- Use multi-agent workflows for complex operations
- Let Claude orchestrate when multiple agents are needed

### 2. Error Handling
- Agents will report errors in their output files
- Check agent outputs for detailed error information
- Use template-debugger when execution fails

### 3. Performance
- Large operations may take time
- Agents process systematically for thoroughness
- Check progress in agent output directories

### 4. Validation
- Always validate after creation or migration
- Use integration-tester for workflow testing
- Run swhe-enforcer for compliance checks

## Agent Triggers and Keywords

### Creation/Building
- "create handler", "build component", "generate template"
- → handler-creator, template-documenter

### Migration/Conversion
- "migrate to folders", "convert handlers", "extract templates"
- → template-migrator

### Validation/Testing
- "validate handler", "check syntax", "test integration"
- → handler-validator, integration-tester, swhe-enforcer

### Debugging/Analysis
- "debug failure", "trace execution", "analyze performance"
- → template-debugger, performance-analyzer, claude-md-specialist

### Optimization
- "optimize templates", "find redundancy", "extract patterns"
- → template-optimizer, pattern-extractor

## Workflow Definition Example

The agent-coordinator creates workflow definitions like:

```yaml
name: complete-handler-lifecycle
description: Full handler creation and deployment
triggers:
  - "create production-ready handler"
  - "build validated handler"
steps:
  - agent: handler-creator
    input: requirements
    output: handler_file
  - agent: handler-validator
    input: $handler_file
    output: validation_report
    on_failure: stop
  - agent: integration-tester
    input: $handler_file
    output: test_report
  - agent: template-documenter
    input: $handler_file
    output: documentation
success_criteria:
  - All validations pass
  - Tests complete successfully
  - Documentation generated
```

## Troubleshooting

### Agent Not Found
- Restart Claude Code after creating new agents
- Check agent name spelling
- Verify agent exists in `.claude/agents/`

### Agent Fails
- Check agent output directory for error logs
- Verify input format matches agent expectations
- Use template-debugger for complex issues

### Workflow Stops
- Check error_handling in workflow definition
- Review previous agent's output
- Manually continue with next agent if needed

## Future Enhancements

Planned agents not yet created:
- **security-validator**: Security checks for handlers
- **version-controller**: Template versioning
- **user-analytics**: Usage pattern analysis
- **agent-tester**: Validates agent functionality

## Summary

The subagent system provides specialized tools for every aspect of template management. Claude orchestrates these agents to handle complex workflows, ensuring consistent, validated, and well-documented template systems.

Remember: Agents are tools that Claude uses - they enhance capabilities but require Claude's orchestration for multi-step workflows.
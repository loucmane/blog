# Agent Quick Reference Card

## Core Template Management

| Agent | Purpose | Trigger | Color |
|-------|---------|---------|-------|
| **template-migrator** | Convert monolithic → folders | "migrate handlers" | 🟢 Green |
| **handler-creator** | Create new handlers | "create handler for X" | 💗 Pink |
| **trigger-router** | Route requests → handlers | "what handler for X" | 🔵 Blue |
| **swhe-enforcer** | Validate S:W:H:E format | "check compliance" | 🔴 Red |
| **orchestration-conductor** | Manage workflows | "orchestrate task" | 🟣 Purple |
| **handler-validator** | Check handler syntax | "validate handler" | 🟡 Yellow |
| **operator-executor** | Execute operations | "run operator" | 🟠 Orange |

## Analysis & Optimization

| Agent | Purpose | Trigger | Color |
|-------|---------|---------|-------|
| **template-optimizer** | Find redundancies | "optimize templates" | 🟦 Cyan |
| **claude-md-specialist** | Analyze CLAUDE.md | "analyze engine" | 🟪 Magenta |
| **performance-analyzer** | Monitor performance | "check performance" | 🟡 Yellow |
| **pattern-extractor** | Learn from usage | "extract patterns" | 🟣 Purple |

## Documentation & Testing

| Agent | Purpose | Trigger | Color |
|-------|---------|---------|-------|
| **template-documenter** | Generate docs | "document handlers" | 🔵 Blue |
| **integration-tester** | Test interactions | "test integration" | 🟢 Green |
| **template-debugger** | Debug failures | "debug error" | 🔴 Red |

## Coordination

| Agent | Purpose | Trigger | Color |
|-------|---------|---------|-------|
| **agent-coordinator** | Define workflows | "create workflow" | 🔷 Indigo |

## Common Commands

### Single Agent
```
"Use the [agent-name] agent to [task]"
```

### Multi-Agent Workflow
```
"Create and validate a new handler for [feature]"
→ handler-creator → handler-validator → template-documenter
```

### Debug Workflow
```
"Debug why [handler] is failing"
→ template-debugger → swhe-enforcer → handler-validator
```

### Migration Workflow
```
"Migrate all handlers to new structure"
→ template-migrator → handler-validator → integration-tester
```

## Output Locations

```
.claude/agent-outputs/
├── [agent-name]/
│   ├── reports/
│   ├── logs/
│   └── [outputs]/
```

## Quick Tips

1. **Restart Required**: After creating new agents
2. **Claude Orchestrates**: Agents can't call agents
3. **Check Outputs**: Look in agent-outputs for results
4. **Error Logs**: Each agent logs errors to its folder
5. **Workflow Files**: agent-coordinator creates these

## Troubleshooting

- **Agent not found**: Restart Claude Code
- **Agent fails**: Check output directory
- **Wrong agent used**: Be more specific in request
- **Workflow stops**: Check error handling mode

## Most Used Workflows

1. **Create Handler**: creator → validator → documenter
2. **Fix Bug**: debugger → validator → tester
3. **Optimize**: optimizer → pattern → performance
4. **Migrate**: migrator → validator → tester → documenter

## Remember

- Agents = Specialized Tools
- Claude = Orchestrator
- Outputs = `.claude/agent-outputs/`
- Registry = `.claude/agents/AGENT-REGISTRY.md`
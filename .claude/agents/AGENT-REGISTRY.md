# Template System Agent Registry

This document serves as the central registry for all template system agents, their capabilities, triggers, and use cases.

## Quick Navigation

- [Core Template Management](#core-template-management) (7 agents)
- [Analysis & Optimization](#analysis--optimization) (4 agents)
- [Documentation & Testing](#documentation--testing) (3 agents)
- [Agent Color Convention](#agent-color-convention)
- [Common Workflows](#common-workflows)
- [How to Use Agents](#how-to-use-agents)

## Core Template Management

### 1. template-migrator
- **Color**: Green 🟢
- **Purpose**: Migrate handlers from monolithic files to folder structure
- **Tools**: Read, Grep, Glob, Write, MultiEdit
- **Triggers**: "migrate handlers", "convert to folder structure", "extract handler"
- **Use Cases**:
  - Moving handlers from REGISTRY.md to individual files
  - Converting monolithic templates to modular structure
  - Preserving handler functionality during migration
- **Output**: `.claude/agent-outputs/template-migrator/`

### 2. handler-creator
- **Color**: Pink 💗
- **Purpose**: Create new handlers from user requirements
- **Tools**: Read, Write, MultiEdit, Glob, Grep
- **Triggers**: "create new handler", "make handler for X", "build handler"
- **Use Cases**:
  - Generating handlers from descriptions
  - Creating proper YAML frontmatter
  - Placing handlers in correct folder structure
- **Output**: New handlers in `.claude/templates/handlers/`

### 3. trigger-router
- **Color**: Blue 🔵
- **Purpose**: Route user requests to appropriate handlers
- **Tools**: Read, Grep, mcp__serena__search_for_pattern
- **Triggers**: "what handler for X", "route request", "find trigger"
- **Use Cases**:
  - Finding best handler for user request
  - Parsing natural language to handler mapping
  - Identifying handler chains for complex requests
- **Output**: `.claude/agent-outputs/trigger-router/`

### 4. swhe-enforcer
- **Color**: Red 🔴
- **Purpose**: Validate S:W:H:E format compliance
- **Tools**: Read, Grep, Glob
- **Triggers**: "check S:W:H:E", "validate ultrathink", "enforce compliance"
- **Use Cases**:
  - Validating ULTRATHINK statements
  - Checking handler comprehension evidence
  - Enforcing pre-ULTRATHINK protocol
- **Output**: `.claude/agent-outputs/swhe-enforcer/`

### 5. orchestration-conductor
- **Color**: Purple 🟣
- **Purpose**: Manage complex multi-step workflows
- **Tools**: Read, Grep, Glob, Task, TodoWrite, MultiEdit
- **Triggers**: "orchestrate workflow", "manage complex task", "coordinate handlers"
- **Use Cases**:
  - Coordinating handler dependencies
  - Managing workflow state
  - Sequencing complex operations
- **Output**: `.claude/agent-outputs/orchestration-conductor/`

### 6. handler-validator
- **Color**: Yellow 🟡
- **Purpose**: Validate handler syntax and connections
- **Tools**: Read, Grep, Glob, MultiEdit
- **Triggers**: "validate handler", "check syntax", "verify connections"
- **Use Cases**:
  - Checking YAML frontmatter completeness
  - Validating handler structure
  - Finding broken references
- **Output**: `.claude/agent-outputs/handler-validator/`

### 7. operator-executor
- **Color**: Orange 🟠
- **Purpose**: Execute atomic template operations
- **Tools**: Read, MultiEdit, Grep, Glob, Bash, WebFetch
- **Triggers**: "execute operation", "run operator", "perform task"
- **Use Cases**:
  - Loading operator templates
  - Executing single operations
  - Tracking operation results
- **Output**: `.claude/agent-outputs/operator-executor/`

## Analysis & Optimization

### 8. template-optimizer
- **Color**: Cyan 🟦
- **Purpose**: Analyze and optimize template system
- **Tools**: Read, Grep, Glob, MultiEdit
- **Triggers**: "optimize templates", "find redundancy", "consolidate handlers"
- **Use Cases**:
  - Identifying duplicate patterns
  - Finding orphaned handlers
  - Suggesting consolidations
- **Output**: `.claude/agent-outputs/template-optimizer/`

### 9. claude-md-specialist
- **Color**: Magenta 🟪
- **Purpose**: Read-only analysis of CLAUDE.md
- **Tools**: Read, Grep (no editing tools)
- **Triggers**: "analyze CLAUDE.md", "check execution engine", "find gaps"
- **Use Cases**:
  - Deep analysis of enforcement mechanisms
  - Finding unused protocol sections
  - Identifying integration gaps
- **Output**: `.claude/agent-outputs/claude-md-specialist/`

### 10. performance-analyzer
- **Color**: Yellow 🟡
- **Purpose**: Monitor system performance
- **Tools**: Read, Grep, Glob, Bash
- **Triggers**: "analyze performance", "measure efficiency", "find bottlenecks"
- **Use Cases**:
  - Measuring handler execution times
  - Tracking resource usage
  - Comparing handler efficiency
- **Output**: `.claude/agent-outputs/performance-analyzer/`

### 11. pattern-extractor
- **Color**: Purple 🟣
- **Purpose**: Learn from usage patterns
- **Tools**: Read, Grep, Glob, Write
- **Triggers**: "extract patterns", "analyze usage", "find workflows"
- **Use Cases**:
  - Identifying common handler sequences
  - Finding reusable patterns
  - Detecting anti-patterns
- **Output**: `.claude/agent-outputs/pattern-extractor/`

## Documentation & Testing

### 12. template-documenter
- **Color**: Blue 🔵
- **Purpose**: Auto-generate documentation
- **Tools**: Read, Write, MultiEdit, Grep, Glob
- **Triggers**: "document handlers", "create guides", "update docs"
- **Use Cases**:
  - Creating handler usage guides
  - Generating API documentation
  - Maintaining changelogs
- **Output**: `.claude/templates/docs/`

### 13. integration-tester
- **Color**: Green 🟢
- **Purpose**: Test handler interactions
- **Tools**: Read, Grep, Glob, Bash, Write
- **Triggers**: "test integration", "verify workflow", "check compliance"
- **Use Cases**:
  - Testing handler combinations
  - Verifying S:W:H:E compliance
  - Running regression tests
- **Output**: `.claude/agent-outputs/integration-tester/`

### 14. template-debugger
- **Color**: Red 🔴
- **Purpose**: Debug execution failures
- **Tools**: Read, Grep, Glob, Bash
- **Triggers**: "debug handler", "trace execution", "find failure"
- **Use Cases**:
  - Tracing execution paths
  - Finding S:W:H:E validation failures
  - Debugging circular dependencies
- **Output**: `.claude/agent-outputs/template-debugger/`

## Agent Color Convention

- **Red** 🔴: Validation/Enforcement/Debugging (swhe-enforcer, template-debugger)
- **Green** 🟢: Creation/Building/Testing (template-migrator, integration-tester)
- **Blue** 🔵: Routing/Documentation (trigger-router, template-documenter)
- **Yellow** 🟡: Validation/Performance (handler-validator, performance-analyzer)
- **Purple** 🟣: Orchestration/Patterns (orchestration-conductor, pattern-extractor)
- **Orange** 🟠: Execution (operator-executor)
- **Cyan** 🟦: Optimization (template-optimizer)
- **Magenta** 🟪: Analysis (claude-md-specialist)
- **Pink** 💗: Creation (handler-creator)

## Common Workflows

### Create and Validate Handler
```
1. handler-creator: Generate new handler
2. handler-validator: Check syntax and structure
3. template-documenter: Create documentation
```

### Migrate and Test
```
1. template-migrator: Move handlers to new structure
2. handler-validator: Validate all migrated handlers
3. integration-tester: Test handler interactions
```

### System Optimization
```
1. template-optimizer: Find redundancies
2. pattern-extractor: Analyze usage patterns
3. performance-analyzer: Measure improvements
```

### Debug Failed Execution
```
1. template-debugger: Trace execution path
2. swhe-enforcer: Check S:W:H:E compliance
3. handler-validator: Verify handler syntax
```

## How to Use Agents

### Direct Invocation
```
Use the [agent-name] subagent to [task description]
```

### Via Task Tool
```
Task(
  description="[Short description]",
  prompt="[Detailed task for agent]",
  subagent_type="[agent-name]"
)
```

### Proactive Triggers
Agents marked "Use proactively" in their descriptions will be automatically suggested by Claude when their trigger conditions are met.

### Multi-Agent Workflows
Claude acts as the orchestrator, reading workflow definitions and executing agents in sequence. Results are passed between agents as needed.

## Agent Output Structure

All agents save their outputs to:
```
.claude/agent-outputs/
├── [agent-name]/
│   ├── reports/
│   ├── logs/
│   └── [agent-specific-files]
```

## Notes

- Agents cannot spawn other agents - orchestration happens at Claude level
- All agents require Claude Code restart to be recognized after creation
- Agents follow consistent YAML frontmatter format
- Project paths should be relative, not absolute
- Error handling should be explicit in agent instructions
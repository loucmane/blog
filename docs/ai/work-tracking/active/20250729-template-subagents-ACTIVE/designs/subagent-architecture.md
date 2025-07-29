# Template System Subagent Architecture

## Overview
Based on analysis of meta-agent capabilities and our template system needs, we propose 6 specialized subagents that form a complete ecosystem for template management.

## Core Subagent Design

### 1. template-migrator
- **Name**: `template-migrator`
- **Color**: Green (transformation)
- **Description**: "Use when migrating handlers from monolithic template files to the new folder-based structure with frontmatter metadata"
- **Tools**: `Read, Write, MultiEdit, mcp__serena__search_for_pattern, mcp__serena__find_symbol`
- **Primary Role**: Automate migration of 69+ handlers to new structure
- **Key Tasks**:
  - Extract handlers from monolithic files
  - Generate YAML frontmatter with metadata
  - Create proper folder structure
  - Preserve handler functionality

### 2. trigger-router  
- **Name**: `trigger-router`
- **Color**: Blue (navigation)
- **Description**: "Use proactively when routing user requests to appropriate template handlers based on triggers and intent"
- **Tools**: `Read, Grep, mcp__serena__search_for_pattern, mcp__serena__find_symbol`
- **Primary Role**: Identify and route to correct handlers
- **Key Tasks**:
  - Parse user intent
  - Search for matching triggers
  - Return handler location and metadata
  - Suggest alternatives if no exact match

### 3. swhe-enforcer
- **Name**: `swhe-enforcer`
- **Color**: Red (enforcement)
- **Description**: "Use proactively to validate and enforce S:W:H:E format compliance in all template operations"
- **Tools**: `Read, mcp__serena__search_for_pattern`
- **Primary Role**: Maintain S:W:H:E format integrity
- **Key Tasks**:
  - Validate S:W:H:E format
  - Check handler comprehension
  - Enforce pre-ultrathink protocol
  - Report compliance issues

### 4. orchestration-conductor
- **Name**: `orchestration-conductor`
- **Color**: Purple (coordination)
- **Description**: "Use when executing complex workflows that require orchestrating multiple template handlers"
- **Tools**: `Read, Task, TodoWrite, mcp__serena__search_for_pattern`
- **Primary Role**: Coordinate multi-template operations
- **Key Tasks**:
  - Break down complex requests
  - Delegate to appropriate handlers
  - Track workflow progress
  - Ensure proper sequencing

### 5. handler-validator
- **Name**: `handler-validator`
- **Color**: Yellow (verification)
- **Description**: "Use to validate handler syntax, frontmatter completeness, and template connections"
- **Tools**: `Read, Grep, mcp__serena__find_symbol, mcp__serena__find_referencing_symbols`
- **Primary Role**: Quality assurance for handlers
- **Key Tasks**:
  - Validate YAML frontmatter
  - Check handler references
  - Verify template connections
  - Report inconsistencies

### 6. operator-executor
- **Name**: `operator-executor`
- **Color**: Orange (action)
- **Description**: "Use when executing single atomic template operations from the operators category"
- **Tools**: `Read, Edit, Bash, mcp__serena__search_for_pattern`
- **Primary Role**: Execute atomic operations
- **Key Tasks**:
  - Load operator templates
  - Execute single operations
  - Return operation results
  - Handle error conditions

## Agent Interaction Flow

```
User Request
    ↓
trigger-router (identifies handler)
    ↓
swhe-enforcer (validates format)
    ↓
orchestration-conductor (if multi-template)
    ↓
operator-executor (for atomic ops)
    ↓
handler-validator (post-execution check)
```

## Implementation Priority

1. **template-migrator** - Immediate need for folder structure transition
2. **trigger-router** - Foundation for all template operations  
3. **swhe-enforcer** - Maintains system integrity
4. **orchestration-conductor** - Enables complex workflows
5. **handler-validator** - Quality assurance
6. **operator-executor** - Atomic operations

## Design Principles

### Minimal Tool Sets
Each agent has only the tools necessary for its specific role, reducing complexity and improving performance.

### Clear Delegation Triggers
Description fields use action-oriented language ("Use when...", "Use proactively for...") enabling automatic delegation.

### Single Responsibility
Each agent has one primary role, avoiding overlap and confusion.

### Pipeline Architecture
Agents can work independently or as part of a larger workflow pipeline.

## Integration with Folder Structure

The agents map directly to our interaction-based folder organization:
- **triggers/** → handled by trigger-router
- **orchestrators/** → handled by orchestration-conductor
- **operators/** → handled by operator-executor

## Success Metrics

- Migration of all 69+ handlers to new structure
- Maintained S:W:H:E enforcement across all operations
- Reduced time to find and execute handlers
- Clear audit trail of template operations
- Improved template system usability

## Next Steps

1. Create template-migrator agent first (highest priority)
2. Test migration on a single handler
3. Iterate and improve based on results
4. Create remaining agents in priority order
5. Test complete pipeline with real workflows
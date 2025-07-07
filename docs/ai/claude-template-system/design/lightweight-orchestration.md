# Lightweight Multi-Agent Orchestration Design

## Overview

This document explores how to integrate multi-agent delegation into standard workflows without heavyweight orchestration commands. The goal is to make delegation natural, lightweight, and efficient - taking minutes, not hours.

## Current State Analysis

### Heavy Orchestration (orchestrate-and-test)
- **23 agents** across 10 phases
- **Hours** to complete
- **Comprehensive** but overwhelming
- **Rigid structure** that doesn't adapt to task needs

### Medium Orchestration (m-orchestrate-dev)
- **3 agents** in dev-review cycle
- **Better balance** but still formal
- **Sequential** not parallel
- **Limited to dev workflow**

### What We Want
- **Natural delegation** based on task complexity
- **2-4 agents maximum** for most tasks
- **Minutes not hours** execution
- **Integrated with todos** and SESSION.md
- **Flexible patterns** that adapt to needs

## Lightweight Delegation Triggers

### Complexity-Based Triggers
When the main agent should naturally delegate:

1. **Multiple Domain Expertise** (Complexity > 3)
   - Example: "Add authentication with performance optimization"
   - Trigger: Auth expert + Performance expert needed
   - Pattern: Parallel domain agents

2. **Quality Gates Required** (Risk > Medium)
   - Example: "Refactor critical payment logic"
   - Trigger: Implementation + Security review needed
   - Pattern: Sequential dev-review cycle

3. **Research + Implementation** (Unknown > 40%)
   - Example: "Integrate new AI model we haven't used"
   - Trigger: Research phase before implementation
   - Pattern: Research agent → Implementation agent

4. **Cross-Package Changes** (Scope > 2 packages)
   - Example: "Update theme system across monorepo"
   - Trigger: Multiple packages need coordination
   - Pattern: Package-specific agents in parallel

## Lightweight Orchestration Patterns

### Pattern 1: Domain Split (2-3 agents)
```yaml
Trigger: Task mentions multiple specialized domains
Agents:
  - Main: Coordinates and integrates
  - Domain1: Handles specific expertise
  - Domain2: Handles other expertise
Time: 10-20 minutes
Example: "Add accessible dark mode" → UI Agent + A11y Agent
```

### Pattern 2: Quality Review (2 agents)
```yaml
Trigger: Task modifies critical code or needs validation
Agents:
  - Developer: Implements solution
  - Reviewer: Validates quality/security
Time: 15-30 minutes
Example: "Fix authentication bug" → Dev Agent + Security Agent
```

### Pattern 3: Research-First (2 agents)
```yaml
Trigger: Task requires learning/exploration
Agents:
  - Researcher: Explores options, finds patterns
  - Implementer: Applies research findings
Time: 20-30 minutes
Example: "Add new chart library" → Research Agent + Implementation Agent
```

### Pattern 4: Parallel Package (2-4 agents)
```yaml
Trigger: Task spans multiple packages/areas
Agents:
  - Orchestrator: Coordinates changes
  - Package Agents: Handle specific packages
Time: 15-25 minutes
Example: "Update all API endpoints" → API Agent + Frontend Agent + Docs Agent
```

## Integration with Standard Workflow

### 1. TodoWrite Integration
```markdown
When creating todos with complexity > 3:
- [ ] 🎭 Main Task (orchestrated)
  - [ ] Research phase - Agent 1
  - [ ] Implementation - Agent 2
  - [ ] Integration - Main agent
```

### 2. SESSION.md Tracking
```markdown
### 📝 Progress Log
- **14:30** - Task complexity warrants delegation
- **14:32** - Deployed Research Agent for options analysis
- **14:45** - Research complete, deploying Implementation Agent
- **15:00** - Implementation complete, integrating results
```

### 3. Natural Language Triggers
Instead of `/orchestrate-and-test`, the main agent recognizes:
- "This needs multiple perspectives..."
- "Let me delegate the research phase..."
- "I'll deploy a specialized agent for the UI work..."

### 4. Decision Flow
```
1. Analyze task complexity/risk/scope
2. If triggers met → Propose delegation
3. Get user approval (unless pre-authorized)
4. Deploy lightweight agents
5. Integrate results
6. Update todos/SESSION.md
```

## Lightweight Agent Specifications

### Minimal Agent Context
Unlike the 2000+ word prompts in heavy orchestration:
```
Role: UI Implementation Specialist
Task: Create dark mode toggle component
Context: 
  - Current theme system at /lib/theme.ts
  - Follow 44px touch target standard
  - Integrate with existing Button component
Output: Component implementation + integration instructions
Time limit: 15 minutes
```

### Agent Communication
Simple, direct, file-based:
```
Main → Agent: task-spec.md with requirements
Agent → Main: implementation + summary.md
Main: Integrates and continues
```

## Implementation Approach

### Phase 1: Pattern Recognition
Main agent learns to recognize delegation triggers:
- Complexity scoring
- Domain detection
- Risk assessment
- Scope analysis

### Phase 2: Template Patterns
Create lightweight templates for common delegations:
- domain-split-template.md
- quality-review-template.md
- research-first-template.md
- parallel-package-template.md

### Phase 3: Natural Integration
Build into standard workflow:
- Add to WORKFLOWS.md
- Include in CONVENTIONS.md
- Update todo patterns
- Enhance SESSION.md tracking

### Phase 4: Progressive Enhancement
Start simple, add complexity as needed:
- Begin with 2-agent patterns
- Add 3rd agent when proven useful
- Keep execution under 30 minutes
- Maintain flexibility

## Benefits Over Heavy Orchestration

1. **Speed**: Minutes vs hours
2. **Flexibility**: Adapt to task needs
3. **Simplicity**: 2-4 agents vs 23
4. **Integration**: Natural part of workflow
5. **Transparency**: Clear in todos/SESSION.md

## Example: Applying to Real Task

### Task: "Add search functionality to blog"

#### Heavy Approach (orchestrate-and-test)
- 23 agents analyzing every angle
- Hours of execution
- Massive output to synthesize

#### Lightweight Approach
1. **Main agent** recognizes: Search needs UI + Performance + Accessibility
2. **Proposes**: "This task would benefit from specialized perspectives. Shall I deploy:"
   - Search Implementation Agent (core functionality)
   - Performance Agent (optimize for large datasets)
   - A11y Agent (screen reader support)
3. **Execution**: 
   - 3 agents work in parallel (15 min)
   - Main agent integrates results (10 min)
   - Total: 25 minutes
4. **Output**: Integrated search with all considerations

## Next Steps

1. **Document patterns** in WORKFLOWS.md
2. **Create decision matrices** for CONVENTIONS.md
3. **Build trigger recognition** into standard flow
4. **Test with real tasks** to refine patterns
5. **Create minimal templates** for each pattern

## Key Principle

> "Orchestration should be invisible - a natural response to complexity, not a heavyweight command"

The goal is for the main agent to say "Let me get a second opinion on this" as naturally as it currently says "Let me search for that file.""
# Claude Command Pattern Analysis Report

## Overview
This report analyzes why some Claude commands execute while others only display as templates. After examining working commands (`infinite.md`, `infinite-documentation.md`) and a non-working command (`orchestrate-and-test.md`), I've identified critical structural patterns.

## Key Finding: Conceptual vs Procedural Language

The fundamental difference is that **working commands are written as thinking prompts** while **non-working commands are written as deployment specifications**.

## Detailed Pattern Analysis

### 1. Command Opening Structure

#### WORKING Pattern ✅
```markdown
Think deeply about this [specific task type]. You are about to [action in conceptual terms].
```

Examples:
- `infinite.md`: "Think deeply about this infinite generation task. You are about to embark on a sophisticated iterative creation process."
- `infinite-documentation.md`: "Think deeply about this documentation evolution task. You are about to orchestrate a sophisticated iterative improvement process."

#### NON-WORKING Pattern ❌
```markdown
Think deeply about [gerund phrase describing process]. This command [technical description].
```

Example:
- `orchestrate-and-test.md`: "Think deeply about orchestrating a comprehensive multi-agent implementation workflow for the given task. This command creates worktrees, deploys specialized agents..."

**Key Difference**: Working commands focus on the TASK itself, non-working focus on the PROCESS.

### 2. Variable Declaration Patterns

#### WORKING Pattern ✅
```markdown
**Variables:**

variable_name: $ARGUMENTS
another_var: $ARGUMENTS
```

Clean, minimal, no type annotations or explanations.

#### NON-WORKING Pattern ❌
```markdown
**Variables:**
- variable_name: $ARGUMENTS (required)
- another_var: $ARGUMENTS (optional, default: value)
```

Over-specified with type hints and documentation.

### 3. TASK Block Structure

#### WORKING Pattern ✅
```markdown
```
TASK: [Action description from agent perspective]

You are [role/identity]. 

CONTEXT:
- [Contextual information]
- [More context]

REQUIREMENTS:
1. [What to do conceptually]
2. [More conceptual actions]

DELIVERABLE: [What to produce]
```
```

The TASK blocks are written as **prompts to the agent**, not instructions to deploy agents.

#### NON-WORKING Pattern ❌
```markdown
Deploy [Agent Name] using the Task tool.

```
TASK: [Technical task description]
[Technical specifications]
```

**Parallel Execution Management:**
- Deploy all agents using Task tool
- Monitor progress
- Handle failures
```

Too many technical directives and deployment instructions.

### 4. Tool Reference Patterns

#### WORKING Pattern ✅
- Mentions tools contextually: "Deploy multiple Sub Agents" or "using Task tool"
- Tools are mentioned as part of the narrative flow
- No explicit deployment commands

#### NON-WORKING Pattern ❌
- Explicit commands: "Deploy X Agent using the Task tool"
- Repeated phrases like "**Parallel Execution Management:**"
- Technical sections breaking the narrative flow

### 5. Language Style Patterns

#### WORKING Pattern ✅
- **Narrative voice**: "You are about to...", "Think carefully about..."
- **Agent perspective**: "You are Sub Agent [X]..."
- **Conceptual actions**: "Generate iteration", "Create documentation"
- **Natural flow**: Reads like a story or guide

#### NON-WORKING Pattern ❌
- **Technical voice**: "Deploy", "Execute", "Implement"
- **Orchestrator perspective**: "Deploy five specialist orchestrators"
- **Procedural actions**: "Create worktree", "Run pnpm install"
- **Manual style**: Reads like technical documentation

### 6. Structural Flow Patterns

#### WORKING Pattern ✅
1. Philosophical opening (think deeply)
2. Simple variable parsing
3. Conceptual phase descriptions
4. Agent-perspective TASK blocks
5. Natural language execution
6. Thoughtful closing

#### NON-WORKING Pattern ❌
1. Technical opening
2. Complex variable specifications
3. Procedural phase descriptions
4. Deployment-focused TASK blocks
5. Explicit execution commands
6. Technical summary

## Specific Problems in orchestrate-and-test.md

### 1. Over-Engineering
The command has 896 lines compared to ~500 for working commands. It's trying to be too explicit about every detail.

### 2. Deployment Focus
Lines like these break the pattern:
- Line 69: "Deploy a Pre-Analysis Agent using the Task tool"
- Line 203: "**Parallel Execution Management:**"
- Line 435: "Deploy all 5 Specialist Orchestrators using Task tool in parallel"

### 3. Technical Specifications
Too many technical details:
- Port configurations
- Worktree management
- Tmux session handling
- HTML dashboard generation

### 4. Missing Conceptual Framing
The command describes HOW to orchestrate but doesn't help Claude THINK about orchestration conceptually.

## Root Cause Analysis

Working commands operate on the principle that **Claude needs to embody the task conceptually** before executing it. They're written as thinking exercises that naturally lead to action.

Non-working commands try to **specify the execution procedurally**, which prevents Claude from engaging with the task conceptually. They're blueprints rather than thinking prompts.

## Transformation Recipe

To fix `orchestrate-and-test.md`:

### 1. Simplify Opening
```markdown
Think deeply about this task implementation challenge. You need to explore multiple specialist perspectives to find the best solution.
```

### 2. Remove Type Annotations
```markdown
**Variables:**

task_id: $ARGUMENTS
specialists: $ARGUMENTS  
depth: $ARGUMENTS
```

### 3. Rewrite TASK Blocks Conceptually
Instead of "Deploy Pre-Analysis Agent", use:
```markdown
TASK: Understand the implementation requirements

You are analyzing Task ${task_id} to create shared understanding.

Your role is to ensure all specialist perspectives will work together harmoniously.
```

### 4. Remove Deployment Commands
Replace all "Deploy using Task tool" with natural descriptions of what happens.

### 5. Maintain Agent Perspective
Write from the viewpoint of agents doing work, not someone managing agents.

## Critical Success Factors

1. **Conceptual > Procedural**: Focus on WHAT and WHY, not HOW
2. **Narrative > Technical**: Tell a story, don't write a manual
3. **Agent > Orchestrator**: Write from the doer's perspective
4. **Simple > Complex**: Less specification, more imagination
5. **Thinking > Deploying**: It's a prompt, not a program

## Conclusion

The pattern is clear: **Working commands are thinking prompts that help Claude conceptually understand and embody a task**. Non-working commands are technical specifications that describe deployment procedures. 

To make any command work, transform it from a deployment manual into a thinking guide. Help Claude think about the task conceptually, and the execution will follow naturally.

The magic is in the conceptual framing, not the technical details.
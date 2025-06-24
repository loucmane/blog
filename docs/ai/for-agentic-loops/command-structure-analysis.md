# Command Structure Analysis - Working vs Non-Working Patterns

## Executive Summary

After analyzing the Claude command files, I've identified the EXACT structural patterns that make commands executable vs template-only. The key differences lie in **conceptual framing**, **task formatting**, and **language style**.

## Working Commands Analysis

### 1. `/infinite.md` - WORKING ✅
- **Opens with imperative thinking**: "Think deeply about this infinite generation task"
- **Variables declared simply**: `spec_file: $ARGUMENTS`
- **TASK blocks use conceptual language**: "TASK: Generate iteration [NUMBER]"
- **Sub-agent instructions are narrative**: "You are Sub Agent [X] generating..."
- **No explicit "Deploy using Task tool" directives**

### 2. `/infinite-documentation.md` - WORKING ✅
- **Opens with imperative thinking**: "Think deeply about this documentation evolution task"
- **Variables declared simply**: `mode: $ARGUMENTS`
- **TASK blocks are conversational**: "TASK: Generate [ASPECT] for documentation iteration"
- **Natural language flow**: "You are the Performance Summarization Agent"
- **Mentions Task tool contextually**: "using Task tool" (not as explicit deployment command)

## Non-Working Command Analysis

### 3. `/orchestrate-and-test.md` - NOT WORKING ❌
- **Opens with descriptive language**: "Think deeply about orchestrating a comprehensive multi-agent..."
- **Variables use explicit typing**: `- task_id: $ARGUMENTS (required)`
- **TASK blocks read like deployment scripts**: "Deploy Pre-Analysis Agent using the Task tool"
- **Overly technical directives**: "**Parallel Execution Management:**"
- **Explicit deployment commands**: "Deploy all 5 Specialist Orchestrators using Task tool in parallel"
- **Too procedural**: Reads like a technical manual rather than a thinking prompt

## Key Structural Differences

### 1. **Opening Style**
| Working | Non-Working |
|---------|-------------|
| Direct imperative: "Think deeply about this [task]" | Descriptive: "Think deeply about orchestrating..." |
| Simple, focused | Complex, multi-clause |
| Task-oriented | Process-oriented |

### 2. **Variable Declaration**
| Working | Non-Working |
|---------|-------------|
| `variable: $ARGUMENTS` | `- variable: $ARGUMENTS (required)` |
| No typing annotations | Includes type hints |
| Clean and minimal | Over-specified |

### 3. **TASK Block Format**
| Working | Non-Working |
|---------|-------------|
| Conceptual: "TASK: Generate..." | Procedural: "Deploy X Agent using..." |
| Narrative voice: "You are..." | Technical voice: "Deploy five specialist..." |
| Natural flow | Deployment script style |

### 4. **Language Style**
| Working | Non-Working |
|---------|-------------|
| Conversational prompting | Technical specification |
| Implicit tool usage | Explicit tool commands |
| Thinking-oriented | Execution-oriented |

### 5. **Code Fence Usage**
| Working | Non-Working |
|---------|-------------|
| Code fences for TASK content | Code fences for technical examples |
| Maintains narrative flow | Breaks into technical sections |
| Agent perspective | Orchestrator perspective |

## The Root Problem

The `orchestrate-and-test.md` command fails because it's written as a **deployment specification** rather than a **thinking prompt**. It tells Claude HOW to deploy agents rather than helping Claude THINK about what to do.

## Specific Issues in orchestrate-and-test.md

1. **Line 69**: "Deploy a Pre-Analysis Agent using the Task tool" - Too explicit
2. **Line 203**: "Deploy Master Orchestrator using Task tool" - Procedural command
3. **Line 207**: "Deploy five specialist orchestrators simultaneously" - Technical directive
4. **Line 435**: "Deploy all 5 Specialist Orchestrators using Task tool in parallel" - Deployment script
5. **Multiple sections titled "Parallel Execution Management"** - Over-engineered

## Recommendations for Fixing orchestrate-and-test.md

### 1. **Rewrite Opening**
```markdown
Think deeply about this orchestration and testing task. You need to coordinate multiple specialist perspectives to create the best possible implementation.
```

### 2. **Simplify Variables**
```markdown
task_id: $ARGUMENTS
specialists: $ARGUMENTS
depth: $ARGUMENTS
```

### 3. **Convert TASK Blocks to Conceptual**
Instead of:
```markdown
Deploy Pre-Analysis Agent using the Task tool.
```

Use:
```markdown
TASK: Create implementation contracts for Task ${task_id}

You are responsible for analyzing the task and creating contracts that ensure all implementations work together.
```

### 4. **Remove Explicit Deployment Commands**
Replace all "Deploy X using Task tool" with natural language that describes what needs to happen conceptually.

### 5. **Adopt Narrative Voice**
Write from the perspective of the agents doing the work, not from the perspective of someone deploying agents.

## Pattern for Success

Working commands follow this pattern:
1. **Think** - Imperative opening focused on the task
2. **Understand** - Simple variable parsing
3. **Become** - TASK blocks written from agent perspective
4. **Act** - Natural language describing actions
5. **Flow** - Maintains conversational tone throughout

## Conclusion

The key to making commands executable is to write them as **thinking prompts** that help Claude understand and embody the task, rather than technical specifications that describe deployment procedures. The language should be conversational, task-focused, and written from the perspective of the agents doing the work.

Transform `orchestrate-and-test.md` from a deployment manual into a thinking guide, and it will execute properly.
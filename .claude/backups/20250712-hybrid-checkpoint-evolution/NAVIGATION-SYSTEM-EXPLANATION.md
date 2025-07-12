# How the New CLAUDE.md Navigation System Works

## Overview
The new CLAUDE.md acts as an intelligent traffic controller that routes EVERY request to the appropriate documentation in TOOLS.md, WORKFLOWS.md, or CONVENTIONS.md. It contains NO implementation details - only navigation logic.

## Core Principle: Natural Language → Exact Documentation

The system works by:
1. User states what they want to do
2. CLAUDE.md matches to a section
3. That section provides immediate routing
4. User lands on exact workflow/tool/convention needed

---

## 🛠️ TOOLS.md Integration

### How Tool Routing Works

**User says**: "I need to search for a function"
↓
**CLAUDE.md matches**: Code Discovery Mode
↓
**Shows quick router**:
```
| Need | Use | NOT |
|------|-----|-----|
| Find function/class | `mcp__serena__find_symbol` | manual search |
```
↓
**Links to**: [TOOLS.md#mandatory-tool-selection-router] for complete details

### Complete Tool Coverage

The new CLAUDE.md routes to ALL tools via:

1. **Mode-Based Pre-Selection**
   - Code Discovery Mode → Shows search tools
   - Code Modification Mode → Shows edit tools
   - Bug Fix Mode → Shows debug tools
   - Each mode pre-filters relevant tools

2. **Quick Router Tables**
   - Shows 5-6 most common tools per mode
   - Always ends with "Need more? → [Complete Tool Router]"

3. **Tool Troubleshooting Section**
   - Common tool errors → Solutions
   - Links to [TOOLS.md#common-violations]

### Example Tool Flow

**Scenario**: User needs to refactor a component

1. User: "I need to refactor the Button component"
2. CLAUDE.md: Routes to "Code Modification Mode"
3. Shows:
   ```
   PRE-FLIGHT CHECK:
   1. ❌ NEVER edit without reading first
   2. ✅ ALWAYS Read → Understand → Edit
   
   TOOL ROUTER:
   | Change Type | Use | When |
   | Whole function/class | `mcp__serena__replace_symbol_body` | Complete replacement |
   
   CONVENTIONS: Check [Code Conventions](CONVENTIONS.md#code-conventions) for patterns
   ```
4. User knows exactly which tool and sees convention link

---

## 📋 WORKFLOWS.md Integration

### How Workflow Routing Works

**User says**: "I need to fix a bug"
↓
**CLAUDE.md matches**: Bug Fix Mode
↓
**Shows**:
```
USE THIS TEMPLATE: [Bug Fix Template](WORKFLOWS.md#bug-fix-template)

LOCKED STEPS (must complete in order):
1. 🔒 State the bug clearly
2. 🔒 Reproduce the issue
3. 🔒 Investigate root cause
4. 🔒 Apply fix
5. 🔒 Verify resolution
```
↓
**Forces navigation** to full workflow

### Complete Workflow Coverage

Every workflow in WORKFLOWS.md is accessible via:

1. **Task-Based Entry Points**
   - "Starting new session" → Session Management
   - "Task has multiple steps" → Orchestration
   - "Need to test approach" → Testing Workflows
   - "Creating memory" → Memory Management

2. **Mode Sections**
   - Each mode links to relevant workflows
   - Shows which workflow applies when

3. **Decision Trees**
   ```
   Is it 3+ steps/subtasks?
   ├─ YES → Go to [Orchestration Decision](#orchestration-decision)
   ├─ NO → Continue below
   └─ UNSURE → Use TodoWrite to break it down first
   ```

### Example Workflow Flow

**Scenario**: Starting a new feature

1. User: "I want to add user authentication"
2. CLAUDE.md: Detects "Starting new feature"
3. Routes to "Task Initialization"
4. Decision tree asks: "Is it 3+ steps?"
5. YES → Routes to [Orchestration Workflow]
6. Shows mandatory specialist deployment
7. Links to full workflow with constraints

### All Workflows Mapped

| User Intent | CLAUDE.md Section | Routes to WORKFLOWS.md |
|-------------|-------------------|------------------------|
| "Starting session" | Session Start Protocol | #session-management |
| "Continuing work" | Session Continuity | #prevent-work-duplication |
| "Multiple steps" | Orchestration Decision | #intelligent-multi-agent-orchestration |
| "Deploy specialist" | Specialist Deployment | #specialist-deployment-flow |
| "Run tests" | Testing Mode | #testing-workflows |
| "Fix bug" | Bug Fix Mode | #bug-fix-template |
| "Add feature" | Task Initialization | #feature-implementation-template |
| "Review code" | Code Analysis Mode | #code-review-template |
| "Refactor" | Code Modification Mode | #refactoring-template |
| "Create memory" | Memory Management | #memory-management |
| "End session" | Session Closure | #session-end |
| "Emergency" | Emergency Help | #emergency-debug-template |

---

## 📐 CONVENTIONS.md Integration

### How Convention Routing Works

**User action**: About to write code
↓
**CLAUDE.md shows**: Quick Convention Checks
↓
```
Before you code, check:
- [ ] Naming? → [Conventions](CONVENTIONS.md#naming-conventions)
- [ ] File structure? → [Patterns](CONVENTIONS.md#file-organization)
- [ ] Commit message? → [Standards](CONVENTIONS.md#commit-standards)
```
↓
**Forces** proper pattern usage

### Complete Convention Coverage

Conventions are integrated via:

1. **Mode-Specific Links**
   - Code Modification Mode → Links to Code Conventions
   - Git Operations → Links to Git Conventions
   - Testing Mode → Links to Testing Conventions

2. **Quick Check Sections**
   - Pre-flight reminders before actions
   - Links to specific convention sections

3. **Decision Matrices**
   - Orchestration Decision → Links to Orchestration Matrix
   - Evidence requirements → Links to Evidence-Based patterns

### Example Convention Flow

**Scenario**: Making a commit

1. User: "Commit my changes"
2. CLAUDE.md: Routes to "Git Operations"
3. Shows:
   ```
   🚨 CRITICAL: Use `gac` alias!
   # ✅ CORRECT (single quotes inside message)
   gac "feat: add 'Modern Blog' feature"
   
   CONVENTIONS: [Git Conventions](CONVENTIONS.md#git-conventions)
   ```
4. User sees example AND convention link

### All Conventions Mapped

| Convention Type | CLAUDE.md Integration | Links to CONVENTIONS.md |
|----------------|----------------------|-------------------------|
| Code patterns | Code Modification Mode | #code-conventions |
| Naming standards | Quick Convention Checks | #naming-conventions |
| File organization | Quick Convention Checks | #file-organization |
| Git practices | Git Operations section | #git-conventions |
| Testing patterns | Testing Mode | #testing-checkpoint-conventions |
| Communication | Evidence requirements | #communication-patterns |
| Orchestration rules | Orchestration Decision | #orchestration-decision-matrix |
| Common mistakes | Tool Troubleshooting | #common-convention-violations |
| Serena patterns | Code Discovery Mode | #serena-workflow-patterns |

---

## 🎭 How Mode Detection Works

### Natural Language Triggers

The system uses pattern matching on user input:

```yaml
Starting Triggers:
  - "start", "begin", "new session" → Session Start Protocol
  - "continue", "resume", "back to" → Session Continuity
  - "fix", "broken", "error" → Bug Fix Mode
  - "add", "implement", "create" → Task Initialization
  - "find", "search", "where" → Code Discovery Mode
  - "change", "edit", "update" → Code Modification Mode
  - "help", "lost", "confused" → Emergency Help
```

### Mode Adaptation

Once in a mode, CLAUDE.md:
1. Shows only relevant tools
2. Links to specific workflows
3. Applies appropriate conventions
4. Maintains context

### Example Mode Flow

**User Journey**:
1. "I need to fix the login bug" → Bug Fix Mode
2. Shows 5 locked steps from workflow
3. Pre-selects debugging tools
4. Links to error conventions
5. Guides through systematic fix

---

## 🚀 Complete System Benefits

### 1. No Duplication
- CLAUDE.md contains ZERO implementation details
- All actual content lives in TOOLS/WORKFLOWS/CONVENTIONS
- Updates only needed in one place

### 2. Forced Best Practices
- Can't skip to tools without checking router
- Can't start work without session management
- Can't make claims without evidence links

### 3. Natural Discovery
- Start with what you want to do
- Get routed to exact documentation
- Learn system through use

### 4. Systematic Coverage
- Every tool has a route
- Every workflow has an entry point
- Every convention has a checkpoint

### 5. Emergency Recovery
- Multiple "escape hatches"
- Clear troubleshooting paths
- Always able to reorient

---

## 📊 Usage Example: Complete Feature Implementation

Let's trace a full feature implementation:

1. **User**: "I need to add a shopping cart feature"

2. **CLAUDE.md Detection**: 
   - Matches "add" → Task Initialization
   - Shows decision tree

3. **Complexity Check**:
   - "Is it 3+ steps?" → YES
   - Routes to Orchestration Decision

4. **Orchestration Routing**:
   - Links to [WORKFLOWS.md#intelligent-multi-agent-orchestration]
   - Shows mandatory specialist deployment
   - Links to [WORKFLOWS.md#specialist-deployment-flow]

5. **Tool Pre-Selection**:
   - Shows tools for code discovery
   - Links to [TOOLS.md#mandatory-tool-selection-router]

6. **Convention Checks**:
   - Shows naming conventions link
   - Shows component patterns link
   - Links to [CONVENTIONS.md#code-conventions]

7. **Progress Tracking**:
   - Reminds about TodoWrite
   - Links to [WORKFLOWS.md#task-management]
   - Shows SESSION.md update requirements

8. **Testing Integration**:
   - Shows user testing checkpoints
   - Links to [WORKFLOWS.md#user-testing-checkpoints]

Every step routes to existing documentation - nothing duplicated!

---

## 🎯 Summary

The new CLAUDE.md is a **pure navigation layer** that:
- Takes natural language input
- Routes to exact documentation needed
- Pre-selects relevant tools
- Enforces proper workflows
- Maintains all content in the source docs

It's like a smart GPS for the documentation system - it doesn't contain the map, it just knows how to get you where you need to go efficiently.
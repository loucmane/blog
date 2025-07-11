o# Claude AI Assistant - Navigation Hub

You are Claude, an AI assistant helping with software development. This is your navigation hub - always loaded first.

## 🚨 Critical Reminders

### ULTRATHINK ALWAYS → ORCHESTRATE WHEN NEEDED
**ALWAYS**: Ultrathink for ALL non-trivial work (baseline thinking)
**THEN ASSESS**: Deploy specialist when:
  - 3+ steps/subtasks → Review & implement together
  - Security/payments/a11y → Always deploy
  - High risk changes → Deploy for safety
**SPECIALIST**: An AI agent with focused expertise deployed via Task tool
**WHY**: Ultrathink catches issues, specialists add expertise

### Three Non-Negotiables
1. **SESSION.md First!** → Update before ANY work ([how](WORKFLOWS.md#session-management))
2. **Evidence Only!** → No claims without data ("X appears Y times" not "X is better")
3. **Tool Router First!** → ALWAYS check [router](TOOLS.md#mandatory-tool-selection-router) before selecting tools

### Flight Protocol (Mandatory)
**Every action**: STATE → CHECK → VERIFY → EXECUTE
- Full protocol → [Universal Flight Protocol](WORKFLOWS.md#universal-flight-protocol)

## ⚡ Quick Reference

### Essential Commands (Copy-paste, never type!)
**Why**: Typing timestamps leads to errors, copy-paste ensures accuracy
```bash
# Timestamps - ALWAYS use
date "+%Y-%m-%d %H:%M %Z"        # For SESSION.md (2025-07-10 15:45 CEST)
date +%Y%m%d                      # For folder names (20250709)

# Git
gac "commit message"              # git add . && commit
pwd && git branch --show-current  # Check location
git status                        # Before any commits
```

### Quick Decision Rules
```yaml
Starting work?             → Update SESSION.md first
Need a tool?              → Check Tool Router (no exceptions!)
Complex task (>3 steps)?   → TodoWrite first
Common task?              → Use Behavioral Template
Non-trivial work?         → Ultrathink first, then assess if specialist needed
Uncertain?                → Ask user, don't guess
Making claim?             → Have evidence or say "I'm not certain"
Session ending?           → Memory + SESSION.md + git clean
Context getting high?     → [Context Management](WORKFLOWS.md#context-management)
Error/Lost?               → State it, check abort procedures
Nothing integrated?       → It's not done yet!
```

### Work Tracking
- **One folder per initiative!** Don't create multiple for related work
- **Folder format**: `YYYYMMDD-topic-STATUS` (e.g., `20250709-workflow-patterns-ACTIVE`)
- **6-file system**: tracker, implementation, findings, decisions, memory-refs, handoff
- **Integration**: Nothing done until in main docs

## 🛠️ Essential Tools

### ⚠️ Before ANY Tool Use
**→ [Tool Selection Router](TOOLS.md#mandatory-tool-selection-router)** (Mandatory!)

### Core Tools
- **TodoWrite/TodoRead** - Task tracking (use for 3+ steps)
- **Task** - Deploy specialists (THIS IS BUILT-IN tool, NOT mcp__!)
- **Bash** - Commands ([common ones](CONVENTIONS.md#common-commands))
- **Serena** (mcp__) - Code search/analysis ([patterns](CONVENTIONS.md#serena-workflow-patterns))
- **TaskMaster** (mcp__) - Project planning (`get_tasks` → `next_task`)

## 📖 Key Terms
- **Ultrathink**: Deep analysis before action (via Task tool)
- **Specialist**: Expert AI agent for specific domains
- **Orchestration**: Deploying specialists for complex work
- **Task tool**: Built-in agent deployment (NOT mcp__)
- **Evidence-based**: Claims backed by data, not assumptions

## 🧭 Quick Navigation

### By Task Type
| I need to... | Go here |
|-------------|---------|
| Start session | [Session Management](WORKFLOWS.md#session-management) |
| Track work | [Work Tracking Organization](WORKFLOWS.md#work-tracking-organization) |
| Fix a bug | [Bug Fix Template](WORKFLOWS.md#bug-fix-template) |
| Add feature | [Feature Template](WORKFLOWS.md#feature-implementation-template) |
| Review code | [Code Review Template](WORKFLOWS.md#code-review-template) |
| Refactor | [Refactoring Template](WORKFLOWS.md#refactoring-template) |
| Deploy specialist | [Orchestration](WORKFLOWS.md#intelligent-multi-agent-orchestration) |
| End session | [Session End Workflow](WORKFLOWS.md#session-end) |

### By Question
| If wondering... | Check here |
|----------------|------------|
| "Which tool?" | [Tool Router](TOOLS.md#mandatory-tool-selection-router) |
| "How to name?" | [Naming Conventions](CONVENTIONS.md#naming-conventions) |
| "When to deploy specialist?" | [Orchestration Matrix](CONVENTIONS.md#orchestration-decision-matrix) |
| "Common commands?" | [Command Reference](CONVENTIONS.md#common-commands) |
| "Next TaskMaster task?" | Use `mcp__taskmaster-ai__get_tasks` → `next_task` |
| "No workflow exists?" | [Create with Meta-Flow](WORKFLOWS.md#meta-flow-v2) |
| "Context high?" | [Context Management](WORKFLOWS.md#context-management) |
| "I'm lost" | [Abort Procedures](WORKFLOWS.md#abort-procedures) |

## 🎯 Common Workflows

1. **New Feature** → [Feature Template](WORKFLOWS.md#feature-implementation-template) + TodoWrite
2. **Bug Fix** → [Bug Fix Template](WORKFLOWS.md#bug-fix-template) + Reproduce first
3. **Code Review** → [Review Template](WORKFLOWS.md#code-review-template) + Task tool
4. **Refactoring** → [Refactor Template](WORKFLOWS.md#refactoring-template) + Serena
5. **Documentation** → [Documentation Template](WORKFLOWS.md#documentation-update-template) + Context
6. **Emergency** → [Emergency Template](WORKFLOWS.md#emergency-debug-template) + Triage

### Complex Task Handling
- **3+ steps** → Deploy specialist → Review plan → Implement
- **Security/payments/a11y** → Always deploy specialist
- **High risk** → Deploy for safety check
- **TaskMaster tasks** → Follow [Orchestration Protocol](WORKFLOWS.md#intelligent-multi-agent-orchestration)
- **User testing** → Built into every subtask checkpoint

## 📋 Session Lifecycle

### Start
1. Update SESSION.md
2. Check todos
3. Review context
4. State goals

### During  
- Follow templates
- Update todos real-time
- Tool Router always
- Test incrementally
- Ask when uncertain

### End
1. Update SESSION.md
2. Create memory
3. Clear git status
4. Document handoff

## 📚 Key Resources

| Resource | Purpose | Critical For |
|----------|---------|--------------|
| [WORKFLOWS.md](WORKFLOWS.md) | All workflows & templates | How to do things |
| [CONVENTIONS.md](CONVENTIONS.md) | Standards & patterns | Code quality |
| [TOOLS.md](TOOLS.md) | Tool selection & config | Choosing tools |
| [PROJECT-BLOG.md](PROJECT-BLOG.md) | Blog specifics | Implementation |
| [BUILDING-BETTER.md](BUILDING-BETTER.md) | Improve system | Meta-work |

## 🚨 Emergency Help

- **Can't find workflow?** → [Behavioral Templates](WORKFLOWS.md#behavioral-templates)
- **Tool confusion?** → [Tool Router](TOOLS.md#mandatory-tool-selection-router)
- **Made mistake?** → [Common Violations](CONVENTIONS.md#common-convention-violations)
- **System broken?** → [Emergency Debug](WORKFLOWS.md#emergency-debug-template)
- **Principles?** → [Core Principles](CONVENTIONS.md#core-development-principles)

---

Remember: Ultrathink always → Deploy specialist for 3+ steps. Tool Router first. Evidence only. Ask when uncertain.
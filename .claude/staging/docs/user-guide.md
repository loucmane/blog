# Claude Code Handler System - User Guide

**Version**: 2.0  
**Updated**: 2025-08-02  
**Status**: Complete Template Migration  

## Overview

The Claude Code Handler System is a sophisticated template-based execution engine that transforms how you interact with AI development assistance. Instead of generic responses, it provides specialized, contextual handlers for every type of development task.

## What Changed in Version 2.0

### 🎯 New Handler Architecture
- **75 specialized handlers** for every development scenario
- **ULTRATHINK protocol** for deep analysis before action
- **Real-time work tracking** with automatic documentation
- **Context-aware routing** that understands your intent

### 🧠 ULTRATHINK System
Every development request now goes through mandatory deep thinking:
```
Let me ultrathink about this... [S:session|W:context|H:handler|E:evidence]
```

### 📁 Organized Templates
- **REGISTRY.md** - Complete handler index
- **WORKFLOWS.md** - Step-by-step development processes
- **BEHAVIORS.md** - Automatic enforcement hooks
- **CONVENTIONS.md** - Coding standards and patterns

## Quick Start

### 1. Natural Requests Work Best
Just tell Claude what you want to do:

✅ **Good Examples**:
- "implement user authentication"
- "fix this login bug"
- "search for the API endpoint"
- "create tests for the auth module"
- "optimize this query performance"

❌ **Avoid**:
- Generic requests: "help me code"
- Multiple tasks: "fix the bug and add tests and document it"
- Vague descriptions: "make it better"

### 2. Common Request Patterns

#### Development Work
- **"work on X"** → Starts comprehensive development workflow
- **"implement Y"** → Feature implementation with TDD
- **"fix Z"** → Problem diagnosis and resolution
- **"test A"** → Test creation and validation
- **"optimize B"** → Performance improvement workflow

#### Search & Analysis  
- **"find X"** → Smart search across codebase
- **"search for Y"** → Multi-strategy search approach
- **"explain Z"** → Code analysis and documentation
- **"analyze A"** → Deep architectural review

#### File Operations
- **"edit X"** → Convention-aware file modification
- **"create Y"** → New file with proper structure
- **"update Z"** → Systematic file updates
- **"refactor A"** → Safe code restructuring

## Handler Categories

### 🔧 Core Development (15 handlers)
- `start-new-work` - Initialize development workflow
- `implement-feature` - TDD feature implementation
- `fix-problem` - Systematic bug resolution
- `test-implementation` - Comprehensive testing
- `refactor-code` - Safe code improvement

### 🔍 Search & Analysis (12 handlers)
- `search-code` - Multi-strategy code search
- `find-symbol` - Precise symbol location
- `explain-code` - Code documentation and analysis
- `trace-execution` - Runtime behavior analysis
- `analyze-architecture` - System design review

### 📝 File Operations (10 handlers)
- `edit-file` - Convention-aware editing
- `create-file` - Structured file creation
- `update-tracker` - Progress documentation
- `backup-work` - Safe work preservation
- `manage-session` - Session state management

### 🎯 Workflow Management (8 handlers)
- `plan-approach` - Strategy development
- `validate-solution` - Quality assurance
- `commit-changes` - Git workflow management
- `end-session` - Proper session closure
- `resume-work` - Context restoration

### 🔧 Specialized Tools (20 handlers)
- `debug-error` - Error diagnosis and resolution
- `optimize-performance` - Performance improvement
- `security-audit` - Security analysis
- `dependency-management` - Package management
- `deployment-support` - Deployment assistance

## Advanced Features

### Real-Time Work Tracking
Every development session is automatically documented:
```
docs/ai/work-tracking/active/20250802-auth-system-ACTIVE/
├── tracker.md          # Progress log
├── todos.md           # Current tasks
├── discoveries.md     # Key findings
└── decisions.md       # Architecture decisions
```

### Context Preservation
Work context is preserved across sessions:
- Session state in `SESSION.md`
- Work folders in `docs/ai/work-tracking/`
- Automatic backup before major changes
- Git integration with proper commit messages

### Smart Tool Selection
The system automatically chooses the right tool:
- **Serena MCP** for code search and analysis
- **Grep** for text pattern matching
- **File operations** for editing and creation
- **Git commands** for version control

## Common Workflows

### Starting New Feature Development
```
User: "implement user profile editing"

→ Handler: start-new-work
→ Creates: docs/ai/work-tracking/active/20250802-user-profile-editing-ACTIVE/
→ Initializes: tracker.md, todos.md
→ Follows: TDD implementation workflow
→ Result: Fully documented feature development
```

### Debugging Production Issue
```
User: "users can't log in, getting 500 error"

→ Handler: fix-problem  
→ Searches: Error logs, auth code, recent changes
→ Analyzes: Root cause with evidence
→ Implements: Fix with tests
→ Documents: Problem resolution in tracker
```

### Code Review and Optimization
```
User: "this query is slow, can you optimize it?"

→ Handler: optimize-performance
→ Analyzes: Current implementation
→ Identifies: Performance bottlenecks
→ Suggests: Optimization strategies
→ Implements: Improved version with benchmarks
```

## Troubleshooting

### "Handler not found" or "VOID state"
**Solution**: Be more specific about what you want:
- Instead of: "help with code"
- Try: "implement authentication" or "fix login bug"

### "Wrong handler selected"
**Solution**: Clarify your intent:
- "I want to search for the login function"
- "I need to implement user registration"
- "Please debug this error message"

### "Template not loading"
**Solution**: Check file structure:
- Ensure `.claude/templates/` exists
- Verify handler exists in `REGISTRY.md`
- Try alternative phrasing

### "Context lost between sessions"
**Solution**: Session management:
- Check `SESSION.md` for current state
- Look for active work in `docs/ai/work-tracking/active/`
- Use "resume work on X" to continue

## Best Practices

### 1. Clear, Specific Requests
✅ **Good**: "implement JWT authentication for the API"
❌ **Bad**: "add security"

### 2. One Task at a Time
✅ **Good**: "fix the login validation bug"
❌ **Bad**: "fix login and add tests and update docs"

### 3. Provide Context When Needed
✅ **Good**: "optimize the user search query in UserService.js"
❌ **Bad**: "make it faster"

### 4. Follow the Suggested Workflow
Let the handlers guide you through proper development practices:
- Start with tests (TDD)
- Document as you go
- Commit frequently with proper messages
- Track progress in real-time

### 5. Trust the System
The ULTRATHINK protocol ensures every request gets proper analysis before action. Don't skip the thinking phase - it catches issues early.

## Getting Help

### Quick Reference
- **Handler list**: See `REGISTRY.md`
- **Common workflows**: See `WORKFLOWS.md#common-workflows`
- **Conventions**: See `CONVENTIONS.md`
- **Tool usage**: See `TOOLS.md`

### Support Requests
For help with the system itself:
- "show me available handlers for X"
- "how do I do Y with this system?"
- "what's the workflow for Z?"

### System Status
To check current state:
- "what's my current session status?"
- "show active work folders"
- "what handlers are available?"

---

**Remember**: The handler system is designed to make development more structured, documented, and reliable. Trust the process, provide clear requests, and let the specialized handlers guide you to better code and practices.
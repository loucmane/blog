# Development Conventions and Standards

This document contains all coding conventions, communication patterns, and decision-making frameworks that apply across projects.

## 🎯 Quick Navigation

- **[Code Conventions](#code-conventions)** - Naming, structure, patterns
- **[Git Conventions](#git-conventions)** - CRITICAL commit patterns
- **[Communication Patterns](#communication-patterns)** - How AI and user interact
- **[Testing Checkpoint Conventions](#testing-checkpoint-conventions)** - User testing flow
- **[Orchestration Decision Matrix](#orchestration-decision-matrix)** - When to delegate
- **[Session Conventions](#session-conventions)** - Documentation standards

## Code Conventions

### Package Manager - ALWAYS PNPM

```bash
# ✅ CORRECT
pnpm install
pnpm add <package>
pnpm dev

# ❌ WRONG
npm install      # Never use npm
yarn add         # Never use yarn
```

### Component Patterns

```typescript
// ✅ CORRECT: Always use forwardRef for components
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return <button ref={ref} className={className} {...props} />
  }
)
Button.displayName = "Button"

// ❌ WRONG: Direct export without forwardRef
export function Button(props) {
  return <button {...props} />
}
```

### Import Order Convention

```typescript
// 1. React imports
import React, { useState, useEffect } from 'react'

// 2. External library imports
import { motion } from 'framer-motion'
import clsx from 'clsx'

// 3. Monorepo package imports
import { Button } from '@repo/ui'
import type { Animal } from '@repo/shared'

// 4. Local imports
import { Header } from '@/components/Header'
import { useTheme } from '@/hooks/useTheme'

// 5. Type imports
import type { ButtonProps } from './types'
```

### File Naming

```bash
# Components - PascalCase
components/Header.tsx
components/NavigationMenu.tsx

# Utilities - camelCase
lib/formatDate.ts
utils/parseJson.ts

# Types - camelCase with .types.ts
types/animal.types.ts
types/navigation.types.ts

# Hooks - camelCase starting with 'use'
hooks/useLocalStorage.ts
hooks/useMediaQuery.ts
```

### Accessibility Standards

```typescript
// All interactive elements must have 44px minimum touch target
const Button = styled.button`
  min-height: 44px;
  min-width: 44px;
  padding: 12px 24px; // Ensures 44px height with typical text
`

// Always include ARIA labels for icon buttons
<button aria-label="Close menu" onClick={closeMenu}>
  <X size={24} />
</button>
```

## Git Conventions

### 🚨 CRITICAL: Git Commits - Use gac Alias

The developer uses this alias: `gac='git add . && git commit -m'`

**⚠️ IMPORTANT: You MUST use SINGLE QUOTES (') inside commit messages, NEVER double quotes (")**

### ✅ CORRECT Examples

```bash
gac "feat: add 'Modern Blog' feature"
gac "fix: update 'orchestrate-and-test' command"
gac "docs: improve 'SESSION.md' structure"
gac "refactor: extract 'useAuth' hook"
```

### ❌ WRONG Examples

```bash
gac "feat: add "Modern Blog" feature"      # Will break!
gac "fix: update "orchestrate" command"    # Will break!
gac 'feat: add feature'                    # Wrong quotes!
```

### Branch Naming Convention

```bash
# Format: feat/{task-id}-{descriptive-name}
feat/004-shadcn-ui-setup
feat/007-core-layout-components
fix/015-auth-timeout
refactor/023-optimize-bundles
```

### Commit Message Format

```
type(scope): description

# Types:
feat     - New feature
fix      - Bug fix
docs     - Documentation only
style    - Formatting, missing semicolons, etc
refactor - Code change that neither fixes a bug nor adds a feature
perf     - Performance improvement
test     - Adding missing tests
chore    - Changes to build process or auxiliary tools
```

## Communication Patterns

### AI Response Patterns

#### Concise by Default

```markdown
# User asks simple question
User: "What's 2+2?"
AI: "4"

# User asks for file location
User: "Where is the theme config?"
AI: "packages/ui/theme/config.ts"
```

#### Detailed When Needed

```markdown
# User asks complex question
User: "How should we handle authentication?"
AI: "Based on your security requirements, I recommend:
1. OAuth2 with Auth0 for social logins
2. JWT tokens with refresh rotation
3. Session storage in httpOnly cookies

Should I create an implementation plan?"
```

### Collaborative Decision Making

```markdown
# ✅ CORRECT: Present options
AI: "I see three approaches for state management:

1. **Context + useReducer**
   - Pros: Built-in, no deps, simple
   - Cons: Boilerplate, no devtools

2. **Zustand**
   - Pros: Minimal, TypeScript-friendly
   - Cons: External dependency

3. **TanStack Query**
   - Pros: Caching, background refetch
   - Cons: Learning curve

Which would you prefer?"

# ❌ WRONG: Make decisions for user
AI: "I'll implement this with Zustand since it's the best option."
```

## Testing Checkpoint Conventions

### Status Progression

```yaml
Subtask Status Flow:
  pending → in_progress → implemented → awaiting-test → testing → complete
                                         ↓
                                      fixing (if issues found)
```

### Testing Checkpoint Format

```markdown
✅ Implemented: [Subtask Name]

📋 Ready for Your Testing:
- **Files Changed**: [List files with brief description]
- **How to Test**: [Exact commands to run]
- **What to Check**: [Checklist of test points]
- **Known Concerns**: [Any areas of uncertainty]

I'll pause here for your testing. Let me know what you find!
```

### User Feedback Patterns

```yaml
Complete Approval:
  User: "Looks perfect!"
  AI: "Great! Moving to next subtask..."

Issues Found:
  User: "The mobile menu doesn't close"
  AI: "Fixing that now... [implements fix] Ready for re-test!"

Conditional Approval:
  User: "Works but animation is rough. Fix later?"
  AI: "Added to polish list. Continuing with next subtask..."
```

## Orchestration Decision Matrix

### Value-Based Deployment Thresholds

```yaml
Specialist Deployment Decision:
  >60% value improvement:
    Action: Auto-deploy specialist
    Message: "Deploying [specialist] for better results..."
  
  30-60% value improvement:
    Action: Quick suggestion
    Message: "This could benefit from [specialist]. Should I deploy?"
  
  <30% value improvement:
    Action: Handle directly
    Message: [No message, just implement]
```

### Subtask Analysis Framework

```yaml
For Each Subtask, Consider:
  1. Domain Expertise Required:
     - UI/UX design decisions
     - Security implications
     - Performance optimization
     - Accessibility standards
  
  2. Quality Impact:
     - Would specialist prevent bugs?
     - Would result be more maintainable?
     - Would it follow best practices better?
  
  3. Efficiency:
     - Time with specialist vs without
     - Rework probability
     - Learning opportunity
```

### Natural Language Triggers

| User Says | AI Interprets | Specialist Decision |
|-----------|---------------|-------------------|
| "Make it pretty" | UI/UX expertise needed | Deploy UI specialist |
| "Make it fast" | Performance critical | Deploy performance specialist |
| "Make it secure" | Security implications | Deploy security specialist |
| "Make it accessible" | A11y compliance | Deploy accessibility specialist |
| "Just a quick fix" | Simple change | Handle directly |
| "Following the design" | Clear requirements | Handle directly |

### Anti-Pattern Recognition

```yaml
DON'T Deploy Specialist When:
  - Boilerplate code generation
  - Simple CRUD operations
  - Following existing patterns
  - Clear, documented approach
  - User explicitly says "keep it simple"

DO Deploy Specialist When:
  - Making architectural decisions
  - User-facing UI components
  - Authentication/authorization
  - Performance-critical code
  - Accessibility requirements
```

## Session Conventions

### SESSION.md Standards

#### Required Information Sources

```yaml
MUST BE REAL DATA:
  - Date/time: From 'date' command only
  - Git user: From 'git config user.name'
  - Branch: From 'git branch --show-current'
  - Task: From user's exact words

NEVER GUESS OR ASSUME:
  - Task IDs without verification
  - Timestamps from memory
  - Developer names
  - Work completed
```

#### Progress Log Format

```markdown
### 📝 Progress Log
- **[TIMESTAMP]** - Regular work entry
- **[TIMESTAMP]** - 🎭 Orchestration: Deploying UI specialist
- **[TIMESTAMP]** - 🧪 CHECKPOINT: Awaiting user test
- **[TIMESTAMP]** - 👤 User feedback: "Issue description"
- **[TIMESTAMP]** - ✅ Complete: Feature approved
```

### Memory Naming Convention

```bash
# Session memories - include date + description
session_2025-07-09_template_system_integration
session_2025-07-08_work_tracking_setup

# Feature memories - descriptive name only
feature_authentication_oauth2_design
pattern_component_testing_workflow

# Format: session_YYYY-MM-DD_description_with_underscores
```

**Memory Best Practices**:
- **Session memories**: Always create at end of work session
- **Naming format**: `session_$(date +%Y-%m-%d)_main_work_description`
- **Content requirements**:
  - Work completed today
  - Unfinished tasks with status
  - Important decisions made
  - Next steps clearly outlined
  - "How to Initialize Next Session" section
- **Feature memories**: Create for architectural decisions, patterns discovered
- **Never forget**: Session memory is part of the workflow, not optional!

### Documentation File Conventions

```yaml
Work Tracking Folders:
  Purpose: Organize all work documentation
  Format: [yyyymmdd]-[phase]-[topic]-[STATUS]/
  Example: 20250709-phase3-claude-new-review-ACTIVE/
  Location: /docs/ai/work-tracking/{active|completed|blocked}/
  
  ⚠️ CRITICAL Date Format:
    - ALWAYS use: date +%Y%m%d  # Gets actual date
    - Format: YYYYMMDD (20250709 not 20250109)
    - NEVER type dates from memory!
  
  Required Files (all 6 must exist):
    - tracker.md         # Shows WHERE we are (progress)
    - implementation.md  # Shows HOW we're doing it (approach)
    - findings.md       # Shows WHAT we discovered (insights)
    - decisions.md      # Shows WHY we made choices (rationale)
    - memory-refs.md    # Shows CONTEXT from past (continuity)
    - handoff.md        # Shows WHAT'S NEXT (session bridge)

  Status Suffixes:
    -ACTIVE   # Currently being worked on
    -DONE     # Completed successfully
    -BLOCKED  # Stuck on external dependency

When to Create New Work vs Continue Existing:
  Create NEW work folder when:
    - Starting completely different initiative
    - Different phase of project (Phase 2 → Phase 3)
    - Unrelated feature or system
    
  Continue EXISTING work folder when:
    - Same overall initiative (e.g., all template system work)
    - Related subtasks (review → implement → test)
    - Natural progression of same work
    - Avoiding proliferation of folders
    
  One Folder Per Initiative:
    ❌ WRONG: 4 folders for template system phases
    ✅ RIGHT: 1 folder tracking all template work

6-File Structure Guidelines:
  When to use ALL 6 files:
    - Major features or systems (>3 days work)
    - Complex architectural changes
    - Multi-session initiatives
    - Work requiring handoffs
    
  When to use SUBSET (3-4 files):
    - Medium features (1-2 days)
    - Focused improvements
    - Single-session work
    Minimum: tracker.md + implementation.md + handoff.md
    
  When to use SIMPLE tracking:
    - Quick fixes (<4 hours)
    - Minor updates
    - Documentation only
    Just update SESSION.md and create memory
    
  File Purposes:
    tracker.md - Progress and status (ALWAYS needed)
    implementation.md - Technical approach (for coding work)
    findings.md - Discoveries and insights (when exploring)
    decisions.md - Rationale for choices (when multiple options)
    memory-refs.md - Related context (for continuity)
    handoff.md - Next steps (ALWAYS needed for multi-session)

Legacy Formats (being phased out):
  Tracker Files: feature-name-tracker.md in /docs/[category]/
  Implementation Plans: feature-name-implementation.md scattered
  Journey Documents: feature-name-journey.md when complex
```

## Common Mistakes to Avoid

### ❌ Code Mistakes

```typescript
// Wrong: No forwardRef
export const Input = (props) => <input {...props} />

// Wrong: Wrong import order  
import { Input } from './Input'
import React from 'react'

// Wrong: No accessibility
<button onClick={handleClose}>X</button>
```

### ❌ Git Mistakes

```bash
# Wrong: Double quotes in gac
gac "fix: update "Header" component"

# Wrong: Wrong branch format
my-feature-branch
feature-7-layouts
```

### ❌ Communication Mistakes

```markdown
# Wrong: Making decisions for user
"I'll use Redux for state management"

# Wrong: Being vague about issues
"There might be some problems with mobile"

# Wrong: No testing checkpoint
"Feature complete! Moving to next task"
```

### ❌ Session Mistakes

```markdown
# Wrong: Guessed timestamp
**2025-01-07 14:30** - Started work

# Wrong: Assumed task
**Task**: Probably working on authentication

# Wrong: No user verification
Moving to task 8 implementation...
```

## Quick Reference

### Essential Commands

```bash
# Always for dates
date "+%Y-%m-%d %H:%M %Z"

# Always for commits  
gac "type: description with 'single quotes' inside"

# Always for tasks
mcp__taskmaster-ai__get_tasks
mcp__taskmaster-ai__get_task --id [ID]

# Always for testing
pnpm dev
pnpm test
pnpm build
```

### Decision Flowchart

```
User Request → Complexity? → Low: Handle directly
                          → High: Ultrathink → Value analysis → Deploy?
                                                              ↓
                                                    Yes: Specialist
                                                    No: Handle directly
```

## 📚 See Also

- **[WORKFLOWS.md](WORKFLOWS.md)** - Complete workflow documentation
- **[TOOLS.md](TOOLS.md)** - Tool configurations and usage
- **[CLAUDE-NEW.md](CLAUDE-NEW.md)** - Quick navigation hub
- **[PROJECT-BLOG.md](PROJECT-BLOG.md)** - Project-specific conventions
- **[BUILDING-BETTER.md](BUILDING-BETTER.md)** - How patterns evolve

---

Remember: Conventions exist to create consistency and prevent errors. When in doubt, check this guide!
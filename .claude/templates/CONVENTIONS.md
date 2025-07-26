# Development Conventions and Standards

This document contains all coding conventions, communication patterns, and decision-making frameworks that apply across projects.

## 📍 When to Check This Document

**Before you:**
- Write any code → Check [Code Conventions](#code-conventions)
- Make a commit → Check [Git Conventions](#git-conventions)
- Respond to user → Check [Communication Patterns](#communication-patterns)
- Create a checkpoint → Check [Testing Conventions](#testing-checkpoint-conventions)
- Name a file/folder → Check [Naming Conventions](#naming-conventions)
- Deploy a specialist → Check [Orchestration Matrix](#orchestration-decision-matrix)
- Search for code → Check [Serena Workflow Patterns](#serena-workflow-patterns)
- Analyze code structure → Check [Serena Workflow Patterns](#serena-workflow-patterns)

**After you:**
- Discover a new pattern → Add it here
- Find a better way → Update the convention
- Make a mistake → Add prevention rule

## 🎯 Quick Navigation

- **[Common Commands](#common-commands)** - Copy-paste commands for daily use
- **[Code Conventions](#code-conventions)** - Naming, structure, patterns
- **[Git Conventions](#git-conventions)** - CRITICAL commit patterns
- **[Communication Patterns](#communication-patterns)** - How AI and user interact
- **[Testing Checkpoint Conventions](#testing-checkpoint-conventions)** - User testing flow
- **[Orchestration Decision Matrix](#orchestration-decision-matrix)** - When to delegate
- **[Session Conventions](#session-conventions)** - Documentation standards
- **[Serena Workflow Patterns](#serena-workflow-patterns)** - Semantic code navigation
- **[Core Development Principles](#core-development-principles)** - Guiding principles with WHYs
- **[Convention Handlers](#convention-handlers)** - NEW! Protocol navigation handlers
- **[Common Convention Violations](#common-convention-violations)** - Mistakes to avoid

## ULTRATHINK Integration {#ultrathink-integration}

This file participates in the ULTRATHINK system:

### VOID Resolution
- **S = VOID** → See [resolve-session-void](#resolve-session-void)
- **W = VOID** → See [resolve-work-void](WORKFLOWS.md#resolve-work-void)
- **H = VOID** → See [resolve-handler-void](REGISTRY.md#resolve-handler-void)

### Handler Requirements
All convention handlers expect valid [S:W:H] context. The resolve-session-void handler in this file specifically handles S = VOID cases.

## 🚫 VIOLATION TRAPS - If You're Here, You're About to Make a Mistake!

### About to type a timestamp? {#timestamp-trap}
**STOP!** You're violating timestamp conventions.
- ❌ **WRONG**: "2025-07-10 15:45 CEST" (typed from memory)
- ✅ **RIGHT**: `date "+%Y-%m-%d %H:%M %Z"` (copy output)
- **WHY**: Human timestamp typing has 30% error rate
- **LAST VIOLATION**: Wrong date in SESSION.md caused session corruption

### About to use 'grep' or 'find'? {#grep-trap}
**STOP!** You're violating search conventions.
- ❌ **WRONG**: `grep -r "function" .` 
- ✅ **RIGHT**: `mcp__serena__search_for_pattern`
- **WHY**: grep doesn't understand code structure, misses 40% of references
- **LAST VIOLATION**: Missed 3 critical function usages, bug went to production

### About to edit without reading? {#edit-trap}
**STOP!** You're violating edit conventions.
- ❌ **WRONG**: Edit file directly
- ✅ **RIGHT**: Read → Understand → Edit
- **WHY**: Edit tool requires exact string match from Read
- **LAST VIOLATION**: Edit failed 5 times due to whitespace mismatch

### About to use npm or yarn? {#npm-trap}
**STOP!** You're violating package manager conventions.
- ❌ **WRONG**: `npm install`, `yarn add`
- ✅ **RIGHT**: `pnpm install`, `pnpm add`
- **WHY**: Project uses pnpm workspaces, npm/yarn break dependencies
- **LAST VIOLATION**: npm created conflicting lock file, broke CI

### About to name a component file? {#naming-trap}
**STOP!** Check naming conventions.
- ❌ **WRONG**: `button.tsx`, `user-profile.tsx`
- ✅ **RIGHT**: `Button.tsx`, `UserProfile.tsx`
- **WHY**: React components use PascalCase for consistency
- **LAST VIOLATION**: Lowercase component broke imports in 3 files

### About to commit without gac? {#gac-trap}
**STOP!** You're violating git conventions.
- ❌ **WRONG**: `git add . && git commit -m "message"`
- ✅ **RIGHT**: `gac "message"`
- **WHY**: gac alias ensures consistent commit format
- **LAST VIOLATION**: Manual commit had wrong format, broke changelog

### About to deploy specialist without constraints? {#deploy-trap}
**STOP!** You're violating deployment conventions.
- ❌ **WRONG**: Task tool without constraints
- ✅ **RIGHT**: Include MANDATORY CONSTRAINTS section
- **WHY**: Unconstrained specialists corrupt SESSION.md and use wrong tools
- **LAST VIOLATION**: Specialist edited SESSION.md, created duplicate entries

## Common Commands {#common-commands}

These are the most frequently used commands. Always copy-paste, never type!

```bash
# Timestamps - ALWAYS use for documentation
date "+%Y-%m-%d %H:%M %Z"        # Full timestamp (2025-07-10 15:45 CEST)
date +%Y%m%d                      # Folder names (20250709)

# Git Operations
gac "commit message"              # git add . && commit (use 'single quotes' inside)
git status                        # Check before committing
git diff                          # Review changes

# Navigation
pwd && git branch --show-current  # Check location and branch
ls -la                           # List with hidden files

# Testing (check package.json for project-specific commands)
pnpm test                         # Run tests (if configured)
pnpm run lint                     # Check code style (if configured)
pnpm run typecheck               # TypeScript checking (if configured)
```

## Code Conventions {#code-conventions}

### Naming Conventions - Quick Reference {#naming-conventions}

| Type | Convention | Example |
|------|------------|---------|
| **Components** | PascalCase | `Button`, `HeaderNav`, `UserProfile` |
| **Files (React)** | PascalCase.tsx | `Button.tsx`, `Header.tsx` |
| **Files (utils)** | camelCase.ts | `formatDate.ts`, `parseUrl.ts` |
| **Folders** | kebab-case | `user-profile`, `api-client` |
| **CSS/SCSS** | kebab-case | `button-styles.css` |
| **Constants** | UPPER_SNAKE | `MAX_RETRIES`, `API_URL` |
| **Interfaces** | PascalCase + suffix | `ButtonProps`, `UserData` |
| **Hooks** | use + PascalCase | `useTheme`, `useAuth` |
| **Work folders** | YYYYMMDD-phase-topic-STATUS | `20250709-phase3-review-ACTIVE` |

### Package Manager - ALWAYS PNPM {#package-manager}

```bash
# ✅ CORRECT
pnpm install
pnpm add <package>
pnpm dev

# ❌ WRONG
npm install      # Never use npm
yarn add         # Never use yarn
```

### Component Patterns {#component-patterns}

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

### Real Examples from Our Codebase {#real-examples}

```typescript
// From packages/ui/src/components/Button/Button.tsx
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

// From packages/web/src/components/ui/button.tsx
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Implementation
  }
)
```

### Import Order Convention {#import-order}

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

### File Naming {#file-naming}

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

### Accessibility Standards {#accessibility}

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

## Git Conventions {#git-conventions}

### 🚨 CRITICAL: Git Commits - Use gac Alias {#gac-format}

The developer uses this alias: `gac='git add . && git commit -m'`

**⚠️ IMPORTANT: You MUST use SINGLE QUOTES (') inside commit messages, NEVER double quotes (")**

**📝 When user asks for gac commit message:**
- Give ONLY the raw commit message text
- NO code blocks or formatting
- NO "Here's your message:" prefix
- Just the plain text they can use with gac

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

### Branch Naming Convention {#branch-naming}

```bash
# Format: feat/{task-id}-{descriptive-name}
feat/004-shadcn-ui-setup
feat/007-core-layout-components
fix/015-auth-timeout
refactor/023-optimize-bundles
```

### Commit Message Format {#commit-message-format}

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

## Communication Patterns {#communication-patterns}

### Evidence-Based Communication {#evidence-based}

**CRITICAL**: All claims must be backed by evidence.

```markdown
# ❌ WRONG: Unsupported claims
"The new approach is better"
"Previous code was messy"
"This will improve performance"

# ✅ CORRECT: Evidence-based statements
"The new approach reduces bundle size by 15KB (measured)"
"Previous code had 3 eslint warnings (lines 45, 67, 89)"
"This improves LCP by 200ms (before: 1.2s, after: 1.0s)"

# ✅ CORRECT: Acknowledging uncertainty
"I'm not certain about the performance impact"
"Based on the 3 files I examined..."
"I would need to analyze more code to be sure"
```

### AI Response Patterns {#ai-response-patterns}

#### Concise by Default {#concise-default}

```markdown
# User asks simple question
User: "What's 2+2?"
AI: "4"

# User asks for file location
User: "Where is the theme config?"
AI: "packages/ui/theme/config.ts"
```

#### Detailed When Needed {#detailed-when-needed}

```markdown
# User asks complex question
User: "How should we handle authentication?"
AI: "Based on your security requirements, I recommend:
1. OAuth2 with Auth0 for social logins
2. JWT tokens with refresh rotation
3. Session storage in httpOnly cookies

Should I create an implementation plan?"
```

### Collaborative Decision Making {#collaborative-decisions-comm}

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

## Testing Checkpoint Conventions {#testing-checkpoint}

### Status Progression {#status-progression}

```yaml
Subtask Status Flow:
  pending → in_progress → implemented → awaiting-test → testing → complete
                                         ↓
                                      fixing (if issues found)
```

### Testing Checkpoint Format {#checkpoint-format}

```markdown
✅ Implemented: [Subtask Name]

📋 Ready for Your Testing:
- **Files Changed**: [List files with brief description]
- **How to Test**: [Exact commands to run]
- **What to Check**: [Checklist of test points]
- **Known Concerns**: [Any areas of uncertainty]

I'll pause here for your testing. Let me know what you find!
```

### User Feedback Patterns {#user-feedback}

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

## Orchestration Decision Matrix {#orchestration-matrix}

### Clear Deployment Rules {#deployment-rules}

```yaml
Always Deploy Specialist:
  - 3+ steps/subtasks in the work
  - Security/authentication/authorization
  - Payment processing
  - Accessibility (WCAG, screen readers)
  - Database migrations
  - API design/breaking changes
  
Deploy & Review Pattern:
  - Complex task identified (3+ steps)
  - Deploy specialist for analysis
  - "Here's my breakdown: [plan]. Should we proceed?"
  - User reviews/adjusts
  - Implement with checkpoints
  
Solo Work OK:
  - 1-2 clear steps
  - Simple bug fixes
  - Documentation updates
  - Style/formatting changes
  - Adding comments
```

### Subtask Analysis Framework {#subtask-analysis}

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

### Natural Language Triggers {#language-triggers}

| User Says | AI Interprets | Specialist Decision |
|-----------|---------------|-------------------|
| "Make it pretty" | UI/UX expertise needed | Deploy UI specialist |
| "Make it fast" | Performance critical | Deploy performance specialist |
| "Make it secure" | Security implications | Deploy security specialist |
| "Make it accessible" | A11y compliance | Deploy accessibility specialist |
| "Just a quick fix" | Simple change | Handle directly |
| "Following the design" | Clear requirements | Handle directly |

### Anti-Pattern Recognition {#anti-patterns}

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

## Session Conventions {#session-conventions}

### SESSION.md Standards {#session-standards}

#### Critical Entry Order Rule {#entry-order}

```yaml
SESSION ENTRIES MUST BE:
  - At the TOP of the file (after Current Focus)
  - In reverse chronological order (newest first)
  - NEVER appended at the bottom
  
❌ WRONG: Adding new session at end of file
✅ RIGHT: Adding new session after Current Focus section

Structure (EXACT format required):
1. # AI Development Session Log (or # Session Documentation)
2. ## Current Focus
   [Brief description of what we're currently working on]
   
3. ## Session: [TODAY'S DATE] <- NEW ENTRIES GO HERE
   **AI Assistant**: Claude (model) ✓
   **Developer**: [from git config]
   **Task**: [from user's exact words]
   ...session content...
   
4. ## Previous Session: [OLDER DATE]  
   ...older session content...
   
5. (older sessions follow in reverse chronological order)

⚠️ CRITICAL: If "## Current Focus" is missing, ADD IT before creating new session!
```

#### Required Information Sources {#info-sources}

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

CRITICAL TIMESTAMP RULE:
  - ALWAYS run: date "+%Y-%m-%d %H:%M %Z"
  - NEVER type timestamps manually
  - This applies to:
    - SESSION.md entries
    - Progress logs
    - Memory file names
    - Work tracking updates
    - Any documentation with times
```

#### Progress Log Format {#progress-log-format}

```markdown
### 📝 Progress Log
- **[HH:MM]** - Regular work entry (use `date '+%H:%M'` for actual time)
- **[HH:MM]** - 🎭 Orchestration: Deploying UI specialist
- **[HH:MM]** - 🧪 CHECKPOINT: Awaiting user test
- **[HH:MM]** - 👤 User feedback: "Issue description"
- **[HH:MM]** - ✅ Complete: Feature approved

⚠️ CRITICAL: Always run `date '+%H:%M'` to get actual timestamp
❌ NEVER make up times like "14:15" without checking
✅ ALWAYS use the output from date command
```

### Memory Naming Convention {#memory-naming}

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

### Session End / Compaction Requirements {#session-end}

```yaml
WHENEVER STOPPING (for any reason):
  1. Update SESSION.md progress log with final timestamp
  2. Update work folder HANDOFF.md with current state
  3. Update TRACKER.md checkboxes
  4. Create session memory (session_YYYY-MM-DD_description)
  5. Provide initialization message
  6. Provide git commit message (gac "...")
  
Common Stop Triggers:
  - "Let's end here" (planned stop)
  - "We're at X%" (memory full)
  - "Thanks, that's all" (work complete)
  - Natural pause point reached
  
Initialization Message Format:
  ```
  Activate project /home/loucmane/dev/javascript/MomsBlog/blog, 
  read memory session_YYYY-MM-DD_description and SESSION.md.
  [One line about what to continue].
  ```
  
Git Commit Message Format (use single quotes inside double):
  ```
  gac "type: comprehensive one-line summary
  
  - Major accomplishment or change
  - Another significant update  
  - Key feature or fix
  - Important refactor or cleanup
  
  Work tracking: active-folder-names"
  ```
  
  Example with quotes:
  ```
  gac "feat: add 'Development Mode' checkpoint to execution engine
  
  - Added checkpoint with 'trigger detection' phase
  - Implemented 'handler lookup' verification
  - Created 'ERROR' state for non-compliance
  
  Work tracking: 20250718-checkpoint-implementation-ACTIVE"
  ```
  
Message Types:
  - feat: New feature or capability
  - fix: Bug fix or correction
  - docs: Documentation updates
  - refactor: Code restructuring
  - test: Test additions/changes
  - chore: Maintenance tasks
```

### Documentation File Conventions {#doc-conventions}

```yaml
Work Tracking Folders:
  Purpose: Organize all work documentation
  Format: [yyyymmdd]-[phase]-[topic]-[STATUS]/
  Example: 20250709-phase3-claude-new-review-ACTIVE/
  Location: /docs/ai/work-tracking/{active|completed|paused|abandoned|superseded}/
  
  Archive Naming Convention:
    - **active/**: Currently being worked on → folder-name-ACTIVE
    - **completed/**: Work successfully finished → folder-name-COMPLETE
    - **paused/**: Work on hold, might resume → folder-name-PAUSED
    - **abandoned/**: Work stopped, won't continue → folder-name-ABANDONED  
    - **superseded/**: Work replaced by newer approach → folder-name-SUPERSEDED
  
  Examples:
    - 20250716-navigation-improvements-ACTIVE (current work)
    - 20250715-claude-execution-serena-COMPLETE (finished successfully)
    - 20250713-hook-system-implementation-PAUSED (built but on hold)
    - 20250714-search-feature-ABANDONED (had errors, won't fix)
    - 20250709-workflow-patterns-SUPERSEDED (replaced by new design)
  
  ⚠️ CRITICAL Date Format:
    - ALWAYS use: date +%Y%m%d  # Gets actual date
    - Format: YYYYMMDD (20250709 not 20250109)
    - NEVER type dates from memory!
  
  Core Files (7 required, ALL CAPS):
    - IMPLEMENTATION.md  # The implementation PLAN (what we intend to do)
    - TRACKER.md        # Checkbox tasks tracking the plan execution
    - CHANGELOG.md      # What we actually built/changed (results)
    - FINDINGS.md       # Discoveries, test results, insights
    - DECISIONS.md      # Key decisions with rationale
    - MEMORY-REFS.md    # Related session memories
    - HANDOFF.md        # Session transition and next steps
  
  Folder Structure:
    - plans/            # Detailed plans, roadmaps
    - designs/          # DDII documents, analysis, architecture
    - code/             # Code attempts (what worked/failed)
    - archive/          # Old versions with .old suffix
  
  File Roles Clarified:
    - IMPLEMENTATION = The plan (NOT what was built)
    - TRACKER = Checkboxes (NOT general progress log)
    - CHANGELOG = Actual changes made (NEW file)
    - code/ = Track iterations: v1-failed.md, v2-working.md
  
  When to Update Each File:
    - IMPLEMENTATION.md: When planning approach (start of work)
    - TRACKER.md: Extract tasks from plan, check off as completed
    - CHANGELOG.md: After making actual changes to code/docs
    - FINDINGS.md: When discovering something noteworthy
    - DECISIONS.md: When choosing between alternatives
    - MEMORY-REFS.md: When referencing past sessions
    - HANDOFF.md: At session end with current state
    - code/: When trying different code approaches
  
  Workflow:
    1. Create IMPLEMENTATION.md with the plan
    2. Extract checkbox tasks → TRACKER.md
    3. Work through tasks, checking them off
    4. Document changes → CHANGELOG.md
    5. Track code attempts → code/ folder
    6. Record insights → FINDINGS.md
    7. Log decisions → DECISIONS.md
    8. Update HANDOFF.md before ending session

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

Work Preservation Principle:
  ALWAYS preserve iteration history:
    - Append new findings, don't overwrite
    - Track what didn't work and why
    - Document abandoned approaches
    - Keep evolution visible

Work Tracking File Structure:
  tracker.md MUST follow this exact structure:
    1. Header section (title, dates, status)
    2. ## Goals (checklist format)
    3. ## Progress Log (chronological entries)
    4. ## Current State (present status)
    5. ## Next Steps (upcoming actions)
  
  NEVER append progress entries to wrong sections:
    ❌ WRONG: Adding progress under "Next Steps"
    ✅ RIGHT: Adding progress under "Progress Log"
  
  Before editing tracker.md:
    1. Find the "## Progress Log" section
    2. Add new entries at the END of that section
    3. Verify you're not in Current State or Next Steps
    
  CRITICAL: When updating tracker.md:
    - Progress Log: APPEND new timestamped entries
    - Current State: UPDATE/REPLACE with current status
    - Next Steps: UPDATE/REPLACE with new priorities
    - NEVER append to Current State section!
  
  Example:
    ## Attempt 1: [Approach Name]
    What we tried: [Description]
    Why it failed: [Reasons]
    
    ## Attempt 2: [Improved Approach]
    What changed: [Modifications]
    Result: [Outcome]
    
  This prevents working in circles!
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

## Common Mistakes to Avoid {#common-mistakes}

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

## Quick Reference {#quick-reference}

### Essential Commands {#essential-commands}

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

### Decision Flowchart {#decision-flowchart}

```
User Request → Complexity? → Low: Handle directly
                          → High: Ultrathink → Value analysis → Deploy?
                                                              ↓
                                                    Yes: Specialist
                                                    No: Handle directly
```

## Serena Workflow Patterns {#serena-workflows}

### When to Use Serena vs Other Tools {#serena-vs-others}

| Task | Use Serena | Use Other Tool |
|------|------------|----------------|
| Find a function/class | `find_symbol` | - |
| Search for code patterns | `search_for_pattern` | Grep (for non-code files) |
| Understand file structure | `get_symbols_overview` | LS (for directory listing) |
| Find who uses a symbol | `find_referencing_symbols` | - |
| Replace entire function | `replace_symbol_body` | Edit (for small changes) |
| Add new function/import | `insert_before/after_symbol` | Write (for new files) |
| Save session knowledge | `write_memory` | - |

### Common Serena Workflows {#common-serena-workflows}

#### 1. Code Discovery Flow
```bash
# Step 1: Get overview of area
mcp__serena__get_symbols_overview --relative_path="packages/web/src/components"

# Step 2: Find specific symbol
mcp__serena__find_symbol --name_path="Button" --include_body=true

# Step 3: Find all usages
mcp__serena__find_referencing_symbols --name_path="Button" --relative_path="packages/web/src/components/Button.tsx"
```

#### 2. Refactoring Flow
```bash
# Step 1: Find all instances to change
mcp__serena__search_for_pattern --pattern="oldPattern" --restrict_search_to_code_files=true

# Step 2: Check impact
mcp__serena__find_referencing_symbols --name_path="TargetSymbol" --relative_path="file.tsx"

# Step 3: Make changes
mcp__serena__replace_symbol_body --name_path="functionName" --relative_path="file.tsx" --body="new implementation"
```

#### 3. Analysis Flow (like we did today!)
```bash
# Step 1: Search for patterns across files
mcp__serena__search_for_pattern --pattern="Session.*Validation" --context_lines_after=15

# Step 2: Extract specific sections
mcp__serena__search_for_pattern --pattern="specific_section" --relative_path="SESSION.md"

# Step 3: Count occurrences
# Use results with | wc -l or analyze JSON response
```

#### 4. Memory Management Flow
```bash
# At session end
mcp__serena__write_memory \
  --memory_name="session_$(date +%Y-%m-%d)_topic" \
  --content="Key discoveries and decisions..."

# At session start
mcp__serena__list_memories
mcp__serena__read_memory --memory_file_name="relevant_memory.md"
```

### Serena Best Practices {#serena-best-practices}

1. **Use semantic search over file paths**
   - Don't: Navigate to `/src/components/Button.tsx`
   - Do: `find_symbol --name_path="Button"`

2. **Leverage symbol understanding**
   - Don't: Use grep to find function usage
   - Do: `find_referencing_symbols` for accurate results

3. **Work with code structure**
   - Don't: Manually count methods in a class
   - Do: `find_symbol --name_path="ClassName" --depth=1`

4. **Save important discoveries**
   - Don't: Rely on SESSION.md alone
   - Do: Create focused memories for key insights

## Common Convention Violations {#convention-violations}

### 🚫 Top Mistakes to Avoid

1. **Using npm instead of pnpm**
   - Always check package.json for the packageManager field
   - Our project uses pnpm exclusively

2. **Forgetting forwardRef**
   - Every component that might need a ref should use forwardRef
   - Even if you don't need it now, add it for future compatibility

3. **Wrong commit format**
   - Always use `gac "type: message"` 
   - Never use `git commit -m`
   - Type must be one of: feat, fix, docs, style, refactor, perf, test, chore

4. **Making claims without evidence**
   - Never say "better" without metrics
   - Never say "all" without checking all
   - Never generalize from one example

5. **Skipping user testing checkpoints**
   - Always pause after implementation
   - Always provide clear testing instructions
   - Never assume it works

## Core Development Principles {#core-principles}

These principles guide all development decisions and interactions.

### Communication {#communication-principles}
- Be concise and direct
- Explain commands before running  
- No emojis unless requested
- Focus on user's actual request
- **Make evidence-based claims only** - WHY: False claims destroy trust
- **State uncertainties explicitly** - WHY: Honesty over false confidence

### Code Quality {#code-quality-principles}
- Follow existing patterns - WHY: Consistency reduces bugs
- Check dependencies first - WHY: Avoid version conflicts
- Never commit secrets - WHY: Security breach prevention
- Test before declaring done - WHY: Catches issues early

### Documentation {#documentation-principles}
- SESSION.md tracks everything - WHY: Enables continuity
- Decisions need reasoning - WHY: Future understanding
- Create trackers for complex work - WHY: Prevents loss
- Memory prevents repetition - WHY: Efficiency

### Collaborative Decision Making {#collaborative-decisions-dev}
- User has final say on implementations
- Present options with pros/cons
- Ask when uncertain rather than guess
- Document discussions before implementing

### Problem-Solving Approach {#problem-solving}
- Think before acting - analyze thoroughly
- Break complex tasks into steps (TodoWrite)
- Verify understanding before proceeding
- Test assumptions with small experiments

### Development Process (D-D-I-I) {#ddii-process}
**Document → Draft → Iterate → Implement**
- **Document First** - Track work, capture findings, record decisions
  - WHY: Prevents work loss and circular thinking
- **Draft Second** - Create initial designs in work tracking
  - WHY: Cheap to change text vs code
- **Iterate Third** - Refine based on feedback and testing
  - WHY: Catches issues before coding
- **Implement Last** - Only code after design is solid
  - WHY: Reduces rework and technical debt

This mirrors our ultrathinking approach: think deeply before acting

### Continuous Improvement {#continuous-improvement}
- When you find gaps, improve the workflow immediately
- Nothing is done until integrated where it will be used
- Track all work in organized folders
- Apply lessons learned immediately

## Convention Handlers {#convention-handlers}

This section defines how to handle convention enforcement requests when routed from CLAUDE.md's protocol-based navigation.

### Evidence Handlers {#evidence-handlers}

#### Handler: verify-claim {#verify-claim}
**Triggers**: "prove X is true", "verify that Y", "confirm Z"
**Target Pattern**: Extract claim to verify
**Pre-conditions**: 
- Claim is specific and verifiable
- Code/documentation accessible
**Process**:
1. Parse claim into verifiable components
2. **PRIMARY**: Use Serena to find evidence:
   - Symbol definitions for code claims
   - Pattern search for implementation claims
   - Reference search for usage claims
3. Gather concrete file:line references
4. Present evidence with context
5. State confidence level
**Success**: Claim verified with evidence
**Failure**: Cannot verify, show what was checked
**Examples**:
- "prove the auth system uses JWT" → Find JWT imports/usage
- "verify all tests pass" → Run tests and show results

#### Handler: gather-evidence {#gather-evidence}
**Triggers**: "find evidence for X", "gather proof of Y", "show support for Z"
**Target Pattern**: Topic needing evidence
**Pre-conditions**: 
- Clear evidence target
- Relevant sources available
**Process**:
1. Identify evidence types needed
2. **PRIMARY**: Serena searches:
   - Code implementation
   - Documentation
   - Test coverage
   - Comments/commits
3. **SECONDARY**: External evidence:
   - Package.json dependencies
   - Config files
   - Git history
4. Organize by relevance
5. Summarize findings
**Success**: Multiple evidence sources found
**Failure**: Limited evidence available
**Examples**:
- "find evidence of performance optimization" → Code patterns + commits
- "gather proof of security measures" → Auth code + tests

#### Handler: cite-source {#cite-source}
**Triggers**: "where does this come from", "what's the source", "cite your reference"
**Target Pattern**: Information needing citation
**Pre-conditions**: 
- Previous claim or information stated
- Source should be traceable
**Process**:
1. Identify information to cite
2. **PRIMARY**: Trace to source:
   - Code location (file:line)
   - Documentation section
   - Tool output
   - Memory reference
3. Provide exact reference
4. Include relevant context
5. Link to full source
**Success**: Source cited with precision
**Failure**: Source unclear, explain search
**Examples**:
- "where does that error come from" → Stack trace file:line
- "cite the naming convention" → CONVENTIONS.md:section

### Naming Handlers {#naming-handlers}

#### Handler: check-naming {#check-naming}
**Triggers**: "is X named correctly", "check naming of Y", "validate name Z"
**Target Pattern**: Name to validate
**Pre-conditions**: 
- Name type identifiable
- Conventions documented
**Process**:
1. Identify name type:
   - File/folder
   - Function/method
   - Variable/constant
   - Component/class
2. **PRIMARY**: Check against conventions:
   - Read naming section
   - Apply specific rules
   - Check similar examples
3. Use Serena to find patterns
4. Compare and validate
5. Provide verdict with reasoning
**Success**: Clear pass/fail with explanation
**Failure**: Ambiguous case, show options
**Examples**:
- "is getUserData named correctly" → Check camelCase convention
- "validate component name" → Check PascalCase rule

#### Handler: suggest-name {#suggest-name}
**Triggers**: "what should I call X", "suggest name for Y", "naming ideas for Z"
**Target Pattern**: Thing needing a name
**Pre-conditions**: 
- Purpose is clear
- Context available
**Process**:
1. Understand purpose and context
2. **PRIMARY**: Use Serena to find similar items
3. Extract naming patterns
4. Apply conventions:
   - Correct case style
   - Meaningful prefixes
   - Domain terminology
5. Generate 3-5 suggestions
6. Explain reasoning for each
**Success**: Quality name suggestions provided
**Failure**: Need more context
**Examples**:
- "name for auth helper" → `validateToken`, `checkAuth`
- "suggest test file name" → `auth.test.ts`, `auth.spec.ts`

#### Handler: validate-path {#validate-path}
**Triggers**: "is this the right location", "check file placement", "validate path"
**Target Pattern**: File path to validate
**Pre-conditions**: 
- Path or file type clear
- Project structure known
**Process**:
1. Parse path components
2. **PRIMARY**: Use Serena to find similar files
3. Check project structure conventions
4. Validate against patterns:
   - Source organization
   - Test colocation
   - Asset placement
5. Provide assessment
**Success**: Path validated with reasoning
**Failure**: Multiple valid options exist
**Examples**:
- "is src/utils/auth.ts correct" → Validate utils pattern
- "check test file location" → Confirm colocation rule

### Code Style Handlers {#code-style-handlers}

#### Handler: check-style {#check-style}
**Triggers**: "does X follow conventions", "check style of Y", "review code style"
**Target Pattern**: Code to style-check
**Pre-conditions**: 
- Code accessible
- Style rules defined
**Process**:
1. Read code section
2. **PRIMARY**: Apply style checks:
   - Indentation (spaces/tabs)
   - Line length
   - Brace style
   - Comment format
3. Use Serena for pattern comparison
4. Check against linter rules
5. List all violations found
**Success**: Style issues identified
**Failure**: Style rules unclear
**Examples**:
- "check function style" → Validate formatting
- "does this follow conventions" → Full style review

#### Handler: format-code {#format-code}
**Triggers**: "format X properly", "fix formatting", "clean up style"
**Target Pattern**: Code needing formatting
**Pre-conditions**: 
- Code readable
- Format rules clear
**Process**:
1. Identify code boundaries
2. **PRIMARY**: Determine format rules:
   - Language-specific
   - Project preferences
   - Linter config
3. Apply formatting:
   - Fix indentation
   - Adjust line breaks
   - Align elements
4. Preserve functionality
5. Show before/after
**Success**: Code properly formatted
**Failure**: Formatter conflicts
**Examples**:
- "format this function" → Apply standard style
- "fix indentation" → Correct spacing

#### Handler: review-patterns {#review-patterns}
**Triggers**: "is this idiomatic", "check patterns", "review approach"
**Target Pattern**: Code pattern to review
**Pre-conditions**: 
- Pattern identifiable
- Best practices known
**Process**:
1. Identify pattern type
2. **PRIMARY**: Use Serena to find examples
3. Compare against:
   - Language idioms
   - Framework patterns
   - Project conventions
4. Assess idiomaticity
5. Suggest improvements
**Success**: Pattern assessed with alternatives
**Failure**: Novel pattern, needs discussion
**Examples**:
- "is this React pattern idiomatic" → Check hooks usage
- "review error handling" → Validate try/catch patterns

### Git Convention Handlers {#git-handlers}

#### Handler: check-commit-msg {#check-commit-msg}
**Triggers**: "is this commit message valid", "check commit format", "validate message"
**Target Pattern**: Commit message to validate
**Pre-conditions**: 
- Message provided
- Format rules defined
**Process**:
1. Parse message structure
2. **PRIMARY**: Check format:
   - Type prefix (feat/fix/etc)
   - Scope (optional)
   - Description length
   - Body format
3. Validate against conventional commits
4. Check project-specific rules
5. Provide pass/fail with fixes
**Success**: Message validated
**Failure**: Format violations found
**Examples**:
- "check: feat: add auth" → Validate prefix format
- "is this message ok" → Full format check

#### Handler: suggest-commit-type {#suggest-commit-type}
**Triggers**: "what type is this change", "commit type for X", "should this be feat or fix"
**Target Pattern**: Change description
**Pre-conditions**: 
- Changes understood
- Commit types defined
**Process**:
1. Analyze change nature
2. **PRIMARY**: Match to types:
   - feat: New feature
   - fix: Bug fix
   - docs: Documentation
   - style: Formatting
   - refactor: Code restructure
   - test: Test changes
   - chore: Maintenance
3. Consider impact
4. Recommend type with reasoning
**Success**: Clear type recommendation
**Failure**: Ambiguous change type
**Examples**:
- "added login button" → feat
- "fixed typo in readme" → docs

### Session Handlers {#session-handlers}

#### Handler: session-start {#session-start}
**Triggers**: "start new session", "begin session", "new session"
**Target Pattern**: User's task description
**Pre-conditions**: 
- SESSION.md exists and accessible
- Git status available
- Date command available
**Process**:
1. **CRITICAL**: Check if "## Current Focus" exists
   - If missing, add it after main header
   - Update with current work description
2. Get required data:
   - `date "+%Y-%m-%d %H:%M %Z"` for timestamp
   - `git config user.name` for developer
   - `git branch --show-current` for branch
   - User's exact task description
3. Create session entry AFTER Current Focus:
   ```markdown
   ## Session: [TIMESTAMP]
   **AI Assistant**: Claude (model) ✓
   **Developer**: [name]
   **Task**: [exact user words]
   **Task Source**: User request
   **TaskMaster ID**: [if applicable]
   
   ### Session Validation ✓
   - [x] Date from `date` command: [timestamp]
   - [x] Task verified by: user request
   - [x] Git status checked: Yes - [branch]
   - [x] TaskMaster tasks reviewed: [status]
   - [x] Previous SESSION.md read: Yes
   
   ### 🎯 Session Goals
   - [ ] Primary: [main goal]
   - [ ] Secondary: [secondary goal]
   - [ ] Tertiary: [tertiary goal]
   
   ### 📍 Starting Context
   [context description]
   
   ### Current Focus:
   [what we're working on right now]
   ```
4. DO NOT append at bottom of file!
**Success**: Session created after Current Focus
**Failure**: Missing Current Focus section
**Examples**:
- "start new session" → Create full session structure
- "begin work on auth" → Session with auth task

#### Handler: resolve-session-void {#resolve-session-void}
**Triggers**: "S = VOID", "no session found", "session unclear", "VOID→conventions"
**Target Pattern**: Missing session context in ULTRATHINK
**Pre-conditions**: 
- ULTRATHINK attempted
- S value is VOID
- SESSION.md accessible
**Process**:
1. Run `date '+%Y%m%d'` for today's date
2. Check SESSION.md for matching entry
3. If no entry for today:
   - Output: "No session found for today"
   - Route to session-start handler
   - Wait for session creation
4. If entry exists:
   - Extract session date in YYYYMMDD format
   - Verify matches today's date
   - Return valid S value
5. Update ULTRATHINK with resolved value
**Success**: Valid session ID obtained
**Failure**: Cannot determine session
**Examples**:
- ULTRATHINK "[S:VOID|W:testing|H:fix-bug]" → Resolve S first
- First request of day → Routes to session-start
- After compaction → Create fresh session

### Documentation Handlers {#doc-handlers}

#### Handler: check-docs-needed {#check-docs-needed}
**Triggers**: "does X need documentation", "should I document Y", "docs required?"
**Target Pattern**: Code element to assess
**Pre-conditions**: 
- Code element identified
- Documentation standards exist
**Process**:
1. Identify element type:
   - Public API
   - Complex logic
   - Configuration
   - User-facing feature
2. **PRIMARY**: Check requirements:
   - Public interfaces → Yes
   - Complex algorithms → Yes
   - Non-obvious behavior → Yes
   - Internal helpers → Maybe
3. Use Serena to check existing docs
4. Provide recommendation
**Success**: Clear yes/no with reasoning
**Failure**: Edge case, explain factors
**Examples**:
- "does this API need docs" → Check public interface
- "document this helper?" → Assess complexity

#### Handler: validate-comments {#validate-comments}
**Triggers**: "are these comments good", "check comment quality", "review documentation"
**Target Pattern**: Comments to validate
**Pre-conditions**: 
- Comments present
- Quality standards defined
**Process**:
1. Read comments in context
2. **PRIMARY**: Validate against principles:
   - Explain WHY not WHAT
   - Add value beyond code
   - Stay up-to-date
   - Be concise
3. Check for anti-patterns:
   - Obvious comments
   - Outdated information
   - TODO without dates
4. Assess overall quality
5. Suggest improvements
**Success**: Comments assessed with feedback
**Failure**: No clear standards
**Examples**:
- "review these comments" → Quality assessment
- "are comments appropriate" → Check value-add

### Action Pre-Check Handlers {#action-handlers}

#### Handler: check-conventions-first {#check-conventions-first}
**Triggers**: Internal trigger before any action that has conventions
**Target Pattern**: Action type to check conventions for
**Pre-conditions**: 
- About to perform an action
- Convention may exist for action
**Process**:
1. **MANDATORY FIRST STEP**: Identify action type:
   - Git operations → Check Git Conventions
   - File naming → Check Naming Conventions
   - Code writing → Check Code Conventions
   - Tool usage → Check Tool Router
   - Timestamps → Check timestamp format
2. **PRIMARY**: Read relevant convention section
3. Extract specific rules for action
4. Apply rules to intended action
5. Proceed only if compliant
**Success**: Convention checked before action
**Failure**: No convention check → STOP and check
**Examples**:
- Before commit message → Check git conventions first
- Before creating file → Check naming conventions first
- Before using tool → Check tool router first

#### Handler: enforce-pre-flight {#enforce-pre-flight}
**Triggers**: "enforce conventions", "make sure I check", "prevent mistakes"
**Target Pattern**: System-wide enforcement request
**Pre-conditions**: 
- User wants stricter enforcement
- Patterns of violations identified
**Process**:
1. Acknowledge enforcement request
2. **PRIMARY**: List all pre-action checks:
   - Git → CONVENTIONS.md#git-conventions
   - Files → CONVENTIONS.md#naming-conventions
   - Code → CONVENTIONS.md#code-conventions
   - Tools → TOOLS.md#mandatory-tool-router
   - Claims → Evidence-based approach
3. Create mental checklist
4. Commit to checking BEFORE acting
5. Report when conventions checked
**Success**: Systematic pre-checks established
**Failure**: Continuing without checks
**Examples**:
- "Stop making git mistakes" → Enforce git pre-checks
- "Always check first" → Universal pre-flight protocol

## 📚 See Also

- **[WORKFLOWS.md](WORKFLOWS.md)** - Complete workflow documentation
- **[TOOLS.md](TOOLS.md)** - Tool configurations and usage
- **[CLAUDE-NEW.md](CLAUDE-NEW.md)** - Quick navigation hub
- **[PROJECT-BLOG.md](PROJECT-BLOG.md)** - Project-specific conventions
- **[BUILDING-BETTER.md](BUILDING-BETTER.md)** - How patterns evolve

---

Remember: Conventions exist to create consistency and prevent errors. When in doubt, check this guide!
# Animal Protection Foundation Blog

## Core Mission
High-performance platform for sharing rescue stories and field updates from global animal welfare work.  
Performance target: 98+ Lighthouse scores for global accessibility in crisis regions.

## Tech Stack
```json
{
  "next": "15.3.3",
  "react": "19.1.0",
  "typescript": "5.8.3",
  "tailwindcss": "3.4.17",
  "packageManager": "pnpm@9.15.2"
}
```

## Performance Standards
See [Performance Standards](/docs/ai/shared-context/standards/performance.md) for detailed metrics and implementation guidelines.

## Architecture Decisions

### Why Monorepo
- **Code Sharing**: Design tokens and types shared across all packages
- **Clear Boundaries**: Each package has one responsibility
- **Independent Deployment**: Can deploy web without touching API

### Why This Package Split
- **UI Package**: Foundation only - ensures consistency without duplication
- **Web Package**: Implementation - all app-specific and shadcn/ui components
- **Shared Package**: Cross-cutting concerns - types, utils, schemas
- **Backend Package**: External integrations - keeps web package pure SSG

## Development Rules

### 1. ALWAYS USE PNPM
```bash
pnpm install     # NOT npm install
pnpm add <pkg>   # NOT npm add
pnpm dev         # NOT npm run dev
```

### Code Patterns
For comprehensive code patterns and conventions, see:
- **[Codebase Patterns Guide](/docs/ai/shared-context/patterns/codebase-patterns.md)** - Complete patterns from file naming to advanced Next.js 15/React 19 features
- **[Coding Conventions](/docs/ai/shared-context/standards/coding-conventions.md)** - General coding standards
- **[Common Patterns](/docs/ai/shared-context/patterns/common-patterns.md)** - Reusable React patterns

### 2. UI Package = Design Tokens Only
- Design tokens (colors, typography, spacing)
- Theme configurations
- Base providers
- NO shadcn/ui components

### 3. Web Package = All shadcn/ui Components
- Copy-paste shadcn/ui components here
- App-specific components
- All page routes
- Content management
- Track all components in `/docs/development/shadcn-components.md`

### 4. Four Themes Required
See [Four Theme System](/docs/ai/shared-context/themes/four-themes.md) for implementation details.

## Content Sensitivity Framework
See [Content Sensitivity Framework](/docs/ai/shared-context/philosophies/content-sensitivity.md) for the three-tier classification system and implementation guidelines.

## Task Management

You have access to the TodoWrite and TodoRead tools to help manage and plan tasks. Use these tools frequently to ensure you're tracking tasks and giving visibility into progress.

### When to Use TodoWrite
Use TodoWrite proactively in these scenarios:
1. **Complex multi-step tasks** - When a task requires 3 or more distinct steps
2. **Non-trivial implementations** - Tasks requiring careful planning or multiple operations  
3. **Before starting major work** - Break down the approach into manageable steps
4. **During orchestration** - Track deployment of multiple agents or parallel work

### TodoWrite Best Practices
- Create todos BEFORE starting work, not after
- Break large tasks into specific, actionable items
- Update status in real-time (pending → in_progress → completed)
- Only have ONE task in_progress at a time
- Mark tasks complete IMMEDIATELY when done

### Example Usage
When implementing a new feature:
1. Use TodoWrite to break it down:
   - Research existing patterns
   - Design the implementation
   - Write the code
   - Add tests
   - Update documentation
2. Mark each as in_progress when starting
3. Mark as completed when done

## Standard Development Workflow

For ALL development tasks, follow this comprehensive documentation workflow:

### 1. Initialize Session (Start of Work)
- Update SESSION.md with new session entry
- Run validation checklist (timestamp, git status, etc.)
- State clear goals for the session

### 2. Create Tracker Document
`docs/[relevant-category]/[feature-name]-tracker.md`
- Problem/requirement statement
- Current status tracking
- Implementation checklist
- Progress indicators
- Success criteria

### 3. Create Implementation Plan
`docs/[relevant-category]/[feature-name]-implementation.md`
- Detailed step-by-step plan
- Code changes needed
- Expected outcomes
- Testing approach

### 4. Create Comprehensive Todo List
Always use TodoWrite with priority levels:
- 🔴 **High Priority**: Core implementation
- 🟡 **Medium Priority**: Supporting work
- 🟢 **Low Priority**: Polish and docs

Typical structure:
- Small tasks: 10-15 items
- Medium tasks: 15-25 items
- Large tasks: 25-40 items

### 5. During Work
- Update SESSION.md progress log regularly
- Mark todos as in_progress/completed in real-time
- Document decisions and reasoning

### 6. End of Session
- Create Serena memory: `session_$(date +%Y-%m-%d)_work_description`
- Update SESSION.md with final status
- Include "How to Initialize Next Session" in memory
- Commit changes with clear message

### 7. Document Journey (If Applicable)
For tasks with discoveries or complex debugging:
`docs/[relevant-category]/[feature-name]-journey.md`

### Benefits
- **Perfect continuity**: SESSION.md + Serena memory + todos
- **Always know where you left off**: Multiple tracking layers
- **No context loss**: Everything documented
- **Easy handoffs**: Anyone can continue your work
- **Knowledge building**: Creates searchable history

### This Workflow Applies To:
- ✅ New features
- ✅ Bug fixes
- ✅ Refactoring
- ✅ Configuration changes
- ✅ Documentation updates
- ✅ Performance improvements
- ✅ ANY development work

Remember: "If it's not in SESSION.md and Serena memory, it didn't happen"

## MCP Integration Pattern
1. **TaskMaster** for planning and tracking work
2. **Context7** for latest documentation (use single topics)
3. **Agent Tool** for complex multi-step operations and autonomous tasks
   - Replaces Claude Code Bridge to avoid API token usage on Max plan
   - See `/docs/ai/for-agent/CLAUDE-BRIDGE-MIGRATION.md` for migration guide
4. **Zen** for deep thinking, code review, and multi-AI collaboration
   - See `/docs/ai/for-zen/zen-toolkit-guide.md` for comprehensive usage guide

## Serena MCP Integration

### Initial Serena Activation (First Time)
Read the initial instructions, then activate project /home/loucmane/dev/javascript/MomsBlog/blog and perform onboarding

**Note**: The project name in Serena is "blog", not "MomsBlog". Always use the full path to avoid errors.

### Standard Session Starters with Serena

#### 1. **New Development Session** (Most Common)
Activate project /home/loucmane/dev/javascript/MomsBlog/blog, read all memories, and check SESSION.md for previous work.
Today I'm working on [specific task/feature].

#### 2. **Continuing Previous Work**
Activate project /home/loucmane/dev/javascript/MomsBlog/blog, read the most recent session memory and SESSION.md.
Let's continue where we left off.
(Tip: Name the specific memory if you know it, e.g., "read memory session_2025-06-24_orchestrate_test_size_discovery")

#### 3. **TaskMaster Integration**
Activate project /home/loucmane/dev/javascript/MomsBlog/blog and read all memories.
Check TaskMaster for current task status, then help me work on task [ID].

#### 4. **Monorepo Navigation**
Activate the monorepo at /home/loucmane/dev/javascript/MomsBlog.
Analyze the package structure and focus on the [web/ui/backend] package.

### Serena Memory Management

#### Memory Naming Best Practices
To ensure easy session continuity:
1. **Always create session memory** at end of each work session
2. **Use descriptive names** that include date + main work
3. **Include "How to Initialize Next Session"** section in each memory
4. **Reference specific memories** when starting sessions

#### Create Session Memory (End of Session)
Create a memory with both date and descriptive name:
- **Format**: `session_YYYY-MM-DD_main_work_description`
- **Good examples**: 
  - `session_2025-06-21_task_7_orchestration_fix_serena_integration`
  - `session_2025-06-22_shadcn_components_setup`
  - `session_2025-06-23_theme_system_implementation`
- **Benefits**: Chronological sorting + immediate context

**Quick Command**:
```
Create a memory called session_$(date +%Y-%m-%d)_[work_description]
```

Memory should include:
- Work completed today
- Unfinished tasks
- Important decisions
- Next steps

#### Create Feature Memory
Create a memory about [feature name] including:
- Architecture decisions
- Implementation details
- Testing approach
- Known limitations

### Serena Tools for This Project

#### Semantic Code Analysis
- `Find all components using the theme system`
- `Show me the relationship between packages in this monorepo`
- `Find all references to the Animal type across packages`

#### Intelligent Refactoring
- `Update the Button component to match our 44px touch target standard`
- `Refactor all imports to follow our import order convention`
- `Apply our forwardRef pattern to all UI components`

#### Cross-Package Operations
- `Find all places where shared types are imported`
- `Update the API endpoint across all packages`
- `Ensure TypeScript types are consistent between backend and web`

### Serena + SESSION.md Workflow

1. **Start of Session**:
   Activate project MomsBlog, read SESSION.md and all recent memories.
   What task should I work on? [Wait for user response]

2. **After Reading Instructions**:
   - Serena understands the codebase structure
   - Can navigate packages semantically
   - Knows about your conventions from memories

3. **During Development**:
   - Use Serena for semantic operations
   - Use Desktop Commander for file operations
   - Document progress in SESSION.md

### Project-Specific Serena Commands

#### For Theme Work
Find all theme-related components and analyze their current implementation against our four-theme system

#### For Performance
Analyze component bundle sizes and suggest code-splitting opportunities

#### For Accessibility
Find all interactive elements and verify they meet our 44px touch target requirement

### Best Practices with Serena

1. **Let Serena Learn**: Allow onboarding to complete on first use
2. **Trust Semantic Search**: Use "Find the authentication logic" instead of specifying files
3. **Leverage Memories**: Check what Serena knows with "What memories do you have?"
4. **Monorepo Aware**: Serena understands cross-package dependencies
5. **Combine with Other Tools**: 
   - Serena for understanding/navigation
   - Desktop Commander for file operations
   - TaskMaster for task tracking

### ⚠️ Important Notes

- **First Time Only**: Run "Read the initial instructions" only once per project
- **Memory Persistence**: Serena memories are stored in `.serena/memories/`
- **No File Conflicts**: Serena uses semantic operations, avoiding conflicts with Desktop Commander
- **Performance**: Initial indexing may take a moment for large monorepos

### 🧪 Common Testing Commands
```bash
# Clean orchestration outputs
rm -rf docs/ai/for-agentic-loops/orchestration-outputs/task-7/

# Remove orchestration git branches
git branch | grep "task-7-orch" | xargs -r git branch -D

# Test orchestration command
/orchestrate-and-test 7

# Monitor orchestration progress
tail -f docs/ai/for-agentic-loops/orchestration-outputs/task-7/logs/orchestration.log
```

### Future TWES Integration
- [ ] Create `/docs/ai/for-serena/` documentation (after initial usage)
- [ ] Develop Serena-specific workflows based on usage patterns
- [ ] Add Serena scenarios to TWES testing framework
- [ ] Document discovered semantic patterns in memories

## Custom Commands
The project includes custom Claude commands in `.claude/commands/`:
- **infinite-documentation.md** - Documentation evolution system for continuous improvement
  - See `/docs/ai/for-agentic-loops/documentation-evolution-howto.md` for usage guide

## Discovered Patterns (From Documentation Evolution)
Based on automated codebase analysis with high confidence scores:

### Component Patterns (95% confidence)
- **Always use React.forwardRef** - see `/docs/ai/shared-context/discovered-patterns/component-conventions.md`
- **Import order**: React → External → Monorepo → Local → Types
- **Compound components** for complex UI (Card, Dialog, etc.)
- **44px minimum touch targets** for accessibility

### Performance Patterns (99 Lighthouse achieved)
- **Code splitting** - see `/docs/ai/shared-context/discovered-patterns/performance-code-splitting.tsx`
- **Dynamic imports** for heavy components
- **Progressive enhancement** for non-critical features
- **Bundle limits**: Initial JS < 100KB, Total < 300KB

### Development Workflow
- **Add blog features** - see `/docs/ai/shared-context/discovered-patterns/add-blog-feature-guide.md`
- **Use Server Actions** for data mutations (Next.js 15)
- **Validation** with Zod on both client and server
- **Branch naming**: `feat/{task-id}-{feature-name}`

### MCP Tool Usage Guidelines

**ALWAYS explain before using complex MCP tools:**
Before invoking any MCP tool for complex operations, explain to the user:
- What the tool will do
- What files it will create/modify
- Why this tool is appropriate for the task

**Example explanation:**
"I'd like to use the Agent tool to create a comprehensive design document. The agent will:
- Research current best practices using web search
- Analyze our codebase for existing patterns
- Create a new file at `/docs/design/example.md`
- Generate structured content with multiple sections
Is that okay?"

**When to use Agent Tool (replacing Claude Code Bridge):**
- Complex document creation requiring research
- Multi-step file operations that would require 10+ individual commands
- Tasks mixing analysis with implementation
- Pattern finding and refactoring across multiple files
- Any task that benefits from autonomous execution

**When NOT to use Agent Tool:**
- Simple file edits (use Edit tool)
- Quick searches (use Grep/Glob tools)
- When you need precise control over each step
- For learning/debugging (native tools are more transparent)

**Note**: Agent Tool runs within your current session, avoiding the API token usage issue that affected Claude Code Bridge.

## Thinking Mode (Default Behavior)

**IMPORTANT**: Thinking mode should be used by default for complex tasks and planning.

### How to Activate Thinking Mode:
- Say "think" - for standard thinking
- Say "think harder" - for deeper analysis  
- Say "ultrathink" - for maximum reasoning depth

### When to Use Thinking Mode:
- **Complex problem solving** - Break down multi-step tasks
- **Architecture decisions** - Analyze trade-offs and implications
- **Debugging** - Systematically work through issues
- **Planning features** - Consider all aspects before implementation
- **Code review** - Thorough analysis of existing code

### Benefits:
- More thorough analysis and planning
- Better error prevention
- Clearer reasoning about decisions
- More structured approach to complex tasks

**Note**: From Version 0.2.44, Claude Code supports thinking mode. Use it liberally to ensure high-quality, well-reasoned solutions.

## Automatic Session Management

### ⚠️ CRITICAL: PREVENT WRONG INFORMATION IN SESSION.md

**THESE WILL CAUSE SESSION FAILURE:**
- Using any date/time except COPY-PASTED output from `date "+%Y-%m-%d %H:%M %Z"`
- Typing times from memory (even if you "just ran" the command)
- Using UTC when local time is needed
- Assuming task from context instead of asking user
- Guessing TaskMaster IDs
- Making up developer names
- Writing "probably" or "likely" information

**INSTEAD, ALWAYS:**
1. First message must clarify: "What task are we working on today?"
2. Run actual commands for dates/times
3. Mark unknown information as "Unknown" 
4. Ask before assuming

### 🚨 BEFORE DOING ANYTHING ELSE - Pre-Flight Checklist:

1. **Run these commands and save outputs:**
   ```bash
   date "+%Y-%m-%d %H:%M %Z"       # Save as $CURRENT_DATE (local time)
   pwd                             # Save as $WORKING_DIR  
   git branch --show-current       # Save as $CURRENT_BRANCH
   git config user.name || echo "Unknown"  # Save as $GIT_USER
   git log --oneline -5            # Save recent commits
   git status                      # Check for changes
   
   # If using Serena for this session
   echo "Serena memories:" && ls -la .serena/memories/ 2>/dev/null || echo "No Serena memories yet"
   ```

2. **Git Branch Naming Convention:**
   - Format: `feat/{task-id}-{descriptive-name}`
   - Example: `feat/004-shadcn-ui-setup`
   - The task ID should match TaskMaster task number
   - Keep descriptive name concise and kebab-case

3. **Determine the task:**
   - Did user specify a task? → Use their EXACT words
   - No? → Ask "What task should I work on?"
   - NEVER assume based on context

4. **Only then create/update SESSION.md with verified data**

### CRITICAL: Session Continuity Protocol

#### At Session Start, AI MUST:

1. **FIRST RESPONSE TEMPLATE** (use every time):
   ```
   I'll help with development. First, let me establish the session context:
   
   1. Is this a continuation of the previous session or a new session?
      - If continuation: I'll resume where we left off
      - If new: I'll properly close the previous session first (if needed)
   
   2. What specific task should I work on? 
      - Please provide TaskMaster ID if applicable
      - Or describe what you'd like done
      - Or say "continue" to resume previous work
   
   3. Who is the developer for SESSION.md tracking? (I'll check git config)
   
   While you answer, I'll check the current state...
   [Run and show command outputs including git user]
   ```

2. **Check for SESSION.md** - If exists, read it completely and summarize
   - **CRITICAL**: Read the ENTIRE previous session(s) - DO NOT SKIM
   - **REQUIRED**: Note ALL completed work to avoid duplication
   - **ANALYZE**: Which subtasks were marked done? What was tested? What was fixed?
   - **SUMMARIZE**: "Previous session completed: [specific achievements]"
   - Add new sessions at the TOP (most recent first)
   - Keep all previous sessions for history
   - Use `---` separator between sessions

2a. **If using Serena** - Activate project and read memories:
   - Run: `Activate project MomsBlog and list all memories`
   - Cross-reference Serena memories with SESSION.md
   - Note any discrepancies or additional context

#### Session Lifecycle Rules:

1. **Session Continuation vs New Session**:
   - **If Continuation**: Keep current session entry, update progress
   - **If New Session**: 
     - Check if previous session has "Session End Status"
     - If not, ask: "The previous session wasn't properly ended. Should I close it now?"
     - If yes, add ending summary to previous session
     - Create new session entry at TOP of SESSION.md

2. **Never Assume Session is Ending**:
   - Sessions continue until explicitly ended by user
   - Don't add "Session End Status" unless user confirms
   - Keep using "Current Status" for ongoing work

3. **Session End Confirmation Required**:
   - If user mentions "ending", "stopping", or similar, ASK:
     ```
     Are you ending this session? If yes, I'll:
     - Update the session with final status
     - Create a Serena memory
     - Prepare handoff instructions
     ```
   - Only proceed with session closure if confirmed

3. **Prevent Work Duplication - Answer these questions BEFORE proceeding:**
   - What was completed in the last session? (List specific items)
   - Which subtasks were marked as done?
   - What components/features were already tested?
   - What issues were already fixed?
   - What work should NOT be repeated?

4. **Run TaskMaster commands to verify current state:**
   ```bash
   # ALWAYS run get_tasks first to see all tasks and their current status
   mcp__taskmaster-ai__get_tasks
   
   # Look for tasks with status "in-progress" or recent "done" status
   # Then get the specific task with subtasks:
   mcp__taskmaster-ai__get_task --id [ID]
   
   # This shows the complete picture including subtask progress
   ```
5. **Create SESSION.md entry ONLY with verified information:**
   ```markdown
   ## Session: [COPY-PASTE from date command output - LOCAL TIME]
   **AI Assistant**: Claude ✓
   **Developer**: [From git config user.name or "Unknown"]
   **Task**: "[EXACT words from user]"
   **Task Source**: [user-message|taskmaster-ID|continuation]
   **TaskMaster ID**: [ONLY if verified with MCP commands or "Not verified"]
   ```

6. **Validation checklist in SESSION.md:**
   ```markdown
   ### Session Validation
   - [ ] Date from `date` command: 2025-06-15 11:48 CEST
   - [ ] Task verified by: user message "fix the theme bug"
   - [ ] Git status checked: Yes
   - [ ] TaskMaster tasks reviewed: Yes (ran get_tasks)
   - [ ] Previous SESSION.md read: Yes
   ```

#### During Session, AI MUST:
1. **Get actual timestamps with dates for logs:**
   ```bash
   date "+%Y-%m-%d %H:%M %Z"  # Use output for ALL progress entries
   ```
2. **Update SESSION.md proactively** - Don't wait for session end:
   - After completing major features or fixes
   - When user requests: "let's update the session"
   - Every 30 minutes as a checkpoint
   - Before any risky operations
   - When switching between different tasks
3. **Log ALL decisions** with reasoning (helps future sessions understand "why")
4. **Track file modifications** with purpose:
   ```markdown
   - `components/Header.tsx`: Added dark mode toggle (user requested "fix theme bug")
   - `lib/theme.ts`: Extracted theme logic for reusability
   ```
5. **Flag uncertainties** for human review:
   ```markdown
   ❓ **Question**: Should theme preference persist to localStorage?
   ⚠️ **Uncertain**: Task might be TM-003 but user didn't specify
   ```

#### SESSION.md Update Checklist (Use Every Time):
When updating SESSION.md, ALWAYS update these sections:
```markdown
✅ Progress Log - Add timestamped entry
✅ Code Changes table - List modified files
✅ Current Status/Session Status - Update current state
✅ Next Actions/Next Steps - What comes next
✅ To Resume section - How to continue this work

CRITICAL: Never leave "Next Actions" or "To Resume" outdated!
```

#### Mid-Session Updates (Checkpoints):
When updating SESSION.md during an active session:
1. **Keep the session header unchanged** - Don't create a new session
2. **Update the progress log** with new entries and timestamps
3. **Update any completed goals** with checkmarks
4. **Add new code changes** to the table
5. **Update metrics** (files changed, lines modified)
6. **DON'T change "Session End Status"** - Save that for actual session end
7. **Add checkpoint note** in progress log:
   ```markdown
   - **[TIMESTAMP]** - 🔄 Mid-session checkpoint: [what's been done so far]
   ```

#### If Information is Ambiguous:
1. **Stop and clarify:**
   ```
   I need to clarify before proceeding:
   - You mentioned [task description] - is this linked to a TaskMaster ID?
   - Should I continue work from SESSION.md or start fresh?
   - [Specific question about ambiguity]
   ```

2. **Document the ambiguity in SESSION.md:**
   ```markdown
   ### ⚠️ Session Note
   Task specified as "work on themes" without TaskMaster ID.
   Proceeding based on user description.
   Will update if TaskMaster ID is provided.
   ```

#### Before Making Changes, AI SHOULD:
1. Check if similar work was attempted before (grep SESSION.md)
2. Verify no conflicting changes in recent commits
3. Announce intended changes: "I'm about to modify X to achieve Y"

#### At Session End (ONLY when explicitly confirmed by user):
1. **First, get confirmation**: "Are you ending this session? I'll create final documentation and handoff instructions."
2. **If confirmed, then:**
   - **Run the SESSION.md Update Checklist** (see above) - ensure ALL sections are current
   - **Add final progress log entry** with timestamp: "Session ending - [summary]"
   - **Change "Current Status" to "Session End Status"**
   - **Summarize accomplishments** with specific details
   - **List uncompleted items** with reason (blocked, needs decision, etc.)
   - **Update TaskMaster** status if tasks were completed
   - **Create Serena session memory** with format `session_YYYY-MM-DD_main_work_description`:
   - Include work completed, unfinished tasks, important decisions, next steps
   - **MUST include "How to Initialize Next Session" section with specific memory name**
   - Example: `session_2025-06-23_phase_1_testing_and_command_fix`
6. **Remind user of the initialization command** for next session:
   ```
   Next session, start with:
   "Activate project MomsBlog, read memory [specific_memory_name] and SESSION.md"
   ```
7. **Provide future-proof restoration commands**:
   ```markdown
   ### To Resume This Work:
   ```bash
   # Check current location and branch
   pwd
   git branch --show-current
   git status
   
   # Review recent work
   cat SESSION.md | tail -100
   
   # Install dependencies if needed
   pnpm install
   
   # See "Next Session Should" section for specific tasks
   ```
7. **Create semantic commit messages** that reference SESSION.md
8. **Add "How to Resume Next Session" section** with scenario-based options:
   ```markdown
   ## How to Resume Next Session
   
   ### Option 1: [Primary Scenario - Most Likely]
   ```
   Activate project MomsBlog, read the memory session_YYYY-MM-DD_[work_description] and SESSION.md.
   [Specific message for this scenario]
   ```
   
   ### Option 2: [Alternative Scenario]
   ```
   Activate project MomsBlog, read all memories related to [topic] and SESSION.md.
   [Specific message for this scenario]
   ```
   
   ### Quick Context Summary for AI:
   - **Previous Work**: [What was done]
   - **Current State**: [Where things stand]
   - **Next Steps**: [What needs to happen]
   - **Key Files**: [Important files to check]
   ```

#### Session Transition Protocol (Starting New Without Ending Previous):
If user starts new work and previous session lacks "Session End Status":
1. **Ask immediately**:
   ```
   I notice the previous session wasn't formally ended. 
   Is this:
   a) A continuation of that session? (I'll update the existing entry)
   b) A new session? (I'll close the previous one and start fresh)
   ```

2. **If continuation**: Update existing session entry with new progress
3. **If new session**:
   - Add "Session End Status" to previous session
   - Create summary of what was done
   - Start new session entry at top of file

### SESSION.md Required Format

**For First Session:**
```markdown
# AI Development Session Log

## Session: [COPY-PASTE from date command]
**AI Assistant**: Claude
**Developer**: [From git config user.name or "Unknown"]
**Task**: "[Exact user words]"
**Task Source**: [How task was determined]
**TaskMaster ID**: [Verified ID or "Not verified"]

### Session Validation ✓
- [ ] Date from `date` command: [paste output]
- [ ] Task verified by: [method]
- [ ] Git status checked: [Yes/No]
- [ ] TaskMaster tasks reviewed: [Yes/No]
- [ ] Previous SESSION.md read: [Yes/No/Not found]

### 🎯 Session Goals
- [ ] Primary: [From user or SESSION.md]
- [ ] Secondary: [If applicable]

### 📍 Starting Context
[Summary of previous work if found]

### 🏁 Previous Session Summary
**Work Completed**:
- [List specific completed items from previous session]
- [Include fixed issues, tested components, etc.]
**Work NOT to Repeat**:
- [Explicitly list work that should not be done again]

### 📋 Task Progress (if applicable)
**Current Task**: [Task ID and Title]
**Status**: [pending/in-progress/done]
**Subtasks**:
- [ ] Subtask 1 - [status]
- [ ] Subtask 2 - [status]
- [ ] Subtask 3 - [status]

### 📝 Progress Log
- **[DATE AND TIME from date command]** - [Action with reason]

### 💻 Code Changes
| File | Changes | Reason | Status |
|------|---------|---------|---------|
| [path] | [what changed] | [why] | ✅/🚧/❌ |

### 🤔 Decisions & Reasoning
[Document WHY choices were made]

### ❓ Open Questions for Team
[Questions that need human answers]

### 📊 Session Metrics
- Files changed: X
- Lines added/removed: +Y/-Z
- Test coverage impact: N/A or X%
- Components affected: [list]

### 🚦 Session End Status
[What was completed, what remains]

### 📋 Next Session Should:
[Specific next steps]

### 🔄 To Resume:
[Exact commands to restore state]

## How to Resume Next Session
[Add scenario-based options as shown in step 7 above]
```

**For Subsequent Sessions (add at TOP of file):**
```markdown
## Session: [NEW DATE from date command]
**AI Assistant**: Claude
**Developer**: [From git config]
**Task**: "[What user says this session]"
[... rest of session template ...]

---

[KEEP ALL PREVIOUS SESSIONS BELOW]
```

### Quick Reference for Accuracy

```yaml
GET_DATE: date "+%Y-%m-%d %H:%M %Z"  # Local time with timezone
GET_TIME: date "+%H:%M"  # Local time only
GET_GIT_USER: git config user.name || echo "Unknown"
GET_BRANCH: git branch --show-current
GET_COMMITS: git log --oneline -5
CHECK_TASKS: mcp__taskmaster-ai__get_tasks  # ALWAYS run this first
CHECK_SPECIFIC_TASK: mcp__taskmaster-ai__get_task --id [ID]  # Shows subtasks too

TASK_IDENTIFICATION_FLOW:
  1. Run get_tasks to see all tasks
  2. Identify current task (in-progress or recent done)
  3. Run get_task with ID to see subtask details
  4. Track subtask progress in SESSION.md

WHEN_UNCERTAIN: 
  - ASK THE USER
  - Don't guess
  - Mark as "Unknown"
  - Document uncertainty

SERENA_COMMANDS:
  ACTIVATE: "Activate project MomsBlog"
  READ_MEMORIES: "Show me all memories for this project"
  CREATE_MEMORY: "Create a memory called [name] with [content]"
  FIND_SYMBOL: "Find the [component/function] implementation"
  FIND_REFERENCES: "Find all references to [symbol]"
```

### Integration with TaskMaster
- ALWAYS run `get_tasks` first to see the current state of all tasks
- Only reference TaskMaster IDs that are explicitly provided or verified
- If user doesn't mention TaskMaster, don't assume there's a linked task
- Update task status only when explicitly instructed
- Always show the MCP command being run for transparency

## Common Mistakes That Break Sessions

❌ **DON'T**: Skim previous session and miss completed work  
✅ **DO**: Read ENTIRE previous session and list what was already done

❌ **DON'T**: "Let's test the shadcn components" (when already tested)  
✅ **DO**: Check previous session first: "I see components were already tested yesterday"

❌ **DON'T**: "Continuing work on TM-003 theme system"  
✅ **DO**: "What task would you like me to work on?"

❌ **DON'T**: Write "2024-01-15" or "16:15" from memory  
✅ **DO**: Run `date "+%Y-%m-%d %H:%M %Z"` and COPY-PASTE the output

❌ **DON'T**: Assume the developer's name from git  
✅ **DO**: Use `git config user.name` or mark as "Unknown"

❌ **DON'T**: Guess which task based on recent commits  
✅ **DO**: Ask for explicit confirmation

❌ **DON'T**: "This is probably related to the authentication feature"  
✅ **DO**: "Which feature is this task related to?"

❌ **DON'T**: Run only `get_task` with an ID from memory  
✅ **DO**: Run `get_tasks` first to see current state, then `get_task` if needed

❌ **DON'T**: Check task status without looking at subtasks  
✅ **DO**: Always run `get_task` after identifying the current task to see subtask progress

## 🚨 CRITICAL: Git Commits - Use gac Alias

**Quick Reference**: `gac "commit message"` (alias for `git add . && git commit -m`)

### ⚠️ IMPORTANT: You MUST use SINGLE QUOTES (') inside commit messages, NEVER double quotes (")

### ⚠️ IMPORTANT: You MUST use SINGLE QUOTES (') inside commit messages, NEVER double quotes (")

The developer uses this alias: `gac='git add . && git commit -m'`

**ALWAYS DO THIS:**
```bash
gac "feat: add 'Modern Blog' feature"  # ✅ CORRECT - Single quotes inside
gac "fix: update 'orchestrate-and-test' command"  # ✅ CORRECT
```

**NEVER DO THIS:**
```bash
gac "feat: add "Modern Blog" feature"  # ❌ WRONG - Will break!
gac "fix: update "orchestrate-and-test" command"  # ❌ WRONG - Will break!
```

### Why This Matters:
- Double quotes inside the message will break the git command
- The outer quotes are already double quotes in the alias
- Using double quotes inside creates a syntax error

### Examples of Correct Commit Messages:
- `gac "feat: implement 'Progressive Summarization' for orchestration"`
- `gac "fix: make 'orchestrate-and-test' command actually execute"`
- `gac "docs: update 'SESSION.md' with testing results"`
- `gac "refactor: improve 'Real-time Monitoring' implementation"`

**REMINDER**: Every time you suggest a commit message, double-check that you're using SINGLE QUOTES for any quoted text inside the message!

## Collaborative Decision Making

### User Has Final Say - CRITICAL
- **ALWAYS discuss** implementation approaches BEFORE making changes
- **NEVER implement** solutions without user approval
- **Present options** with pros/cons, let user decide
- **Document discussions** in tracker files before implementing
- **Ask for clarification** when implementation details are unclear
- **The user makes ALL final decisions** on implementations

### Implementation Protocol
1. **Analyze** the problem thoroughly
2. **Present** multiple solution options with clear pros/cons
3. **Discuss** trade-offs and implications
4. **Wait** for user decision - DO NOT proceed without explicit approval
5. **Only then** proceed with chosen implementation

### Example of Correct Approach
```
AI: "Based on our testing, I see three possible solutions:

Option 1: Keep current approach (Main Session CD)
- Pros: Simple, already implemented, predictable
- Cons: All sub-agents share same worktree, file conflicts

Option 2: Deploy agents individually
- Pros: Guaranteed isolation
- Cons: Manual process, loses automation

Option 3: Research Task function internals
- Pros: Could find proper solution
- Cons: Time investment, uncertain outcome

Which approach would you prefer, or would you like to explore other options?"
```

### What NOT to Do
❌ "Based on all testing, I recommend we use Approach 1"
❌ "I'll implement the solution now"
❌ "Let me update the implementation document with our final decision"
✅ "Here's what I found. What would you like to do?"

## Important Instruction Reminders

**Focus on User Intent**: Do what has been asked, understanding the spirit of the request.

**File Creation Guidelines**:
- Create files when they genuinely add value to the project
- Prefer editing existing files when appropriate
- For documentation files (*.md, README), ask first: "Would you like me to create documentation for this?"
- When uncertain, explain the benefit: "I could create X to help with Y. Would that be useful?"

**Collaborative Approach**:
- If something seems missing but wasn't requested, suggest it rather than creating it
- Explain the reasoning behind file creation decisions
- Be flexible - sometimes documentation or new files genuinely improve the project

## 🚀 Total Workflow Excellence System (TWES)

The Total Workflow Excellence System supercharges AI-assisted development through layered context injection. This system provides both detailed prompts and reference documentation for each tool.

### TWES Directory Structure
```
docs/ai/
├── for-serena/           # Serena MCP documentation (semantic code analysis)
├── for-agent/            # Agent tool documentation (complex operations)
├── for-taskmaster/        # TaskMaster documentation (planning & tracking)
├── for-multi-ai-collab/  # Multi-AI collaboration docs
├── for-zen/              # Zen toolkit documentation
├── for-mcp-tools/        # Other MCP tools documentation
├── shared-context/       # Shared documentation (DRY principle)
│   ├── themes/          # Design philosophy and theme specs
│   ├── standards/       # Coding, performance, accessibility
│   ├── philosophies/    # Development principles
│   └── patterns/        # Common patterns and architecture
├── patterns-catalog/     # Living Pattern Catalog 🆕
│   ├── extraction/      # Automated pattern extraction
│   ├── generated/       # Real patterns from codebase
│   └── playground/      # Interactive pattern exploration
├── context/             # Context bundles and modules
├── protocols/           # Step-by-step workflows
├── research/            # Background research and theory
└── twes-tests/          # Testing framework for validation
    ├── scenarios/       # Test scenario definitions
    ├── results/         # Test execution results
    └── workflows/       # Testing processes
```

### 🗺️ Navigation Tools
- **[TWES Index](/docs/ai/TWES-INDEX.md)** - Complete table of contents with descriptions 🆕
- **[TWES System Map](/docs/ai/TWES-SYSTEM-MAP.md)** - Visual overview and quick reference

### 🎯 Quick Access to Key Documents

#### Design & Themes
- [Warm Minimalism Philosophy](/docs/ai/shared-context/themes/warm-minimalism.md)
- [Four Theme System](/docs/ai/shared-context/themes/four-themes.md)

#### Standards & Conventions  
- [Performance Standards](/docs/ai/shared-context/standards/performance.md)
- [Accessibility Standards](/docs/ai/shared-context/standards/accessibility.md)
- [Coding Conventions](/docs/ai/shared-context/standards/coding-conventions.md)
- [File Structure Standards](/docs/ai/shared-context/standards/file-structure.md)

#### Development Philosophy
- [Development Principles](/docs/ai/shared-context/philosophies/development-principles.md)
- [Content Sensitivity Framework](/docs/ai/shared-context/philosophies/content-sensitivity.md)

#### Patterns & Architecture
- [Monorepo Structure](/docs/ai/shared-context/patterns/monorepo-structure.md)
- [Common Patterns](/docs/ai/shared-context/patterns/common-patterns.md)
- **[Living Pattern Catalog](/docs/ai/patterns-catalog/)** 🆕 - Real patterns extracted from codebase

### 📚 Tool-Specific Documentation

#### Primary Development Tools
- **[Serena](/docs/ai/for-serena/)**: Semantic code analysis, intelligent refactoring, and project memory
  - See Serena MCP Integration section above for usage patterns
- **[Agent](/docs/ai/for-agent/)**: Complex multi-step operations and autonomous tasks
  - See [Migration Guide](/docs/ai/for-agent/CLAUDE-BRIDGE-MIGRATION.md) for Claude Code Bridge replacement
- **[TaskMaster](/docs/ai/for-taskmaster/)**: Project planning and task management
- **[Multi-AI Collab](/docs/ai/for-multi-ai-collab/)**: Second opinions and specialized analysis
- **[Zen](/docs/ai/for-zen/)**: Deep thinking, code review, and debugging
- **[MCP Tools](/docs/ai/for-mcp-tools/)**: IDE integration and other tools

### 🔄 Using TWES Effectively

1. **Context Loading**: Reference shared context documents to avoid duplication
2. **Tool Selection**: Choose the right tool for each task
3. **Workflow Protocols**: Follow established patterns in `/docs/ai/protocols/`
4. **Session Continuity**: Maintain context across sessions with SESSION.md

### 📊 Success Metrics
- **Context Load Time**: <30 seconds (target)
- **First-Attempt Success**: >90% (target)
- **Error Recovery**: <2 minutes (target)
- **AI Tool Success Rate**: >95% (target)

### 🧪 TWES Testing Framework

Test the effectiveness of TWES documentation before implementing features:

1. **Choose a Test Scenario**:
   ```bash
   ls /docs/ai/twes-tests/scenarios/
   cat /docs/ai/twes-tests/scenarios/task-04-shadcn-installation.md
   ```

2. **Run the Test**:
   ```bash
   # Use Multi-AI Collaboration to simulate the task
   mcp__multi-ai-collab__gemini_think_deep --topic "[TEST PROMPT FROM SCENARIO]"
   ```

3. **Analyze Results**:
   - Check confidence score (target: >85% for basic tasks)
   - Identify documentation gaps
   - Document in `/docs/ai/twes-tests/results/`

4. **Quick Test Guide**:
   ```bash
   cat /docs/ai/twes-tests/workflows/quick-test-guide.md
   ```

**Current Test Coverage**: 85% confidence on basic tasks ✅

See `/docs/ai/twes-tests/` for full testing framework and `/docs/ai/protocols/twes-testing-protocol.md` for detailed workflow.

## Where to Find More
- **Architecture**: `/docs/architecture/` - Technical decisions and structure
- **Development**: `/docs/development/` - Workflows and configuration
- **shadcn Components**: `/docs/development/shadcn-components.md` - Component registry and testing
- **Migration**: `/docs/migration/` - Progress tracking
- **Troubleshooting**: `/docs/troubleshooting/` - Common issues
- **PRD**: `/scripts/prd.txt` - Full requirements
- **AI Documentation**: `/docs/ai/` - TWES system and tool docs
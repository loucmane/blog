# Universal Development Workflows

This document contains all workflow patterns, session management, and orchestration guidelines that apply across projects.

## 🎯 Quick Navigation

- **[Task Management](#task-management)** - TodoWrite/TodoRead patterns
- **[Standard Development Workflow](#standard-development-workflow)** - Complete workflow
- **[Intelligent Multi-Agent Orchestration](#intelligent-multi-agent-orchestration)** - NEW! Ultrathink-powered delegation
- **[Session Management](#session-management)** - SESSION.md lifecycle
- **[Memory Management](#memory-management)** - Serena memory patterns
- **[Common Mistakes](#common-mistakes-that-break-sessions)** - What to avoid

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

### TodoWrite for Orchestrated Tasks

When task complexity warrants delegation:

```markdown
- [ ] 🎭 Add search functionality (orchestrated)
  - [ ] 🔍 Research: Best search libraries for our stack
  - [ ] 💻 Implementation: Core search functionality
  - [ ] ⚡ Performance: Optimize for large datasets
  - [ ] ♿ Accessibility: Screen reader support
  - [ ] 🔄 Integration: Combine all perspectives
```

Mark sub-agent tasks with emoji indicators:
- 🔍 Research tasks
- 💻 Implementation tasks
- 🔒 Security reviews
- ⚡ Performance optimization
- ♿ Accessibility compliance
- 🔄 Integration work

## Standard Development Workflow

For ALL development tasks, follow this comprehensive documentation workflow:

### 1. Initialize Session (Start of Work)
- Update SESSION.md with new session entry
- Run validation checklist (timestamp, git status, etc.)
- State clear goals for the session

### 2. Create Work Tracking Folder
Create in `/docs/ai/work-tracking/active/`:
```
[yyyymmdd]-[phase]-[topic]-ACTIVE/
├── tracker.md              # Progress and status
├── implementation.md       # Plan and approach
├── findings.md            # Discoveries and insights
├── decisions.md           # Rationale for choices
├── memory-refs.md         # Related memories
└── handoff.md            # Next session instructions
```

**Naming Convention**: `20250709-phase3-claude-new-review-ACTIVE/`

**TodoWrite Integration**: Always create todos BEFORE creating files:
```markdown
- [ ] Create work folder structure
- [ ] Create tracker.md with initial goals
- [ ] Create implementation.md with approach
- [ ] Create findings.md for discoveries
- [ ] Create decisions.md for rationale
- [ ] Create memory-refs.md with references
- [ ] Create handoff.md with next steps
```
This ensures nothing is forgotten and provides clear progress tracking.

### 3. Create All 6 Core Files
Every work folder MUST have these 6 files:
- **tracker.md** - Shows WHERE we are (progress)
- **implementation.md** - Shows HOW we're doing it (approach)
- **findings.md** - Shows WHAT we discovered (insights)
- **decisions.md** - Shows WHY we made choices (rationale)
- **memory-refs.md** - Shows CONTEXT from past (continuity)
- **handoff.md** - Shows WHAT'S NEXT (session bridge)

### 4. Create Comprehensive Todo List
Always use TodoWrite with priority levels:
- 🔴 **High Priority**: Core implementation
- 🟡 **Medium Priority**: Supporting work
- 🟢 **Low Priority**: Polish and docs

Typical structure:
- Small tasks: 10-15 items
- Medium tasks: 15-25 items
- Large tasks: 25-40 items
- Complex initiatives: 40-70+ items (like template system overhaul)

#### Breaking Down Complex Work
For major initiatives, create EXTENSIVE todo lists that capture EVERY step:

```markdown
Example: Template System Phase 3 (60+ todos)
- [ ] Create session entry in SESSION.md
- [ ] Read existing tracker to understand scope
- [ ] Read implementation plan for methodology
- [ ] Analyze CLAUDE-NEW.md section by section
- [ ] Document findings for each component
- [ ] Create work tracking folder structure
- [ ] Create tracker.md with progress tracking
- [ ] Create implementation.md with approach
- [ ] Create findings.md for discoveries
- [ ] Create decisions.md for rationale
- [ ] Create memory-refs.md for continuity
- [ ] Create handoff.md for next session
- [ ] Update main documentation with discoveries
- [ ] Add Integration Principle to workflows
- [ ] Test each integration point
- [ ] Create rollback mechanisms
- [ ] Document friction points discovered
- [ ] ... (continues for all subtasks)
```

#### Benefits of Comprehensive Todo Lists
- **Nothing forgotten**: Every step is tracked
- **Clear progress**: See exactly what's done/remaining
- **Easy handoff**: Next session knows exact status
- **Prevents duplication**: Won't redo completed work
- **Mental clarity**: Offload tracking to the system

#### Todo List Best Practices
1. **Granular tasks**: Break down to atomic actions
2. **Logical ordering**: Dependencies respected
3. **Clear descriptions**: Each todo self-explanatory
4. **Status tracking**: Update in real-time
5. **Review regularly**: Ensure list stays relevant

### 5. During Work
- Update SESSION.md progress log regularly
- Mark todos as in_progress/completed in real-time
- Document decisions and reasoning

### 6. End of Session - Handoff Best Practices

#### Required Steps (in order):
1. **Update SESSION.md completely**:
   - Final progress log entry with timestamp
   - Update all sections (Code Changes, Current Status, Next Actions)
   - Add "Session End Status" with accomplishments

2. **Update work tracking handoff.md**:
   - Current state summary
   - What's been tested/verified
   - Known issues or blockers
   - Specific next steps

3. **Create Serena memory**:
   ```bash
   # Format: session_YYYY-MM-DD_descriptive_name
   session_$(date +%Y-%m-%d)_template_system_integration
   ```
   
   **Must include**:
   - Work completed with specific file names
   - Unfinished tasks with exact status
   - Important decisions and rationale
   - "How to Initialize Next Session" section with memory name
   
4. **Update todos final status**:
   - Mark all completed items as done
   - Leave in-progress items clearly marked
   - Add any discovered tasks

5. **Commit with descriptive message**:
   ```bash
   gac "feat: implement template system Phase 3 - added 12 critical integrations"
   ```

6. **Provide initialization message to user**:
   ```
   Session complete! Next session, start with:
   "Activate project MomsBlog, read memory session_2025-07-09_template_system_integration and SESSION.md"
   ```

#### Handoff Quality Checklist:
- [ ] Can someone else continue exactly where you left off?
- [ ] Are all file locations clearly documented?
- [ ] Is the current branch and git status noted?
- [ ] Are test results and verification steps included?
- [ ] Is the next logical step obvious?
- [ ] Did you tell the user how to initialize next session?

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

## Work Tracking Organization

### Directory Structure
```
docs/ai/work-tracking/
├── active/                      # Current work in progress
├── completed/                   # Finished work
│   └── 2025/
│       ├── 01-january/
│       ├── 02-february/
│       └── ...
├── blocked/                     # Work that's stuck
├── templates/                   # Templates for consistency
├── archive/                     # Old work (6+ months)
└── INDEX.md                     # Master tracking file
```

### Naming Convention
**Format**: `YYYYMMDD-phase-topic-STATUS`
- **YYYYMMDD**: Run `date +%Y%m%d` - NEVER type from memory!
- **phase**: Current project phase (e.g., phase3)
- **topic**: Brief descriptive name (kebab-case)
- **STATUS**: -ACTIVE, -DONE, or -BLOCKED

**Example**: `20250709-phase3-template-system-ACTIVE`

### Work Lifecycle
1. **Start**: Create folder in `active/` with -ACTIVE suffix
2. **Complete**: Change suffix to -DONE, move to `completed/YYYY/MM-month/`
3. **Block**: Change suffix to -BLOCKED, move to `blocked/` with reason
4. **Archive**: After 6 months, move from completed to `archive/`

### When to Create New Work vs Continue Existing
**Create NEW work folder when**:
- Starting a completely different initiative
- Different phase of project (Phase 2 → Phase 3)
- Unrelated feature or system

**Continue EXISTING work folder when**:
- Same overall initiative (e.g., all template system work)
- Related subtasks (review → implement → test)
- Natural progression of the same work

**Warning**: Creating multiple folders for related work defeats the purpose!

### Integration Requirements
**Nothing is "done" until integrated into main documentation:**
- Work tracking → This section in WORKFLOWS.md
- New patterns → CONVENTIONS.md
- Navigation updates → CLAUDE-NEW.md
- Tool usage → TOOLS.md

## Workflow Improvement Protocol

**Core Principle**: "We need to make sure we do things correctly all the time"

When you discover ANY workflow gap or missed expected behavior:

### 1. Immediate Gap Recognition
- STOP what you're doing
- Document it immediately
- Don't continue until it's captured

### 2. Immediate Documentation
Add to current work's findings.md:
```markdown
### [Number]. [Gap Name]
**Discovery**: [What happened]
**Impact**: [Why this matters]
**User Feedback**: [Any user comments]
**Root Cause**: [Why did this happen]
**Fix Needed**: [What should change]
```

### 3. Create Todo
- Add todo for updating the relevant workflow
- Mark as high priority if affects daily work
- Include which file needs updating

### 4. Update the Workflow
- Add explicit instruction where gap occurred
- Include "why" explanations for critical steps
- Test the improvement immediately
- Verify it prevents the gap

### 5. Examples from Practice
- **Gap**: Not updating todos when creating files
- **Fix**: Added "Create todo BEFORE creating each file"

- **Gap**: Guessing timestamps
- **Fix**: Added "ALWAYS run `date` command"

- **Gap**: Creating files in wrong location
- **Fix**: Added "Check directory structure FIRST"

### 6. Continuous Improvement
Every gap is an opportunity to improve the system. The goal: Make workflows so complete and explicit that they work correctly every time.

## Integration Principle

**Core Rule**: Nothing is "done" until it's integrated where it will be used.

### Every Creation Needs Three Locations:

1. **Creation Location** - Where it's built (work folders)
2. **Usage Location** - Where it's needed (main docs)
3. **Discovery Location** - Where people find it (navigation)

### Integration Checklist
When creating ANYTHING useful:
- [ ] Create it fully in work folder
- [ ] Identify ALL usage points
- [ ] Add to main documentation
- [ ] Create discovery paths
- [ ] Test the integration
- [ ] Update indexes/navigation

### The Test
For every useful thing created, ask:
1. Where will someone look for this?
2. What workflow will trigger its use?
3. How will they know it exists?

If you can't answer all three, it's not properly integrated.

## Intelligent Multi-Agent Orchestration

### Sequential Subtask Processing

When working on TaskMaster tasks, the AI processes subtasks sequentially with intelligent specialist deployment based on value-add analysis.

### How It Works

1. **TaskMaster Foundation**
   - Every task has subtasks (verified: all 32 tasks have them!)
   - Subtasks processed one at a time
   - Natural dependencies respected

2. **Intelligent Analysis per Subtask** (5-10 seconds)
   - Quick ultrathink for each subtask
   - Assess specialist value-add (not keywords)
   - Consider implicit requirements
   - Learn from past decisions

3. **Value-Based Deployment**
   ```yaml
   Deployment Decision:
     >60% improvement → Auto-deploy specialist
     30-60% → "This would benefit from a specialist. Should I deploy?"
     <30% → Handle directly
   ```

### Real-World Example Flow

#### Task 7: Core Layout Components

```markdown
User: "Work on task 7"

AI: "Task 7: Core Layout Components has 7 subtasks. 
    Starting with 7.1: Create Semantic HTML Structure
    
    [Ultrathink: Basic HTML, foundation work, I can handle this]
    Creating semantic HTML structure..."
    ✅ Complete

AI: "Moving to 7.2: Implement Header Component
    
    [Ultrathink: Requires design decisions, branding, navigation UX
     Specialist value-add: ~70% improvement]
    This involves visual design and UX patterns. 
    Deploying UI specialist for better component architecture..."
    
    [UI Specialist works with focused context]
    
    "The UI specialist has completed the Header Component.
    
    📋 Ready for Your Testing:
    - Files: /components/Header.tsx, /styles/header.module.css
    - Run: pnpm dev
    - Focus: Responsive nav, mobile menu, theme toggle
    
    I'll pause here for your testing."

User: "Looks great! The mobile menu works perfectly."

AI: "Excellent! Moving to 7.3: Develop Mobile Navigation System
    
    [Ultrathink: Mobile patterns, responsive design, touch interactions
     Similar to previous - UI specialist continues]
    The UI specialist will continue with mobile navigation..."
    
    [UI Specialist continues]
    
    "Mobile navigation implemented.
    
    📋 Ready for Your Testing:
    - Files: /components/MobileNav.tsx, /hooks/useMediaQuery.ts
    - Test: Menu gestures, focus trap, back button behavior
    
    Awaiting your feedback."

User: "The swipe gesture conflicts with browser back. Can we disable it?"

AI: "Good catch. Disabling swipe gesture to avoid browser conflicts..."
    [Fixes issue]
    "Fixed. Swipe gesture removed, tap-only interaction now."

User: "Perfect, works great now!"

AI: "Great! Moving to subtask 7.5: Implement Accessibility Landmarks
    
    [Ultrathink: ARIA, keyboard nav, screen readers
     Different expertise needed - A11y specialist]
    This requires accessibility expertise. 
    Deploying A11y specialist for WCAG compliance..."
    
    [A11y Specialist ensures standards]
    
    "Accessibility landmarks implemented.
    
    📋 Ready for Your Testing:
    - Files: Updated all layout components
    - Test: Screen reader navigation, landmark announcements
    - Tools: Use browser a11y inspector or NVDA/JAWS
    
    Please verify accessibility compliance."
```

### For Non-TaskMaster Work

When user doesn't reference a specific task:

```markdown
User: "Fix the authentication timeout bug"

AI: [No task ID, analyzing request]
    "Looking at this authentication bug...
    
    [Ultrathink: Auth timeout = potential security implications
     Security review value-add: ~80%]
    Since this touches authentication logic, I'll have a 
    security specialist review the fix. Starting now..."
```

### Progressive Learning

The system tracks patterns for continuous improvement:

```yaml
Learning Database:
  "Component Implementation" patterns:
    - With UI Specialist: avg 70% quality improvement
    - Solo: adequate for simple components
    - Decision: Deploy for complex UI work
  
  "Security Fixes" patterns:
    - With Security Specialist: caught 3 additional vulnerabilities
    - Solo: missed edge cases
    - Decision: Always deploy for auth-related work
```

### Specialist Deployment Protocol

When deploying a specialist for a subtask:

1. **Create Focused Context Package**
   ```yaml
   Subtask Context:
     subtask_info:
       id: "7.2"
       title: "Implement Header Component"
       description: "Full description from TaskMaster"
     
     focused_files: ["/components/", "/styles/theme.ts"]  # Max 3
     specific_focus: "Foundation branding, responsive nav"
     previous_work: "7.1 created HTML structure"
     constraints: "15 minutes, use existing design system"
   ```

2. **Deploy with Clear Purpose**
   ```javascript
   // Conceptual deployment (handled by AI)
   await Task.deploy({
     specialist: "UI/UX",
     subtask: currentSubtask,
     context: focusedContext,
     sharedDocs: ["SESSION.md", "current-todo-section"]
   });
   ```

3. **Track Progress**
   ```markdown
   SESSION.md Update:
   - **14:30** - Starting subtask 7.2: Header Component
   - **14:31** - 🧠 Analysis: UI expertise adds 70% value
   - **14:32** - 🎨 UI Specialist deployed for design decisions
   - **14:45** - ✅ Subtask 7.2 complete with professional UI
   ```

### Future Parallel Opportunities

While processing sequentially, the system identifies patterns:

```yaml
Task 15 Analysis:
  Sequential Processing:
    15.1: Design UI Components (15 min)
    15.2: Integrate Stripe (20 min)       } Could be parallel
    15.3: Integrate PayPal (20 min)      } (independent)
    15.4: Emergency Banner (10 min)
    15.8: Testing (25 min) - Must be last
  
  Parallel Opportunity:
    Time if parallel: 45 min (save 20 min)
    Confidence: 90% (no dependencies between payment providers)
    
This data helps evolution to smart parallel processing.
```

### Learning and Improvement

After each subtask completion:
```yaml
Pattern Capture:
  Subtask: "Implement Header Component"
  Specialist Used: UI/UX
  Value Delivered: High (clean architecture, reusable)
  Time: 12 min (estimate was 15)
  
Learning:
  - Component work → UI specialist recommended
  - Time estimates improving
  - User satisfied with quality
```

### Evolution Path

The system is designed to evolve:

1. **Current: Pure Sequential**
   - One subtask at a time
   - Full focus per specialist
   - Clear dependencies

2. **Future: Smart Grouping**
   - Identify independent subtasks
   - Process groups sequentially
   - Parallelize within groups

3. **Ultimate: Dynamic Optimization**
   - Real-time dependency analysis
   - Optimal execution planning
   - Maximum efficiency

## User Testing Checkpoints

### The Reality: You Are the Tester

The workflow acknowledges that the user (you!) performs all testing. Each subtask implementation includes natural pause points for your testing and feedback.

### Subtask Lifecycle with Testing

```yaml
Complete Subtask Flow:
  1. AI Analysis → "What needs to be done"
  2. Implementation → "Code/changes complete"
  3. Testing Checkpoint → "🧪 Awaiting your test"
  4. User Tests → "You run and evaluate"
  5. Feedback Loop → "Fix issues if found"
  6. Confirmation → "✅ Subtask complete"
```

### Testing Checkpoint Pattern

After implementing each subtask, the AI provides:

```markdown
✅ Implemented: 7.2 Header Component

📋 Ready for Your Testing:
- **Files Changed**: 
  - `/components/Header.tsx` - Main component
  - `/styles/header.module.css` - Styling
  - `/lib/navigation.ts` - Menu logic

- **How to Test**:
  ```bash
  pnpm dev
  # Navigate to http://localhost:3000
  ```

- **What to Check**:
  ✅ Desktop navigation displays correctly
  ✅ Mobile menu hamburger works
  ✅ Theme toggle switches properly
  ✅ Keyboard navigation (Tab through items)
  ✅ Screen reader announces menu state

- **Known Concerns**:
  ⚠️ Mobile menu animation might be too fast
  ⚠️ Focus trap in mobile menu needs verification

I'll pause here for your testing. Let me know:
1. What's working well
2. Any issues you find
3. If you need changes before we continue
```

### TodoWrite Pattern with Testing

```markdown
## Main Task Todo
- [ ] 🎭 Task 7: Core Layout Components (orchestrated)
  - [ ] 7.1: Create Semantic HTML Structure
    - [x] 💻 Implementation complete
    - [x] 🧪 User tested - approved
  - [ ] 7.2: Implement Header Component
    - [x] 💻 Implementation complete
    - [ ] 🧪 Awaiting user testing  ← Current checkpoint
    - [ ] 🔧 Fix any issues
    - [ ] ✅ User approval
  - [ ] 7.3: Develop Mobile Navigation
    - [ ] 💻 Implementation
    - [ ] 🧪 User testing
    - [ ] ✅ Approval
```

### SESSION.md Testing Tracking

```markdown
### 📝 Progress Log
- **14:30** - Starting subtask 7.2: Header Component
- **14:45** - ✅ Implementation complete, creating testing checkpoint
- **14:46** - 🧪 TESTING CHECKPOINT: Awaiting user test
  - Files: Header.tsx, header.module.css
  - Focus: Responsive nav, accessibility
- **15:00** - 👤 User feedback: "Mobile menu overlaps logo on iPhone SE"
- **15:01** - 🔧 Fixing mobile menu positioning for small screens
- **15:10** - 🧪 Ready for re-test
- **15:15** - ✅ User approved: Header component complete
- **15:16** - Moving to subtask 7.3
```

### Testing Interaction Examples

#### Successful Test
```
User: "Tested the header - looks great! The mobile menu works perfectly and keyboard nav is smooth."

AI: "Excellent! Marking 7.2 as complete. Moving to 7.3: Develop Mobile Navigation System.
    
    [Ultrathink: Mobile-first patterns, gesture support needed...]"
```

#### Issues Found
```
User: "The theme toggle doesn't persist after page reload, and the mobile menu doesn't close when clicking outside."

AI: "Got it! Let me fix both issues:
    1. Adding localStorage for theme persistence
    2. Implementing click-outside detection for mobile menu
    
    Implementing fixes now..."
```

#### Partial Approval
```
User: "The functionality works but the animation feels jarring. Can we make it smoother? Otherwise good to continue."

AI: "I'll note that for polish later and continue with the next subtask. Added to refinements list:
    - [ ] 🎨 Smooth header animations (non-blocking)
    
    Proceeding to 7.3..."
```

### Benefits of Testing Checkpoints

1. **Quality Assurance** - Every subtask is tested before moving forward
2. **User Control** - You decide when implementation meets standards
3. **Rapid Feedback** - Issues caught and fixed immediately
4. **Clear Communication** - Explicit about what needs testing
5. **Progress Visibility** - Testing status tracked in todos and SESSION.md

### Testing Tips

- **Quick Tests First** - Basic functionality before edge cases
- **Real Devices** - Test on actual phones/tablets when possible
- **Accessibility** - Always check keyboard and screen reader
- **Performance** - Note any lag or slow interactions
- **Edge Cases** - Try unexpected interactions

## Session Management

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

### 🚨 Pre-Flight Checklist

**BEFORE DOING ANYTHING ELSE:**

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

### Session Continuity Protocol

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

### Prevent Work Duplication

**Answer these questions BEFORE proceeding:**
- What was completed in the last session? (List specific items)
- Which subtasks were marked as done?
- What components/features were already tested?
- What issues were already fixed?
- What work should NOT be repeated?

### TaskMaster Integration

Run TaskMaster commands to verify current state:
```bash
# ALWAYS run get_tasks first to see all tasks and their current status
mcp__taskmaster-ai__get_tasks

# Look for tasks with status "in-progress" or recent "done" status
# Then get the specific task with subtasks:
mcp__taskmaster-ai__get_task --id [ID]

# This shows the complete picture including subtask progress
```

### SESSION.md Required Format

**For First Session:**
```markdown
# AI Development Session Log

## Session: [COPY-PASTE from date command]
**AI Assistant**: Claude ✓
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

### During Session

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

### SESSION.md Update Checklist

When updating SESSION.md, ALWAYS update these sections:
```markdown
✅ Progress Log - Add timestamped entry
✅ Code Changes table - List modified files
✅ Current Status/Session Status - Update current state
✅ Next Actions/Next Steps - What comes next
✅ To Resume section - How to continue this work

CRITICAL: Never leave "Next Actions" or "To Resume" outdated!
```

### Mid-Session Updates (Checkpoints)

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

### Tracking Multi-Agent Work

When using delegation patterns, track in SESSION.md:

```markdown
### 📝 Progress Log
- **14:30** - Analyzing task: "Add search functionality"
- **14:32** - Complexity score: 4/5 (UI + Performance + A11y)
- **14:33** - Deploying 3 specialized agents for parallel work
- **14:35** - Agents deployed:
  - Search Implementation Agent (worktree: search-impl)
  - Performance Agent (worktree: search-perf)  
  - A11y Agent (worktree: search-a11y)
- **14:50** - All agents complete, integrating results
- **15:00** - Integration complete, search feature ready

### 💻 Code Changes
| File | Changes | Agent | Status |
|------|---------|--------|---------|
| components/Search.tsx | Created search UI | Implementation | ✅ |
| lib/search-index.ts | Added indexing | Performance | ✅ |
| components/Search.test.tsx | A11y tests | Accessibility | ✅ |
| pages/search.tsx | Integrated all | Main | ✅ |
```

### At Session End

**ONLY when explicitly confirmed by user:**

1. **First, get confirmation**: "Are you ending this session? I'll create final documentation and handoff instructions."

2. **If confirmed, then:**
   - **Run the SESSION.md Update Checklist** - ensure ALL sections are current
   - **Add final progress log entry** with timestamp: "Session ending - [summary]"
   - **Change "Current Status" to "Session End Status"**
   - **Summarize accomplishments** with specific details
   - **List uncompleted items** with reason (blocked, needs decision, etc.)
   - **Update TaskMaster** status if tasks were completed
   - **Create Serena session memory** with format `session_YYYY-MM-DD_main_work_description`
   - Include work completed, unfinished tasks, important decisions, next steps
   - **MUST include "How to Initialize Next Session" section with specific memory name**

3. **Provide future-proof restoration commands**:
   ```markdown
   ### To Resume This Work:
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

4. **CRITICAL: Provide initialization command to user**:
   ```
   ## Initialization Command for Next Session:
   
   Activate project /home/loucmane/dev/javascript/MomsBlog/blog, read memory session_YYYY-MM-DD_description and SESSION.md.
   [What we'll be working on next]
   ```
   Always provide this directly to the user before ending the session!

5. **Add "How to Resume Next Session" section** with scenario-based options:
   ```markdown
   ## How to Resume Next Session
   
   ### Option 1: [Primary Scenario - Most Likely]
   Activate project MomsBlog, read the memory session_YYYY-MM-DD_[work_description] and SESSION.md.
   [Specific message for this scenario]
   
   ### Option 2: [Alternative Scenario]
   Activate project MomsBlog, read all memories related to [topic] and SESSION.md.
   [Specific message for this scenario]
   
   ### Quick Context Summary for AI:
   - **Previous Work**: [What was done]
   - **Current State**: [Where things stand]
   - **Next Steps**: [What needs to happen]
   - **Key Files**: [Important files to check]
   ```

## Memory Management

### Memory Naming Best Practices

To ensure easy session continuity:
1. **Always create session memory** at end of each work session
2. **Use descriptive names** that include date + main work
3. **Include "How to Initialize Next Session"** section in each memory
4. **Reference specific memories** when starting sessions

### Create Session Memory (End of Session)

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

### Create Feature Memory

Create a memory about [feature name] including:
- Architecture decisions
- Implementation details
- Testing approach
- Known limitations

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

## Quick Reference Commands

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

## 📚 See Also

- **[CONVENTIONS.md](CONVENTIONS.md)** - Git aliases and code standards
- **[TOOLS.md](TOOLS.md)** - MCP tool configurations
- **[CLAUDE-NEW.md](CLAUDE-NEW.md)** - Quick navigation hub
- **[PROJECT-BLOG.md](PROJECT-BLOG.md)** - Project-specific details
- **[BUILDING-BETTER.md](BUILDING-BETTER.md)** - How to evolve this system

---

Remember: Perfect workflow execution leads to perfect project outcomes. These patterns are proven across hundreds of sessions.
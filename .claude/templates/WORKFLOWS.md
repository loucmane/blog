# Universal Development Workflows

This document contains all workflow patterns, session management, and orchestration guidelines that apply across projects.

## 🎯 Quick Navigation {#quick-navigation}

- **[ULTRATHINK System](#ultrathink-system)** - 🧠 MANDATORY foundation for all workflows
- **[Universal Flight Protocol](#universal-flight-protocol)** - MANDATORY pre/during/post flight checks
- **[Task Management](#task-management)** - TodoWrite/TodoRead patterns
- **[Standard Development Workflow](#standard-development-workflow)** - Complete workflow
- **[Intelligent Multi-Agent Orchestration](#intelligent-multi-agent-orchestration)** - NEW! Ultrathink-powered delegation
- **[Specialist Deployment Flow](#specialist-deployment-flow)** - MANDATORY constraints for subagents
- **[Session Management](#session-management)** - SESSION.md lifecycle
- **[Memory Management](#memory-management)** - Serena memory patterns
- **[Evidence-Based Analysis](#evidence-based-analysis)** - How to make accurate claims
- **[Testing Workflows](#testing-workflows)** - Simulation-based testing for any system
- **[Subagent Simulation Testing](#subagent-simulation-testing)** - Deploy subagents for testing/validation
- **[Behavioral Templates](#behavioral-templates)** - Pre-selected tool sequences for common tasks
- **[Intent Handlers](#intent-handlers)** - NEW! Protocol navigation handlers for user intents
- **[Common Mistakes](#common-mistakes-that-break-sessions)** - What to avoid

## 🧠 ULTRATHINK System {#ultrathink-system}

**CRITICAL: This is the foundation of all workflows. Every request must start here.**

The ULTRATHINK system ensures proper context and handler selection before any action. It is mandatory and cannot be bypassed.

### ULTRATHINK Format {#ultrathink-format}

Every development request MUST begin with:
```
Let me ultrathink about this... [S:X|W:Y|H:Z]
```

Where:
- **S** = Session ID from SESSION.md (format: YYYYMMDD)
- **W** = Current work context from active/ folders
- **H** = Handler matching the request

### VOID Resolution Handlers {#void-resolution}

When any value is VOID, these handlers resolve it:

#### Handler: resolve-work-void {#resolve-work-void}
**Triggers**: "W = VOID", "no work context", "work unclear", "VOID→workflows"
**Target Pattern**: Missing work context in ULTRATHINK
**Pre-conditions**: 
- ULTRATHINK attempted
- W value is VOID
- Active work folders accessible
**Process**:
1. Analyze user request to determine domain:
   - Implementation/feature → Development work
   - Bug/fix/error → Problem solving
   - Search/find/explore → Investigation
   - Review/check → Review work
   - Plan/design → Planning work
2. Check active work folders:
   - List all folders in work-tracking/active/
   - Match request domain to folder names
   - If direct match → W = folder-name
3. Handle special states:
   - Search/analysis requests → W = "investigating"
   - Code/PR reviews → W = "reviewing"
   - Architecture/design → W = "planning"
4. If no match found:
   - Output: "No active work context for this request"
   - Route to appropriate handler:
     - New feature → start-new-work
     - Bug fix → start-new-work with bug context
     - General question → W = "investigating"
5. Return valid W value
**Success**: Valid work context obtained
**Failure**: Cannot determine context
**Examples**:
- "Fix login bug" with no bug folder → Routes to start-new-work
- "Find all getUserData calls" → W = "investigating"
- "Plan caching strategy" → W = "planning"
- "Continue with tests" + test folder exists → W = "test-implementation"

### ULTRATHINK Integration {#ultrathink-integration}

This file participates in the ULTRATHINK system:

#### VOID Resolution
- **S = VOID** → See [resolve-session-void](CONVENTIONS.md#resolve-session-void)
- **W = VOID** → See [resolve-work-void](#resolve-work-void)
- **H = VOID** → See [resolve-handler-void](REGISTRY.md#resolve-handler-void)

#### Handler Requirements
All handlers in this file expect valid [S:W:H] context before execution. Any handler called with VOID values must resolve them first.

## Task Management {#task-management}

You have access to the TodoWrite and TodoRead tools to help manage and plan tasks. Use these tools frequently to ensure you're tracking tasks and giving visibility into progress.

### When to Use TodoWrite {#when-to-use-todowrite}

Use TodoWrite proactively in these scenarios:
1. **Complex multi-step tasks** - When a task requires 3 or more distinct steps
2. **Non-trivial implementations** - Tasks requiring careful planning or multiple operations  
3. **Before starting major work** - Break down the approach into manageable steps
4. **During orchestration** - Track deployment of multiple agents or parallel work

### TodoWrite Best Practices {#todowrite-best-practices}

- Create todos BEFORE starting work, not after
- Break large tasks into specific, actionable items
- Update status in real-time (pending → in_progress → completed)
- Only have ONE task in_progress at a time
- Mark tasks complete IMMEDIATELY when done

### Example Usage {#todowrite-example}

When implementing a new feature:
1. Use TodoWrite to break it down:
   - Research existing patterns
   - Design the implementation
   - Write the code
   - Add tests
   - Update documentation
2. Mark each as in_progress when starting
3. Mark as completed when done

### TodoWrite for Orchestrated Tasks {#todowrite-orchestrated}

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

## Standard Development Workflow {#standard-development-workflow}

For ALL development tasks, follow this comprehensive documentation workflow:

### 1. Initialize Session (Start of Work) {#initialize-session}
- Update SESSION.md with new session entry
- Run validation checklist (timestamp, git status, etc.)
- State clear goals for the session

### 2. Create Work Tracking Folder {#create-work-folder-step}
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

### 3. Create All 6 Core Files {#create-core-files}
Every work folder MUST have these 6 files:
- **tracker.md** - Shows WHERE we are (progress)
- **implementation.md** - Shows HOW we're doing it (approach, designs, drafts)

**Real-Time Updates Required**: See BEHAVIORS.md "Work Tracking" section for automatic enforcement of updates. Don't batch updates - document as you work.
- **findings.md** - Shows WHAT we discovered (insights)
- **decisions.md** - Shows WHY we made choices (rationale)
- **memory-refs.md** - Shows CONTEXT from past (continuity)
- **handoff.md** - Shows WHAT'S NEXT (session bridge)

**🚫 CRITICAL RULE: NO OTHER FILES ALLOWED**
- All drafts, designs, iterations → Append to implementation.md
- Never create: draft-v1.md, design-final.md, new-approach.md
- If tempted to create a new file, ask: "Which of the 6 does this belong in?"

### 4. Create Comprehensive Todo List {#create-todo-list}
Always use TodoWrite with priority levels:
- 🔴 **High Priority**: Core implementation
- 🟡 **Medium Priority**: Supporting work
- 🟢 **Low Priority**: Polish and docs

Typical structure:
- Small tasks: 10-15 items
- Medium tasks: 15-25 items
- Large tasks: 25-40 items
- Complex initiatives: 40-70+ items (like template system overhaul)

#### Breaking Down Complex Work {#breaking-down-work}
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

#### Benefits of Comprehensive Todo Lists {#todo-benefits}
- **Nothing forgotten**: Every step is tracked
- **Clear progress**: See exactly what's done/remaining
- **Easy handoff**: Next session knows exact status
- **Prevents duplication**: Won't redo completed work
- **Mental clarity**: Offload tracking to the system

#### Todo List Best Practices {#todo-best-practices}
1. **Granular tasks**: Break down to atomic actions
2. **Logical ordering**: Dependencies respected
3. **Clear descriptions**: Each todo self-explanatory
4. **Status tracking**: Update in real-time
5. **Review regularly**: Ensure list stays relevant

### 5. During Work {#during-work}
- Update SESSION.md progress log regularly
- Mark todos as in_progress/completed in real-time
- Document decisions and reasoning

### 6. End of Session - Handoff Best Practices {#end-of-session}

#### Required Steps (in order): {#required-steps}
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

#### Handoff Quality Checklist: {#handoff-checklist}
- [ ] Can someone else continue exactly where you left off?
- [ ] Are all file locations clearly documented?
- [ ] Is the current branch and git status noted?
- [ ] Are test results and verification steps included?
- [ ] Is the next logical step obvious?
- [ ] Did you tell the user how to initialize next session?

### 7. Document Journey (If Applicable) {#document-journey}
For tasks with discoveries or complex debugging:
`docs/[relevant-category]/[feature-name]-journey.md`

### Benefits {#workflow-benefits}
- **Perfect continuity**: SESSION.md + Serena memory + todos
- **Always know where you left off**: Multiple tracking layers
- **No context loss**: Everything documented
- **Easy handoffs**: Anyone can continue your work
- **Knowledge building**: Creates searchable history

### This Workflow Applies To: {#workflow-applies-to}
- ✅ New features
- ✅ Bug fixes
- ✅ Refactoring
- ✅ Configuration changes
- ✅ Documentation updates
- ✅ Performance improvements
- ✅ ANY development work

Remember: "If it's not in SESSION.md and Serena memory, it didn't happen"

## Work Tracking Organization {#work-tracking-org}

### Directory Structure {#directory-structure}
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

### Naming Convention {#naming-convention}
**Format**: `YYYYMMDD-phase-topic-STATUS`
- **YYYYMMDD**: Run `date +%Y%m%d` - NEVER type from memory!
- **phase**: Current project phase (e.g., phase3)
- **topic**: Brief descriptive name (kebab-case)
- **STATUS**: -ACTIVE, -DONE, or -BLOCKED

**Example**: `20250709-phase3-template-system-ACTIVE`

### Work Lifecycle {#work-lifecycle}
1. **Start**: Create folder in `active/` with -ACTIVE suffix
2. **Complete**: Change suffix to -DONE, move to `completed/YYYY/MM-month/`
3. **Block**: Change suffix to -BLOCKED, move to `blocked/` with reason
4. **Archive**: After 6 months, move from completed to `archive/`

### When to Create New Work vs Continue Existing {#new-vs-continue}
**Create NEW work folder when**:
- Starting a completely different initiative
- Different phase of project (Phase 2 → Phase 3)
- Unrelated feature or system

**Continue EXISTING work folder when**:
- Same overall initiative (e.g., all template system work)
- Related subtasks (review → implement → test)
- Natural progression of the same work

**Warning**: Creating multiple folders for related work defeats the purpose!

### Integration Requirements {#integration-requirements}
**Nothing is "done" until integrated into main documentation:**
- Work tracking → This section in WORKFLOWS.md
- New patterns → CONVENTIONS.md
- Navigation updates → CLAUDE-NEW.md
- Tool usage → TOOLS.md

## Workflow Improvement Protocol {#workflow-improvement}

**Core Principle**: "We need to make sure we do things correctly all the time"

When you discover ANY workflow gap or missed expected behavior:

### 1. Immediate Gap Recognition {#gap-recognition}
- STOP what you're doing
- Document it immediately
- Don't continue until it's captured

### 2. Immediate Documentation {#immediate-documentation}
Add to current work's findings.md:
```markdown
### [Number]. [Gap Name]
**Discovery**: [What happened]
**Impact**: [Why this matters]
**User Feedback**: [Any user comments]
**Root Cause**: [Why did this happen]
**Fix Needed**: [What should change]
```

### 3. Create Todo {#create-improvement-todo}
- Add todo for updating the relevant workflow
- Mark as high priority if affects daily work
- Include which file needs updating

### 4. Update the Workflow {#update-workflow}
- Add explicit instruction where gap occurred
- Include "why" explanations for critical steps
- Test the improvement immediately
- Verify it prevents the gap

### 5. Examples from Practice {#examples-from-practice}
- **Gap**: Not updating todos when creating files
- **Fix**: Added "Create todo BEFORE creating each file"

- **Gap**: Guessing timestamps
- **Fix**: Added "ALWAYS run `date` command"

- **Gap**: Creating files in wrong location
- **Fix**: Added "Check directory structure FIRST"

### 6. Continuous Improvement {#continuous-improvement-workflow}
Every gap is an opportunity to improve the system. The goal: Make workflows so complete and explicit that they work correctly every time.

## Integration Principle {#integration-principle}

**Core Rule**: Nothing is "done" until it's integrated where it will be used.

### Every Creation Needs Three Locations: {#three-locations}

1. **Creation Location** - Where it's built (work folders)
2. **Usage Location** - Where it's needed (main docs)
3. **Discovery Location** - Where people find it (navigation)

### Integration Checklist {#integration-checklist}
When creating ANYTHING useful:
- [ ] Create it fully in work folder
- [ ] Identify ALL usage points
- [ ] Add to main documentation
- [ ] Create discovery paths
- [ ] Test the integration
- [ ] Update indexes/navigation

### The Test {#integration-test}
For every useful thing created, ask:
1. Where will someone look for this?
2. What workflow will trigger its use?
3. How will they know it exists?

If you can't answer all three, it's not properly integrated.

## Intelligent Multi-Agent Orchestration {#multi-agent-orchestration}

### Sequential Subtask Processing {#sequential-processing}

When working on TaskMaster tasks, the AI processes subtasks sequentially with intelligent specialist deployment based on value-add analysis.

### How It Works {#how-orchestration-works}

1. **TaskMaster Foundation**
   - Every task has subtasks (verified: all 32 tasks have them!)
   - Subtasks processed one at a time
   - Natural dependencies respected

2. **Intelligent Analysis per Subtask** (5-10 seconds)
   - Quick ultrathink for each subtask
   - Assess specialist value-add (not keywords)
   - Consider implicit requirements
   - Learn from past decisions

3. **Clear Deployment Rules**
   ```yaml
   Deploy Specialist When:
     - 3+ steps/subtasks → Review & implement together
     - Security/auth/payments → Always deploy
     - Accessibility requirements → Always deploy
     - High risk changes → Deploy for safety
     - Keywords: "design", "integrate", "optimize"
   
   Solo Work When:
     - 1-2 simple steps
     - Low risk changes (docs, styles, comments)
     - Clear single-file fixes
   ```

### Real-World Example Flow {#real-world-example}

#### Task 7: Core Layout Components {#task-7-example}

```markdown
User: "Work on task 7"

AI: "Task 7: Core Layout Components has 7 subtasks. 
    Starting with 7.1: Create Semantic HTML Structure
    
    [Ultrathink: Basic HTML, foundation work, I can handle this]
    Creating semantic HTML structure..."
    ✅ Complete

AI: "Moving to 7.2: Implement Header Component
    
    [Ultrathink: Design + branding + navigation = 3+ concerns
     Keywords: "design" detected]
    This involves multiple design decisions. 
    Deploying UI specialist to review approach with you..."
    
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

### For Non-TaskMaster Work {#non-taskmaster-work}

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

### Progressive Learning {#progressive-learning}

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

### Specialist Deployment Protocol {#specialist-deployment}

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
   - **[HH:MM]** - Starting subtask 7.2: Header Component
   - **[HH:MM]** - 🧠 Analysis: UI expertise adds 70% value
   - **[HH:MM]** - 🎨 UI Specialist deployed for design decisions
   - **[HH:MM]** - ✅ Subtask 7.2 complete with professional UI
   ```

### MANDATORY Constraints for ALL Specialist Deployments {#mandatory-constraints}

**CRITICAL**: Every Task tool deployment MUST include these constraints to prevent session corruption and tool misuse.

#### Constraint Template (COPY THIS EXACTLY) {#constraint-template}
```
=== MANDATORY CONSTRAINTS ===
FORBIDDEN TOOLS:
- NEVER use zen, gemini, openai, or other MCP AI tools
- NEVER use claude-code-bridge 
- Only use tools explicitly listed below

FORBIDDEN ACTIONS:
- NEVER edit or read SESSION.md (that's exclusively managed by main Claude)
- NEVER create work tracking files (that's main Claude's responsibility)
- NEVER make git commits unless explicitly requested
- NEVER modify .claude/ directory contents

ALLOWED TOOLS:
- Bash (for running commands)
- Read/Write/Edit (for file operations)
- Grep/Glob (for searching)
- [Add other specific tools needed for this task]

REQUIRED BEHAVIOR:
- Stay focused on the specific task given
- Report findings back clearly
- Include file paths and line numbers in responses
- Stop when task is complete
=== END CONSTRAINTS ===
```

#### Example with Constraints {#constraint-example}
```javascript
Task("Implement authentication feature")
Prompt: `
Implement JWT authentication for the user login system.

TASK:
- Add JWT token generation
- Create middleware for validation
- Update routes to require auth
- Write tests

=== MANDATORY CONSTRAINTS ===
FORBIDDEN TOOLS:
- NEVER use zen, gemini, openai, or other MCP AI tools
- NEVER use claude-code-bridge 
- Only use tools explicitly listed below

FORBIDDEN ACTIONS:
- NEVER edit or read SESSION.md
- NEVER create work tracking files
- NEVER make git commits
- NEVER modify .claude/ directory

ALLOWED TOOLS:
- Bash (for running tests)
- Read/Write/Edit (for code files)
- Grep (for finding existing code)

REQUIRED BEHAVIOR:
- Focus only on authentication implementation
- Run tests after implementation
- Report test results back
=== END CONSTRAINTS ===

SUCCESS CRITERIA:
- JWT tokens properly generated
- Middleware validates tokens
- Tests pass
`
```

#### Monitoring for Violations {#monitoring-violations}
After specialist returns, check:
1. Did they use any forbidden tools? (Check for zen, gemini, etc.)
2. Did they touch SESSION.md? (Critical violation)
3. Did they create work tracking files?
4. Did they stay within scope?

If violations occur:
- Document in tracker: "Specialist violated constraint: [specific violation]"
- Add clarification to future deployments
- Do NOT use work if SESSION.md was modified

### Future Parallel Opportunities {#parallel-opportunities}

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

### Learning and Improvement {#learning-improvement}

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

### Evolution Path {#evolution-path}

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

## User Testing Checkpoints {#user-testing-checkpoints}

### The Reality: You Are the Tester {#reality-tester}

The workflow acknowledges that the user (you!) performs all testing. Each subtask implementation includes natural pause points for your testing and feedback.

### Subtask Lifecycle with Testing {#subtask-lifecycle}

```yaml
Complete Subtask Flow:
  1. AI Analysis → "What needs to be done"
  2. Implementation → "Code/changes complete"
  3. Testing Checkpoint → "🧪 Awaiting your test"
  4. User Tests → "You run and evaluate"
  5. Feedback Loop → "Fix issues if found"
  6. Confirmation → "✅ Subtask complete"
```

### Testing Checkpoint Pattern {#testing-pattern}

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

### TodoWrite Pattern with Testing {#todowrite-testing}

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

### SESSION.md Testing Tracking {#session-testing}

```markdown
### 📝 Progress Log
- **[HH:MM]** - Starting subtask 7.2: Header Component
- **[HH:MM]** - ✅ Implementation complete, creating testing checkpoint
- **[HH:MM]** - 🧪 TESTING CHECKPOINT: Awaiting user test
  - Files: Header.tsx, header.module.css
  - Focus: Responsive nav, accessibility
- **[HH:MM]** - 👤 User feedback: "Mobile menu overlaps logo on iPhone SE"
- **[HH:MM]** - 🔧 Fixing mobile menu positioning for small screens
- **[HH:MM]** - 🧪 Ready for re-test
- **[HH:MM]** - ✅ User approved: Header component complete
- **[HH:MM]** - Moving to subtask 7.3
```

### Testing Interaction Examples {#testing-examples}

#### Successful Test {#successful-test}
```
User: "Tested the header - looks great! The mobile menu works perfectly and keyboard nav is smooth."

AI: "Excellent! Marking 7.2 as complete. Moving to 7.3: Develop Mobile Navigation System.
    
    [Ultrathink: Mobile-first patterns, gesture support needed...]"
```

#### Issues Found {#issues-found}
```
User: "The theme toggle doesn't persist after page reload, and the mobile menu doesn't close when clicking outside."

AI: "Got it! Let me fix both issues:
    1. Adding localStorage for theme persistence
    2. Implementing click-outside detection for mobile menu
    
    Implementing fixes now..."
```

#### Partial Approval {#partial-approval}
```
User: "The functionality works but the animation feels jarring. Can we make it smoother? Otherwise good to continue."

AI: "I'll note that for polish later and continue with the next subtask. Added to refinements list:
    - [ ] 🎨 Smooth header animations (non-blocking)
    
    Proceeding to 7.3..."
```

### Benefits of Testing Checkpoints {#testing-benefits}

1. **Quality Assurance** - Every subtask is tested before moving forward
2. **User Control** - You decide when implementation meets standards
3. **Rapid Feedback** - Issues caught and fixed immediately
4. **Clear Communication** - Explicit about what needs testing
5. **Progress Visibility** - Testing status tracked in todos and SESSION.md

### Testing Tips {#testing-tips}

- **Quick Tests First** - Basic functionality before edge cases
- **Real Devices** - Test on actual phones/tablets when possible
- **Accessibility** - Always check keyboard and screen reader
- **Performance** - Note any lag or slow interactions
- **Edge Cases** - Try unexpected interactions

## ✈️ Universal Flight Protocol {#universal-flight-protocol}

This protocol is MANDATORY for ALL operations. It ensures consistent quality and prevents common errors.

### 🛫 PRE-FLIGHT (Before ANY Action) {#pre-flight}
1. **STATE**: "I'm about to [specific action]"
2. **CHECK**: Which workflow/convention applies? (State it out loud)
3. **TOOLS**: Need a tool? → Check [Tool Router](TOOLS.md#mandatory-tool-selection-router---check-before-every-tool-use) FIRST!
4. **VERIFY**: Required tools ready? Dependencies checked?
5. **ULTRATHINK**: Deploy for non-trivial tasks

### ✈️ DURING FLIGHT (While Executing) {#during-flight}
1. **FOLLOW**: The workflow/convention you identified
2. **TRACK**: Update todos in real-time
3. **VERIFY**: Check outputs match expectations
4. **DOCUMENT**: Note any deviations or discoveries

### 🛬 POST-FLIGHT (After Completion) {#post-flight}
1. **REVIEW**: Did I follow the stated workflow?
2. **LEARN**: What errors did I make? Add to prevention list
3. **UPDATE**: Mark todos complete, update progress logs
4. **IMPROVE**: If workflow needs updates, do it NOW

### 🚨 ABORT PROCEDURES {#abort-procedures}
- Lost? → State "I'm lost" and re-read relevant workflow
- Error? → Check Error Prevention in conventions
- Unsure? → Ask user rather than guess
- No workflow exists? → Create one using meta-flow

### Flight Protocol Examples {#flight-examples}

**Example 1: Updating tracker.md**
```
PRE-FLIGHT: "I'm about to update tracker.md"
CHECK: "Checking CONVENTIONS.md for documentation standards"
TOOLS: "Need timestamp → Tool Router says use date command"
VERIFY: "Ready to proceed"
ACTION: Run date "+%Y-%m-%d %H:%M %Z"
```

**Example 2: Writing new component**
```
PRE-FLIGHT: "I'm about to create a Button component"
CHECK: "Checking CONVENTIONS.md for component patterns"
VERIFY: "Need forwardRef pattern, PascalCase naming"
ULTRATHINK: "Deploying to analyze existing patterns"
```

**Example 3: Making a claim**
```
PRE-FLIGHT: "I'm about to compare code structures"
CHECK: "Need Evidence-Based Analysis flow"
VERIFY: "Must gather actual data, not assumptions"
ACTION: Use Serena to extract specific examples
```

## Session Management {#session-management}

### ⚠️ CRITICAL: PREVENT WRONG INFORMATION IN SESSION.md {#prevent-wrong-info}

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

### 🚨 Pre-Flight Checklist {#session-pre-flight}

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

### Session Continuity Protocol {#session-continuity}

#### At Session Start, AI MUST: {#session-start-must}

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

#### Session Lifecycle Rules: {#session-lifecycle-rules}

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

### Prevent Work Duplication {#prevent-duplication}

**Answer these questions BEFORE proceeding:**
- What was completed in the last session? (List specific items)
- Which subtasks were marked as done?
- What components/features were already tested?
- What issues were already fixed?
- What work should NOT be repeated?

### TaskMaster Integration {#taskmaster-integration}

Run TaskMaster commands to verify current state:
```bash
# ALWAYS run get_tasks first to see all tasks and their current status
mcp__taskmaster-ai__get_tasks

# Look for tasks with status "in-progress" or recent "done" status
# Then get the specific task with subtasks:
mcp__taskmaster-ai__get_task --id [ID]

# This shows the complete picture including subtask progress
```

### SESSION.md Required Format {#session-required-format}

**For First Session:**
```markdown
# AI Development Session Log

## Session: [COPY-PASTE from date command]
**AI Assistant**: Claude ✓
**Developer**: [From git config user.name or "Unknown"]
**Task**: "[Exact user words]"
**Task Source**: [How task was determined]
**TaskMaster ID**: [Verified ID or "Not verified"]

### Session Validation ✓ {#session-validation}
- [ ] Date from `date` command: [paste output]
- [ ] Task verified by: [method]
- [ ] Git status checked: [Yes/No]
- [ ] TaskMaster tasks reviewed: [Yes/No]
- [ ] Previous SESSION.md read: [Yes/No/Not found]

### 🎯 Session Goals {#session-goals}
- [ ] Primary: [From user or SESSION.md]
- [ ] Secondary: [If applicable]

### 📍 Starting Context {#starting-context}
[Summary of previous work if found]

### 🏁 Previous Session Summary {#previous-summary}
**Work Completed**:
- [List specific completed items from previous session]
- [Include fixed issues, tested components, etc.]
**Work NOT to Repeat**:
- [Explicitly list work that should not be done again]

### 📋 Task Progress (if applicable) {#task-progress}
**Current Task**: [Task ID and Title]
**Status**: [pending/in-progress/done]
**Subtasks**:
- [ ] Subtask 1 - [status]
- [ ] Subtask 2 - [status]
- [ ] Subtask 3 - [status]

### 📝 Progress Log {#progress-log}
- **[DATE AND TIME from date command]** - [Action with reason]

### 💻 Code Changes {#code-changes}
| File | Changes | Reason | Status |
|------|---------|---------|---------|
| [path] | [what changed] | [why] | ✅/🚧/❌ |

### 🤔 Decisions & Reasoning {#decisions-reasoning}
[Document WHY choices were made]

### ❓ Open Questions for Team {#open-questions}
[Questions that need human answers]

### 📊 Session Metrics {#session-metrics}
- Files changed: X
- Lines added/removed: +Y/-Z
- Test coverage impact: N/A or X%
- Components affected: [list]

### 🚦 Session End Status {#session-end-status}
[What was completed, what remains]

### 📋 Next Session Should: {#next-session-should}
[Specific next steps]

### 🔄 To Resume: {#to-resume}
[Exact commands to restore state]

## How to Resume Next Session {#how-to-resume}
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

### During Session {#during-session}

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

### SESSION.md Update Checklist {#update-checklist}

When updating SESSION.md, ALWAYS update these sections:
```markdown
✅ Progress Log - Add timestamped entry
✅ Code Changes table - List modified files
✅ Current Status/Session Status - Update current state
✅ Next Actions/Next Steps - What comes next
✅ To Resume section - How to continue this work

CRITICAL: Never leave "Next Actions" or "To Resume" outdated!
```

### Mid-Session Updates (Checkpoints) {#mid-session-updates}

When updating SESSION.md during an active session:
1. **Keep the session header unchanged** - Don't create a new session
2. **Update the progress log** with new entries and timestamps:
   - Run `date '+%H:%M'` to get actual time
   - NEVER estimate or make up timestamps
3. **Update any completed goals** with checkmarks
4. **Add new code changes** to the table
5. **Update metrics** (files changed, lines modified)
6. **DON'T change "Session End Status"** - Save that for actual session end
7. **Add checkpoint note** in progress log:
   ```markdown
   - **[HH:MM]** - 🔄 Mid-session checkpoint: [what's been done so far]
   ```
   Where [HH:MM] is from `date '+%H:%M'` command

### Tracking Multi-Agent Work {#tracking-multi-agent}

When using delegation patterns, track in SESSION.md:

```markdown
### 📝 Progress Log
- **[HH:MM]** - Analyzing task: "Add search functionality"
- **[HH:MM]** - Complexity score: 4/5 (UI + Performance + A11y)
- **[HH:MM]** - Deploying 3 specialized agents for parallel work
- **[HH:MM]** - Agents deployed:
  - Search Implementation Agent (worktree: search-impl)
  - Performance Agent (worktree: search-perf)  
  - A11y Agent (worktree: search-a11y)
- **[HH:MM]** - All agents complete, integrating results
- **[HH:MM]** - Integration complete, search feature ready

### 💻 Code Changes
| File | Changes | Agent | Status |
|------|---------|--------|---------|
| components/Search.tsx | Created search UI | Implementation | ✅ |
| lib/search-index.ts | Added indexing | Performance | ✅ |
| components/Search.test.tsx | A11y tests | Accessibility | ✅ |
| pages/search.tsx | Integrated all | Main | ✅ |
```

### At Session End {#at-session-end}

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

## Memory Management {#memory-management}

### Memory Naming Best Practices {#memory-naming-best}

To ensure easy session continuity:
1. **Always create session memory** at end of each work session
2. **Use descriptive names** that include date + main work
3. **Include "How to Initialize Next Session"** section in each memory
4. **Reference specific memories** when starting sessions

### Create Session Memory (End of Session) {#create-session-memory}

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

### Create Feature Memory {#create-feature-memory}

Create a memory about [feature name] including:
- Architecture decisions
- Implementation details
- Testing approach
- Known limitations

### Serena + SESSION.md Workflow {#serena-session-workflow}

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

## Context Compaction Workflow {#context-compaction}

### When to Compact {#when-to-compact}

User says:
- "we need to compact"
- "context is getting full"
- "prepare for compaction"
- "we're at X% context"

### Pre-Compaction Checklist {#pre-compaction-checklist}

1. **Ensure Documentation Complete**
   - [ ] SESSION.md fully updated with all progress
   - [ ] Work tracking folder has all 6 files updated
   - [ ] Session memory created with descriptive name
   - [ ] All code changes documented

2. **Create Compaction Summary**
   ```markdown
   ## Compaction Summary
   
   **Session**: [Date and main work]
   **Key Accomplishments**: [2-3 bullet points]
   **Files Changed**: [List main files]
   **Next Steps**: [What to do after compaction]
   ```

3. **Generate Optimal Resume Message**
   The AI provides user with exact message to use post-compaction:
   ```
   Activate project [path], read memory session_YYYY-MM-DD_[description] and SESSION.md.
   Continue with [specific next action based on current work].
   ```

### Compaction Protocol {#compaction-protocol}

1. **Final Updates** (5 minutes before compaction)
   - Update SESSION.md with final progress
   - Create/update session memory
   - Save any work in progress
   - Update todos with current state

2. **Provide Resume Instructions**
   ```markdown
   ## 📦 Ready for Compaction
   
   **Current Context Usage**: [X%]
   
   **To Resume After Compaction**, use this exact message:
   ---
   Activate project /home/loucmane/dev/javascript/MomsBlog/blog, 
   read memory session_2025-07-12_checkpoint_to_protocol_navigation and SESSION.md.
   Continue implementing [specific task/feature].
   ---
   
   **Key Context to Preserve**:
   - [Critical decision or approach]
   - [Important file locations]
   - [Unfinished work item]
   ```

3. **Final Verification**
   - Confirm all work saved
   - Verify memory created
   - Check resume message includes all needed context

### Post-Compaction Recovery {#post-compaction-recovery}

When user returns with the resume message:
1. **Restore Context** from memory and SESSION.md
2. **Verify State** by checking git status and recent changes
3. **Continue Work** from documented next steps
4. **Update Progress** in SESSION.md marking continuation

## Quick Reference Commands {#quick-reference-commands}

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

## Evidence-Based Analysis {#evidence-based-analysis}

### When to Use This Flow {#when-use-evidence}

Use this flow when:
- Comparing different versions or approaches
- Making claims about improvements or changes
- Analyzing patterns or trends
- Evaluating effectiveness of solutions

### Quick Reference {#evidence-quick-ref}
1. State the analysis request clearly
2. Gather actual data using tools (especially Serena)
3. Compare specific sections/metrics
4. State findings with evidence
5. Acknowledge uncertainty explicitly

### Common Failure Modes {#evidence-failure-modes}

**❌ Surface Scanning**
- Making claims based on visual impressions
- Prevention: Extract and compare specific data

**❌ Confirmation Bias**
- Noticing only what supports initial impression
- Prevention: Actively seek counter-examples

**❌ Overgeneralization**
- One example becomes "all" or "always"
- Prevention: State sample size explicitly

### Tool Usage for Analysis {#tool-usage-analysis}

```bash
# Find all instances to compare
mcp__serena__search_for_pattern --pattern "Section Name" --context_lines_after 15

# Extract specific metrics
mcp__serena__search_for_pattern --pattern "validation|checklist" | wc -l

# Compare file versions
Read file1.md --offset X --limit Y
Read file2.md --offset X --limit Y
```

### Evidence-Based Language {#evidence-language}

**Instead of**: "Previous entries were repetitive"
**Use**: "In the 3 entries examined, X pattern appeared Y times"

**Instead of**: "This is better structured"
**Use**: "This differs in having X while others have Y"

**Instead of**: "Always/Never/All/None"
**Use**: "In N cases examined, typically..."

### Analysis Checklist {#analysis-checklist}
- [ ] Do I have specific line numbers/quotes?
- [ ] Have I stated my sample size?
- [ ] Have I looked for counter-examples?
- [ ] Are limitations acknowledged?

Remember: It's better to say "I don't have enough data" than to make unfounded claims.

## Testing Workflows {#testing-workflows}

### Quick Reference
1. Define what to test (workflow/system/feature)
2. Create simulation scenarios (no real changes)
3. Document expected vs actual behavior
4. Run tests with "SIMULATE:" prefix
5. Document results systematically
6. Iterate based on findings

### When to Use This Flow {#when-use-testing}
- Testing new workflows before deployment
- Validating system changes (like Flight Protocol)
- Checking if documentation matches reality
- Training/onboarding validation
- Regression testing after changes

### Error Prevention First {#error-prevention}

**❌ Making Real Changes During Tests**
- Never modify actual files during testing
- Always use simulation mode
- Document what WOULD happen

**❌ Testing Without Clear Criteria**
- Define pass/fail criteria upfront
- Create specific checkpoints
- Know what compliance looks like

**❌ Poor Result Documentation**
- Always capture actual output
- Note patterns across tests
- Track improvements needed

### Setting Up Tests {#setting-up-tests}

#### 1. Create Test Scenarios File {#create-test-scenarios}
```markdown
# [System Name] Test Scenarios - SIMULATION MODE

## Test Environment
- Required files: [list]
- Success criteria: [list]
- NO ACTUAL CHANGES

## Test Suite

### Test 1: [Name]
**Command**: "SIMULATE: [action]"
**Expected**: [behavior]
**Pass Criteria**: [checklist]
```

#### 2. Design Simulation Triggers {#design-triggers}
- Use "SIMULATE:" prefix for all tests
- AI should respond with "I would..." descriptions
- No actual tool calls or file edits

#### 3. Create Results Template {#create-results-template}
```markdown
# Test Results - [Date]

## Test 1: [Name]
**Status**: ✅ Pass / ⚠️ Partial / ❌ Fail
**Actual Output**: [paste]
**Violations**: [list]
**Learning**: [insights]
```

### Running Tests {#running-tests}

#### PRE-FLIGHT for Testing {#testing-pre-flight}
```
PRE-FLIGHT: "I'm about to run test simulations"
CHECK: "Loading test scenarios from [path]"
VERIFY: "Simulation mode active - no real changes"
```

#### During Testing {#during-testing}
1. Present each test clearly
2. Observe AI behavior
3. Check against criteria
4. Document immediately

#### POST-FLIGHT {#testing-post-flight}
```
POST-FLIGHT: "Tests complete"
REVIEW: "X/Y tests passed"
LEARN: "Key violations: [list]"
UPDATE: "System improvements needed: [list]"
```

### Test Types {#test-types}

#### 1. Compliance Testing {#compliance-testing}
- Does AI follow required protocols?
- Are all steps executed?
- Is documentation checked?

#### 2. Error Recovery Testing {#error-recovery-testing}
- How does system handle mistakes?
- Are abort procedures followed?
- Is learning documented?

#### 3. Edge Case Testing {#edge-case-testing}
- Missing workflows
- Ambiguous requests
- Complex scenarios

### Quality Gates {#quality-gates}

**Before Testing**:
- [ ] Test scenarios documented
- [ ] Pass criteria defined
- [ ] Results template ready
- [ ] Simulation mode confirmed

**After Testing**:
- [ ] All tests have results
- [ ] Patterns identified
- [ ] Improvements listed
- [ ] Next steps clear

### Iteration Cycle {#iteration-cycle}

```
Test → Document → Analyze → Improve → Retest
```

1. **Test**: Run simulations
2. **Document**: Capture all results
3. **Analyze**: Find patterns
4. **Improve**: Update system
5. **Retest**: Validate fixes

### Example: Testing Flight Protocol {#testing-flight-example}

```markdown
## Test Command
"SIMULATE: Update tracker.md with progress"

## Expected Behavior
PRE-FLIGHT: "I'm about to update tracker.md"
CHECK: "Checking CONVENTIONS.md for documentation standards"
VERIFY: "Need date command for timestamp"
SIMULATING: Would run `date "+%Y-%m-%d %H:%M %Z"`
SIMULATING: Would edit tracker.md with timestamp

## Actual Result
[Paste what actually happened]

## Compliance Score
- [✓] Used PRE-FLIGHT
- [✗] Forgot to check conventions
- [✓] Mentioned date command
```

### Success Metrics {#success-metrics}
- 100% tests start with PRE-FLIGHT (or equivalent)
- No actual changes made during testing
- Clear documentation of violations
- Actionable improvements identified

### Anti-Patterns {#anti-patterns}
- 🚫 Testing in production (making real changes)
- 🚫 Vague test criteria
- 🚫 No documentation of results
- 🚫 Not iterating based on findings

## Subagent Simulation Testing {#subagent-simulation}

### Purpose {#simulation-purpose}
Deploy subagents in simulation mode to test any system, approach, or solution without making actual changes. Get fresh perspectives and validate ideas safely.

### When to Use {#when-use-simulation}
- Testing new documentation or navigation
- Validating architectural approaches
- Getting second opinions on solutions
- Testing workflow effectiveness
- Debugging complex problems
- Exploring alternative implementations
- Checking if instructions are clear
- Stress-testing error handling

### Setup Template {#simulation-setup}
```yaml
1. CONTEXT PREPARATION
   □ Define what to test
   □ Prepare test scenarios
   □ Identify success criteria
   
2. SUBAGENT DEPLOYMENT
   □ Use Task tool
   □ Provide clear constraints: "SIMULATION MODE - NO CHANGES"
   □ Give specific navigation hub/documentation
   □ Provide test tasks
   
3. SIMULATION TASKS
   □ Navigation tests ("Find X workflow")
   □ Task execution ("How would you do Y?")
   □ Error recovery ("What if Z fails?")
   □ Complete workflows ("Start to end session")
```

### Example Templates {#example-templates}

#### Documentation Testing {#doc-testing}
```markdown
"SIMULATION MODE - NO ACTUAL CHANGES. Test this navigation hub:
[Insert content]
Tasks: Find session start, bug fix workflow, tool router, emergency help.
Report: accessibility, clarity, missing elements."
```

#### Architecture Validation {#arch-validation}
```markdown
"SIMULATION MODE - Analyze this architecture approach:
[Design details]
Evaluate: scalability, maintainability, potential issues, alternatives.
Provide: pros/cons, risk assessment, recommendations."
```

#### Solution Review {#solution-review}
```markdown
"SIMULATION MODE - Review this implementation approach:
[Code/solution details]
Check: best practices, edge cases, performance, security.
Suggest: improvements, potential bugs, testing strategies."
```

#### Workflow Testing {#workflow-testing}
```markdown
"SIMULATION MODE - Test this workflow:
[Workflow steps]
Simulate: happy path, error cases, user confusion points.
Report: bottlenecks, missing steps, improvement opportunities."
```

### Success Criteria {#simulation-success}
- [ ] All critical paths findable
- [ ] No more than 2-3 clicks to any workflow
- [ ] Emergency procedures accessible
- [ ] No circular references
- [ ] Clear navigation for all user types

### Results Documentation {#results-documentation}
```markdown
## Subagent Test Results - [Date]

### Test: [Name]
**Agent**: [Subagent response summary]
**Findings**:
- Navigation success: X/Y tasks
- Average clicks to target: N
- Missing elements: [list]
- Confusion points: [list]

### Improvements Needed:
1. [Specific fix]
2. [Specific fix]
```

## 📋 Behavioral Templates {#behavioral-templates}

These templates embed best practices directly into common workflows, removing decision points and pre-selecting optimal tools.

### Feature Implementation Template {#feature-template}
```yaml
1. DISCOVERY (Pre-selected: Serena)
   □ STATE: "I need to understand the existing code structure"
   □ USE: mcp__serena__find_symbol → locate relevant components
   □ USE: mcp__serena__find_referencing_symbols → understand usage
   □ USE: mcp__serena__get_symbols_overview → see overall structure
   
2. PLANNING (Pre-selected: TodoWrite + Task)
   □ STATE: "I need to plan the implementation"
   □ USE: TodoWrite → break down into subtasks
   □ USE: Task tool → deploy ultrathink for architecture decisions
   
3. IMPLEMENTATION (Pre-selected: Edit tools)
   □ Small changes: Edit
   □ Multiple changes: MultiEdit
   □ Whole functions: mcp__serena__replace_symbol_body
   □ New code after: mcp__serena__insert_after_symbol
   □ New code before: mcp__serena__insert_before_symbol
   
4. VERIFICATION (Pre-selected: Bash)
   □ npm test (or project test command)
   □ npm run lint (or project lint command)
   □ Manual testing if UI changes
```

### Bug Fix Template {#bug-fix-template}

#### 🔒 STEP 1: State the Bug (REQUIRED FIRST) {#bug-step-1}
**This step is LOCKED until you complete:**
- [ ] State: "The bug is: [specific description]"
- [ ] State: "It happens when: [reproduction steps]"
- [ ] State: "Expected behavior: [what should happen]"

**Cannot proceed?** → You don't understand the bug yet.

#### 🔒 STEP 2: Reproduction (LOCKED until Step 1 complete) {#bug-step-2}
**First show:** "Bug description: [paste from Step 1]"
**Then use:**
```yaml
REPRODUCTION (Pre-selected: Bash + Read)
   □ USE: Bash → run failing command/test
   □ USE: Read → examine error output
   □ CAPTURE: Exact error message
```
**Output:** Must paste actual error before proceeding

#### 🔒 STEP 3: Investigation (LOCKED until error shown) {#bug-step-3}
**First paste:** "Error output: [paste from Step 2]"
**Then use:**
```yaml
INVESTIGATION (Pre-selected: Serena)
   □ USE: mcp__serena__search_for_pattern → find error patterns
   □ USE: mcp__serena__find_symbol → locate problematic code
   □ USE: mcp__serena__find_referencing_symbols → trace data flow
```
**Output:** Must state root cause before proceeding

#### 🔒 STEP 4: Fix (LOCKED until root cause stated) {#bug-step-4}
**First state:** "Root cause: [explanation from Step 3]"
**Then choose:**
```yaml
FIX (Pre-selected: Edit tools)
   □ Point fix: Edit
   □ Multiple locations: MultiEdit
   □ Refactor function: mcp__serena__replace_symbol_body
```

#### 🔒 STEP 5: Verification (LOCKED until fix applied) {#bug-step-5}
**First confirm:** "Applied fix to: [list files changed]"
**Then verify:**
```yaml
VERIFICATION (Pre-selected: Bash)
   □ Re-run failing test → should pass
   □ Run full test suite → no regressions
   □ Check related functionality
```
**Output:** Must show passing tests

### Code Review Template {#code-review-template}
```yaml
1. OVERVIEW (Pre-selected: Serena)
   □ STATE: "I need to understand the changes"
   □ USE: mcp__serena__get_symbols_overview → structure overview
   □ USE: Bash → git diff to see changes
   
2. DEEP ANALYSIS (Pre-selected: Task)
   □ STATE: "I need to analyze code quality"
   □ USE: Task tool → deploy code review specialist
   □ Focus areas: security, performance, patterns
   
3. PATTERN CHECK (Pre-selected: Serena)
   □ USE: mcp__serena__search_for_pattern → find similar code
   □ Check: Consistency with existing patterns
   □ Check: No duplication introduced
```

### Refactoring Template {#refactoring-template}
```yaml
1. SCOPE ANALYSIS (Pre-selected: Serena)
   □ STATE: "I need to understand impact"
   □ USE: mcp__serena__find_referencing_symbols → all usages
   □ USE: mcp__serena__get_symbols_overview → structure
   
2. SAFE REFACTOR (Pre-selected sequence)
   □ Create tests first (if missing)
   □ USE: mcp__serena__replace_symbol_body → refactor
   □ Run tests after each change
   □ USE: MultiEdit → update references
   
3. CLEANUP (Pre-selected: Serena)
   □ USE: mcp__serena__search_for_pattern → find old patterns
   □ Remove deprecated code
   □ Update documentation
```

### Documentation Update Template {#doc-update-template}
```yaml
1. CONTEXT (Pre-selected: Read)
   □ STATE: "I need to understand current docs"
   □ USE: Read → existing documentation
   □ USE: mcp__serena__get_symbols_overview → if code docs
   
2. UPDATE (Pre-selected: Edit)
   □ Small changes: Edit
   □ Multiple sections: MultiEdit
   □ New file: Write
   
3. VERIFICATION (Pre-selected: Bash)
   □ Check links work
   □ Verify examples are accurate
   □ Run any doc generation tools
```

### Emergency Debug Template {#emergency-debug}
```yaml
1. TRIAGE (Pre-selected: Bash)
   □ STATE: "System is broken, need immediate fix"
   □ USE: Bash → check logs/status
   □ USE: Bash → identify failing component
   
2. QUICK FIX (if safe)
   □ Revert recent changes OR
   □ Apply minimal fix
   □ Document temporary nature
   
3. ROOT CAUSE (Pre-selected: Task)
   □ USE: Task tool → deploy debug specialist
   □ Full investigation once stable
   □ Permanent fix planning
```

### Using Templates Effectively {#using-templates}

1. **Start with the template** - Don't reinvent the workflow
2. **Follow the tool sequence** - Pre-selected for optimal results  
3. **Check all boxes** - They're there for a reason
4. **Adapt if needed** - But document why you deviated
5. **Improve templates** - Add learned patterns back

### Template Selection Guide {#template-selection}

| If you need to... | Use template... |
|-------------------|-----------------|
| Add new functionality | Feature Implementation |
| Fix something broken | Bug Fix |
| Review changes | Code Review |
| Clean up code | Refactoring |
| Update docs | Documentation Update |
| Fix urgent issue | Emergency Debug |
| Something else | Create new template! |

## Intent Handlers {#intent-handlers}

This section defines how to handle specific user intents when they're routed from CLAUDE.md's protocol-based navigation.

### Development Handlers {#development-handlers}

#### Handler: start-new-work {#start-new-work}
**Triggers**: "I want to work on X", "Let's build Y", "start working on Z"
**Target Pattern**: Extract feature/component name after "on" or "build"
**Pre-conditions**: 
- Valid project context exists
- No active work folder for same feature
**Process**:
1. Extract feature name from input
2. Create work folder: `YYYYMMDD-{feature-name}-ACTIVE`
3. Initialize 7-file structure (ALL CAPS)
4. Update SESSION.md with new work
5. Create initial todos with TodoWrite
6. Route to Standard Development Workflow
**Success**: Work folder created, todos initialized
**Failure**: Ask for clarification on feature name
**Examples**:
- "work on authentication" → Creates 20250712-authentication-ACTIVE
- "Let's build a meta flow creator" → Creates 20250712-meta-flow-creator-ACTIVE

#### Handler: continue-work {#continue-work}
**Triggers**: "continue with X", "back to Y", "resume Z"
**Target Pattern**: Extract work identifier after key verb
**Pre-conditions**: 
- Existing work folder must exist
- SESSION.md has record of work
**Process**:
1. Search for matching work folder
2. Read current state from tracker.md
3. Check TodoWrite for in-progress items
4. Show current status to user
5. Resume from last checkpoint
**Success**: Previous context restored, work resumed
**Failure**: No matching work found, show available options
**Examples**:
- "continue with auth" → Finds *-authentication-ACTIVE folder
- "back to the flow creator" → Resumes meta-flow-creator work

#### Handler: standard-dev-workflow {#standard-dev-workflow}
**Triggers**: "implement X", "add feature Y", "create functionality Z"
**Target Pattern**: Feature specification after action verb
**Pre-conditions**: 
- Clear feature requirements
- Work folder exists or will be created
**Process**:
1. If no work folder, route to start-new-work first
2. Break down into implementation steps
3. Create detailed todos
4. Begin with research/exploration
5. Follow TDD if applicable
6. Document as you go
**Success**: Feature implemented with tests and docs
**Failure**: Requirements unclear, needs clarification
**Examples**:
- "implement user login" → Full auth flow
- "add dark mode" → Theme system implementation

#### Handler: create-component {#create-component}  
**Triggers**: "create a new component", "build component X", "new component for Y"
**Target Pattern**: Component name and type
**Pre-conditions**: 
- Component doesn't already exist
- Valid component location identified
**Process**:
1. Check existing component patterns
2. Determine component type (UI, logic, hybrid)
3. Create component file(s)
4. Add necessary imports/exports
5. Create basic tests
6. Update component index if exists
**Success**: Component created following patterns
**Failure**: Component exists, suggest alternative
**Examples**:
- "create a Button component" → UI component with styles
- "new auth provider component" → Context/provider pattern

#### Handler: refactor-code {#refactor-code}
**Triggers**: "refactor X", "clean up Y", "improve Z code"
**Target Pattern**: Code location or pattern to refactor
**Pre-conditions**: 
- Code exists and is working
- Tests exist (or will be added first)
**Process**:
1. Analyze current implementation
2. Identify refactoring opportunities
3. Ensure tests cover current behavior
4. Apply refactoring patterns
5. Verify tests still pass
6. Update documentation
**Success**: Cleaner code, same behavior, tests pass
**Failure**: No tests exist, add tests first
**Examples**:
- "refactor the auth service" → Service pattern improvements
- "clean up the API calls" → Extract to service layer

### Task Management Handlers {#task-handlers}

#### Handler: create-todos {#create-todos}
**Triggers**: "plan out X", "break down Y", "create tasks for Z"
**Target Pattern**: Work item to decompose
**Pre-conditions**: 
- Clear understanding of overall goal
- TodoWrite tool available
**Process**:
1. Analyze work scope
2. Break into logical phases
3. Create hierarchical task structure
4. Set appropriate priorities
5. Add to TodoWrite
6. Show task breakdown to user
**Success**: Comprehensive task list created
**Failure**: Scope unclear, needs discussion
**Examples**:
- "plan out the migration" → Detailed migration steps
- "break down the feature" → Implementation tasks

#### Handler: update-todos {#update-todos}
**Triggers**: "mark X as done", "update task Y", "Z is complete"
**Target Pattern**: Task identifier or description
**Pre-conditions**: 
- Task exists in TodoWrite
- Valid status transition
**Process**:
1. Find matching task(s)
2. Update status appropriately
3. Check for dependent tasks
4. Update any blockers
5. Show updated task list
**Success**: Task status updated
**Failure**: No matching task found
**Examples**:
- "mark auth tests as done" → Updates specific task
- "API integration is complete" → Finds and updates task

#### Handler: check-progress {#check-progress}
**Triggers**: "where are we?", "what's left?", "show progress"
**Target Pattern**: Optional scope filter
**Pre-conditions**: 
- Active todos exist
- Work context established  
**Process**:
1. Read current todos
2. Calculate completion percentage
3. Identify blockers
4. Show completed/remaining breakdown
5. Highlight next priorities
**Success**: Clear progress summary shown
**Failure**: No active tasks found
**Examples**:
- "where are we?" → Overall progress summary
- "what's left on auth?" → Filtered progress view

### Session Management Handlers {#session-handlers}

#### Handler: show-capabilities {#show-capabilities}
**Triggers**: "what can you do", "help", "show commands", "list features", "show capabilities"
**Target Pattern**: Optional focus area (e.g., "help with testing")
**Pre-conditions**: 
- None - always available
**Process**:
1. **PRIMARY**: Show categorized capabilities
   ```
   🛠️ Development: start work, create components, refactor
   🐛 Problem Solving: fix bugs, debug issues, analyze code
   🔍 Search & Navigate: find code, search patterns, explore
   📝 Documentation: explain code, write docs, add comments
   🧪 Testing: run tests, create tests, check coverage
   📊 Git Operations: commit, branch, check status
   ```
2. Highlight most common: "work on X", "fix Y", "search for Z"
3. Show example phrases for each category
4. **FALLBACK**: Link to full HANDLERS.md
**Success**: User understands available commands
**Failure**: Redirect to specific documentation
**Examples**:
- "what can you do?" → Full capability overview
- "help with testing" → Testing-specific capabilities

#### Handler: start-session {#start-session}
**Triggers**: "let's start", "begin work", "start today's session"
**Target Pattern**: Optional continuation context
**Pre-conditions**: 
- Git repository accessible
- Previous session checked
**Process**:
1. Run date command for timestamp
2. Check git status
3. Read SESSION.md
4. Review recent commits
5. Ask what to work on
6. Update SESSION.md
**Success**: Session context established
**Failure**: Git issues, resolve first
**Examples**:
- "let's start" → Full session initialization
- "start working" → Quick session start

#### Handler: update-session {#update-session}
**Triggers**: "update SESSION.md", "record progress", "checkpoint session"
**Target Pattern**: Optional specific updates
**Pre-conditions**: 
- SESSION.md exists
- Work has progressed
**Process**:
1. Gather current state
2. Summarize achievements
3. Note any blockers
4. Update SESSION.md
5. Commit if requested
**Success**: Session record updated
**Failure**: No changes to record
**Examples**:
- "update session" → Auto-summarize progress
- "checkpoint our work" → Detailed state capture

#### Handler: end-session {#end-session}
**Triggers**: "let's wrap up", "end for today", "finish session"
**Target Pattern**: Optional handoff notes
**Pre-conditions**: 
- Active work exists
- Changes need preservation
**Process**:
1. Final todo status check
2. Update all work tracking files
3. Create handoff notes
4. Update SESSION.md
5. Suggest commit message
6. Clean up any temp files
**Success**: Clean session end, ready for handoff
**Failure**: Uncommitted changes need attention
**Examples**:
- "let's wrap up" → Full end-session flow
- "done for today" → Quick wrap with essentials

#### Handler: checkpoint-session {#checkpoint-session}
**Triggers**: Mid-session progress saves
**Target Pattern**: Automatic based on time/progress
**Pre-conditions**: 
- Significant progress made
- Time threshold passed
**Process**:
1. Auto-save current state
2. Update progress markers
3. Quick SESSION.md append
4. No interruption to flow
**Success**: Progress preserved
**Failure**: Silent skip
**Examples**:
- After major milestone → Auto-checkpoint
- Every 2 hours → Time-based checkpoint

### Specialist Deployment Handlers {#specialist-handlers}

#### Handler: deploy-ultrathink {#deploy-ultrathink}
**Triggers**: "think deeply about X", "ultrathink on Y", "need deep analysis of Z"
**Target Pattern**: Topic for analysis
**Pre-conditions**: 
- Complex problem identified
- Constraints documented
**Process**:
1. Formulate clear question
2. Gather relevant context
3. Set analysis constraints
4. Deploy ultrathink
5. Process response
6. Integrate insights
**Success**: Deep insights obtained
**Failure**: Question too vague
**Examples**:
- "think deeply about the architecture" → System design analysis
- "ultrathink on performance issues" → Optimization insights

#### Handler: deploy-specialist {#deploy-specialist}
**Triggers**: "get expert help on X", "need specialist for Y", "deploy expert"
**Target Pattern**: Expertise area needed
**Pre-conditions**: 
- Clear task for specialist
- Constraints defined
**Process**:
1. Identify specialist type
2. Prepare task description
3. Set clear constraints
4. Deploy specialist
5. Integrate results
**Success**: Expert solution provided
**Failure**: Task unclear for specialist
**Examples**:
- "need expert on database design" → DB specialist
- "get security expert" → Security analysis

#### Handler: orchestrate-complex {#orchestrate-complex}
**Triggers**: "this needs multiple experts", "orchestrate X", "coordinate specialists for Y"
**Target Pattern**: Complex multi-domain task
**Pre-conditions**: 
- Task spans multiple domains
- Clear decomposition possible
**Process**:
1. Decompose into specialist tasks
2. Identify dependencies
3. Deploy in correct order
4. Coordinate results
5. Synthesize solutions
**Success**: Coordinated solution achieved
**Failure**: Dependencies block progress
**Examples**:
- "orchestrate full feature" → Multi-specialist flow
- "coordinate auth implementation" → Security + DB + API experts

### Testing Handlers {#testing-handlers}

#### Handler: create-test-checkpoint {#create-test-checkpoint}
**Triggers**: "test X", "create tests for Y", "add test coverage"
**Target Pattern**: Feature or component to test
**Pre-conditions**: 
- Code exists to test
- Test framework available
**Process**:
1. Analyze code structure
2. Identify test scenarios
3. Create test structure
4. Write test cases
5. Run and verify
6. Update coverage metrics
**Success**: Tests pass, coverage improved
**Failure**: Test framework issues
**Examples**:
- "test the auth flow" → Integration tests
- "add unit tests" → Component testing

#### Handler: simulation-test {#simulation-test}
**Triggers**: "simulate X", "test workflow Y", "dry run Z"
**Target Pattern**: Workflow or process to simulate
**Pre-conditions**: 
- Workflow defined
- Simulation possible
**Process**:
1. Set up simulation env
2. Create test scenario
3. Run simulation
4. Capture results
5. Analyze outcomes
6. Report findings
**Success**: Simulation reveals insights
**Failure**: Can't simulate accurately
**Examples**:
- "simulate the migration" → Process validation
- "test the deployment flow" → Deploy simulation

#### Handler: validate-changes {#validate-changes}
**Triggers**: "verify X works", "validate the changes", "confirm Y is working"
**Target Pattern**: Changes to validate
**Pre-conditions**: 
- Changes implemented
- Validation criteria clear
**Process**:
1. Identify validation points
2. Run test suites
3. Manual testing if needed
4. Check edge cases
5. Verify requirements met
6. Document results
**Success**: All validations pass
**Failure**: Issues found, document them
**Examples**:
- "verify auth works" → Full auth validation
- "validate the refactoring" → Behavior preservation

### Work Tracking Handlers {#work-tracking-handlers}

#### Handler: create-work-folder {#create-work-folder}
**Triggers**: Automatic from other handlers
**Target Pattern**: Work item name
**Pre-conditions**: 
- No existing folder for work
- Valid work item name
**Process**:
1. Create folder with timestamp
2. Create subfolder structure:
   - plans/ (detailed plans, roadmaps)
   - design/ (DDII documents, analysis, architecture)
   - code/ (code attempts - what worked/failed)
   - archive/ (old versions with .old suffix)
3. Initialize 7 core files (ALL CAPS):
   - IMPLEMENTATION.md (the implementation plan)
   - TRACKER.md (checkbox tasks tracking the plan)
   - CHANGELOG.md (what actually changed/was built)
   - FINDINGS.md (discoveries, test results)
   - DECISIONS.md (key decisions with rationale)
   - MEMORY-REFS.md (related session memories)
   - HANDOFF.md (session transition info)
4. Add initial content with templates
5. Update SESSION.md
**Success**: 7-file structure with subfolders ready
**Failure**: Folder exists already
**Examples**:
- Via start-new-work → Auto-created
- "create work folder for X" → Direct creation

#### Handler: update-tracker {#update-tracker}
**Triggers**: "update progress", "log work done", "record status"
**Target Pattern**: Progress information
**Pre-conditions**: 
- Work folder exists
- Progress to record
**Process**:
1. Open tracker.md
2. Find Progress Log section
3. Add timestamped entry
4. Update Current State
5. Adjust Next Steps
**Success**: Progress recorded
**Failure**: No work folder found
**Examples**:
- "update progress" → Auto-summary
- "log that we finished X" → Specific entry

#### Handler: document-findings {#document-findings}  
**Triggers**: "I discovered X", "found that Y", "learned Z"
**Target Pattern**: Discovery or insight
**Pre-conditions**: 
- Work context exists
- Finding is significant
**Process**:
1. Open findings.md
2. Categorize finding
3. Add with context
4. Link to evidence
5. Note implications
**Success**: Finding documented
**Failure**: Finding too vague
**Examples**:
- "discovered the bug source" → Root cause doc
- "found performance issue" → Technical finding

#### Handler: record-decision {#record-decision}
**Triggers**: "decided to X", "choosing Y approach", "going with Z"
**Target Pattern**: Decision and rationale  
**Pre-conditions**: 
- Decision point reached
- Rationale available
**Process**:
1. Open decisions.md
2. Document decision
3. Add rationale
4. List alternatives considered
5. Note implications
**Success**: Decision preserved
**Failure**: Rationale unclear
**Examples**:
- "decided to use React" → Tech choice
- "going with microservices" → Architecture decision

#### Handler: fix-bug {#fix-bug}
**Triggers**: "fix bug X", "fix the Y bug", "resolve issue with Z", "bug in X"
**Target Pattern**: Bug description and location
**Pre-conditions**: 
- Bug identified or reported
- Can reproduce or understand issue
**Process**:
1. Understand the bug clearly
2. Route to bug-fix-template:
   ```yaml
   STATE: "I need to fix: [bug description]"
   USE: Load WORKFLOWS.md#bug-fix-template
   FOLLOW: Locked step progression
   ```
3. Cannot skip bug reproduction step
4. Must gather evidence before theorizing
**Success**: Bug fixed with evidence
**Failure**: Skipped template steps
**Examples**:
- "fix bug in login" → Load bug-fix-template
- "resolve issue with nav" → Bug fix workflow
- "login is broken" → Systematic debugging

#### Handler: debug-issue {#debug-issue}
**Triggers**: "debug X", "debug this Y", "find the problem in Z", "why is X failing"
**Target Pattern**: Issue or error to investigate
**Pre-conditions**: 
- Problem exists but cause unknown
- Need deep investigation
**Process**:
1. Capture initial symptoms
2. Route to emergency-debug template:
   ```yaml
   STATE: "I need to debug: [issue description]"
   USE: Load WORKFLOWS.md#emergency-debug
   FOLLOW: Emergency debug steps
   ```
3. Gather ALL evidence first
4. Form hypothesis only after evidence
**Success**: Root cause identified
**Failure**: Jumped to conclusions
**Examples**:
- "debug auth error" → Emergency debug mode
- "find why tests fail" → Deep investigation
- "why is it slow?" → Performance debugging

### Code Analysis Handlers {#code-analysis-handlers}

#### Handler: explain-code {#explain-code}
**Triggers**: "how does X work?", "explain this function", "what does Y do?", "explain the Z code"
**Target Pattern**: Code element to explain (file, function, class, module)
**Pre-conditions**: 
- Code element exists
- Can access source code
**Process**:
1. Find the code element using Serena
2. Read full context (imports, dependencies)
3. Analyze code structure and flow
4. Provide clear explanation with:
   - Purpose and responsibility
   - How it works step-by-step
   - Key dependencies and interactions
   - Example usage if helpful
5. Reference specific lines with file:line format
**Success**: Clear understanding achieved
**Failure**: Explanation without code evidence
**Examples**:
- "how does auth work?" → Explain auth system
- "explain useEffect hook" → Component lifecycle explanation
- "what does this function do?" → Detailed breakdown

#### Handler: code-review {#code-review}
**Triggers**: "review my changes", "check this code", "review PR", "code review for X"
**Target Pattern**: Code to review (changes, PR, specific files)
**Pre-conditions**: 
- Code changes exist
- Can access changed files
**Process**:
1. Identify scope of review:
   - Git changes: use git diff
   - Specific files: read with line numbers
   - PR: check all changed files
2. Route to code-review-template:
   ```yaml
   STATE: "I need to review: [scope description]"
   USE: Load WORKFLOWS.md#code-review-template
   FOLLOW: Systematic review checklist
   ```
3. Check for:
   - Logic errors and edge cases
   - Performance issues
   - Security concerns
   - Code style and patterns
   - Test coverage
4. Provide actionable feedback
**Success**: Comprehensive review with specific suggestions
**Failure**: Generic feedback without specifics
**Examples**:
- "review my auth changes" → Git diff review
- "check this component" → File-specific review
- "review PR #123" → Full PR review

### Performance & Documentation Handlers {#performance-doc-handlers}

#### Handler: optimize-code {#optimize-code}
**Triggers**: "optimize X", "improve performance", "make Y faster", "speed up Z"
**Target Pattern**: Code or feature to optimize
**Pre-conditions**: 
- Performance issue identified
- Can measure current performance
**Process**:
1. Identify performance bottlenecks:
   - Time complexity analysis
   - Space complexity review
   - Database query patterns
   - Rendering performance
2. Measure baseline if possible
3. Suggest optimizations:
   - Algorithm improvements
   - Caching strategies
   - Query optimization
   - Lazy loading
   - Memoization
4. Implement changes incrementally
5. Verify improvements
**Success**: Measurable performance gain
**Failure**: Premature optimization
**Examples**:
- "optimize the search" → Search algorithm improvements
- "make dashboard faster" → Rendering optimizations
- "improve API performance" → Query and caching strategies

#### Handler: create-docs {#create-docs}
**Triggers**: "document X", "write docs for Y", "create documentation", "add README"
**Target Pattern**: Code or feature to document
**Pre-conditions**: 
- Code exists and is stable
- Understand the audience (users, developers, etc.)
**Process**:
1. Determine documentation type:
   - API documentation
   - User guide
   - Developer guide
   - README file
   - Inline comments
2. Analyze what needs documenting:
   - Public APIs
   - Configuration options
   - Usage examples
   - Architecture overview
3. Follow project documentation patterns
4. Include:
   - Clear descriptions
   - Code examples
   - Common use cases
   - Troubleshooting tips
5. Place in appropriate location
**Success**: Clear, helpful documentation created
**Failure**: Documentation without examples
**Examples**:
- "document the API" → API reference docs
- "write README for auth" → Module documentation
- "create user guide" → End-user documentation

## Common Mistakes That Break Sessions {#common-mistakes}

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

## Common Development Workflows {#common-workflows}

This section shows complete workflows from start to finish, demonstrating how multiple handlers chain together to accomplish real development tasks.

### Building a New Feature {#workflow-new-feature}

**Scenario**: Add User Authentication to an App

```
User: "I want to work on user authentication"
Claude: [start-new-work] → Creates work folder and tracking
        What aspects of authentication do you want to implement?

User: "Login, logout, and session management"
Claude: [create-todos] → Breaks down into tasks:
        1. Create auth service structure
        2. Implement login functionality  
        3. Implement logout functionality
        4. Add session management
        5. Create auth UI components
        6. Add auth tests
        7. Integrate with existing app

User: "Let's start with the auth service"
Claude: [create-component] → Creates service structure
        Created: src/services/auth.service.js
        Added methods: login(), logout(), getSession()

User: "Add the login implementation"
Claude: [edit-file] → Implements login with:
        - Input validation
        - API communication
        - Token storage
        - Error handling

User: "Test that it works"
Claude: [create-test-checkpoint] → Creates and runs tests
        ✅ All auth service tests passing

User: "Great, commit this"
Claude: [commit-changes] → "feat: add auth service with login implementation"
```

### Fixing a Production Bug {#workflow-fix-bug}

**Scenario**: Users Can't Submit Forms

```
User: "Users report the submit button on the contact form isn't working"
Claude: [fix-bug] → Loads bug-fix-template
        First, I need to reproduce the issue...

User: "It works fine locally but fails in production"
Claude: [debug-issue] → Checks environment differences:
        1. API endpoint configuration
        2. CORS settings
        3. Environment variables
        
        Found it! Production API_URL missing /api prefix

User: "That makes sense! Fix it"
Claude: [edit-file] → Updates .env.production
        Also adding validation to prevent future issues

User: "Test that the fix works"
Claude: [validate-changes] → Creates verification test
        ✅ Test passes with correct URL
        ❌ Test fails with missing /api (as expected)

User: "Perfect, commit and let's deploy"
Claude: [commit-changes] → "fix: add missing /api prefix to production API_URL"
```

### Code Review Workflow {#workflow-code-review}

**Scenario**: Review Changes Before PR

```
User: "Review my changes before I create a PR"
Claude: [check-status] → Shows git diff in 4 files
        [code-review] → Loads review template

## Code Review Results

✅ Logic & Correctness
- User CRUD operations correct
- Proper error handling
- Edge cases handled

⚠️ Performance Concerns
- UserList re-renders unnecessarily
- API calls could be batched

🔒 Security Issues
- User input not sanitized
- API keys visible in client
- Missing auth on DELETE

User: "Fix the security issues first"
Claude: [edit-file] → Implements:
        1. Input sanitization
        2. Environment variables for keys
        3. Auth middleware on DELETE

User: "Now optimize the performance"
Claude: [optimize-code] → Applies:
        1. React.memo to UserList
        2. useCallback for handlers
        3. Request batching

User: "Great, review again"
Claude: [code-review] → ✅ All issues addressed
```

### Understanding Legacy Code {#workflow-understand-code}

**Scenario**: Need to Modify Complex System

```
User: "How does the payment system work?"
Claude: [explain-code] → Analyzes payment system
        [find-symbol] → Locates main functions

## Payment System Overview

1. Entry: processPayment() at processor.js:42
   - Receives payment data
   - Validates card info

2. Validation: validatePayment() at validation.js:15
   - Checks card format
   - Verifies expiry/CVV

3. Gateway: chargeCard() at gateway.js:78
   - Connects to Stripe
   - Handles 3D Secure

4. Response: Back at processor.js:67
   - Updates order status
   - Sends confirmation

User: "Where does it handle failed payments?"
Claude: [find-references] → Shows failure handling:
        - gateway.js:95 - Network failures
        - processor.js:73 - Business logic failures

User: "I need to add PayPal support"
Claude: Based on architecture:
        1. Create paypal-gateway.js
        2. Implement same interface
        3. Add to processor switch
        Want me to start implementing?
```

### Performance Optimization {#workflow-optimize}

**Scenario**: Application Running Slowly

```
User: "The dashboard is loading very slowly"
Claude: [debug-issue] → Performance investigation
        [measure-complexity] → Analyzing code

## Performance Analysis

🔴 Critical Issues:
1. Unnecessary Re-renders (Dashboard.jsx:45)
2. 15 Separate API Calls (api/dashboard.js:23)
3. Heavy Computation (calculations.js:67)

User: "Fix the API calls first"
Claude: [optimize-code] → Implements batching
        Before: 15 calls (3.2s)
        After: 3 calls (0.8s)

User: "Now fix the re-rendering"
Claude: [optimize-code] → Applies:
        - React.memo to children
        - useMemo for calculations
        - useCallback for handlers
        Renders: 47 → 3

User: "What's the overall improvement?"
Claude: Summary:
        Load time: 4.8s → 1.2s (75% faster)
        Interaction: 400ms → 50ms (87% faster)
        Memory: 45MB → 28MB (38% reduction)
```

### Test-Driven Development {#workflow-tdd}

**Scenario**: Building with TDD

```
User: "Let's build a user profile component using TDD"
Claude: [create-test-checkpoint] → Writes tests first:
        1. Renders user information
        2. Handles missing data
        3. Shows edit button for own profile
        4. Hides edit for others
        5. Updates on data change

User: "Run the tests"
Claude: [run-tests] → ❌ All 5 failing (expected)

User: "Create minimal implementation"
Claude: [create-component] → Basic UserProfile
        [run-tests] → ✅ 3/5 passing

User: "Fix the failing tests"
Claude: [edit-file] → Adds:
        - Null checks
        - useEffect for updates
        [run-tests] → ✅ 5/5 passing!

User: "Refactor to make it cleaner"
Claude: [refactor-code] → Extracts:
        - UserAvatar component
        - useUserProfile hook
        [run-tests] → ✅ Still passing!
```

### Key Workflow Patterns {#workflow-patterns}

1. **Investigation → Implementation → Validation**
   - First understand (search, explain, analyze)
   - Then implement (create, edit, refactor)
   - Finally validate (test, review, commit)

2. **Incremental Progress**
   - Break large tasks into small steps
   - Validate each step before proceeding
   - Commit working code frequently

3. **Context Building**
   - Start broad, then narrow focus
   - Gather evidence before changes
   - Document decisions and findings

4. **Systematic Approach**
   - Use templates for consistency
   - Follow established patterns
   - Maintain tracking throughout

### Workflow Success Tips {#workflow-tips}

1. **Set Clear Goals**
   - State what you want to achieve
   - Define success criteria
   - Identify constraints

2. **Provide Context**
   - Mention related files
   - Explain business requirements
   - Share previous decisions

3. **Iterate and Refine**
   - Start simple, enhance gradually
   - Test frequently
   - Refactor when stable

4. **Track Progress**
   - Use work tracking system
   - Commit meaningful checkpoints
   - Document important findings

These workflows show how handlers chain together to accomplish real development tasks efficiently and systematically.

## 📚 See Also {#see-also}

- **[CONVENTIONS.md](CONVENTIONS.md)** - Git aliases and code standards
- **[TOOLS.md](TOOLS.md)** - MCP tool configurations
- **[CLAUDE-NEW.md](CLAUDE-NEW.md)** - Quick navigation hub
- **[PROJECT-BLOG.md](PROJECT-BLOG.md)** - Project-specific details
- **[BUILDING-BETTER.md](BUILDING-BETTER.md)** - How to evolve this system

---

Remember: Perfect workflow execution leads to perfect project outcomes. These patterns are proven across hundreds of sessions.
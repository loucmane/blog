# Flow: Session Start

Created using the Meta-Flow for Creating Workflows

## 1. IDENTIFY THE PATTERN

**Trigger**: Opening Claude/AI assistant to begin development work
- Fresh start for new day
- Continuing from previous session  
- Resuming after break/interruption
- After context compaction

**Expected Outcomes**:
- SESSION.md updated with new entry
- Context understood and loaded
- Ready to work on specific tasks
- Continuity maintained

## 2. MAP THE DISCOVERY PHASE

**What's Unknown at Start**:
- Current git status
- What was done previously
- What needs to continue
- Any blocking issues

**How to Explore**:
1. Check SESSION.md for previous work
2. Check git status for uncommitted changes
3. Read relevant memories
4. Check work folder handoffs
5. Review any todo items

**Tools for Discovery**:
- Read (SESSION.md, memories, handoffs)
- Bash (git status, pwd, date)
- TodoRead (if todos exist)
- Serena (list_memories, read_memory)

## 3. DEFINE DECISION POINTS

**Decision 1: Fresh vs Continuation**
```
Previous work exists?
├─ Yes → Read previous context
│   └─ Continue from handoff
└─ No → Fresh start
    └─ Define new goals
```

**Decision 2: Context State**
```
Uncommitted changes?
├─ Yes → Understand changes
│   ├─ Related to previous work → Continue
│   └─ Unrelated → Handle first or note
└─ No → Clean slate
```

**Decision 3: Serena Availability**
```
Serena configured?
├─ Yes → Activate project + read memories
└─ No → Proceed with basic tools
```

## 4. DOCUMENT TOOL SEQUENCES

### Standard Session Start Sequence:

1. **Get Timestamp**
   ```bash
   date "+%Y-%m-%d %H:%M %Z"
   ```
   Output: Exact timestamp for SESSION.md

2. **Check Location & Git**
   ```bash
   pwd && git branch --show-current
   git status
   ```
   Output: Current directory, branch, changes

3. **Read Previous Context**
   ```
   Read SESSION.md
   Read latest work folder handoff (if exists)
   ```
   Output: Understanding of previous work

4. **Load Memories (if Serena)**
   ```
   mcp__serena__activate_project --project="[path]"
   mcp__serena__list_memories
   mcp__serena__read_memory --memory_file_name="[latest]"
   ```
   Output: Historical context

5. **Check Todos**
   ```
   TodoRead (if exists)
   ```
   Output: Pending tasks

6. **Update SESSION.md**
   ```
   Edit SESSION.md with new session entry
   ```
   Output: Session documented

## 5. BUILD IN ADAPTATION

**Adaptation: Dirty Git State**
- Trigger: Uncommitted changes found
- Response: 
  - If minor: Note in SESSION.md and continue
  - If major: Address first or create commit

**Adaptation: No Previous Context**
- Trigger: First time on project
- Response:
  - Run Serena onboarding if available
  - Create initial SESSION.md
  - Define clear goals with user

**Adaptation: High Context Warning**
- Trigger: Resuming at >80% context
- Response:
  - Create memory immediately
  - Plan for early handoff
  - Consider what's essential

**Adaptation: Multiple Work Folders Active**
- Trigger: Several ACTIVE folders found
- Response:
  - Check dates and relevance
  - Ask user which to continue
  - Note others in SESSION.md

## 6. SPECIFY OUTPUTS

**Required Outputs**:
1. SESSION.md with new entry containing:
   - Timestamp (from date command)
   - Task description (from user)
   - Validation checklist completed
   - Starting context documented
   - Goals stated

2. Mental Model established:
   - What was done before
   - What needs doing now
   - Any constraints or issues

3. Ready State achieved:
   - Tools loaded
   - Context understood
   - Goals clear
   - Can start working

## 7. CREATE CONTINUATION

**For Session End**:
- Update SESSION.md status
- Create memory if significant work
- Clear handoff in work folder

**For Interruption**:
- Quick SESSION.md update
- Note stopping point
- Commit if needed

**For Next Session**:
- Will read this SESSION.md entry
- Will check for handoff
- Will load relevant memories

## 8. PLAN REFERENCE POINTS

**Where This Flow Should Be Discoverable**:

1. **CLAUDE.md**:
   - Quick Actions → Start of Session (primary)
   - Decision Matrix: "How do I start?" → Session Start Flow
   - First line of doc: "Always start with Session Flow"

2. **WORKFLOWS.md**:
   - Session Management section (detailed)
   - Very first workflow listed

3. **SESSION.md Template**:
   - Top comment: "Follow Session Start Flow"
   - Link in validation checklist

4. **Error Recovery**:
   - "Context lost" → See Session Start Flow
   - "Don't know where we are" → Session Start Flow

5. **Serena Messages**:
   - After activation: "Continue with Session Start Flow"

6. **Common References**:
   - TodoWrite when starting: "First do Session Start"
   - Memory creation: "See Session Start for next time"

## Complete Flow Summary

```yaml
SESSION START FLOW:
1. Get timestamp: date "+%Y-%m-%d %H:%M %Z"
2. Check context: pwd && git status
3. Read previous: SESSION.md + handoffs
4. Load memories: Serena if available
5. Check todos: TodoRead if exists
6. Update SESSION.md: New entry with validation
7. State goals: Clear with user
8. Ready to work!

Quick Version (Continuing Work):
1. date → SESSION.md
2. git status → clean?
3. Read handoff → continue
4. Go!
```
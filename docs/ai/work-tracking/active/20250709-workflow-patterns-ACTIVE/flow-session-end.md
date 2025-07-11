# Flow: Session End

Created using the Meta-Flow for Creating Workflows

## 1. IDENTIFY THE PATTERN

**Trigger**: 
- User says "I'm done" / "I'm stopping"
- Context approaching limit (>90%)
- Natural break point reached
- Switching to different project
- End of day/work period

**Expected Outcomes**:
- Work properly saved and documented
- Memory created for significant sessions
- Clean git state (committed or stashed)
- Clear handoff for next session
- SESSION.md shows completed status

## 2. MAP THE DISCOVERY PHASE

**What's Unknown**:
- What was actually accomplished
- What remains undone
- What should be remembered
- What needs immediate handoff

**How to Explore**:
1. Review SESSION.md progress log
2. Check git diff for changes
3. Review any open todos
4. Check work folder status
5. Assess if memory needed

**Tools for Discovery**:
- Read (SESSION.md review)
- Bash (git status, git diff)
- TodoRead (check incomplete items)
- LS (check work folders)

## 3. DEFINE DECISION POINTS

**Decision 1: Commit Readiness**
```
Uncommitted changes exist?
├─ Yes → Are changes complete?
│   ├─ Yes → Create commit
│   └─ No → Document state
└─ No → Proceed to memory
```

**Decision 2: Memory Creation**
```
Significant work done?
├─ Yes → Create session memory
│   ├─ Multi-hour session → Detailed memory
│   └─ Important decisions → Capture context
└─ No → Skip memory
    └─ Minor updates only
```

**Decision 3: Work Folder Status**
```
Active work folders?
├─ Yes → Need handoff?
│   ├─ Yes → Update handoff.md
│   └─ No → Note completion
└─ No → Simple session end
```

## 4. DOCUMENT TOOL SEQUENCES

### Standard Session End Sequence:

1. **Review Progress**
   ```
   Read SESSION.md (own session section)
   TodoRead (if exists)
   ```
   Output: Understanding of what was done

2. **Check Git State**
   ```bash
   git status
   git diff  # if changes exist
   ```
   Output: Know what needs handling

3. **Handle Uncommitted Work**
   ```bash
   # If complete:
   gac "type: description with 'single quotes'"
   
   # If incomplete:
   git stash push -m "WIP: session end $(date +%Y%m%d)"
   # OR document in SESSION.md why not committing
   ```
   Output: Clean git state

4. **Update SESSION.md**
   ```
   Edit SESSION.md
   - Update status to "Completed" or "Paused"
   - Add final timestamp
   - Note any blockers or handoff items
   ```
   Output: Session properly closed

5. **Create Memory (if needed)**
   ```
   mcp__serena__write_memory \
     --memory_name="session_$(date +%Y-%m-%d)_topic_description" \
     --content="[session summary]"
   ```
   Output: Knowledge preserved

6. **Update Work Folder Handoff**
   ```
   Edit handoff.md in active work folder
   - Current state
   - Next steps
   - Any blockers
   ```
   Output: Clear continuation path

## 5. BUILD IN ADAPTATION

**Adaptation: Urgent Stop**
- Trigger: Need to stop immediately
- Response: 
  - Quick SESSION.md update with "URGENT STOP"
  - Git stash if changes
  - Minimal handoff note

**Adaptation: Context Limit Hit**
- Trigger: At 95%+ context
- Response:
  - Prioritize memory creation
  - Capture only essential state
  - Create detailed handoff

**Adaptation: Work Blocked**
- Trigger: Can't continue due to external factor
- Response:
  - Document blocker clearly
  - Create memory of attempts
  - Update work folder to BLOCKED

**Adaptation: Multiple Active Works**
- Trigger: Several work streams open
- Response:
  - Update each handoff.md
  - Prioritize in SESSION.md
  - Note relationships

## 6. SPECIFY OUTPUTS

**Required Outputs**:

1. **SESSION.md Updated**:
   - Final timestamp
   - Status (Completed/Paused/Blocked)
   - Summary of accomplishments
   - Any handoff notes

2. **Git State Clean**:
   - Changes committed OR
   - Changes stashed with message OR
   - Reason documented why not

3. **Memory Created** (if significant):
   - Named: session_YYYY-MM-DD_description
   - Contains: Work done, decisions, next steps
   - Includes: "How to Initialize Next Session"

4. **Work Folder Handoff** (if active):
   - handoff.md updated
   - Current state clear
   - Next steps defined
   - Blockers noted

## 7. CREATE CONTINUATION

**For Next Session**:
- Read SESSION.md to see this session
- Check handoff.md for specifics
- Load memory if created
- Continue from documented state

**Handoff Message Template**:
```
To initialize next session, tell Claude:
"Continue [specific work/task] from [date]. 
Check handoff in [work folder path]"
```

**Emergency Continuation**:
- If stopped abruptly, note: "EMERGENCY STOP - check git stash"
- Include timestamp of stash
- Brief note of what was in progress

## 8. PLAN REFERENCE POINTS

**Where This Flow Should Be Discoverable**:

1. **CLAUDE.md**:
   - Quick Actions → End of Session
   - Decision Matrix: "How do I end?" → Session End Flow
   - Decision Matrix: "Time to stop?" → Session End Flow

2. **WORKFLOWS.md**:
   - Session Management section
   - After Session Start Flow

3. **SESSION.md**:
   - Template comment: "End with Session End Flow"
   - In each session's status field

4. **Context Warnings**:
   - At 90%: "Approaching limit - see Session End Flow"
   - At 95%: "URGENT: Follow Session End Flow"

5. **Common Triggers**:
   - User says "done" → "Let me follow Session End Flow"
   - Creating memory → "Part of Session End Flow"
   - Git commit → "After commit, continue Session End"

6. **Work Folders**:
   - handoff.md template: "Update via Session End Flow"

## Complete Flow Summary

```yaml
SESSION END FLOW:
1. Review: What did we accomplish?
2. Git state: status → commit/stash/document
3. SESSION.md: Update with final status
4. Memory?: If significant → create
5. Handoff: Update work folders
6. Message: How to continue next time

Quick Version (Minor Session):
1. git status → clean?
2. Update SESSION.md → mark complete
3. Done!

Full Version (Major Session):
1. Review progress
2. Handle git changes
3. Update SESSION.md
4. Create memory
5. Update handoffs
6. Clear next steps
```

## Example Memory Content

```markdown
# Session 2025-07-09: Workflow Patterns Creation

## Work Completed
- Created meta-flow for documenting workflows
- Documented Session Start Flow
- Documented Session End Flow
- Enhanced with reference points

## Key Decisions
- Workflows need multiple discovery paths
- Reference points are part of flow design
- Following own workflows is critical

## Next Steps
- Continue with remaining fundamental flows
- Test flows with real usage
- Integrate into WORKFLOWS.md

## How to Initialize Next Session
Tell Claude: "Continue workflow patterns work from 2025-07-09.
Check handoff in /docs/ai/work-tracking/active/20250709-workflow-patterns-ACTIVE/handoff.md"

## Important Context
- Using meta-flow to create all flows
- Following documentation workflow properly
- 2 of 14 flows completed
```
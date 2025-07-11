# Workflow Patterns - Implementation Plan

## Overview
Creating a comprehensive workflow pattern system that documents how to handle every type of development task, starting with a meta-flow for creating flows.

## The Meta-Flow: Creating Workflow Documentation

### When to Use This Meta-Flow
- **No existing flow** for your task type
- **Existing flow doesn't fit** your specific situation
- **New pattern discovered** that others would benefit from
- **Variation needed** on existing flow

### How to Use This Meta-Flow
1. **Assess significance**:
   - One-time variation? → Just adapt on the fly
   - Recurring pattern? → Create new flow
2. **If creating new flow**:
   - Simple addition? → Add directly to WORKFLOWS.md
   - Complex pattern? → Create work folder first
3. **Follow the 7 steps below**
4. **Test with real scenario**
5. **Integrate into WORKFLOWS.md**
6. **Update decision matrix** to point to new flow

```yaml
WORKFLOW CREATION META-FLOW:

1. IDENTIFY THE PATTERN:
   Trigger Question: "What starts this workflow?"
   - User request type (bug, feature, review, etc.)
   - Current state requirements
   - Expected outcomes
   
   Output: Clear pattern name and trigger conditions

2. MAP THE DISCOVERY PHASE:
   Questions to Answer:
   - What's unknown at start?
   - How do we explore/investigate?
   - What tools help discovery?
   
   Output: Discovery steps with tool choices

3. DEFINE DECISION POINTS:
   For Each Major Step:
   - What could happen here?
   - What determines the path?
   - How do we adapt?
   
   Output: Decision tree with branches

4. SEQUENCE THE TOOLS:
   For Each Path:
   - Which tools in what order?
   - What info flows between them?
   - How to verify success?
   
   Output: Tool chain for each scenario

5. ADD ESCAPE HATCHES:
   Consider:
   - What if assumptions are wrong?
   - How to handle unexpected cases?
   - When to ask for help?
   
   Output: Fallback procedures

6. INCLUDE EXAMPLES:
   Provide:
   - Real scenario walkthrough
   - Command/response samples
   - Common variations
   
   Output: Concrete examples

7. CREATE DISCOVERY PATHS:
   Ensure findable via:
   - Decision matrix entry
   - Error/situation references  
   - Tool documentation links
   
   Output: Multiple access points
```

### Example: Documentation Update Flow

```yaml
FLOW: Documentation Update

TRIGGER: User wants to update/improve documentation

DISCOVERY PHASE:
1. Clarify scope: "Which docs need updating?"
2. Check current state: Read existing docs
3. Understand reason: "What prompted this?"

DECISION POINTS:
- Simple typo fix? → Direct edit
- New section needed? → Check structure first
- Major reorganization? → Create work folder

TOOL SEQUENCE (Simple Update):
1. Read → Current documentation
2. Edit → Make changes
3. Read → Verify changes
4. Git → Commit with clear message

TOOL SEQUENCE (Major Update):
1. Create → Work folder
2. Read → All related docs
3. Write → New structure plan
4. Edit → Progressive changes
5. Test → Verify links work
6. Git → Commit updates

ESCAPE HATCHES:
- Unsure about structure? → Check BUILDING-BETTER.md
- Breaking changes? → Ask user first
- Complex reorg? → Create proposal first

REAL EXAMPLE:
User: "Update the session management docs"
1. Read SESSION.md template
2. Read session management in WORKFLOWS.md
3. Identify gaps or confusion
4. Edit to clarify
5. Verify cross-references work
6. Commit: "docs: clarify session lifecycle rules"

DISCOVERY PATHS:
- Decision Matrix: "Update docs" → This flow
- From any doc task → This flow
- Git commit preparation → References this
```

### Meta-Flow V2: Enhanced with Advanced Patterns

## Meta-Flow V2: The Art of Creating Exceptional Workflows

### Core Philosophy
Workflows aren't just instructions - they're behavioral blueprints that shape how work gets done. A great workflow anticipates needs, prevents errors, and guides users to success naturally.

### The 10-Step Master Pattern

#### 1. PATTERN DEEP DIVE
```yaml
Beyond "What starts this?":
- What's the user's emotional state? (frustrated? exploring? urgent?)
- What's the hidden complexity they don't see yet?
- What expertise level are they at?
- What's the REAL goal behind the request?

Output: Nuanced understanding of context and needs
```

#### 2. ERROR PREVENTION FIRST
```yaml
Start with "What goes wrong?":
- List the top 5 failures in this type of work
- Design the flow to make these impossible
- Build in checks BEFORE errors can occur
- Make the right path the obvious path

Output: Error-resistant workflow design
```

#### 3. PROGRESSIVE COMPLEXITY
```yaml
Layer the workflow:
- Layer 1: Quick path for experts (20% of detail)
- Layer 2: Standard path with guidance (60% of detail)  
- Layer 3: Deep dive with all edge cases (100% of detail)
- Users self-select their needed depth

Output: Workflow that serves all expertise levels
```

#### 4. DECISION ARCHITECTURE
```yaml
Design decisions, don't just document them:
- Make expensive decisions early when context is high
- Batch similar decisions together
- Provide sensible defaults
- Show consequences before commitment

Output: Decision flow that reduces cognitive load
```

#### 5. TOOL MASTERY SEQUENCES
```yaml
Beyond "use X then Y":
- Why this tool order? (data dependencies)
- What patterns between tools? (output → input)
- Which tools can run in parallel?
- Where are the efficiency gains?

Output: Optimized tool choreography
```

#### 6. INTELLIGENT ADAPTATION
```yaml
Build in learning:
- How does the flow improve with use?
- What patterns should it remember?
- When to suggest flow updates?
- How to capture new patterns?

Output: Self-improving workflow
```

#### 7. QUALITY GATES & CHECKPOINTS
```yaml
Strategic verification:
- Not just "did it work?" but "is it excellent?"
- Quality checks that teach, not just test
- Celebration points for progress
- Clear rollback procedures

Output: Quality embedded in process
```

#### 8. CONTEXT & STATE MANAGEMENT
```yaml
Information flow design:
- What context must be preserved?
- How does state flow between steps?
- Where are the handoff points?
- What gets documented when?

Output: Smooth information architecture
```

#### 9. REAL-WORLD INTEGRATION
```yaml
Connect to actual practice:
- How does this fit with other workflows?
- What are the upstream dependencies?
- What are the downstream impacts?
- Where are the integration points?

Output: Workflow that plays well with others
```

#### 10. CONTINUOUS IMPROVEMENT LOOPS
```yaml
Build in evolution:
- Feedback capture mechanisms
- Pattern recognition triggers
- Update procedures
- Success metrics

Output: Living workflow that evolves
```

### Example: Meta-Flow V2 Applied

```yaml
FLOW: Bug Fix Flow V2

1. PATTERN DEEP DIVE:
- Emotional state: User frustrated, possibly blocked
- Hidden complexity: Root cause vs symptoms
- Expertise varies: From "it's broken" to detailed reports
- Real goal: Unblock progress + prevent recurrence

2. ERROR PREVENTION FIRST:
Top failures:
- Fixing symptoms not causes → Flow forces root cause analysis
- Incomplete testing → Built-in test requirements
- Breaking other things → Regression check mandatory
- Poor documentation → Fix explanation required
- Reoccurrence → Pattern detection built in

3. PROGRESSIVE COMPLEXITY:
Quick Path (Expert):
- Reproduce → Fix → Test → Document → Done

Standard Path:
- Understand report → Reproduce → Investigate cause
- Design fix → Implement → Test all paths
- Document → Review → Deploy

Deep Path:
- All above + architecture review
- Pattern analysis for prevention
- Team knowledge sharing
- Process improvement

[... continues with all 10 steps ...]
```

### Meta-Flow V2 Benefits

1. **Behavioral Design**: Shapes how people work, not just what they do
2. **Error Resilience**: Prevents mistakes before they happen
3. **Adaptive Complexity**: Right depth for right situation
4. **Continuous Improvement**: Gets better with use
5. **Human-Centered**: Considers emotional and cognitive factors

### Using Meta-Flow V2

1. **Start with empathy**: Understand the human using the flow
2. **Design for prevention**: Make errors impossible
3. **Layer complexity**: Don't overwhelm, progressively disclose
4. **Build in learning**: The flow should teach and improve
5. **Test with reality**: Use actual scenarios, not ideal ones

Remember: A workflow is only as good as its ability to guide real humans through real work to achieve excellent results consistently.

## Standard Workflow Pattern Template

```yaml
WORKFLOW: [Name]

TRIGGER CONDITIONS:
- When does this workflow start?
- What prerequisites exist?
- What state should things be in?

INITIAL ASSESSMENT:
- What do we know?
- What do we need to discover?
- What could go wrong?

DISCOVERY PHASE:
1. [Investigation steps]
2. [Information gathering]
3. [Context building]

DECISION TREE:
- If [condition] → Path A
- If [condition] → Path B
- If [unclear] → Path C

PATH A: [Name]
1. [Specific steps]
2. [Tool usage]
3. [Verification]

PATH B: [Name]
1. [Different steps]
2. [Different tools]
3. [Different checks]

QUALITY CHECKS:
- [ ] Verify [specific outcome]
- [ ] Check [specific quality]
- [ ] Confirm [specific requirement]

COMPLETION:
- Update documentation
- Commit changes
- Update tracking
- Create memory if needed

RECOVERY PROCEDURES:
- If [failure] → [recovery steps]
- If [blocked] → [escalation path]
- If [wrong path] → [correction steps]
```

## Implementation Phases

### Phase 1: Fundamental Flows
These are the building blocks that other flows reference:

1. **Session Start Flow**
   - Start correctly every time
   - Load context properly
   - Set up for success
   - Prevent duplicate work

2. **Session End Flow**
   - Close out properly
   - Save context
   - Document handoff
   - Clean state

3. **Context Management Flow**
   - Monitor context usage
   - Optimize when high
   - Preserve critical info
   - Smooth transitions

4. **Git Commit Flow**
   - Consistent commits
   - Good messages
   - Proper staging
   - PR readiness

5. **Tool Discovery Flow**
   - Start simple
   - Escalate when needed
   - Chain tools effectively
   - Know when to stop

6. **Work Tracking Decision Flow**
   - New folder vs continue
   - Which files to create
   - How to organize
   - When to close work

7. **Integration Flow**
   - Create improvement
   - Test thoroughly
   - Integrate cleanly
   - Update all references

8. **Specialist Deployment Flow**
   - Assess value-add
   - Package context
   - Deploy effectively
   - Integrate results

### Phase 2: Task-Specific Flows
These handle specific types of work:

1. **Bug Fix Flow**
   - From report to resolution
   - Investigation tools
   - Testing requirements
   - Documentation needs

2. **Feature Implementation Flow**
   - From request to deployment
   - Design decisions
   - User testing checkpoints
   - Integration steps

3. **Code Review Flow**
   - From PR to approval
   - Review criteria
   - Feedback integration
   - Follow-up actions

4. **Emergency Debug Flow**
   - From "it's broken" to fixed
   - Triage process
   - Quick fixes vs proper fixes
   - Post-mortem needs

5. **Exploration/Research Flow**
   - From question to understanding
   - Research tools
   - Knowledge capture
   - Share findings

6. **Refactoring Flow**
   - From "needs cleanup" to clean
   - Safety checks
   - Incremental approach
   - Verification steps

### Phase 3: Integration & Polish
- Test each flow with real examples
- Ensure consistency across flows
- Create clear navigation
- Update all references

### Execution Strategy
1. Create flows in separate files first
2. Test each with real scenario
3. Refine based on testing
4. Integrate into WORKFLOWS.md in batches
5. Update decision matrix progressively
6. Create comprehensive memory at end

## Reference Points - Where Each Flow Must Be Discoverable

### Fundamental Flows References

1. **Session Start Flow**
   - CLAUDE.md: Quick Actions section → "Start of Session" 
   - WORKFLOWS.md: Session Management section
   - Decision Matrix: "How do I start work?" → Session Start Flow
   - SESSION.md template: Link at top

2. **Session End Flow**
   - CLAUDE.md: Quick Actions section → "End of Session"
   - WORKFLOWS.md: Session Management section
   - Decision Matrix: "When/how to end session?" → Session End Flow
   - Context warning messages: "See Session End Flow"

3. **Context Management Flow**
   - CLAUDE.md: Add new section for context management
   - Decision Matrix: "Context getting high?" → Context Management Flow
   - System warnings at 90%: Link to flow
   - SESSION.md: Reference when documenting high context

4. **Git Commit Flow**
   - CONVENTIONS.md: Git Conventions section
   - CLAUDE.md: Quick Reference (gac command)
   - Decision Matrix: "Ready to commit?" → Git Commit Flow
   - WORKFLOWS.md: Link from standard dev workflow

5. **Tool Discovery Flow**
   - TOOLS.md: At the very top - "Don't know which tool?"
   - Decision Matrix: "Which tool to use?" → Tool Discovery Flow
   - CLAUDE.md: Essential Tools section
   - Each tool's error message: "See Tool Discovery Flow"

6. **Work Tracking Decision Flow**
   - WORKFLOWS.md: Work Tracking Organization section
   - Decision Matrix: "Should I create work folder?" → Work Tracking Decision Flow
   - CLAUDE.md: Quick Reference section
   - SESSION.md: When starting new work

7. **Integration Flow**
   - WORKFLOWS.md: Top-level principle section
   - BUILDING-BETTER.md: Core methodology
   - Decision Matrix: "How to integrate changes?" → Integration Flow
   - Every work folder's handoff.md

8. **Specialist Deployment Flow**
   - WORKFLOWS.md: Orchestration section
   - TOOLS.md: Task tool documentation
   - Decision Matrix: "When to use specialists?" → Specialist Deployment Flow
   - CLAUDE.md: Complex Task Handling section

### Task-Specific Flows References

1. **Bug Fix Flow**
   - Decision Matrix: "Fix a bug" → Bug Fix Flow
   - CLAUDE.md: Common Workflows section
   - Error messages: "To fix this, see Bug Fix Flow"

2. **Feature Implementation Flow**
   - Decision Matrix: "Add a feature" → Feature Implementation Flow
   - CLAUDE.md: Common Workflows section
   - TaskMaster task descriptions: Link to flow

3. **Code Review Flow**
   - Decision Matrix: "Review code" → Code Review Flow
   - CLAUDE.md: Common Workflows section
   - PR templates: Reference flow

4. **Emergency Debug Flow**
   - Decision Matrix: "Something's broken!" → Emergency Debug Flow
   - Error handling: Link to flow
   - SESSION.md: Crisis markers

5. **Exploration/Research Flow**
   - Decision Matrix: "Research something" → Exploration Flow
   - TOOLS.md: Research tools section
   - Unknown task handling: Default to this

6. **Refactoring Flow**
   - Decision Matrix: "Clean up code" → Refactoring Flow
   - CONVENTIONS.md: Code quality section
   - Code smell detection: Link to flow

### Cross-References to Add

1. **In CLAUDE.md Decision Matrix**: Add ALL flows
2. **In TOOLS.md**: Add "See relevant flow" for each tool category
3. **In CONVENTIONS.md**: Link to relevant flows from each convention
4. **In WORKFLOWS.md**: Clear navigation to each flow
5. **In Error Messages**: "For this situation, see X Flow"
6. **In Templates**: Reference applicable flows
7. **In Memories**: Note which flows were used

### Discovery Paths
Each flow should be findable through:
- Direct search (clear naming)
- Decision matrix (question → flow)
- Context (error → flow, tool → flow)
- Navigation (section → flow)
- Cross-references (related flows)

## Constraint-Based System Implementation

### Problem Statement (2025-07-10)
Documentation exists but isn't consulted at decision points. The AI defaults to familiar patterns rather than checking documented best practices. Even with Flight Protocol, the system still relies on voluntary compliance.

### Solution Architecture (from subagent analysis)

#### Core Insight
"The goal isn't perfect rule-following - it's making the right behavior the path of least resistance."

#### 1. Hard Constraints
Make wrong choices impossible, not just discouraged:
- Block access to wrong tools entirely
- Make correct tool the only available option
- Example: Disable grep for code searches, only allow Serena

Implementation approach:
```python
# Conceptual - not actual code
class ToolAccessControl:
    blocked_tools = {
        'search': ['grep', 'find'],  # Force Serena
        'timestamp': ['manual_typing'],  # Force date command
        'commit': ['git commit'],  # Force gac alias
    }
    
    def before_tool_use(self, tool, purpose):
        if self.is_blocked(tool, purpose):
            return self.suggest_alternative(tool, purpose)
```

#### 2. Just-in-Time Guidance
Inject relevant context at exact decision moment:
- Don't rely on AI remembering to check
- Show options when action detected
- Example: When "search" detected, show tool options

Implementation in CLAUDE.md:
```yaml
## 🎯 Action Triggers
When you catch yourself saying:
- "I need to search..." → [Tool Router shows: Use Serena for code]
- "Let me find..." → [Tool Router shows: Glob for files, Serena for content]
- "I'll update..." → [Shows: Check timestamp protocol first]
```

#### 3. Behavioral Templates
Provide structured patterns that embed best practices:
- Remove decision points where possible
- Pre-select tools in templates
- Guide through proven sequences

Example template structure:
```yaml
FEATURE_TEMPLATE:
  discovery:
    tool: serena_find_symbol  # Pre-selected
    sequence: [find, analyze, understand]
  implementation:
    tool: edit  # For small changes
    tool: multiedit  # For multiple changes
  verification:
    tool: bash  # For tests
    sequence: [test, lint, verify]
```

#### 4. Environmental Design
Shape behavior through system design:
- Make right path the path of least resistance
- Pre-populate common patterns
- Reduce cognitive load

Examples:
- Auto-run date command when SESSION.md opens
- Suggest Serena when search terms detected
- Block manual timestamp entry

### Implementation Steps

#### Phase 1: Tool Router System
Create active tool selection in CLAUDE.md:

```markdown
## 🛑 TOOL SELECTION ROUTER

NEVER use a tool directly. ALWAYS state first:
1. "I need to [action]"
2. Router will suggest correct tool
3. Confirm or justify deviation

### Action → Tool Mapping
| I need to... | For... | MUST use... | BLOCKED |
|--------------|---------|-------------|----------|
| Search | Code patterns | `mcp__serena__search_for_pattern` | grep, find |
| Search | File names | `Glob` | find |
| Search | Symbol definitions | `mcp__serena__find_symbol` | grep |
| Edit | Whole function | `mcp__serena__replace_symbol_body` | - |
| Edit | Small changes | `Edit` | - |
| Edit | Multiple changes | `MultiEdit` | - |
| Timestamp | Any document | `date "+%Y-%m-%d %H:%M %Z"` | manual typing |
| Commit | Code changes | `gac "message"` | git commit |
```

#### Phase 2: Decision Interception Points

Add to each workflow section:
```markdown
### 🛑 Before Starting This Workflow
□ State: "I need to [specific action]"
□ Tool Router: [Shows appropriate tool]
□ Confirm: Using [selected tool] for [purpose]
```

#### Phase 3: Behavioral Templates

Create in WORKFLOWS.md:
```markdown
## 📋 Behavioral Templates

### Feature Implementation Template
```yaml
1. DISCOVERY (Pre-selected: Serena)
   - mcp__serena__find_symbol → understand structure
   - mcp__serena__find_referencing_symbols → find usages
   
2. IMPLEMENTATION (Pre-selected: Edit tools)
   - Small: Edit
   - Multiple: MultiEdit
   - Whole functions: mcp__serena__replace_symbol_body
   
3. VERIFICATION (Pre-selected: Bash)
   - npm test
   - npm run lint
```

### Bug Fix Template
[Similar structure with pre-selected tools]
```

#### Phase 4: Feedback and Reinforcement

Track violations and adapt:
```markdown
## 📊 Common Violations (Auto-Updated)
1. Using grep instead of Serena: X times
   - Last occurrence: [date]
   - Correction: Always use Serena for code search
   
2. Typing timestamps: Y times
   - Last occurrence: [date]
   - Correction: Always use date command
```

### Expected Outcomes

1. **Immediate**: Reduced wrong tool usage through routing
2. **Short-term**: Habit formation through templates
3. **Long-term**: Natural preference for correct tools
4. **Ultimate**: Right behavior becomes automatic

### Success Metrics
- Wrong tool usage drops to near zero
- No typed timestamps
- Consistent use of Serena for searches
- Templates used without prompting

### Next Actions
1. Implement Tool Router in CLAUDE.md
2. Add decision interception to workflows
3. Create behavioral templates
4. Test with real scenarios
5. Track violations and iterate
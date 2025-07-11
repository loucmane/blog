# Flow: Evidence-Based Analysis

## Quick Reference (5 steps)
1. State the analysis request clearly
2. Gather actual data using tools
3. Compare specific sections/metrics
4. State findings with evidence
5. Acknowledge uncertainty explicitly

## Standard Flow

### 0. VALIDATE NEED
**When to use this flow:**
- Comparing different versions/approaches
- Making claims about improvements
- Analyzing patterns or trends  
- Evaluating effectiveness

**When NOT to use:**
- Simple factual lookups
- Direct user questions
- Code implementation tasks

### 1. PATTERN DEEP DIVE

**Problem this solves**: Prevents false claims, assumptions presented as facts, and inaccurate comparisons.

**What happens without this flow:**
- Make broad generalizations without evidence
- Present assumptions as facts
- Create false narratives that sound plausible
- Lose user trust through inaccuracy

**Real Example (What Just Happened)**:
- Request: "Compare today's SESSION.md entry to previous ones"
- Mistake: Made claims about "repetition" and "structure" without evidence
- Result: User correctly called out the inaccuracy

### 2. ERROR PREVENTION FIRST

**Common Failure Modes:**

#### ❌ Made-Up Data
- **Looks like**: "2025-07-10 10:20 CEST - Made false claims"
- **Why it happens**: Guessing timestamps instead of checking
- **Prevention**: ALWAYS run `date "+%Y-%m-%d %H:%M %Z"` for timestamps
- **Critical**: This includes SESSION.md entries, progress logs, memory names

#### ❌ Surface Scanning
- **Looks like**: "Previous entries were lengthy and narrative"
- **Why it happens**: Quick visual scan instead of data extraction
- **Prevention**: Always extract specific sections for comparison

#### ❌ Confirmation Bias  
- **Looks like**: "Today's entry has a validation checklist" (implying others don't)
- **Why it happens**: Notice what confirms initial impression
- **Prevention**: Actively look for counter-examples

#### ❌ Overgeneralization
- **Looks like**: "Previous entries were repetitive"  
- **Why it happens**: One example becomes "all"
- **Prevention**: State sample size and specific examples

#### ❌ False Attribution
- **Looks like**: "The new system made it more structured"
- **Why it happens**: Assuming correlation is causation
- **Prevention**: Check if feature existed before

### 3. PROGRESSIVE COMPLEXITY

#### Layer 1 - Quick Reference
```bash
# 1. Extract data
search_for_pattern "specific_section"

# 2. Count/measure
wc -l or length analysis  

# 3. Compare same sections
side-by-side comparison

# 4. State findings
"In X of Y cases, I found..."

# 5. Acknowledge limits
"Based on these N examples..."
```

#### Layer 2 - Standard Flow

**Step 1: Clarify the Request**
```yaml
What to compare: [Specific sections/aspects]
How many samples: [Number]
What metrics: [Line count, structure, content]
Expected outcome: [What user wants to learn]
```

**Step 2: Data Gathering Phase**
```bash
# Use Serena for structured comparison
mcp__serena__search_for_pattern --pattern "## Session:" --context_lines_after 20

# Extract specific sections
mcp__serena__search_for_pattern --pattern "Session Validation" --context_lines_after 10

# Count occurrences
mcp__serena__search_for_pattern --pattern "specific_feature" | wc -l
```

**Step 3: Create Comparison Matrix**
```markdown
| Aspect | Entry 1 | Entry 2 | Entry 3 | Evidence |
|--------|---------|---------|---------|----------|
| Has validation checklist | Yes | Yes | Yes | Lines X, Y, Z |
| Word count | 245 | 389 | 156 | Actual count |
| Sections present | 5 | 5 | 5 | Listed below |
```

**Step 4: Analysis with Evidence**
```markdown
Based on analysis of [N] entries:
- Finding 1: [Statement] 
  Evidence: [Specific line numbers or quotes]
  
- Finding 2: [Statement]
  Evidence: [Specific examples]
  
- Finding 3: [Statement]  
  Evidence: [Measurable data]
```

**Step 5: Uncertainty Acknowledgment**
```markdown
Limitations of this analysis:
- Only examined [N] of [Total] entries
- Focused on [specific aspects]  
- May not represent [other patterns]
```

#### Layer 3 - Deep Dive

**Advanced Patterns:**
- Time-series analysis (how things evolved)
- Statistical comparison (averages, trends)
- Correlation analysis (what changes together)
- Multi-dimensional comparison

### 4. DECISION ARCHITECTURE

**Decision: How many samples to analyze?**
```
Is this a specific comparison (A vs B)?
├─ Yes → Analyze just those two in detail
│   └─ Extract all comparable sections
├─ No → Is this about trends/patterns?
│   ├─ Yes → Minimum 5-10 samples
│   └─ No → 3 representative samples
└─ Unsure? → Start with 3, expand if needed
```

**Decision: What level of evidence needed?**
```
Is claim about existence ("has X")?
├─ Yes → One clear example sufficient
├─ No → Is claim about frequency?
│   ├─ Yes → Count all occurrences
│   └─ No → Is claim about quality?
│       ├─ Yes → Rubric-based comparison
│       └─ No → Multiple examples
└─ Unsure? → Provide range of evidence
```

### 5. TOOL MASTERY SEQUENCES

**Serena Pattern Search:**
```bash
# Find all instances with context
mcp__serena__search_for_pattern \
  --substring_pattern "Session Validation" \
  --relative_path "SESSION.md" \
  --context_lines_after 15

# Success: Returns all matches with line numbers
# Failure: No matches → Pattern might be wrong
# Recovery: Try broader pattern or manual search
```

**Comparison Extraction:**
```bash
# Extract specific line ranges
Read SESSION.md --offset 10 --limit 30

# Success: Gets exact section
# Failure: Wrong offset → Adjust based on search results
```

**Counting/Metrics:**
```bash
# Count sections
mcp__serena__search_for_pattern --pattern "^###" | jq length

# Success: Accurate count
# Failure: Pattern too broad → Refine pattern
```

### 6. INTELLIGENT ADAPTATION

**When evidence contradicts hypothesis:**
- ✅ State the contradiction clearly
- ✅ Revise the analysis
- ❌ Cherry-pick supporting evidence
- ❌ Ignore contradictions

**When data is incomplete:**
- ✅ Work with what's available
- ✅ State limitations explicitly
- ❌ Extrapolate beyond data
- ❌ Make up missing data

### 7. QUALITY GATES

**CHECKPOINT: Before Making Claims**
- [ ] Do I have specific evidence?
- [ ] Have I checked counter-examples?
- [ ] Is my sample size stated?
- [ ] Are my words precise? ("appears" vs "is")

**CHECKPOINT: After Analysis**
- [ ] Would a skeptical reader be convinced?
- [ ] Can someone verify my claims?
- [ ] Have I acknowledged limitations?
- [ ] Is uncertainty clearly stated?

### 8. REFERENCE ARCHITECTURE

**Discovery Paths:**
1. Error-based: "Made false claim" → This flow
2. Task-based: "Need to compare" → This flow  
3. Tool-based: "Using Serena analysis" → This flow
4. Quality-based: "Ensure accuracy" → This flow

**Keywords for finding:**
- Evidence-based analysis
- Avoiding false claims
- Comparison methodology
- Data-driven claims
- Analysis accuracy

### 9. USER EXPERIENCE

**Language Patterns:**
- ❌ "Previous entries were..." (broad claim)
- ✅ "In the 3 entries I examined..." (scoped claim)

- ❌ "This is better because..." (judgment)
- ✅ "This differs in that..." (observation)

- ❌ "Always/Never/All/None" (absolute)
- ✅ "In N cases, typically..." (measured)

- ❌ "Obviously..." (assumption)
- ✅ "The data shows..." (evidence)

### 10. REAL EXAMPLES

**Good Analysis Example:**
"Comparing the 3 most recent SESSION.md entries:
- All 3 have Session Validation sections (lines X, Y, Z)
- Entry structure is consistent across all 3
- Main difference: Today references external handoff file (line A) while previous two embed context directly (lines B, C)
- Limitation: Only examined headers and first 30 lines of each"

**Bad Analysis Example:**
"Today's entry is much better structured than previous entries which were repetitive and hard to scan."
(No evidence, broad claims, subjective judgment)

## Success Metrics
- Zero unsubstantiated claims
- All findings have line numbers/quotes
- Limitations explicitly stated
- User trusts the analysis

## Anti-Patterns
- 🚫 "Trust me" analysis
- 🚫 Cherry-picked examples
- 🚫 Unstated assumptions
- 🚫 Absolute language without data

Remember: It's better to say "I don't have enough data" than to make false claims.
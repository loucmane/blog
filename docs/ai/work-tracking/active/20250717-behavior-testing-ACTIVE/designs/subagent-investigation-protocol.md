# Subagent Investigation Protocol Design

## Based on Anthropic Best Practices

From Claude Code Best Practices 3a.1:
- Use subagents for complex problems
- Use them early in conversations
- Preserves context without efficiency loss
- Verify details or investigate questions

## Current State

We already have:
1. **Task Tool** - Built-in delegation capability
2. **Specialist Deployment** - Value-based decisions
3. **Mandatory Constraints** - Prevent session corruption
4. **Ultrathink Analysis** - Deep thinking before deployment

## Proposed Enhancement

### 1. Early Investigation Pattern

Add to CLAUDE.md after ultrathink section:

```markdown
## 🔍 SUBAGENT INVESTIGATION PROTOCOL
**USE SUBAGENTS EARLY FOR COMPLEX PROBLEMS**

When facing complex or ambiguous requests, deploy investigation specialists:
- **Unclear requirements**: "Let me deploy a specialist to investigate the full scope..."
- **Multiple approaches**: "I'll have a specialist analyze different implementation strategies..."
- **Verification needed**: "Let me verify these details with a focused investigation..."
- **Complex searches**: "I'll have a specialist search comprehensively for..."

Benefits:
- Preserves main session context
- Allows parallel investigation
- Returns summarized findings
- Enables deeper analysis without context bloat
```

### 2. Investigation Triggers

Add these triggers that prompt subagent deployment:

#### Complexity Triggers
- "This seems complex, let me investigate..."
- "Multiple aspects to consider here..."
- "Need to understand the full picture..."

#### Verification Triggers  
- "Let me verify that..."
- "I should double-check..."
- "Need to confirm..."

#### Search Triggers
- "This requires comprehensive search..."
- "Need to find all instances of..."
- "Let me investigate patterns..."

### 3. Investigation Workflow

```yaml
Investigation Flow:
  1. Detect complexity/ambiguity
  2. Ultrathink identifies investigation needs
  3. Deploy specialist with narrow focus
  4. Specialist investigates thoroughly
  5. Returns structured findings
  6. Main session continues with clarity
```

### 4. Example Patterns

#### Pattern 1: Early Complexity Detection
```
User: "Fix the authentication issues"
AI: "Let me ultrathink about this... Authentication issues could span multiple areas. 
     Deploying investigation specialist to map out all auth-related code..."
     
[Specialist investigates, returns summary]

AI: "Found 3 distinct auth issues:
     1. Token expiration in /api/auth
     2. Session handling in middleware
     3. Frontend refresh logic
     Let's address these systematically..."
```

#### Pattern 2: Verification Before Action
```
User: "Update all API endpoints to use the new format"
AI: "Let me verify the current endpoint patterns first...
     Deploying specialist to analyze all API endpoints..."
     
[Specialist analyzes, returns findings]

AI: "Verified 23 endpoints across 5 controllers:
     - 15 already use new format
     - 8 need updates
     - 3 have custom patterns requiring special handling
     Proceeding with updates..."
```

### 5. Context Preservation Math

Traditional approach (wastes context):
- 10 searches × 500 tokens = 5,000 tokens
- 20 file reads × 1,000 tokens = 20,000 tokens
- Analysis and synthesis = 5,000 tokens
- Total context used: 30,000 tokens

Subagent approach (preserves context):
- Deploy command = 500 tokens
- Specialist summary = 2,000 tokens
- Total context used: 2,500 tokens
- **Context saved: 27,500 tokens (91%)**

### 6. Integration Points

1. **After Ultrathink**: Natural point to identify complexity
2. **Before Tool Usage**: Instead of many searches, deploy investigator
3. **During Planning**: Verify assumptions with specialists
4. **For Validation**: Confirm understanding before major changes

## Implementation Plan

1. Add investigation protocol section to CLAUDE.md
2. Create verify-details handler in WORKFLOWS.md
3. Add investigation examples to PATTERNS.md
4. Test with complex scenarios

## Success Metrics

- Earlier complexity detection
- Fewer context-heavy operations in main session
- More thorough investigation results
- Better decision making with verified information
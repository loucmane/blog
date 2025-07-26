# Work Mode Trigger Enhancement

## Current Problem
- "Development Mode" only catches coding activities
- Planning, documentation, design discussions are missed
- Results in inconsistent ULTRATHINK usage

## Proposed Solution

### 1. Rename "Development Mode" → "Work Mode"
More accurate description of when ULTRATHINK should activate.

### 2. Add New Trigger Layer
```markdown
**Layer 2.5: Work Activities** (map to specific W contexts)
- Planning: "plan", "design", "strategize", "architect", "approach"
  → W = "planning"
- Documentation: "document", "write docs", "explain", "describe"
  → W = "documenting"  
- Discussion: "discuss", "talk about", "consider", "debate"
  → W = "discussing"
- Review: "review", "walk through", "examine", "evaluate"
  → W = "reviewing"
- Analysis: "analyze", "investigate", "explore", "understand"
  → W = "investigating"
```

### 3. Update Context Detection
In CLAUDE.md Mode Detection:
```
Layer 1 match → Use specific handler from REGISTRY.md
Layer 2 match → Use investigation/analysis handlers
Layer 2.5 match → Use work activity with specific W context
Layer 3 match → Confirm intent: "Is this about work?"
No match → Natural conversation mode
```

### 4. Enhanced execute-ultrathink Pattern
Update PATTERNS.md to include:
```markdown
- Planning request → W = "planning"
- Documentation → W = "documenting"
- Discussion in work folder → W = folder-name or "discussing"
- Review/walkthrough → W = "reviewing"
```

## Benefits
1. Captures ALL work activities, not just coding
2. Provides appropriate W context for each activity type
3. Maintains natural conversation for truly casual chat
4. Makes ULTRATHINK usage more consistent

## Implementation
1. Update CLAUDE.md trigger layers
2. Enhance execute-ultrathink pattern
3. Test with various work scenarios
4. Document in USER-GUIDE.md
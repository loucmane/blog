# Optimal Work Detection Design

## The Problem
Complex trigger detection with 3+ layers is hard to maintain and still misses cases.

## The Solution
**Context-based detection**: Use the work folder itself as the trigger.

## Implementation

### Add to CLAUDE.md (right after ULTRATHINK section):

```markdown
## 📁 Work Folder Rule
**When in any `/work-tracking/active/` folder:**
- ALWAYS use ULTRATHINK format for ALL interactions
- Natural conversation mode is disabled
- This ensures consistent context tracking during work

**Rationale**: If you're in a work folder, you're doing work - simple as that.
```

### Update Mode Detection:

```markdown
**Mode Detection**:
FIRST: Check working directory
├─ Contains '/work-tracking/active/' → Work Mode (use ULTRATHINK)
└─ Otherwise → Continue with layer detection
   ├─ Layer 1 match → Specific handler
   ├─ Layer 2 match → Investigation/analysis  
   ├─ Layer 3 match → Behavioral context
   └─ No match → Natural conversation mode
```

## Benefits

1. **Ultra-simple**: One rule replaces complex detection
2. **Context-aware**: Folder = intent
3. **No false negatives**: Can't miss work activities
4. **No configuration**: Works automatically
5. **User-friendly**: Clear when work mode is active

## How It Works

When in work folder:
- "Hi" → `[S:20250726|W:template-portability|H:greeting]`
- "Let's discuss" → `[S:20250726|W:template-portability|H:discuss]`
- "What time is it?" → `[S:20250726|W:template-portability|H:check-time]`

When outside work folder:
- Normal trigger detection applies
- Natural conversation remains default

## Edge Cases Handled

1. Multiple work folders → W = current folder name
2. Nested discussions → W maintains folder context
3. Quick questions → Still tracked in work context
4. Context switches → W changes with folder

## Migration Path

1. Add work folder rule to CLAUDE.md
2. Test in active work folders
3. Monitor for any issues
4. Refine if needed (unlikely)

This is the cleanest possible solution - leveraging existing context instead of adding complexity!
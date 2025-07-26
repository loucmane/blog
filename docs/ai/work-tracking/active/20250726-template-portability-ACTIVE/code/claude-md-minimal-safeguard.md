# CLAUDE.md Minimal Safeguard Implementation

## Change 1: Add Work Folder Rule
After the "Context:" line in ULTRATHINK section, add:

```markdown
  - Context: W can be folder name, "investigating", "reviewing", "planning" - changes with task focus
  - In work folders (/work-tracking/active/*): Always required
```

## Change 2: Add Work Activities to Layer 2
In the Layer 2 triggers section, add one line:

```markdown
**Layer 2: Implicit Triggers** (map to investigation/analysis)
- Problems: "not working", "broken", "failing", "issue", "error", "bug", "wrong", "stuck"
- Questions: "how does", "what's in", "where is", "why does", "can you check"
- Analysis: "explain this code", "what does this do", "analyze", "review"
- Work activities: "plan", "discuss", "design", "document", "walk through"
- File mentions: paths with extensions (.js, .tsx, .py, /src/, /docs/), code in backticks
```

## Total Changes
- 2 lines added
- 13 words total
- Zero complexity increase
- Maximum coverage improvement

## What This Achieves
1. **Work folders** = Always tracked (no exceptions)
2. **Work activities** = Tracked anywhere (even in root)
3. **Natural overlap** = Both rules reinforce each other
4. **Future-proof** = New work patterns automatically covered
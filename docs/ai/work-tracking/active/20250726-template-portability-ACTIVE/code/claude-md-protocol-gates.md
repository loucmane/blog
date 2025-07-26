# CLAUDE.md Protocol Gates Section (Draft)

Add this after the ULTRATHINK section:

```markdown
## 🔒 PROTOCOL GATES: MANDATORY PRE-ACTION CHECKS

**YOU CANNOT PROCEED WITH ANY ACTION WITHOUT CHECKING THE RELEVANT PROTOCOL FIRST**

This is your pre-flight checklist. Like a pilot cannot take off without checks, you cannot act without protocol verification.

### Before EVERY Action - Ask: "What Convention Applies?"

| If You're About To... | YOU MUST CHECK... | Search Command |
|----------------------|-------------------|----------------|
| Create any file | CONVENTIONS.md - file structures, naming | `search_for_pattern "file.*structure\|naming" .claude/templates/CONVENTIONS.md` |
| Edit a file | Did you Read it first? Check TOOLS.md | `search_for_pattern "before.*edit\|read.*first" .claude/templates/TOOLS.md` |
| Create work folder | 7-file structure (ALL CAPS) | `search_for_pattern "7.*file.*structure" .claude/templates/CONVENTIONS.md` |
| Update CHANGELOG | Reverse chronological order | `search_for_pattern "changelog\|reverse.*chronological" .claude/templates/CONVENTIONS.md` |
| Start new work | start-new-work handler | `search_for_pattern "{#start-new-work}" .claude/templates/WORKFLOWS.md` |
| Work with sessions | session-start handler | `search_for_pattern "{#session-start}" .claude/templates/WORKFLOWS.md` |
| Commit changes | gac format rules | `search_for_pattern "gac.*format\|commit.*message" .claude/templates/CONVENTIONS.md` |
| Choose a tool | Tool selection matrix | `search_for_pattern "tool.*selection" .claude/templates/TOOLS.md` |
| Handle ambiguity | Check PATTERNS.md | `search_for_pattern "ambiguous" .claude/templates/PATTERNS.md` |

### Protocol Violation Response

If you catch yourself acting without checking:
1. **STOP IMMEDIATELY** - Do not complete the action
2. **Find the relevant protocol** - Use search commands above
3. **Read and understand it** - No skimming
4. **THEN proceed** - Following the protocol exactly

### Why This Matters

- **Without protocols**: Inconsistent, error-prone, frustrating for users
- **With protocols**: Smooth, predictable, professional execution
- **The goal**: Make checking as automatic as breathing

### Red Flags That You Skipped Protocol

- User says "why didn't you..." 
- User corrects your approach
- You're guessing at conventions
- You're unsure about structure
- Different approach than last time

**Remember**: Checking takes 5 seconds. Being corrected takes minutes and erodes trust.

## Integration with ULTRATHINK

Your execution flow is now:
1. **ULTRATHINK** about the request
2. **PROTOCOL GATE** check what conventions apply  
3. **EXECUTE** following verified protocols

No exceptions. No shortcuts. This is your operating system.
```

## Key Design Decisions

1. **Table format** - Quick visual scanning
2. **Search commands** - Copy-paste ready
3. **Strong language** - "CANNOT PROCEED"
4. **Positioned prominently** - Right after ULTRATHINK
5. **Self-reinforcing** - Violation response included
6. **Connected to trust** - Shows why it matters

This creates the "cannot proceed without checking" feeling we need.
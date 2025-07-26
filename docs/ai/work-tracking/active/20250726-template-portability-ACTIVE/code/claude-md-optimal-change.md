# CLAUDE.md Optimal Work Detection Change

## Add this section after the ULTRATHINK section:

```markdown
## 📁 Work Folder Rule

**Automatic Work Mode Activation:**
When your working directory is inside `/work-tracking/active/`:
- ULTRATHINK is ALWAYS required for EVERY response
- No trigger detection needed - the folder IS the trigger
- Ensures complete context tracking during active work

**Example**: In `/work-tracking/active/20250726-template-portability-ACTIVE/`:
- "Hi" → Must use ULTRATHINK
- "What about X?" → Must use ULTRATHINK  
- ANY response → Must use ULTRATHINK

**Rationale**: Active work folders = active work context. Simple.
```

## Update Mode Detection section:

Replace the current "Mode Detection" with:

```markdown
**Mode Detection**:
```
Check working directory:
├─ Inside /work-tracking/active/ → WORK MODE (always ULTRATHINK)
└─ Outside work folders → Check triggers:
   ├─ Layer 1 match → Use specific handler from REGISTRY.md
   ├─ Layer 2 match → Use investigation/analysis handlers
   ├─ Layer 3 match → Confirm intent: "Is this about code/development work?"
   └─ No match → Natural conversation mode
```
```

## That's it! 

No other changes needed. The execute-ultrathink pattern already handles W context appropriately.
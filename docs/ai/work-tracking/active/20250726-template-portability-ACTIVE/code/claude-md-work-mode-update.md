# CLAUDE.md Work Mode Update

## Replace "Development Mode" with "Work Mode"

### Current:
```markdown
**Development Mode (AUTO-TRIGGERED BY)**
```

### New:
```markdown
**Work Mode (AUTO-TRIGGERED BY)**
```

## Add Layer 2.5: Work Activities

After Layer 2, add:

```markdown
**Layer 2.5: Work Activities** (map to specific W contexts)
- Planning: "plan", "design", "strategize", "architect", "brainstorm", "approach", "consider options"
  → Triggers ULTRATHINK with W = "planning"
- Documentation: "document", "write docs", "create guide", "explain system", "describe how"
  → Triggers ULTRATHINK with W = "documenting"
- Discussion: "discuss", "talk about", "walk through", "let's go over", "explain why"
  → Triggers ULTRATHINK with W = "discussing"
- Review: "review", "evaluate", "assess", "check over", "examine"
  → Triggers ULTRATHINK with W = "reviewing"
- Analysis: "analyze", "investigate", "deep dive", "understand", "explore"
  → Triggers ULTRATHINK with W = "investigating"
```

## Update Mode Detection Logic

```markdown
**Mode Detection**:
Layer 1 match → Use specific handler from REGISTRY.md
Layer 2 match → Use investigation/analysis handlers  
Layer 2.5 match → Use work activity with mapped W context
Layer 3 match → Confirm intent: "Is this work-related?"
No match → Natural conversation mode
```

## Update Checkpoint Name

```markdown
**🛑 WORK MODE CHECKPOINT - NARRATIVE EXECUTION**
```

This ensures ULTRATHINK activates for ALL work, not just development!
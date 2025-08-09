# Session-SWHE Integration Collaboration

## Date: 2025-01-09
## Mission: Integrate new sessions/ directory structure with CLAUDE.md's S:W:H:E format

---

## CRITICAL CONTEXT

### Old System (Being Replaced)
- **SESSION.md**: Monolithic file, all sessions stacked
- **S field in S:W:H:E**: Just holds date (YYYYMMDD) or VOID

### New System (Not Yet Integrated)
- **sessions/ directory structure**:
  - Organized by: `YYYY/MM/YYYY-MM-DD-NNN-title.md`
  - YAML frontmatter with rich metadata
  - Symlink at `sessions/current` for active session
  - Archive system for completed/stale
  - Unique IDs like `2025-08-04-001`

### The Problem
The template system and CLAUDE.md don't know about the new sessions/ structure. They still reference SESSION.md and only use basic date for the S field.

---

## COLLABORATION WORKSPACE

**Instructions**: 
1. Communicate directly with each other using **[Name @ TIME]** format
2. Work on solutions WHILE discussing
3. Challenge each other's ideas constructively
4. Create actual implementations, not just plans

### Discussion Thread

**[System @ 2:00pm]**: Begin your collaboration here. Introduce yourselves, analyze the problem, and work together on solutions.

---

### Analysis Section
[Specialists will document their findings here]

### Integration Design
[Collaborative design work goes here]

### Implementation
[Actual code/module updates go here]

---

## DELIVERABLES NEEDED

1. **Enhanced S Field Specification**
   - What should S contain beyond just date?
   - How to reference the rich session metadata?
   - Format: `S:2025-08-04-001` or `S:current` or something else?

2. **Module Updates Required**
   - Which CLAUDE.md modules need changes?
   - How does enforcement-check.md validate sessions?
   - Update swhe-format.md specification

3. **Session Loading Protocol**
   - How to load current session from symlink?
   - When to read session metadata?
   - How to handle VOID→session fallback?

4. **Backwards Compatibility**
   - Support both old SESSION.md and new sessions/?
   - Migration path for existing S:YYYYMMDD usage?
   - Graceful degradation if sessions/ not found?

5. **Hook Integration**
   - Should hooks track session IDs?
   - How to update session files from hooks?
   - Session state persistence?

---

## KEY QUESTIONS TO ANSWER

1. Should S field contain full session ID (`2025-08-04-001`) or just pointer (`current`)?
2. How do we handle multiple sessions per day (the -NNN suffix)?
3. Should ULTRATHINK load session metadata automatically?
4. How do we update the session file when work progresses?
5. What happens if sessions/current doesn't exist?

---

[Specialists continue below...]
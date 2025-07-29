# Design Decisions

## Session Folder Migration (2025-07-26)

### Why Move to Folders
- **Performance**: SESSION.md at 46KB and growing
- **Scalability**: Each session isolated, no size limits
- **Searchability**: Serena makes cross-session search trivial
- **Collaboration**: No merge conflicts between sessions

### Why Keep SESSION.md as Index
- **Continuity**: Existing references still work
- **Discovery**: Quick view of current/recent sessions
- **Backward Compatible**: "read SESSION.md" loads index + current

### Naming Convention Choice
- **Format**: `YYYY-MM-DD-description.md`
- **Why Date First**: Natural chronological sorting
- **Why Descriptive**: Quick identification without opening
- **Multiple Per Day**: Allows several sessions/topics daily

### Archive Strategy
- **When**: After 30 days
- **Where**: `sessions/archive/YYYY-MM/`
- **Why**: Keeps active sessions fast, preserves history

---

## ULTRATHINK Improvements (Earlier Today)

### Why Minimal Changes
- **Principle**: Maximum impact with minimum complexity
- **Precedent**: Previously solved S:W:H with just 8 word changes
- **Result**: 2 lines, 13 words for comprehensive improvement

### Why Both Rules
- **Work Folder Rule**: Guarantees coverage in active work
- **Trigger Expansion**: Catches work before entering folders
- **Synergy**: Overlapping coverage with no gaps

### Why Not Complex Detection
- **Rejected**: Adding Layer 2.5 or new detection modes
- **Reason**: Complexity breeds edge cases
- **Chosen**: Simple rules that compose well

### Context Over Modes
- **Rejected**: "Work Mode" vs "Casual Mode" thinking
- **Chosen**: Context-aware system using directory as truth
- **Benefit**: No mode switching, just natural context flow

---

## Protocol Echo Solution (2025-07-26 20:00)

### Why Not Complex Systems
- **Rejected**: Protocol gates table, checkpoint systems, meta-handlers
- **Reason**: Too heavy, requires conscious remembering
- **Insight**: Best solutions are minimal (like S:W:H)

### Why Protocol Echo
- **Chosen**: Simple verbalization before actions
- **Format**: "Action (protocol: X)"
- **Example**: "Creating file (protocol: 7-file structure)"
- **Implementation**: Just 6 words added to CLAUDE.md

### Design Through Sequential Thinking
- **Method**: 10 sequential thoughts exploring options
- **Evolution**: From complex tables → embedded formats → simple echo
- **Key Insight**: Make it impossible to skip by making it verbal

### Why This Works
- **Automatic**: Can't act without speaking protocol
- **Visible**: User sees compliance happening
- **Natural**: Becomes part of action description
- **Minimal**: 6 words vs complex systems

---

## Development Mode Checkpoint Implementation (2025-07-27)

### Decision: S:W:H:E Format
- **What**: Replace verbose 4-chapter narrative with streamlined approach
- **Format**: `[S:session|W:work|H:handler|E:steps/"success criteria"]`
- **Evidence**: E field forces handler reading (count steps + find success)
- **Execution**: Natural language with inline evidence (line numbers)
- **Summary**: Brief checkmark confirmation at end

### Why This Design
1. **94% verbosity reduction** (30 vs 500+ words)
2. **Structural enforcement** - can't fake E field
3. **Natural flow** - evidence inline, not bureaucratic
4. **User-friendly** - concise but verifiable
5. **Proven** - tested and refined through iterations

### What We Rejected
- Separate Handler Check line (redundant with E)
- Complex symbols or multiple fields
- Hash-based verification (not human-readable)
- Keeping any part of 4-chapter structure

---

## S:W:H:E Enforcement Chain (2025-07-27 Complete)

### Decision: Multi-Layer Enforcement
After multiple failures caught by user, implemented complete chain:

1. **Pre-ULTRATHINK Protocol** - No immediate ULTRATHINK allowed
2. **Handler Search Protocol** - Must show search process  
3. **Two-Phase ULTRATHINK** - H:searching mandatory initially
4. **Handler Comprehension** - Must list key steps from handler
5. **Evidence Field** - E:n/key:"critical step"

### Why This Design
- Each layer catches different failure modes
- Visible violations (user can verify)
- Makes false compliance extremely difficult
- Minimal complexity increase (~100 words total)

### What We Learned
- Single-layer enforcement always fails
- Behavioral reminders don't work
- Need multiple structural checkpoints
- User feedback essential for iteration
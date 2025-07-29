# Design Decisions

## Why Granularize Handlers (2025-07-28)

### Problem Statement
- Current handlers try to do too much in one go
- Hard to specify exact operation with H field
- E field becomes vague with multi-step handlers
- Difficult to know which handler applies

### Solution Approach
- Break each handler into atomic operations
- One handler = one clear purpose
- Composable for complex workflows
- Better S:W:H:E precision

### Examples of Over-Broad Handlers
1. **start-new-work** does:
   - Extract feature name
   - Create work folder
   - Initialize 7 files
   - Update SESSION.md
   - Create todos
   - Route to workflow

2. **context-compaction** does:
   - Pre-compaction checklist
   - Create summary
   - Generate resume message
   - Handle auto-compaction
   - Post-compaction recovery

### Design Principles
- **Atomic**: Each handler does ONE thing
- **Discoverable**: Clear naming patterns
- **Composable**: Handlers can chain together
- **Verifiable**: Clear success criteria

## Expanded Design Decision (2025-07-28 12:45)

### From Handler Focus to System Flow
- Initial: Just granularize handlers
- Expanded: Create unified flow system
- Reason: Granularization alone doesn't solve disconnection

### Four-Layer Architecture
1. **Atomic Handlers**: Single-operation precision
2. **Flow Documentation**: Common journeys in CLAUDE.md
3. **Next Steps**: Guide natural progression
4. **Journey Tracking**: Enhanced S:W:H:E with flow state

### Why This Approach
- Evolutionary, not revolutionary
- Preserves existing system
- Adds missing connections
- Creates teaching moments
- Maintains simplicity

### Implementation Priority
1. Document flows (immediate value)
2. Add next steps (easy enhancement)
3. Granularize handlers (systematic work)
4. Enhance tracking (polish)

## Revised Decision: Keep CLAUDE.md Monolithic (2025-07-28 13:20)

### Why Not Split CLAUDE.md
- Single entry point is actually valuable
- AI loads one file and has full context
- Splitting would create startup confusion
- Monolithic nature is a feature for AI systems

### Better Approach
- Keep CLAUDE.md as single source of truth
- Add table of contents and anchors
- Move only detailed flows to FLOWS.md
- Organize internally, don't fragment

### What Moves Out
- Detailed flow sequences → FLOWS.md
- Long handler examples → FLOWS.md
- Keep core engine unified

### Benefits
- Preserves coherent context
- No multi-file loading confusion
- Still reduces clutter
- Better organization without fragmentation

## Final Decision: Connection-Focused Enhancement (2025-07-28 14:45)

### Clear Direction: Improve and Connect
After analysis and user feedback, the path is clear:
- **Connect** the disconnected parts
- **Organize** what already exists  
- **Improve** incrementally
- **NOT** replace or revolutionize

### Why Connection Over Complexity
The extended analysis revealed valid concerns, but the solution isn't to tear down - it's to connect better:
1. **Disconnection** is the real problem
2. **Missing handlers** are fixable
3. **Broad operations** can have alternatives
4. **Journey documentation** fills the gap

### Smart Implementation Strategy

#### 1. Add Without Breaking
- Keep composite handlers (backward compatible)
- Add atomic alternatives (precision when needed)
- Users choose their complexity level

#### 2. Connect Without Complexity
- Related sections create natural flow
- No forced prerequisites
- Simple navigation between files

#### 3. Fix Without Rebuilding  
- Create missing phantom handlers
- Update broken references
- Restore system integrity

#### 4. Document Without Overloading
- FLOWS.md shows journeys
- Multiple paths for different needs
- Make implicit knowledge explicit

### What We're NOT Doing
- NOT throwing away the sophisticated system
- NOT forcing everyone to use atomics
- NOT adding 8-file maintenance burden
- NOT creating performance nightmares

### The Balance Point
**Evolution, not revolution**:
- Preserve what works
- Fix what's broken
- Connect what's isolated
- Document what's implicit

### Implementation Priorities
1. **Related sections** - Biggest impact, least disruption
2. **Fix phantoms** - Restore trust and integrity
3. **Create FLOWS.md** - Document the journeys
4. **Smart atomics** - Options, not obligations

### Success Criteria
- System remains familiar but more connected
- New users can navigate easily
- Power users get precision options
- Nothing breaks, everything improves

### Decision Rationale
The system has good bones but poor connections. We don't need a new skeleton - we need better ligaments. Connect the pieces, and the system becomes powerful AND usable.

## Handler Orchestration Decision (2025-07-28 17:45)

### Problem Redefinition
After deep analysis with 15 sequential thoughts, the real issue isn't that handlers are too broad - it's that they work in isolation rather than orchestrating across templates.

### Core Insight: From Doers to Conductors
Transform handlers from "things that do work" to "orchestrators that conduct templates". Not making them atomic, but making them well-connected.

### Key Decisions
1. **Keep handler scope reasonable** - Not atomic, just well-defined
2. **Mandatory template consultation** - Handlers MUST use multiple templates
3. **Evidence-based execution** - Show which templates were consulted
4. **Structural enforcement** - Cannot proceed without checks

### Example Transformation
```yaml
# OLD: Handler does everything itself
edit-file:
  1. Read file
  2. Edit file  
  3. Verify

# NEW: Handler orchestrates templates
edit-file:
  1. MATRICES.md → Get file type rules
  2. PATTERNS.md → Load edit pattern
  3. BEHAVIORS.md → Check preconditions
  4. CONVENTIONS.md → Apply standards
  5. TOOLS.md → Execute edit
  6. WORKFLOWS.md → Post-validation
```

### Why This Approach
1. **Leverages existing assets** - All templates become active
2. **Creates integration** - Natural flow between files
3. **Self-reinforcing** - Can't skip templates
4. **Maintains sophistication** - Not dumbing down

### Questions for Discussion
1. Is the orchestration model too complex?
2. Should we pilot with 3 handlers first?
3. How do we handle performance concerns?
4. What level of evidence detail is needed?

### Pilot Decision (2025-07-28 17:00)
User approved piloting with 3 handlers:
1. **edit-file** - 6 template orchestration
2. **gac** - 7 template orchestration (centered on gac command)
3. **create-component** - 8 template orchestration

Key adjustment: Changed commit-changes to focus specifically on the `gac` command with:
- Special safety checks for adding all files
- Auto-detection of commit type from changes
- Automatic message formatting
- Protection against committing sensitive files

## Folder Structure Decision (2025-07-29 12:55)

### Final Design: Interaction-Based Organization
After analyzing 6 different organizational approaches and 15 sequential refinements, the optimal structure is:

```
handlers/
├── triggers/        # User-initiated entry points
├── orchestrators/   # Coordinate multiple operations
└── operators/       # Single atomic operations
```

### Why Interaction-Based Wins
1. **Reflects execution flow** - Natural hierarchy from user trigger to execution
2. **Supports orchestration model** - Clear separation of conductors vs performers
3. **Domain via metadata** - Physical location shows role, metadata shows domain

### Key Design Elements
1. **Rich frontmatter** - Each handler declares role, stability, domains, orchestrations
2. **Flat within categories** - No deep subdirectories
3. **Handler ID independence** - H:edit-file not H:operators/edit-file
4. **Consistent structure** - Apply same pattern to patterns/, behaviors/, conventions/

### Example Flow
```
User: "refactor component" 
  → triggers/refactor-component.md
    → orchestrators/refactor-code.md
      → operators/analyze-code.md
      → operators/edit-file.md
      → operators/run-tests.md
```

### Migration Strategy
- Phase 1: Structure only (move files)
- Phase 2: Add metadata (frontmatter)
- Phase 3: Enhance content (orchestration blocks)
- Phase 4: Full system (all template types)
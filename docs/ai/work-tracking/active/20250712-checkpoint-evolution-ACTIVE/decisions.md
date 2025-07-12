# Checkpoint Evolution Decisions

## Major Decisions & Rationale

### 1. Selected Hybrid Checkpoint Evolution
**Options Considered**:
1. Adaptive Mode Recognition
2. Progressive Disclosure
3. Context-Aware Checkpoints
4. Integrated Navigation Hub
5. Hybrid Checkpoint Evolution ✓

**Why**: 
- Maintains safety while improving UX
- Checkpoints become guides not gates
- Natural documentation integration
- Gradual migration path

### 2. Pure Navigation Approach
**Decision**: CLAUDE.md contains NO implementation details
**Why**:
- Single source of truth
- Forces documentation usage
- Easier maintenance
- Clear separation of concerns

### 3. Natural Language Entry Points
**Decision**: Use conversational triggers like "work on X"
**Why**:
- Matches user mental models
- Reduces cognitive load
- More discoverable
- Better user experience

### 4. Mode-Based Tool Pre-Selection
**Decision**: Each mode shows relevant tools only
**Why**:
- Reduces decision fatigue
- Speeds up common tasks
- Still links to full documentation
- Progressive disclosure

### 5. Work Tracking Integration
**Decision**: Create tracking folder immediately on recognition
**Why**:
- Prevents work loss
- Maintains system discipline
- Historical record
- Better handoffs

### 6. Convention Enforcement Strategy
**Decision**: Multi-layer enforcement with visual gate + self-correction
**Options Considered**:
1. Convention Gate only (too weak)
2. Update all handlers (too slow)
3. Interceptor pattern (too complex)
4. Hybrid approach ✓

**Why Hybrid**:
- Visual gate makes it unmissable
- Self-correction allows recovery
- Gradual implementation possible
- Not crippling to productivity
- Multiple safety nets

**Key Innovation**: Convention Enforcement Gate placed BEFORE routing
- Can't start any action without seeing it
- Maps common actions to their conventions
- Simple STOP mechanism if skipped

## Design Principles

### Navigation Over Content
- CLAUDE.md routes, doesn't contain
- All content lives in source docs
- Updates only needed in one place

### Flexibility With Structure
- Natural language for entry
- Structured paths once routed
- Emergency escapes available
- Mode adaptation

### User-Centric Flow
- Start with user intent
- Guide to right resource
- Provide immediate value
- Allow exploration

## Trade-offs Accepted

### Slightly Longer CLAUDE.md
- ~400 lines vs 150
- BUT: Pure navigation
- BUT: Complete coverage
- BUT: Better UX

### More Complex Pattern Matching
- Need to handle variations
- BUT: More natural interaction
- BUT: Better discovery
- BUT: Learns user patterns

## Final Decision: Protocol-Based Approach

### Decision Made (14:45 CEST)
**Use protocol-based CLAUDE.md instead of pattern-based**

### Rationale
1. **No maintenance burden**: CLAUDE.md never needs updating
2. **Intent over patterns**: AI understands meaning, not just keywords
3. **Infinite extensibility**: Add capabilities without touching CLAUDE.md
4. **Natural conversation**: Users speak normally
5. **Tested and validated**: Subagent testing confirmed approach works

### The Key Insight
CLAUDE.md should be like HTTP - a protocol that defines HOW requests are processed, not a catalog of WHAT requests exist.

### Implementation
- ~99 line CLAUDE.md that explains the routing protocol
- All patterns/workflows live in target files
- New capabilities added to target files only
- CLAUDE.md remains stable and timeless

## Protocol Design Rationale (from FINAL-DESIGN-RATIONALE.md)

### The Core Problem
Every time we add patterns to CLAUDE.md, we create maintenance burden. The file grows, becomes outdated, and defeats its purpose.

### The Revolutionary Insight
**CLAUDE.md should be a PROTOCOL, not a CATALOG.**
Like HTTP - the protocol doesn't list every possible URL, it just defines how requests get routed.

### Architecture Layers
1. **CLAUDE.md (Protocol)**: Defines HOW routing works (~100 lines, rarely changes)
2. **Target Files (Catalogs)**: Define WHAT exists (workflows, tools, conventions)
3. **Handlers (Implementation)**: Execute the actual work

### Why This Wins
- No maintenance burden on CLAUDE.md
- Infinite extensibility
- Natural language understanding
- Clean separation of concerns

## Protocol Enforcement Decision (2025-07-12 16:15)

### Problem
Protocol-based CLAUDE.md has no enforcement - I don't use it.

### Options Considered
1. **Visible Routing Marker** - Start every response with routing
2. **Pre-Flight Protocol** - Checklist before responding
3. **Response Template** - Structured two-part responses
4. **Hybrid Approach** - Minimal marker with context-aware details

### Decision: Hybrid Approach
Start responses with: 🧭 [intent] → [handler]

### Rationale
- **Proven**: Old checkpoint system proved visible markers work
- **Minimal**: Doesn't clutter responses
- **Flexible**: Can show more detail when needed
- **Verifiable**: Users can see I'm using the system

### Implementation Location
Add to CLAUDE.md after "How I Process Your Requests":
```markdown
## 🛑 Required: Routing Declaration

Every response starts with:
🧭 [intent-type] → [handler-name]

This shows I've routed through the protocol.
```

## Handler Implementation Decisions (2025-07-12 17:00 CEST)

### Decision: Serena-First Tool Strategy
**Context**: Initial handlers had Serena as fallback option
**Decision**: Make Serena PRIMARY tool wherever applicable
**Rationale**:
- Serena provides semantic code understanding
- Other tools are "dumb" text operations
- Maximizes intelligence in every operation
- Fallback only when Serena lacks capability
**Result**: All handlers rewritten with Serena-first approach

### Decision: Handler Placement Strategy
**Context**: Where should 70+ handlers live?
**Decision**: Handlers in target files, not CLAUDE.md
**Rationale**:
- Keeps CLAUDE.md small and focused
- Handlers near their implementations
- Easy to maintain and extend
- Natural discovery through navigation
**Result**: 
- WORKFLOWS.md got Intent Handlers section
- TOOLS.md got Tool Selection Handlers section
- CONVENTIONS.md will get Convention Handlers

### Decision: Implementation Order
**Context**: 70+ handlers needed, where to start?
**Decision**: WORKFLOWS → TOOLS → CONVENTIONS → CLAUDE
**Rationale**:
- Workflows are most common user intents
- Tools enable the workflows
- Conventions enforce standards
- CLAUDE handlers handle meta/errors
**Result**: Systematic progress, 40/70 complete

### Decision: Handler Format Standardization
**Context**: Need consistent format across all handlers
**Decision**: 6-field format for every handler
**Fields**:
1. Triggers (example phrases)
2. Target Pattern (extraction logic)
3. Pre-conditions (requirements)
4. Process (numbered steps)
5. Success/Failure (outcomes)
6. Examples (concrete usage)
**Result**: Consistent, scannable, complete handlers

### Decision: Progress Tracking Method
**Context**: How to track 70+ handler implementation
**Decision**: Update after each file completion
**Tracking**:
- implementation.md: Detailed counts
- tracker.md: Progress log entries
- findings.md: Insights and evolution
- TodoWrite: Real-time status
**Result**: Clear visibility of progress (57% complete)

### 2025-07-12 20:15 CEST - Dedicated Handler File Consideration

**Question**: Should we have a dedicated HANDLERS.md file instead of distributing handlers across files?

**User Insight**: "How do you know it's working well, you are making claims without us even testing the system."

**Critical Realization**: I violated our evidence-based convention by claiming the distributed approach "works well" without any testing. We need to TEST before making recommendations.

**Testing Plan**:
1. Test current distributed approach with real scenarios
2. Measure discoverability and usability
3. Identify actual pain points
4. THEN make evidence-based decision

**Deferred Decision**: Cannot recommend Option A, B, or C without testing evidence.

### 2025-07-12 20:35 CEST - Decision: Hybrid Handler Approach

After testing and D-D-I-I process, we choose:

**Hybrid Approach: Keep handlers distributed + Add HANDLERS.md registry**

**Rationale**:
1. **Solves Discovery**: Central registry shows all handlers
2. **Maintains Locality**: Handlers stay near their docs
3. **Enables Search**: Can grep HANDLERS.md for any handler
4. **Shows Coverage**: Matrix view reveals gaps
5. **Clarifies Ambiguity**: Disambiguation guide for overlaps
6. **Preserves Work**: Don't need to move 69 handlers

**HANDLERS.md will contain**:
- Quick navigation by intent type
- Disambiguation guide for ambiguous cases
- Lightweight handler entries with links to full versions
- Coverage matrix showing completeness
- Search tips and relationships

**Benefits over pure centralized**:
- No duplication of handler content
- Handlers stay maintainable in context
- Registry stays lightweight
- Easy to keep in sync

**Implementation plan**:
1. Create HANDLERS.md with registry structure
2. Add all 69 handlers as lightweight entries
3. Update CLAUDE.md to reference HANDLERS.md
4. Test improved discoverability
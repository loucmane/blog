# Decisions: Claude Execution Engine Testing

## Key Decisions Made

### 1. Handler Placement Strategy
**Decision**: Put handlers in their domain files, not registry
**Rationale**: 
- Registry is for discovery, not storage
- Serena searches actual files, not registry
- Keeps related handlers together
- Maintains single source of truth

**Evidence**: User feedback - "its probably gonna be missed if its in the registry"

### 2. SESSION.md Structure Requirement
**Decision**: Enforce Current Focus section as mandatory
**Rationale**:
- Provides clear insertion point for new sessions
- Maintains document organization
- Prevents append-at-bottom mistakes
- Gives context for current work

**Implementation**: Added explicit check in session-start handler

### 3. Convention Documentation Style
**Decision**: Include full structure examples, not just rules
**Rationale**:
- Shows exact format required
- Reduces ambiguity
- Provides copy-paste templates
- Makes requirements unmistakable

**Example**: SESSION.md structure now shows all sections

### 4. Behavioral Hook Enforcement
**Decision**: Make checks blocking, not advisory
**Rationale**:
- "Cannot proceed" stronger than "should check"
- Natural behavior emerges
- Mistakes become impossible
- System self-enforces

**Validation**: Successfully prevented wrong session placement

### 5. Registry Organization
**Decision**: Keep registry comprehensive but lightweight
**Rationale**:
- Fast lookup for all handlers
- Points to source files
- Easy to maintain
- Supports Serena search pattern

**Structure**: Category → Handler → Location → Purpose

## Design Principles Confirmed

### 1. Dynamic Over Static
- Load templates on-demand
- Save context for important work
- Always current with templates

### 2. Discovery Over Documentation  
- Make me search for answers
- Learn through exploration
- Build understanding naturally

### 3. Enforcement Over Guidance
- Block wrong actions
- Force correct behavior
- Make good practices automatic

### 4. Feedback Over Perfection
- User catches issues
- System adapts quickly
- Continuous improvement

## Future Decisions Needed

### 1. Handler Consolidation
- Should session handlers be unified?
- Where do cross-cutting handlers live?
- How to handle handler dependencies?

### 2. Template Evolution
- How to version templates?
- Backward compatibility approach?
- Migration strategies?

### 3. Performance Optimization
- Cache frequently used handlers?
- Optimize Serena searches?
- Reduce lookup overhead?

### 4. Error Recovery
- What if handler not found?
- Fallback mechanisms?
- User guidance patterns?

## Matrix System Decision

### 6. Comprehensive Matrices Approach
**Decision**: Create dedicated MATRICES.md file
**Rationale**:
- Single tool selection matrix insufficient
- Many decision points need structure
- Matrices provide quick visual guidance
- Easier to maintain in dedicated file

**Implementation Plan**:
1. Document current gaps (✓)
2. Decide on matrix categories (✓)
3. Implement MATRICES.md file
4. Update CLAUDE.md to reference it
5. Update REGISTRY.md to include it

**Matrix Categories Identified**:
- Request Type → Handler Matrix
- File Type → Convention Matrix  
- Problem Type → Solution Matrix
- Context → Mode Matrix
- Error → Recovery Matrix

**Why Separate File**:
- Follows pattern of HANDLERS.md, PATTERNS.md
- Searchable with Serena
- Maintainable and extensible
- Reduces CLAUDE.md complexity

### 7. Behavioral Hooks Organization
**Decision**: Create dedicated BEHAVIORS.md file
**Rationale**:
- Consolidates all "cannot proceed without" gates
- Keeps CLAUDE.md lean and focused
- Makes behaviors searchable and maintainable
- Separates enforcement from process

**Implementation**:
- BEHAVIORS.md contains all automatic triggers
- WORKFLOWS.md contains manual processes
- Cross-references connect them
- CLAUDE.md just references BEHAVIORS.md

**Key Insight**: Following DDII, we documented the need for work tracking enforcement as a behavior, not just a workflow
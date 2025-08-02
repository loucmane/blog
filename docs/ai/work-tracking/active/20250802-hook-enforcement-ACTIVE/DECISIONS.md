# Hook Enforcement Decisions

## Decision 1: Technical Enforcement Over Documentation
**Choice**: Create actual blocking hooks instead of more documentation
**Rationale**: Current "enforcement" is just text that gets ignored. Real hooks with exit code 2 create actual barriers.

## Decision 2: Hook-Based vs Alternative Approaches
**Choice**: Use Claude Code's native hook system
**Rationale**: 
- Built-in support, no hacks needed
- Proper lifecycle integration
- Clean JSON communication
- State management capabilities

## Decision 3: General Hook Specialist vs ULTRATHINK-Only
**Choice**: Created general-purpose hook-specialist agent
**Rationale**: ULTRATHINK is just one enforcement need. A general specialist can handle git commits, security, conventions, etc.

## Decision 4: Blocking vs Warning Strategy
**Choice**: Use blocking (exit 2) for ULTRATHINK violations
**Rationale**: User explicitly frustrated by 100+ reminders. Warnings would just continue the problem.

## Decision 5: State Management Approach
**Choice**: JSON files in logs/ directory
**Rationale**: 
- Simple and reliable
- Persists across hook invocations
- Easy to debug and inspect
- Follows established patterns
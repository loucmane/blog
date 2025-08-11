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

## Decision 5: Registry Source Update
**Choice**: Deprecate legacy REGISTRY.md/REGISTRY-REFINED.md; use `templates/registry/*.md` as the source of truth
**Rationale**: Align enforcement and hints to live registry layout

## Decision 6: Configurable Enforcement Levels
**Choice**: Support soft | stable | strict levels via `.claude/settings.json.enforcement_metadata.version`
**Rationale**: Adapt enforcement strictness to context and reduce friction

## Decision 7: VOID Resolution Guidance
**Choice**: When handler search fails (multiple attempts), suggest `templates/handlers/operators/workflow/resolve-handler-void.md` and detect repeated loads to flag potential circular resolution
**Rationale**: Provide a clear path out of VOID and prevent cycles

## Decision 8: Serena MCP Preferred for Discovery
**Choice**: Prefer `mcp__serena__*` tools for searching/finding during ULTRATHINK; treat them as first-class search/read evidence with hints pointing to `templates/registry`
**Rationale**: Faster, structured, and more consistent than raw Grep/Glob; reduces friction

## Decision 5: State Management Approach
**Choice**: JSON files in logs/ directory
**Rationale**: 
- Simple and reliable
- Persists across hook invocations
- Easy to debug and inspect
- Follows established patterns
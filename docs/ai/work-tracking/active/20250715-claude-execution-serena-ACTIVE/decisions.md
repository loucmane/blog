# Design Decisions

## 2025-07-15 - Dynamic Search vs Static Embedding

### Decision: Use Serena for Dynamic Template Search

**Rationale:**
- Static embedding (like CLAUDE-OLD.md) uses 1000+ lines of context
- Templates change over time - static copies get outdated
- Serena can find exact sections quickly
- Only load what's needed for each request

**Trade-offs:**
- Pro: Minimal context usage
- Pro: Always up-to-date
- Con: Slight overhead of search operation
- Con: Depends on Serena being available

### Decision: Minimal Core with Search Patterns

**Rationale:**
- Keep only essential routing logic in CLAUDE.md
- Use clear search patterns for each intent type
- Cache only the most common operations

**Implementation:**
- ~100 lines for CLAUDE.md
- Clear intent → search mapping
- Embedded Serena commands ready to execute
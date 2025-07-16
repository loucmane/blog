# Decisions: Navigation Improvements

## Decision Log

### Decision 1: Create Trigger Phrase Index
**Date**: 2025-07-16 17:35 CEST
**What**: Add comprehensive trigger phrase mapping to REGISTRY.md
**Why**: Direct mapping reduces search iterations
**How**: Table format with user phrases → handlers

### Decision 2: Implement Navigation Shortcuts
**Date**: 2025-07-16 17:35 CEST
**What**: Pre-defined search patterns for common flows
**Why**: Avoid repeated complex searches
**How**: Add to CLAUDE.md as quick lookups

### Decision 3: Visual Navigation Aids
**Date**: 2025-07-16 17:36 CEST
**What**: Add flow diagrams and decision trees
**Why**: Visual representation aids understanding
**How**: ASCII diagrams in template files

### Decision 4: Handler Renaming Strategy
**Date**: 2025-07-16 17:36 CEST
**What**: Gradually align handler names with user phrases
**Why**: Natural discovery without breaking changes
**How**: Add aliases, then migrate over time

## Prioritization

1. **Immediate**: Trigger phrase index (quick win)
2. **Short-term**: Navigation shortcuts 
3. **Medium-term**: Visual aids
4. **Long-term**: Handler renaming

## Success Criteria

- First-try handler discovery > 90%
- Average searches per request < 1.5
- User doesn't need to remind about navigation
- Natural phrase → action mapping

### Decision 5: Pattern-Based Matching
**Date**: 2025-07-16 17:58 CEST
**What**: Use patterns and keywords instead of exact phrases
**Why**: Users express same intent many different ways
**How**: Keyword extraction, scoring, fuzzy matching

### Decision 6: Fallback Strategy
**Date**: 2025-07-16 17:58 CEST
**What**: Graceful degradation when no match found
**Why**: Can't anticipate every variation
**How**: Show top matches, ask for clarification

### Decision 7: Implementation Approach
**Date**: 2025-07-16 18:05 CEST
**What**: Start with enhanced REGISTRY.md keywords section
**Why**: 
- Easiest to implement quickly
- Works with existing search mechanisms
- Can test effectiveness before complex changes
**How**: Add Navigation Keywords section with verb/noun mappings
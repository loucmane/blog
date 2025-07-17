# Findings: Navigation Improvements

## Discoveries

### Discovery 1: Pattern Mismatch Problem
**Time**: 2025-07-16 17:32 CEST
**What**: Handler names don't match natural language triggers
**Example**: User says "work on feature" but handler is "start-new-work"
**Impact**: Requires multiple searches to find right handler

### Discovery 2: Three-Hop Navigation Pattern
**Time**: 2025-07-16 17:33 CEST
**What**: Most requests require 3 searches minimum
1. Search REGISTRY for handler location
2. Search template file for full handler
3. Sometimes search conventions/behaviors too
**Impact**: High context usage, slower response

### Discovery 3: Missing Direct Mappings
**Time**: 2025-07-16 17:34 CEST
**What**: No direct user phrase → handler mapping
**Current**: Must infer handler name from description
**Better**: Explicit trigger phrase index

## Key Insights

1. **Naming Convention Gap**: System-centric names vs user-centric phrases
2. **Search Inefficiency**: Each search uses context and time
3. **Discovery Friction**: Finding handlers requires system knowledge
4. **Cross-Reference Complexity**: Dependencies between templates not obvious

### Discovery 4: Search Pattern Failure Examples
**Time**: 2025-07-16 17:42 CEST
**What**: Specific examples of failed searches
1. "work on" → 7 files, multiple contexts, unclear which is right
2. "commit" → 9 files, could mean generate message OR execute commit
3. "fix bug" → Handler is actually "fix-problem" not "fix-bug"
**Impact**: Ambiguity forces multiple searches to find right handler

### Discovery 5: Missing Central Routing
**Time**: 2025-07-16 17:43 CEST
**What**: No single source of truth for user phrase → handler mapping
**Current**: Must search multiple files and infer connections
**Better**: Central trigger phrase index with clear mappings

### Discovery 6: Exact Match Limitation
**Time**: 2025-07-16 18:02 CEST
**What**: Trigger phrase index assumes exact matches
**Problem**: Users say things differently:
- "work on X" vs "start working on X" vs "let's work on X"
- "fix the bug" vs "fix bug" vs "resolve bug" vs "debug"
- "make a commit" vs "commit" vs "save changes"
**Impact**: Index could miss many valid variations

### Discovery 7: Work Folder Status Analysis
**Time**: 2025-07-16 18:02 CEST
**What**: Reviewed all active work folders for obsolescence
**Findings**:
1. **20250709-phase3-template-system-ACTIVE**: INCOMPLETE (89% done, missing 3 integrations)
2. **20250709-workflow-patterns-ACTIVE**: STALE (last update 2025-07-10, abandoned after CLAUDE.md redesign)
3. **20250712-checkpoint-evolution-ACTIVE**: COMPLETE (100% - all 73 handlers implemented)
4. **20250713-claude-handler-testing-ACTIVE**: SUPERSEDED (replaced by execution engine approach)
5. **20250713-hook-system-implementation-ACTIVE**: ABANDONED (put on hold, hooks deleted)
6. **20250714-search-feature-ACTIVE**: ABANDONED (only 3 files, protocol errors)
7. **20250114-claude-execution-engine-ACTIVE**: SUPERSEDED (by 20250715 work)
8. **20250715-claude-execution-serena-ACTIVE**: COMPLETE (created current CLAUDE.md)
9. **20250716-claude-execution-testing-ACTIVE**: COMPLETE (tested and enhanced system)
**Impact**: 8/9 folders are obsolete, showing clear evolution path
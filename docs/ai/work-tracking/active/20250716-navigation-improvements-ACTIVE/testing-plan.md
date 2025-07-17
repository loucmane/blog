# Navigation Testing Plan

## Ready for Testing After Compaction

### What We've Implemented
1. **Navigation Keywords in REGISTRY.md**
   - Action Keywords table (work, fix, search, etc.)
   - Context Keywords table (bug, feature, component, etc.)
   - Direct keyword → handler mapping

2. **Updated CLAUDE.md Logic**
   - Check Navigation Keywords first
   - Extract keywords if no exact match
   - Fall back to broader search

### Test Scenarios to Run

#### Scenario 1: Common Development Phrases
Test these variations to see if they find the right handler in 1 search:
- "let's work on authentication" → should find `start-new-work`
- "I need to fix the login bug" → should find `fix-problem`
- "can you help debug this error" → should find `debug`
- "resolve this issue" → should find `fix-problem`
- "implement user login" → should find `implement-feature`

#### Scenario 2: Ambiguous Requests
Test how system handles multiple possible handlers:
- "search for user auth" → `search-code` or `find-symbol`?
- "save my changes" → `create-commit-message` or `commit-changes`?
- "create new button" → `create-component` or `create-file`?

#### Scenario 3: No Match Cases
Test fallback behavior:
- "analyze performance metrics" → no direct handler
- "optimize database queries" → no direct handler
- Should fall back to broader search or ask for clarification

### Success Metrics
- Average searches per request: Target < 1.5 (down from 3-4)
- First-try success rate: Target > 80%
- Clear fallback behavior when no match

### How to Test
1. Make a request using natural language
2. Count how many searches are needed
3. Note if correct handler is found
4. Document any failures or confusion

## Resume Command
```
Activate project /home/loucmane/dev/javascript/MomsBlog/blog, 
read memory session_2025-07-17_navigation_testing_ready and SESSION.md. 
Test the navigation improvements with the scenarios in testing-plan.md.
```
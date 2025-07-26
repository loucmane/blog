# Common Search Patterns Guide

## How Users Ask vs What Handlers Exist

This guide maps natural user language to the appropriate handlers, helping both users and the AI find the right functionality quickly.

## By Intent Category

### 🚀 Starting Something New

**Users Say** → **Handler to Use**
- "I want to build a new feature" → `start-new-work`
- "Let's create a login system" → `start-new-work`
- "Time to implement authentication" → `start-new-work`
- "Starting fresh on the API" → `start-new-work`
- "Beginning work on dark mode" → `start-new-work`

### 🔧 Fixing Problems

**Users Say** → **Handler to Use**
- "The login is broken" → `fix-bug`
- "Navigation isn't working" → `fix-bug`
- "Users can't submit the form" → `fix-bug`
- "There's a bug in checkout" → `fix-bug`
- "Something's wrong with search" → `fix-bug`

### 🔍 Finding Things

**Users Say** → **Handler to Use**
- "Where is the auth logic?" → `find-symbol` or `search-code`
- "Show me the login function" → `find-symbol`
- "Find all API calls" → `grep-pattern`
- "What files use UserContext?" → `find-references`
- "Look for error handling" → `search-code`

### 🧐 Understanding Code

**Users Say** → **Handler to Use**
- "How does authentication work?" → `explain-code`
- "What does this useEffect do?" → `explain-code`
- "Explain the payment flow" → `explain-code`
- "Walk me through this algorithm" → `explain-code`
- "I don't understand this function" → `explain-code`

### 📝 Making Changes

**Users Say** → **Handler to Use**
- "Change the button color to blue" → `edit-file`
- "Update the API endpoint" → `edit-file`
- "Add a new field to the form" → `edit-file`
- "Remove the old comments" → `edit-file`
- "Fix the typo in the message" → `edit-file`

### 🏗️ Creating New Code

**Users Say** → **Handler to Use**
- "Create a new Button component" → `create-component`
- "Make a user service" → `create-component`
- "Build a custom hook for auth" → `create-component`
- "Add a utility function" → `create-component`
- "New API endpoint needed" → `create-component`

### 🧹 Cleaning Up Code

**Users Say** → **Handler to Use**
- "This code is messy" → `refactor-code`
- "Clean up the auth service" → `refactor-code`
- "Simplify this component" → `refactor-code`
- "This needs better structure" → `refactor-code`
- "Make this more maintainable" → `refactor-code`

### 🐛 Debugging Issues

**Users Say** → **Handler to Use**
- "Why is this failing?" → `debug-issue`
- "What's causing the error?" → `debug-issue`
- "The app crashes on login" → `debug-issue`
- "Track down the memory leak" → `debug-issue`
- "Figure out why it's slow" → `debug-issue` or `optimize-code`

### ✅ Managing Tasks

**Users Say** → **Handler to Use**
- "What should I do next?" → `check-progress`
- "Mark login as complete" → `update-todos`
- "Plan out the feature" → `create-todos`
- "What's left to do?" → `check-progress`
- "Break this down into steps" → `create-todos`

### 💾 Version Control

**Users Say** → **Handler to Use**
- "Save my changes" → `commit-changes`
- "What did I change?" → `check-status`
- "Commit with 'fixed login bug'" → `commit-changes`
- "Create a feature branch" → `create-branch`
- "Show recent commits" → `view-history`

### 🧪 Testing

**Users Say** → **Handler to Use**
- "Test the login flow" → `create-test-checkpoint`
- "Add tests for the API" → `create-test-checkpoint`
- "Make sure auth works" → `validate-changes`
- "Check if my fix works" → `validate-changes`
- "Run the test suite" → `run-tests`

### 📚 Documentation

**Users Say** → **Handler to Use**
- "Document the API" → `create-docs`
- "Write a README" → `create-docs`
- "Add comments to this" → `create-docs`
- "Explain how to use this" → `create-docs`
- "Create setup instructions" → `create-docs`

### 🔍 Code Review

**Users Say** → **Handler to Use**
- "Review my changes" → `code-review`
- "Check my PR" → `code-review`
- "Is this code good?" → `code-review`
- "Give me feedback" → `code-review`
- "Audit the security" → `code-review`

### ⚡ Performance

**Users Say** → **Handler to Use**
- "This is too slow" → `optimize-code`
- "Speed up the search" → `optimize-code`
- "Improve performance" → `optimize-code`
- "Reduce load time" → `optimize-code`
- "Make it faster" → `optimize-code`

## Common Confusion Points

### "Show me X" - Multiple Handlers Apply
- If X is a file → `read-file`
- If X is a symbol/function → `find-symbol`
- If X is changes → `check-status`
- If X is how something works → `explain-code`

### "Fix X" - Context Matters
- If X is broken → `fix-bug`
- If X is messy code → `refactor-code`
- If X is formatting → `format-code`
- If X is performance → `optimize-code`

### "Check X" - Many Meanings
- Check if working → `validate-changes`
- Check code quality → `code-review`
- Check naming → `check-naming`
- Check git status → `check-status`

## Natural Language Patterns

### Questions That Trigger Handlers
- "How do I...?" → Usually needs `show-capabilities`
- "Why is...?" → Usually needs `debug-issue`
- "What does...?" → Usually needs `explain-code`
- "Where is...?" → Usually needs `find-symbol`
- "Can you...?" → Depends on request

### Action Words and Their Handlers
- **Create/Make/Build** → `create-component` or `start-new-work`
- **Fix/Repair/Resolve** → `fix-bug`
- **Find/Search/Locate** → `search-code` or `find-symbol`
- **Change/Update/Modify** → `edit-file`
- **Review/Check/Inspect** → `code-review`
- **Test/Verify/Validate** → `validate-changes`
- **Document/Explain/Describe** → `create-docs` or `explain-code`

### Emotion/Frustration Mapping
- "This is broken!" → `fix-bug`
- "I'm stuck" → `debug-issue` or `show-capabilities`
- "This is confusing" → `explain-code`
- "It's not working" → `fix-bug` or `debug-issue`
- "I don't know what to do" → `show-capabilities` or `check-progress`

## Quick Reference Card

### Most Common Requests
1. **"Fix the bug"** → `fix-bug`
2. **"How does this work?"** → `explain-code`
3. **"Find where X is"** → `find-symbol`
4. **"Make it faster"** → `optimize-code`
5. **"Review my code"** → `code-review`
6. **"What's next?"** → `check-progress`
7. **"Save changes"** → `commit-changes`
8. **"Create a component"** → `create-component`
9. **"Run tests"** → `run-tests`
10. **"Start new feature"** → `start-new-work`

## Pro Tips

1. **Be specific** - "Fix login bug" better than "fix it"
2. **Include context** - "Review my auth changes" better than "review"
3. **Use action verbs** - "Create", "Fix", "Find", "Explain"
4. **Ask directly** - "How does auth work?" triggers handlers better than "I'm curious about auth"

## If Handler Not Found

When the AI can't find a handler, try:
1. Rephrase with action verbs
2. Be more specific about what you want
3. Use words from the categories above
4. Ask "What can you do?" to see capabilities
5. Break complex requests into smaller parts
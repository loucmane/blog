# Troubleshooting Guide

## When Things Don't Work as Expected

This guide helps you resolve common issues when working with Claude.

## Quick Fixes for Common Problems

### 🔴 "Claude doesn't understand my request"

**Symptoms:**
- Claude asks for clarification repeatedly
- Wrong handler triggered
- Unexpected response

**Solutions:**
1. **Be more specific**
   - ❌ "Fix it" 
   - ✅ "Fix the login button not responding to clicks"

2. **Include context**
   - ❌ "The error" 
   - ✅ "The 'undefined is not a function' error in auth.js:45"

3. **Use action words**
   - ❌ "The code needs work"
   - ✅ "Refactor the payment service"

4. **Try alternative phrasing**
   - Instead of: "Make it work"
   - Try: "Debug why the form submission fails"

### 🔴 "Claude can't find my code"

**Symptoms:**
- "File not found" errors
- Can't locate symbols
- Wrong files being read

**Solutions:**
1. **Provide exact file paths**
   ```
   "Find the login function in src/auth/login.js"
   ```

2. **Give unique identifiers**
   ```
   "Find the validateUser function" (not just "validate")
   ```

3. **Describe the location**
   ```
   "In the auth module, find where tokens are stored"
   ```

4. **Use the right search terms**
   ```
   "Search for 'localStorage.setItem'" (exact string)
   ```

### 🔴 "Claude makes changes I didn't want"

**Symptoms:**
- Unexpected file modifications
- Wrong code changes
- Unwanted deletions

**Solutions:**
1. **Preview before applying**
   ```
   You: "Show me what changes you'll make first"
   ```

2. **Be explicit about scope**
   ```
   "Only change the color, don't touch the functionality"
   ```

3. **Use git for safety**
   ```
   You: "Create a branch before making changes"
   ```

4. **Specify what NOT to do**
   ```
   "Update the API call but keep the error handling as is"
   ```

### 🔴 "Tests are failing after changes"

**Symptoms:**
- Previously passing tests now fail
- New errors appear
- Functionality broken

**Solutions:**
1. **Run tests before changes**
   ```
   You: "First run the existing tests"
   ```

2. **Make incremental changes**
   ```
   You: "Let's change one function at a time and test"
   ```

3. **Check test assumptions**
   ```
   You: "Do the tests expect the old behavior?"
   ```

4. **Update tests with code**
   ```
   You: "Update both the code and its tests"
   ```

## Handler-Specific Troubleshooting

### start-new-work Not Creating Folder

**Problem:** Work folder not created
**Solution:** 
```
You: "Create work folder for user-authentication feature"
# More explicit about what you want
```

### fix-bug Not Finding Issue

**Problem:** Can't reproduce bug
**Solution:**
```
You: "The bug happens when users click submit with empty email field"
# Provide exact reproduction steps
```

### search-code Returns Too Many Results

**Problem:** Too many matches
**Solution:**
```
You: "Find where user.save() is called in the auth module only"
# Narrow the search scope
```

### commit-changes Has Wrong Message

**Problem:** Commit message doesn't match conventions
**Solution:**
```
You: "Commit with message: 'fix: resolve login validation error'"
# Provide exact message format
```

## Common Error Messages

### "File has not been read yet"

**Meaning:** Claude tried to edit a file without reading it first
**Fix:**
```
You: "First read the config.js file, then update the API_URL"
```

### "No handler found for request"

**Meaning:** Your request doesn't match any handler triggers
**Fix:**
```
You: "Show me what commands are available"
# Then rephrase using suggested patterns
```

### "Cannot find symbol"

**Meaning:** The code element doesn't exist or name is wrong
**Fix:**
```
You: "List all functions in the auth service"
# Find the correct name
```

### "Multiple matches found"

**Meaning:** Search term is too generic
**Fix:**
```
You: "Find the login function in UserService class specifically"
```

## Workflow Issues

### Getting Stuck in a Loop

**Symptoms:**
- Same error repeatedly
- No progress being made
- Circular dependencies

**Solutions:**
1. **Break the cycle**
   ```
   You: "Let's try a different approach"
   ```

2. **Simplify the problem**
   ```
   You: "Just focus on getting the basic version working"
   ```

3. **Skip and return**
   ```
   You: "Mark this as blocked and move to the next task"
   ```

### Lost Context

**Symptoms:**
- Claude forgets previous work
- Repeating already-done tasks
- Missing important details

**Solutions:**
1. **Summarize progress**
   ```
   You: "What have we completed so far?"
   ```

2. **Restore from tracking**
   ```
   You: "Check the work folder for our progress"
   ```

3. **Provide reminders**
   ```
   You: "Remember, we decided to use the singleton pattern"
   ```

### Overwhelming Complexity

**Symptoms:**
- Task too large
- Too many dependencies
- Unclear requirements

**Solutions:**
1. **Decompose the problem**
   ```
   You: "Let's break this into smaller tasks"
   ```

2. **Focus on one aspect**
   ```
   You: "Just implement the data fetching part first"
   ```

3. **Create a plan**
   ```
   You: "Plan out the implementation steps before coding"
   ```

## Performance Issues

### Slow Responses

**Possible Causes:**
- Large file analysis
- Complex searches
- Multiple operations

**Solutions:**
1. Be specific about what to analyze
2. Limit search scope
3. Do operations sequentially

### Context Limit Warnings

**Symptoms:**
- "Approaching context limit"
- Truncated responses
- Missing information

**Solutions:**
1. **Start fresh**
   ```
   You: "Save our progress and let's start a new session"
   ```

2. **Focus on essentials**
   ```
   You: "Just show the relevant function, not the whole file"
   ```

## Best Practices to Avoid Issues

### 1. Clear Communication
- State your goal upfront
- Provide specific examples
- Confirm understanding before proceeding

### 2. Incremental Progress
- Make small changes
- Test frequently
- Commit working code

### 3. Use Safety Nets
- Work in branches
- Keep backups
- Review changes before applying

### 4. Provide Feedback
- Tell Claude what worked
- Correct misunderstandings immediately
- Guide toward the solution you want

## Getting Help

### When to Start Over
- After 3+ failed attempts
- When context is corrupted
- When approach is fundamentally wrong

### How to Reset
```
You: "Let's start fresh. I want to [clear goal statement]"
```

### Asking for Alternatives
```
You: "This approach isn't working. What other ways can we solve this?"
```

### Clarifying Capabilities
```
You: "Can you help with [specific task]?"
You: "What's the best way to [achieve goal]?"
```

## Emergency Commands

### Stop Current Operation
```
"Stop, let's not make those changes"
```

### Revert Changes
```
"Undo the last edit"
"Restore the original version"
```

### Get Status
```
"What did we just change?"
"Show me the current state"
```

### Save Progress
```
"Save our current progress before continuing"
"Create a checkpoint here"
```

## Prevention Tips

1. **Always verify before applying**
   - Review changes
   - Run tests
   - Check dependencies

2. **Communicate clearly**
   - One task at a time
   - Specific file/function names
   - Expected outcomes

3. **Use Claude's strengths**
   - Let it handle systematic tasks
   - Provide context for decisions
   - Ask for explanations

4. **Work with version control**
   - Commit frequently
   - Use branches for experiments
   - Review diffs before committing

Remember: Most issues can be resolved by being more specific, providing context, and breaking complex tasks into smaller steps.
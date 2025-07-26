# Work Mode Transition Design

## Entry Transitions (Into Work Mode)

### Automatic Entry
1. **start-new-work handler** 
   - Creates work folder
   - Changes directory to it
   - Work mode auto-activates

2. **continue-work handler**
   - Changes to existing work folder
   - Work mode auto-activates

3. **Session initialization**
   - If last session was in work folder
   - Resumes there automatically

## Exit Transitions (To Casual Mode)

### Option 1: Explicit Commands
```
User: "Let's have a casual chat"
User: "Exit work mode"
User: "Go to project root"
```
- **Pros**: Clear intent, explicit
- **Cons**: Users must remember commands

### Option 2: Context Switch
```
User: "What's the weather like?"
Claude: "I notice you're asking about non-work topics. Would you like to exit work mode?"
User: "Yes" → Change to project root
```
- **Pros**: Natural, contextual
- **Cons**: Adds confirmation step

### Option 3: Directory Commands
```
User: "cd .." or "cd /blog"
Claude: Changes directory, exits work mode
```
- **Pros**: Familiar to developers
- **Cons**: Too technical for some users

### Option 4: Hybrid Approach (RECOMMENDED)
Combine multiple triggers:

1. **Explicit requests**:
   - "casual chat" → Exit work mode
   - "take a break" → Exit work mode
   - "done working" → Exit work mode

2. **Natural transitions**:
   - "What time is it?" → Stay in work mode (quick question)
   - "Tell me a joke" → Prompt to exit work mode
   - "How's the weather?" → Prompt to exit work mode

3. **Work completion**:
   - "Work complete" → Archive folder & exit
   - "Finished with X" → Archive folder & exit

## Implementation

### Add to WORKFLOWS.md:

```markdown
#### Handler: exit-work-mode {#exit-work-mode}
**Triggers**: "casual chat", "exit work", "take a break", "done working"
**Process**:
1. Save current work state
2. Update work tracking files
3. Change directory to project root
4. Confirm: "Exited work mode. Now in casual conversation."
**Success**: Directory changed, work mode deactivated
**Examples**:
- "Let's have casual chat" → Exits to project root
- "I'm done working" → Archives folder and exits
```

### Add to CLAUDE.md:

```markdown
## 🚪 Work Mode Transitions

**Entering Work Mode**:
- Automatic when creating/entering work folders
- "I want to work on X" → Creates folder, enters work mode
- "Continue with Y" → Enters existing work folder

**Exiting Work Mode**:
- "Let's have casual chat" → Returns to project root
- "Exit work mode" → Saves state and exits
- "Done working" → Archives folder if complete

**While in Work Mode**:
- ALL responses use ULTRATHINK
- Quick questions stay in work context
- Non-work topics prompt for mode switch
```

## Edge Cases

1. **Multiple work folders**
   - "Switch to auth work" → Changes work context
   - Maintains work mode, changes W value

2. **Temporary questions**
   - "What time is it?" → Answer in work context
   - No mode switch for quick queries

3. **Session boundaries**
   - New session asks: "Continue in work folder?"
   - Can start fresh or resume work

4. **Nested work**
   - Work folders can't nest
   - Switch between them atomically

## Benefits

1. **Clear boundaries** - Users control mode
2. **Natural transitions** - Contextual switching
3. **State preservation** - Work saved on exit
4. **Flexible** - Multiple ways to transition
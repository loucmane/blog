# execute-ultrathink Pattern Update

## Update the W determination logic in PATTERNS.md:

```markdown
3. Determine W (Work context):
   - Check current directory:
     ```bash
     pwd_result=$(pwd)
     if [[ "$pwd_result" == *"/work-tracking/active/"* ]]; then
       W = extract folder name (e.g., "template-portability")
     else
       continue with standard analysis
     fi
     ```
   - If not in work folder, analyze request:
     - Implementation/coding → W = "implementing"
     - Bug/debugging → W = "debugging"
     - Search/investigation → W = "investigating"
     - Planning/design → W = "planning"
     - Documentation → W = "documenting"
     - Discussion → W = "discussing"
     - Review → W = "reviewing"
     - Casual chat → W = "chatting"
   - W only becomes VOID for ambiguous requests outside work folders
```

## This single change makes the system context-aware!

When in work folders:
- W automatically uses folder name
- No need to analyze request type
- Context is always clear

When outside work folders:
- Normal activity analysis applies
- More flexible W values
- Natural conversation preserved
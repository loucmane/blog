---
id: debug-issue
name: Debug Issue
role: trigger
domain: debug
stability: stable
triggers:
  - "debug X"
  - "debug this Y"
  - "find the problem in Z"
  - "why is X failing"
dependencies:
  - emergency-debug
tools:
  - Read
  - Grep
version: 1.0.0
---

#### Handler: debug-issue {#debug-issue}
**Triggers**: "debug X", "debug this Y", "find the problem in Z", "why is X failing"
**Target Pattern**: Issue or error to investigate
**Pre-conditions**: 
- Problem exists but cause unknown
- Need deep investigation
**Process**:
1. Capture initial symptoms
2. Route to emergency-debug template:
   ```yaml
   STATE: "I need to debug: [issue description]"
   USE: Load WORKFLOWS.md#emergency-debug
   FOLLOW: Emergency debug steps
   ```
3. Gather ALL evidence first
4. Form hypothesis only after evidence
**Success**: Root cause identified
**Failure**: Jumped to conclusions
**Examples**:
- "debug auth error" → Emergency debug mode
# 🚨 AGENT UPDATE POST-COMPACTION MESSAGE

## Critical Agent Status - MUST READ

We discovered the subagents need updates to support our migration. Here's the current state:

### ✅ Successfully Updated (2/6)
1. **template-scanner** - Has Migration Mode section, works for both analysis AND migration
2. **security-validator** - Has Migration Mode section, outputs both JSON and human reports

### ❌ Need Fixing (4/6)  
3. **template-migrator** - Broken, needs restoration + Migration Mode
4. **handler-validator** - Broken, needs restoration + Migration Mode
5. **integration-tester** - Broken, needs restoration + Migration Mode
6. **handler-creator** - Broken (hardcoded handlers), needs restoration

## Key Learning: ADD Don't REPLACE

The right approach is to ADD "Migration Mode" sections to agents while keeping ALL original functionality. We did this successfully for template-scanner and security-validator.

## Next Steps

### Option 1: Quick Fix (Recommended if low on capacity)
Use the agents as-is with our enhanced prompts from IMPLEMENTATION.md:
```
Task: template-scanner "[paste full prompt from IMPLEMENTATION.md section 2.1]"
```

### Option 2: Proper Fix
Add Migration Mode sections to broken agents WITHOUT removing original functionality.

## Current Migration Status
- 0/75 handlers migrated
- Enhanced prompts ready in IMPLEMENTATION.md
- Staging structure not created yet
- Need to decide on agent approach before proceeding

## Files to Check
- `.claude/agents/` - See which agents are broken
- `IMPLEMENTATION.md` - Has all enhanced prompts ready
- Memory: `template-migration-agent-updates-session-20250801`

## User Concern
We were at 9% capacity and worried about making agents worse. The concern is valid - 4 of 6 agents are currently broken and need restoration.
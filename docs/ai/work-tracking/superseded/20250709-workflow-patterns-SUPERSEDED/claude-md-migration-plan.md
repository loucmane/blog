# CLAUDE.md Migration Plan - 2025-07-10 15:57 CEST

## Objective
Restructure CLAUDE.md from 286 lines to <100 lines while ensuring NOTHING is lost and the full workflow remains clear.

## Pre-Migration Inventory

### Current CLAUDE.md Content Inventory
- [ ] Lines 1-20: Header and Critical Reminders
- [ ] Lines 21-53: Flight Protocol (PRE/DURING/POST/ABORT)
- [ ] Lines 48-53: Quick Commands
- [ ] Lines 54-71: Quick Reference - Most Used
- [ ] Lines 72-91: Quick Navigation by Task Type
- [ ] Lines 92-116: Essential Tools section
- [ ] Lines 117-154: Decision Matrix tables
- [ ] Lines 155-172: Quick Decision Rules
- [ ] Lines 173-188: Flight Protocol Examples
- [ ] Lines 189-208: Quick Actions
- [ ] Lines 209-221: Common Workflows
- [ ] Lines 222-234: Common Workflows list
- [ ] Lines 235-269: Key Principles
- [ ] Lines 270-278: See Also section

## Migration Mapping

| Content | Current Location | New Home | Verification Method |
|---------|------------------|----------|-------------------|
| Flight Protocol | Lines 21-53 | WORKFLOWS.md → New "Universal Flight Protocol" section | Check section exists |
| Quick Commands | Lines 48-53 | CONVENTIONS.md → "Common Commands" section | Verify commands work |
| Key Principles | Lines 235-269 | CONVENTIONS.md → "Core Development Principles" | Check all principles moved |
| Examples | Lines 173-188 | WORKFLOWS.md → Under respective workflows | Verify examples in context |
| Common Workflows | Lines 222-234 | Already in WORKFLOWS.md | Verify links work |
| Quick Actions | Lines 189-208 | WORKFLOWS.md → Under Session Management | Check completeness |

## Verification Checklist

### 1. Content Verification
- [ ] Create backup: `cp CLAUDE.md CLAUDE.md.backup-20250710`
- [ ] Export each section to temporary files before moving
- [ ] Count lines/sections before and after
- [ ] Diff check to ensure nothing deleted without being moved

### 2. Journey Testing - Session Start to End

#### Session Start Test
```
1. Open CLAUDE.md
2. Find "how to start session" → Should lead to WORKFLOWS.md#session-management
3. Follow link → Should find complete session start workflow
4. Check SESSION.md update instructions are findable
5. Verify pre-flight checklist is accessible
```

#### During Work Tests
- [ ] "I need to search for code" → Tool Router findable?
- [ ] "I need to fix a bug" → Bug template findable?
- [ ] "I need to track tasks" → TodoWrite guidance findable?
- [ ] "I need to use Serena" → MCP tool docs findable?
- [ ] "I need to commit" → Git conventions findable?

#### Session End Test
```
1. "How to end session" → Should lead to session end workflow
2. Memory creation instructions findable?
3. Handoff documentation clear?
4. Git status cleanup mentioned?
```

### 3. Critical Path Verification

These MUST remain easily discoverable:
- [ ] Flight Protocol (new location)
- [ ] Tool Selection Router
- [ ] Behavioral Templates
- [ ] Evidence-based requirements
- [ ] Session lifecycle (start/middle/end)
- [ ] Emergency procedures

### 4. First-Time User Test

Simulate new user experience:
1. Start with only CLAUDE.md
2. Can they find how to begin?
3. Can they understand the system structure?
4. Can they locate help for common tasks?
5. Is the progression logical?

## Migration Steps

### Phase 1: Create New Sections (Don't Delete Yet)
1. Add "Universal Flight Protocol" to WORKFLOWS.md
2. Add "Common Commands" to CONVENTIONS.md
3. Add "Core Development Principles" to CONVENTIONS.md
4. Move examples to their respective workflow sections

### Phase 2: Verify New Locations
1. Test each link works
2. Verify content is complete
3. Check formatting is preserved
4. Ensure context makes sense

### Phase 3: Update CLAUDE.md
1. Remove migrated content
2. Replace with single-line pointers
3. Ensure all links are correct
4. Verify <100 lines

### Phase 4: Full System Test
1. Run through complete session lifecycle
2. Test common task scenarios
3. Verify emergency procedures
4. Check navigation speed

## Success Criteria

- [ ] CLAUDE.md is <100 lines
- [ ] Zero content lost (verified by diff)
- [ ] All common tasks have clear navigation path
- [ ] Session start-to-end journey is smooth
- [ ] First-time user can navigate successfully
- [ ] All links work correctly
- [ ] No duplicate content
- [ ] Emergency procedures remain accessible

## Rollback Plan

If anything breaks:
1. `cp CLAUDE.md.backup-20250710 CLAUDE.md`
2. Document what failed
3. Adjust plan and retry

## Post-Migration Monitoring

Track for 3 sessions:
- Did I have to search for something that used to be easy to find?
- Did I accidentally recreate content in CLAUDE.md?
- Are there any dead links?
- Is the navigation actually faster?
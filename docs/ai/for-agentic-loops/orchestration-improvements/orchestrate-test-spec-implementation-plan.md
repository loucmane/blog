# Orchestrate-Test Spec Architecture Implementation Plan

## Executive Summary

After 2 days of failed attempts to fix the orchestrate-and-test command, we discovered the root cause by analyzing working commands like `infinite.md`. The solution: **Convert from inline prompts to external spec architecture**.

### Key Discovery
- **Working Pattern**: Commands like `infinite.md` (181 lines) delegate to external spec files
- **Our Problem**: `orchestrate-and-test.md` (898 lines) has everything inline
- **Root Cause**: Commands >200 lines with inline content are treated as documentation
- **Solution**: Follow the proven spec delegation pattern

## Current State Analysis

### What We Have
- **File**: `.claude/commands/orchestrate-and-test.md`
- **Size**: 898 lines (way over execution threshold)
- **Structure**: 14 agent prompts embedded inline
- **Status**: Displays template only, never executes

### Failed Attempts
1. TASK: block conversion with triple backticks ❌
2. Narrative/disguised prompt transformation ❌
3. Adding explicit "using Task tool" everywhere ❌
4. Size reduction to 60 lines ❌
5. Adding "Parallel Execution Management:" sections ❌

### Why These Failed
Every attempt kept the fundamental flaw: **inline content makes Claude treat it as documentation**.

## Target Architecture

### Command File Structure (~150 lines)
```
.claude/commands/orchestrate-and-test.md
- Variable parsing
- Spec loading logic
- Task file reading
- Simple orchestration flow
- Task tool deployment calls
```

### Spec File Structure (~650 lines)
```
.claude/specs/orchestrate-test-spec.md
- Core challenge definition
- All 14 agent specifications
- Contract templates
- Orchestration flow
- Output requirements
```

### Pattern Match with infinite.md
| Component | infinite.md | orchestrate-test (Target) |
|-----------|-------------|---------------------------|
| Command | 181 lines | ~150 lines |
| Logic | Orchestration only | Orchestration only |
| Specs | External file | External file |
| Agents | In spec file | In spec file |

## Implementation Steps

### Phase 1: Create Spec File Structure
1. Create `.claude/specs/` directory
2. Create `orchestrate-test-spec.md` 
3. Add header and core challenge section
4. Structure similar to `invent_new_ui.md`

### Phase 2: Extract Agent Specifications
For each of the 14 agents:
1. Copy TASK block from current command
2. Format as specification section
3. Preserve all context and requirements
4. Maintain variable references (${task_id}, etc.)

Agent Order:
1. Pre-Analysis Agent
2. Master Orchestrator
3. Performance Specialist
4. Architecture Specialist  
5. UX/DX Specialist
6. Accessibility Specialist
7. Innovation Specialist
8. Evaluation Orchestrator
9. Performance Summarizer
10. Architecture Summarizer
11. UX/DX Summarizer
12. Accessibility Summarizer
13. Innovation Summarizer
14. Synthesis Orchestrator

### Phase 3: Simplify Command File
1. Remove all TASK blocks
2. Keep orchestration logic only
3. Add spec loading phase
4. Simplify to ~150 lines
5. Focus on Task tool calls

### Phase 4: Testing Strategy

#### Step 1: Single Agent Test
- Enable only Pre-Analysis Agent
- Verify it executes and creates contracts
- Check `/tmp/orchestration/` for output

#### Step 2: Master + One Specialist
- Add Master Orchestrator
- Add Performance Specialist only
- Verify coordination works

#### Step 3: Full Specialist Suite
- Enable all 5 specialists
- Test parallel deployment
- Monitor worktree creation

#### Step 4: Complete Flow
- Enable evaluation
- Enable summarizers
- Enable synthesis
- Full end-to-end test

## Risk Mitigation

### Potential Risks
1. **Spec not loaded correctly** → Test with console output first
2. **Variable substitution fails** → Verify ${task_id} works in spec
3. **Parallel deployment issues** → Start with sequential, then parallel
4. **Context too large** → Monitor token usage

### Mitigation Strategies
- Keep backups of working orchestrate-and-test.md
- Test each phase independently
- Use explicit error handling
- Document any deviations from plan

## Success Criteria

### Immediate Success
- [ ] Command executes instead of displaying template
- [ ] Pre-Analysis Agent creates contract files
- [ ] Worktrees are created
- [ ] Orchestration.log is generated

### Full Success
- [ ] All 14 agents deploy successfully
- [ ] Task 7 implementation completes
- [ ] Synthesis report generated
- [ ] No manual intervention required

## Timeline

### Session 1 (Next)
- Create spec file
- Extract first 5 agents
- Initial testing

### Session 2
- Extract remaining agents
- Simplify command file
- Test full flow

### Session 3
- Debug any issues
- Optimize performance
- Document lessons learned

## Confidence Level

**HIGH** - This approach is proven to work:
- `infinite.md` uses this exact pattern successfully
- Spec files can be large (invent_new_ui_v3.md is 478 lines)
- Clear separation of concerns
- Follows Claude's execution patterns

## Next Actions

1. Create `orchestrate-test-spec.md`
2. Start extracting agent specifications
3. Test with Pre-Analysis Agent first
4. Iterate based on results

---

*This plan is based on extensive analysis of working commands and represents our best understanding of Claude's execution patterns.*
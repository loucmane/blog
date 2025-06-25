# Orchestrate-Test Spec Architecture Solution

## The Discovery

After 2 days of frustration, the solution was found by analyzing how `infinite.md` actually works:
- **infinite.md** (181 lines) → Reads external spec files
- **orchestrate-and-test.md** (898 lines) → Has everything inline

## The Pattern

### Working Commands
```
Command File (small) → Loads Spec → Deploys Agents → Agents Use Spec
```

### Our Problem
```
Command File (huge with inline prompts) → Treated as Documentation → Never Executes
```

## The Solution

### 1. Create External Spec
**Path**: `.claude/specs/orchestrate-test-spec.md`
- Contains all 14 agent specifications
- Follows pattern of `invent_new_ui.md` specs
- Can be large (up to 650 lines is fine)

### 2. Simplify Command
**File**: `orchestrate-and-test.md`
- Reduce from 898 to ~150 lines
- Remove all TASK blocks
- Keep only orchestration logic
- Add spec loading phase

### 3. Key Architecture
```
orchestrate-and-test.md (~150 lines)
├── Variable parsing
├── Load spec from .claude/specs/
├── Read task file
├── Deploy agents using Task tool
└── Reference spec in agent context

orchestrate-test-spec.md (~650 lines)
├── Core Challenge
├── All 14 Agent Specifications
├── Contract Templates
├── Orchestration Flow
└── Output Requirements
```

## Why This Works

1. **Proven Pattern**: infinite.md uses this successfully
2. **Size Appropriate**: Commands <200 lines execute
3. **Spec Freedom**: Specs can be large (478 lines for invent_new_ui_v3.md)
4. **Clear Separation**: Orchestration vs. Content

## Implementation Priority

1. Create spec file first
2. Test with single agent (Pre-Analysis)
3. Gradually add more agents
4. Keep command file minimal

## Confidence Level

**HIGH** - This is not a theory, it's a proven pattern that works in production.

## Next Session Initialization

```
Activate project blog, read memory orchestrate_test_spec_architecture_solution and SESSION.md.
Let's implement the spec architecture for orchestrate-and-test command.
```

## Key Lesson

We spent 2 days trying to fix the format, narrative style, and size of an inline command. The real issue was architectural - working commands delegate to specs, they don't contain everything inline.

**Remember**: Commands orchestrate, specs specify.
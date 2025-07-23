# CLAUDE.md - Version 1: Traditional Enforcement Approach

## ⚠️ CRITICAL: ENFORCEMENT SYSTEM ACTIVE ⚠️
**ALL REQUESTS MUST PASS THROUGH COMPLIANCE GATES**
- Violations will be blocked
- Non-compliance triggers ERROR states
- This is mandatory, not optional

## 🛑 DEVELOPMENT MODE CHECKPOINT - ENFORCEMENT REQUIRED

**STEP 1: TRIGGER DETECTION** [MANDATORY]
When any development signal detected, YOU MUST:
```
□ State trigger: "Detected: [_______] (Layer [_])"
□ Find handler: "Loading handler [_______] from [_______]"
□ Verify loaded: "Handler contains [___] steps"
ERROR if any checkbox unchecked!
```

**STEP 2: EVIDENCE GATHERING** [REQUIRED BEFORE CLAIMS]
Before ANY factual statement about code:
```
□ Search performed: [YES/NO]
□ Files examined: [___, ___, ___]
□ Evidence found: Line [___] in [___]
ERROR: Claims without evidence = VIOLATION
```

**STEP 3: CONVENTION COMPLIANCE** [BLOCKING]
Before ANY file edit:
```
□ Convention checked: [YES/NO]
□ Rule applied: [_______]
□ Compliance verified: [YES/NO]
BLOCKED: Cannot edit without convention check!
```

**STEP 4: TEST VALIDATION** [ENFORCED]
Before marking ANY task complete:
```
□ Tests identified: [_______]
□ Tests executed: [YES/NO]
□ Results: [PASS/FAIL]
□ Evidence: [command output]
ERROR: Cannot complete without test evidence!
```

## ENFORCEMENT MATRIX

| Action | Required Gate | Penalty for Skip |
|--------|--------------|------------------|
| Make claim | Evidence required | ERROR STATE |
| Edit file | Convention check | EDIT BLOCKED |
| Complete task | Test results | COMPLETION DENIED |
| Skip handler | Not allowed | RESPONSE FAILS |

## COMPLIANCE TRACKING

```
Session Compliance Score: [___]%
Violations This Session: [___]
Blocked Operations: [___]
ERROR States Triggered: [___]
```

## VIOLATION PROTOCOL

When violation detected:
1. **IMMEDIATE STOP** - Halt all operations
2. **ERROR NOTIFICATION** - Display violation type
3. **CORRECTIVE ACTION** - State required compliance
4. **RETRY REQUIRED** - Cannot proceed without compliance

## EXAMPLE ENFORCEMENT

```
User: "Fix the login bug"

ENFORCEMENT CHECKPOINT TRIGGERED!
□ Detected: "fix" + "bug" (Layer 1)
□ Loading handler...
ERROR: Handler not loaded! Cannot proceed!

[RETRY]
✓ Detected: "fix" + "bug" (Layer 1)
✓ Loading handler "fix-problem" from WORKFLOWS.md
✓ Handler contains 6 steps

Proceeding with enforcement monitoring...
```

## MANDATORY BEHAVIORAL GATES

### Gate 1: No Claims Without Proof
```python
if making_claim and not evidence_gathered:
    raise EnforcementError("VIOLATION: Claim without evidence!")
```

### Gate 2: No Edits Without Convention
```python
if editing_file and not convention_checked:
    raise BlockedError("BLOCKED: Must check conventions first!")
```

### Gate 3: No Completion Without Tests
```python
if marking_complete and not tests_passed:
    raise ValidationError("DENIED: Tests required for completion!")
```

## ENFORCEMENT STATISTICS

Track and report:
- Total enforcement triggers: [___]
- Successful compliance: [___]%
- Violations caught: [___]
- User frustration level: [LIKELY HIGH]

---

**Remember**: This system prioritizes compliance over everything else. Every action must pass through gates. Non-compliance is not an option.
# Handler Naming Conventions DDII

## Challenge
The template system has grown organically without naming conventions, leading to:
- Inconsistent handler names (create-component vs start-new-work)
- Unclear scope (is debug for debugging or error analysis?)
- Registry maintenance challenges
- Discoverability issues with ULTRATHINK

## Let me ultrathink about this...
We need conventions that make handlers:
1. Discoverable (users can guess names)
2. Consistent (similar patterns follow similar names)
3. Scalable (new handlers fit the pattern)
4. Maintainable (easy to audit and update)

## Current Patterns Analysis

### Verb Patterns
- start-new-work ✓ (action-object-noun)
- create-component ✓ (action-noun)
- fix-problem ✓ (action-noun)
- debug ✗ (just verb, no context)
- analyze-error ✓ (action-noun)

### Issues
- Some handlers are just verbs (debug, refactor)
- Some are too specific (create-component)
- Some overlap (fix-problem vs debug vs analyze-error)

## Proposed Naming Convention

### Pattern: `{action}-{target}[-{modifier}]`

Where:
- **action**: Primary verb (create, start, update, fix, check, etc.)
- **target**: What the action operates on (work, code, session, etc.)
- **modifier**: Optional specificity (new, existing, etc.)

### Examples:
- `create-code` (replaces create-component)
- `start-work-new` (instead of start-new-work)
- `debug-error` (instead of just debug)
- `check-conventions` (clear purpose)

## Registry Management Conventions

### 1. Handler Lifecycle
```
PROPOSED → ACTIVE → DEPRECATED → REMOVED
```

### 2. Registry Entry Format
```markdown
- [`handler-name`](FILE.md#handler-name) - Brief description
  - Status: ACTIVE|DEPRECATED|PROPOSED
  - Replaces: old-handler-name (if applicable)
  - Added: YYYY-MM-DD
```

### 3. Deprecation Process
- Mark as DEPRECATED with replacement
- Keep for 30 days
- Update all references
- Then remove

## Questions to Explore with Sequential Thinking
1. Should we use consistent verb vocabulary?
2. How to handle handlers that do multiple things?
3. Should handler names match anchor names exactly?
4. How to version the registry itself?
5. Should we have handler categories in names?
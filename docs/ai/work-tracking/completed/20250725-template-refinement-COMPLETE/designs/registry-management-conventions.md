# Registry Management Conventions

## Core Principles

### 1. Naming Convention
**Pattern**: `{verb}-{noun}[-{modifier}]`

**Examples**:
- ✅ `create-module` (was create-component)
- ✅ `debug-error` (was debug)
- ✅ `start-work` (was start-new-work)
- ❌ `debug` (missing noun)
- ❌ `emergency-debug` (adjective-verb)

### 2. Controlled Vocabulary

**Primary Verbs**:
- `create` - Generate new artifacts
- `start` - Begin workflows/processes
- `update` - Modify existing items
- `fix` - Repair problems
- `check` - Validate/verify
- `find` - Search/locate
- `run` - Execute processes
- `add` - Append to existing
- `remove` - Delete items
- `show` - Display information

### 3. Handler Name = Anchor Name
**Rule**: No exceptions. Ever.

```markdown
REGISTRY: [`create-module`](WORKFLOWS.md#create-module)
ANCHOR: #### Handler: create-module {#create-module}
```

## Registry Structure

### Lifecycle Sections
```markdown
## ACTIVE Handlers
Currently maintained and recommended

## DEPRECATED Handlers  
Being phased out - use replacements

## PROPOSED Handlers
Under consideration - not yet implemented
```

### Entry Format
```markdown
- [`handler-name`](FILE.md#handler-name) - Brief description
  - **Status**: ACTIVE
  - **Added**: 2025-07-25
  - **Keywords**: [alternative, names, aliases]
  - **Triggers**: [other-handler, another-handler]
  - **Used-by**: [parent-handler]
```

### Deprecation Format
```markdown
- ~~[`old-handler`](FILE.md#old-handler)~~ - Brief description
  - **Status**: DEPRECATED
  - **Replaced-by**: [`new-handler`](FILE.md#new-handler)
  - **Deprecated**: 2025-07-25
  - **Remove-after**: 2025-08-25
```

## Consolidation Rules

### When to Merge Handlers
- >80% functional overlap
- Same target, different names
- Artificial specificity

### When to Keep Separate
- Different workflows
- Different outcomes
- Different target users

## Discoverability Features

### Keywords/Aliases
Each handler should list alternative search terms:

```markdown
- [`create-module`](WORKFLOWS.md#create-module) - Create code artifacts
  - **Keywords**: [component, service, utility, model, class]
```

### Relationship Mapping
Show handler connections:

```markdown
- [`start-work`](WORKFLOWS.md#start-work) - Begin new work
  - **Triggers**: [`create-work-folder`], [`create-todos`]
  - **Used-by**: User direct invocation
```

## Migration Process

### Phase 1: Add New
- Create new handlers with proper names
- Add all metadata
- Test thoroughly

### Phase 2: Deprecate Old  
- Mark old handlers as DEPRECATED
- Add replaced-by links
- Set removal date (30 days)

### Phase 3: Update References
- Fix all internal uses
- Update documentation
- Notify users

### Phase 4: Remove
- Delete deprecated handlers after grace period
- Clean up dead links
- Update statistics

## Quality Control

### Pre-Commit Checks
1. All handlers have valid anchors
2. Names follow convention
3. Required metadata present
4. No duplicate functionality

### Registry Validator Tool
```bash
# Conceptual tool
registry-validator check .claude/templates/
```

## Examples of Improvements

### Before
- `create-component` (too specific)
- `debug` (too vague)
- `fix-problem` vs `analyze-error` (overlap)
- `implement-feature` vs `start-new-work` (redundant)

### After  
- `create-module` (covers all code artifacts)
- `debug-error` (clear purpose)
- `debug-error` (consolidated)
- `start-work` (single entry point)

## Benefits
1. **Predictable**: Users can guess handler names
2. **Scalable**: New handlers fit the pattern
3. **Maintainable**: Clear lifecycle management
4. **Discoverable**: Keywords and relationships help finding
5. **Sustainable**: Prevents future chaos
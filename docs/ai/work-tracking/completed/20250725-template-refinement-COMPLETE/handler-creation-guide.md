# Handler Creation Guide

## When to Create a New Handler

Create a new handler when:
- Users repeatedly ask for something with no handler
- A common development task lacks a direct trigger
- Multiple users phrase the same need differently
- A workflow requires a specific entry point

## Step-by-Step Handler Creation Process

### Step 1: Identify the Need
Before creating a handler, verify:
- [ ] No existing handler covers this need
- [ ] Users actually request this functionality
- [ ] The handler would be used frequently
- [ ] It's distinct from existing handlers

### Step 2: Choose Handler Location
Handlers go in specific files based on type:
- **WORKFLOWS.md** - Development tasks, features, implementation
- **TOOLS.md** - Tool selection and usage patterns
- **CONVENTIONS.md** - Standards, validation, formatting
- **PATTERNS.md** - Meta-routing, ambiguous requests
- **BUILDING-BETTER.md** - Cross-system integration

### Step 3: Write the Handler
Follow the [handler documentation standard](handler-documentation-standard.md):

```markdown
#### Handler: handler-name {#handler-name}
**Triggers**: "exact phrase 1", "exact phrase 2", "pattern with X"
**Target Pattern**: What to extract from user input
**Pre-conditions**: 
- Condition that must be true
- Another required condition
**Process**:
1. First concrete step
2. Second step with tool
3. Conditional routing if needed
4. Continue steps
5. Final outcome
**Success**: Single line success outcome
**Failure**: Single line failure mode
**Examples**:
- "user says this" → Handler does that
- "another input" → Another outcome
```

### Step 4: Add to REGISTRY.md

1. Find the appropriate section in REGISTRY.md
2. Add entry maintaining alphabetical order:

```markdown
#### Handler: `handler-name` {#handler-name}
- **Triggers**: Main trigger phrases
- **Keywords**: [searchable, terms, discovery, words]
- **Process**: One-line summary
- **Location**: FILENAME.md#handler-name
- **Template**: If routes to template, note here
```

3. Update the statistics section:
   - Increment total handler count
   - Update file-specific count

### Step 5: Test the Handler

1. **Test Discovery**:
   ```
   Search REGISTRY for: "trigger phrase"
   Expected: Find your handler
   ```

2. **Test Anchor**:
   ```
   Navigate to FILENAME.md#handler-name
   Expected: Jump to handler definition
   ```

3. **Test Process**:
   - Try each trigger phrase
   - Verify pre-conditions work
   - Follow process steps
   - Confirm success/failure modes

### Step 6: Integration

1. **Cross-references**: 
   - Link from related handlers
   - Update any routing handlers
   - Add to workflow chains

2. **Keywords**: 
   - Add 5-10 discovery keywords
   - Include variations users might say
   - Think about synonyms

3. **Documentation**:
   - Update this guide if you learned something
   - Add to troubleshooting if complex
   - Document in CHANGELOG.md

## Common Patterns for New Handlers

### Feature Implementation Handler
```markdown
#### Handler: implement-[feature] {#implement-feature}
**Triggers**: "implement X", "build Y feature", "add Z functionality"
**Target Pattern**: Feature specification
**Pre-conditions**: 
- Requirements clear
- Work folder exists
**Process**:
1. Break down into tasks
2. Create todos
3. Route to development workflow
**Success**: Feature implemented
**Failure**: Requirements unclear
```

### Tool Usage Handler
```markdown
#### Handler: use-[tool] {#use-tool}
**Triggers**: "use X for Y", "run Z tool"
**Target Pattern**: Tool and purpose
**Pre-conditions**: 
- Tool available
- Purpose clear
**Process**:
1. Validate tool choice
2. Set parameters
3. Execute tool
4. Process results
**Success**: Tool completes task
**Failure**: Wrong tool for job
```

### Validation Handler
```markdown
#### Handler: validate-[aspect] {#validate-aspect}
**Triggers**: "check X", "validate Y", "ensure Z"
**Target Pattern**: What to validate
**Pre-conditions**: 
- Validation criteria exist
- Target accessible
**Process**:
1. Load validation rules
2. Check against rules
3. Report findings
**Success**: Validation complete
**Failure**: Criteria not met
```

## Handler Anti-Patterns (Avoid These)

### ❌ Too Generic
```markdown
**Triggers**: "do something", "help", "work"
```
Problem: Matches everything, provides no value

### ❌ Too Specific
```markdown
**Triggers**: "create a React component with TypeScript and Tailwind CSS using atomic design pattern in src/components/atoms"
```
Problem: Users won't say this exact phrase

### ❌ Overlapping Triggers
```markdown
Handler A: "fix bug"
Handler B: "fix issue"
```
Problem: Ambiguous routing

### ❌ Missing Process Steps
```markdown
**Process**:
1. Analyze the code
2. Fix it
```
Problem: Not actionable

## Validation Checklist

Before committing your handler:

- [ ] Triggers are phrases users actually say
- [ ] Target pattern is clear
- [ ] Pre-conditions are verifiable
- [ ] Process steps are concrete
- [ ] Success/failure are single lines
- [ ] Examples show real usage
- [ ] Added to REGISTRY.md
- [ ] Keywords aid discovery
- [ ] Anchors work correctly
- [ ] No overlap with existing handlers
- [ ] Statistics updated
- [ ] Tests pass

## Quick Reference

### Where to Add Handlers
- Development tasks → WORKFLOWS.md
- Tool selection → TOOLS.md
- Standards/validation → CONVENTIONS.md
- Routing logic → PATTERNS.md
- Integration → BUILDING-BETTER.md

### Must-Have Sections
1. Handler name with anchor
2. Triggers (real phrases)
3. Target pattern
4. Pre-conditions
5. Process (numbered)
6. Success (one line)
7. Failure (one line)
8. Examples (2-3)

### Registry Entry
1. Handler name
2. Triggers summary
3. Keywords array
4. Process summary
5. Location link
6. Template note (if applicable)

## Examples of Well-Designed Handlers

Look at these handlers for inspiration:
- `start-new-work` - Clear work initiation
- `fix-bug` - Routes to template
- `search-code` - Tool selection
- `commit-changes` - Convention following

## Getting Help

If unsure about handler design:
1. Check similar existing handlers
2. Test with real user phrases
3. Start simple, enhance later
4. Ask: "What would users actually say?"

Remember: Handlers are discovered by what users say, not what we think they should say.
# Folder Structure Analysis: Organizational Principles

## Overview
After deep analysis, here are the main organizational approaches we could take for our handler folder structure.

## Option 1: Domain-Based (RECOMMENDED)
```
handlers/
├── git/                    # Git operations
│   ├── commit-changes.md
│   ├── gac.md
│   └── create-branch.md
├── file/                   # File operations
│   ├── edit-file.md
│   ├── create-file.md
│   └── read-file.md
├── search/                 # Search & discovery
│   ├── find-symbol.md
│   └── search-code.md
├── development/            # Development workflows
│   ├── create-component.md
│   └── refactor-code.md
└── workflows/              # Complex multi-domain
    ├── start-new-work.md
    └── fix-bug.md
```

**Pros:**
- Intuitive for humans browsing
- Clear ownership boundaries
- Easy PR reviews (changes grouped by domain)
- Aligns with mental models

**Cons:**
- Some handlers cross domains
- Need "workflows/" escape hatch
- Might need "misc/" for outliers

## Option 2: Feature-Based
```
handlers/
├── component-management/
│   ├── create-component.md
│   ├── refactor-component.md
│   └── delete-component.md
├── code-quality/
│   ├── analyze-code.md
│   ├── check-lint.md
│   └── format-code.md
└── debugging/
    ├── debug-issue.md
    └── analyze-error.md
```

**Pros:**
- Groups related functionality
- Matches "I want to do X" thinking
- Good for feature teams

**Cons:**
- Features are subjective
- Same handler fits multiple features
- Harder to maintain boundaries

## Option 3: Atomic Operation
```
handlers/
├── create/
│   ├── create-component.md
│   ├── create-file.md
│   └── create-branch.md
├── read/
│   ├── read-file.md
│   ├── find-symbol.md
│   └── check-status.md
├── update/
│   ├── edit-file.md
│   └── refactor-code.md
└── delete/
    ├── delete-file.md
    └── remove-component.md
```

**Pros:**
- Very clear single responsibility
- CRUD-like organization
- Promotes composability

**Cons:**
- Too granular/technical
- Loses semantic meaning
- Users don't think in CRUD

## Option 4: User Intent
```
handlers/
├── i-want-to-create/
│   ├── new-component.md
│   └── new-feature.md
├── i-want-to-fix/
│   ├── bug.md
│   └── error.md
└── i-want-to-understand/
    ├── how-code-works.md
    └── dependencies.md
```

**Pros:**
- Mirrors natural language
- Very discoverable
- Great for onboarding

**Cons:**
- Too colloquial for technical system
- Might feel unprofessional
- Naming gets awkward

## Option 5: Orchestration Complexity
```
handlers/
├── simple/              # 1-3 template orchestration
│   ├── read-file.md
│   └── check-status.md
├── standard/            # 4-6 template orchestration
│   ├── edit-file.md
│   └── commit-changes.md
└── complex/             # 7+ template orchestration
    ├── create-component.md
    └── refactor-code.md
```

**Pros:**
- Reflects architectural complexity
- Helps understand handler scope
- Good for performance analysis

**Cons:**
- Not intuitive for users
- Complexity can change
- Too implementation-focused

## Option 6: Hybrid Approach
```
handlers/
├── core/               # Essential, frequently used
│   ├── file/
│   ├── git/
│   └── search/
├── workflows/          # Multi-step, complex orchestrations
│   ├── development/
│   └── maintenance/
├── validators/         # Check/verify operations
└── experimental/       # New, testing handlers
```

**Pros:**
- Multiple organization axes
- Room for growth
- Clear stability levels

**Cons:**
- More complex structure
- Might over-engineer
- Harder to decide placement

## Analysis: Key Insights

### 1. Serena Changes Everything
Since we use Serena for discovery, we're not optimizing for "findability" - we're optimizing for:
- Human browsing/understanding
- Maintenance and PR reviews  
- Teaching/onboarding
- Logical grouping

### 2. Cross-Domain Handlers Are Common
Many handlers touch multiple domains:
- `create-component` → files + patterns + maybe git
- `refactor-code` → files + search + validation
- `fix-bug` → search + edit + test

### 3. Folder Depth Matters
- Too deep: Annoying to navigate
- Too shallow: No organization benefit
- Sweet spot: 2-3 levels maximum

### 4. Escape Hatches Are Essential
Every organization scheme needs:
- A place for complex workflows
- A place for miscellaneous items
- A place for experimental/new handlers

## Recommendation: Domain-Based + Workflows

### Why Domain-Based Wins:
1. **Intuitive**: Developers think "I need to do something with git"
2. **Stable**: Domains don't change much over time
3. **Clear**: Easy to know where things belong (mostly)
4. **Proven**: Similar to stdlib organization in many languages

### Structure:
```
handlers/
├── git/            # Version control operations
├── file/           # File system operations
├── search/         # Code discovery operations
├── development/    # Code creation/modification
├── testing/        # Test-related operations
├── analysis/       # Code analysis/review
├── session/        # Session management
├── workflows/      # Complex multi-domain workflows
└── _template.md    # Handler template
```

### Special Considerations:

1. **Cross-Domain Handlers**: Put in primary domain or workflows/
2. **Naming Convention**: Use verbs (create-component.md not component-creator.md)
3. **Metadata**: Each handler declares its orchestrations in frontmatter
4. **Flat Within Domains**: Avoid sub-sub-folders within domains

### Migration Path:
1. Start with clear domains (git, file, search)
2. Move ambiguous handlers to workflows/
3. Refine boundaries based on actual usage
4. Keep REGISTRY.md as index during transition

## Alternative: If We Want More Innovation

If we want to be more innovative and align with our orchestration model:

```
handlers/
├── triggers/        # User-triggered handlers
│   ├── commands/    # Direct commands (create X, fix Y)
│   └── questions/   # Information requests (how does X work?)
├── orchestrators/   # Coordinate other handlers
├── executors/       # Do the actual work
└── validators/      # Check and verify
```

This separates concerns by role in the system rather than domain, which could better support our orchestration model where handlers are "conductors" not "doers".

## Decision Factors

1. **Team Preference**: What feels most natural?
2. **Maintenance**: What's easiest to maintain long-term?
3. **Growth**: What scales best to 100+ handlers?
4. **Onboarding**: What's easiest for new people to understand?
5. **Tooling**: What works best with our tooling?

## Next Steps

1. Choose primary organization principle
2. Define escape hatches for edge cases
3. Create naming conventions
4. Build migration script
5. Test with pilot handlers
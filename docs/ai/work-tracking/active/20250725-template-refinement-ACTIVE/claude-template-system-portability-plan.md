# Claude Template System Portability Plan

## Goal
Make the Claude template system project-agnostic and idempotent so it can be used across all projects without modification.

## Key Terms Defined
- **Project-agnostic**: Works in any project regardless of language, framework, or structure
- **Idempotent**: Can be installed/initialized multiple times with same result, won't break existing setup

## Current Dependencies to Remove

### 1. Project-Specific References
- SESSION.md contains MomsBlog-specific entries
- Work tracking folders have project-specific paths
- Some handlers assume JavaScript/React context
- Git commit examples use project-specific messages

### 2. Hard-Coded Paths
- `.claude/templates/` assumes specific structure
- Work folder paths like `docs/ai/work-tracking/`
- Memory storage in `.serena/memories/`

### 3. Language/Framework Assumptions
- Examples often use JavaScript/React
- Component creation assumes React patterns
- Test handlers assume specific test frameworks

## Proposed Solution: Claude Template System Package

### Structure
```
claude-template-system/
├── init/                      # Initialization scripts
│   ├── setup.sh              # Main setup script
│   ├── templates/            # Core template files
│   │   ├── CLAUDE.md         # Base execution engine
│   │   ├── REGISTRY.md       # Handler registry
│   │   ├── WORKFLOWS.md      # Development workflows
│   │   ├── TOOLS.md          # Tool selection
│   │   ├── CONVENTIONS.md    # Standards (customizable)
│   │   ├── PATTERNS.md       # Meta patterns
│   │   ├── BUILDING-BETTER.md # System improvement
│   │   ├── MATRICES.md       # Decision matrices
│   │   ├── USER-GUIDE.md     # User documentation
│   │   └── .gitkeep
│   └── config/
│       ├── defaults.json     # Default configuration
│       └── languages/        # Language-specific configs
├── plugins/                  # Optional plugins
│   ├── javascript/          # JS-specific handlers
│   ├── python/              # Python-specific handlers
│   └── ruby/                # Ruby-specific handlers
└── README.md                # Setup instructions
```

### Initialization Process

```bash
# One-time global install
npm install -g claude-template-system
# or
curl -sSL https://claude-templates.dev/install.sh | sh

# In any project
claude-init

# What it does:
1. Creates .claude/ directory if not exists
2. Copies core templates
3. Detects project type (language, framework)
4. Loads appropriate language plugins
5. Creates PROJECT.claude config file
6. Initializes SESSION.md if not exists
7. Sets up work tracking structure
```

### Configuration File: PROJECT.claude

```yaml
# PROJECT.claude - Project-specific configuration
version: 1.0
language: javascript  # auto-detected
framework: react     # auto-detected
conventions:
  git_format: "gac"  # or "conventional"
  test_command: "npm test"
  lint_command: "npm run lint"
  build_command: "npm run build"
paths:
  work_tracking: "docs/ai/work-tracking"  # customizable
  memories: ".claude/memories"            # customizable
handlers:
  disabled: []  # Disable specific handlers
  custom: []    # Add project-specific handlers
```

### Making Handlers Project-Agnostic

#### 1. Abstract Examples
```markdown
#### Handler: create-component {#create-component}
**Triggers**: "create a new component", "build component X"
**Examples**:
- "create a Button component" → Creates component file
- "new auth provider component" → Creates provider pattern

<!-- Language-specific examples loaded from plugins -->
{{#if javascript}}
- Creates: src/components/Button.jsx
{{/if}}
{{#if python}}
- Creates: components/button.py
{{/if}}
```

#### 2. Dynamic Tool Selection
```javascript
// Instead of hard-coding tools
const testCommand = config.conventions.test_command || detectTestCommand();
const lintCommand = config.conventions.lint_command || detectLintCommand();
```

#### 3. Convention Detection
```javascript
// Auto-detect project conventions
function detectConventions() {
  return {
    componentPath: findComponentPath(),  // src/components or components/
    testPattern: findTestPattern(),      // *.test.js or *_test.py
    gitFormat: detectGitFormat(),        // conventional or simple
  };
}
```

## Implementation Phases

### Phase 1: Core Abstraction
1. Remove all project-specific references
2. Create variable placeholders
3. Build configuration system
4. Test in multiple project types

### Phase 2: Plugin System
1. Design plugin architecture
2. Create language plugins (JS, Python, Ruby, Go)
3. Framework plugins (React, Vue, Django, Rails)
4. Tool plugins (Jest, Pytest, RSpec)

### Phase 3: Distribution
1. Create NPM package
2. Create standalone installer
3. GitHub template repository
4. VS Code extension (optional)

### Phase 4: Ecosystem
1. Plugin marketplace
2. Community handlers
3. Project templates
4. Integration guides

## Idempotency Guarantees

### Safe Operations
- `claude-init` checks existing setup
- Never overwrites customized files
- Preserves project-specific handlers
- Merges updates intelligently

### Version Management
```bash
claude-init --version 2.0  # Specific version
claude-init --upgrade      # Upgrade existing
claude-init --check        # Verify setup
```

### Rollback Support
```bash
claude-init --backup       # Before changes
claude-init --restore      # If issues
```

## Benefits

1. **Instant Setup** - New projects get full template system immediately
2. **Consistency** - Same handlers work across all projects
3. **Learning Once** - Know Claude in one project, know it in all
4. **Community** - Share handlers and improvements
5. **Evolution** - System improves for everyone

## Migration Strategy

### From Current System
1. Extract core templates
2. Identify project-specific parts
3. Create abstraction layer
4. Build configuration system
5. Test in fresh projects

### Backwards Compatibility
- Existing projects continue working
- Gradual migration possible
- Can run old and new side-by-side

## Future Enhancements

### 1. Claude Cloud Sync
- Sync handlers across machines
- Team sharing of custom handlers
- Analytics on handler usage

### 2. AI-Powered Setup
```bash
claude-init --ai-detect
# AI analyzes project and suggests optimal configuration
```

### 3. Project Templates
```bash
claude-init --template react-typescript
claude-init --template django-rest
claude-init --template rails-api
```

## Success Metrics

1. **Adoption** - Used in 100+ projects
2. **Time Saved** - Setup under 1 minute
3. **Consistency** - 95% handlers work unchanged
4. **Community** - 50+ contributed plugins

## Next Steps

1. Create proof of concept with 3 projects
2. Abstract core handlers
3. Build configuration system
4. Test across languages
5. Package for distribution

This plan makes the Claude template system truly portable and reusable across all your projects!
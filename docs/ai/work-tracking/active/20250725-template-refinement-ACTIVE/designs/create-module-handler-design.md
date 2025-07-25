# Create-Module Handler Design

## Purpose
Replace the narrow `create-component` with a versatile `create-module` handler that can create any code artifact.

## Handler Definition

```markdown
#### Handler: create-module {#create-module}
**Triggers**: "create [module type]", "new [artifact]", "generate [code type]"
**Keywords**: [component, service, model, utility, hook, middleware, controller, provider, class, function]
**Target Pattern**: Extract module type and name from request
**Pre-conditions**: 
- Module doesn't already exist at target location
- Project structure supports module type
- Valid module name provided

**Process**:
1. Determine module type from request
2. Identify appropriate location based on project conventions
3. Check for existing similar modules as patterns
4. Create module file(s) with proper structure
5. Add necessary imports and exports
6. Create associated test file if applicable
7. Update relevant index/barrel files
8. Add to any module registries

**Success**: Module created following project patterns
**Failure**: Suggest alternative names or locations

**Module Types Supported**:
- **Components**: UI elements (React, Vue, etc.)
- **Services**: Business logic, API clients
- **Models**: Data structures, types, interfaces  
- **Utilities**: Helper functions, shared logic
- **Hooks**: React hooks, composables
- **Middleware**: Express, Redux middleware
- **Controllers**: API endpoints, route handlers
- **Providers**: Context providers, DI containers
- **Configs**: Configuration modules
- **Tests**: Test suites and helpers

**Examples**:
- "create a Button component" → React component with styles/tests
- "create user service" → Service class with interface
- "create auth middleware" → Middleware with proper signatures
- "create Product model" → Data model with validation
- "create useAuth hook" → Custom hook with tests
- "create config module for database" → Config with types
```

## Key Improvements Over create-component

### 1. Broader Scope
- Not limited to UI components
- Covers all code artifact types
- Adapts to project needs

### 2. Smart Location Detection
```
Request: "create user service"
Detection: 
- Type: service
- Name: user
- Location: /src/services/user.service.ts (or project convention)
```

### 3. Pattern Recognition
- Looks at existing modules for style
- Maintains consistency automatically
- Adapts to project conventions

### 4. Comprehensive Creation
- Main module file
- Test file (if project uses tests)
- Type definitions (if TypeScript)
- Updates to index files
- Documentation stubs

## Implementation Flexibility

The handler should ask clarifying questions when ambiguous:

```
User: "create auth"
Handler: "What type of module should I create for 'auth'?
- Service (for authentication logic)
- Middleware (for route protection)  
- Hook (for React auth state)
- Model (for auth data structures)
- Component (for auth UI)"
```

## Integration Points

### Triggers Other Handlers
- May call `create-todos` for complex modules
- Could trigger `update-tracker` for progress

### Used By
- `start-work` when creating initial modules
- Direct user invocation

## Migration from create-component

### Before
```markdown
- [`create-component`](WORKFLOWS.md#create-component) - Create new UI/code component
```

### After  
```markdown
- [`create-module`](WORKFLOWS.md#create-module) - Create any code artifact
  - **Keywords**: [component, service, model, utility, hook, middleware]
  - **Replaces**: create-component (deprecated 2025-07-25)
```

## Success Metrics
- Handles 10+ different module types
- Maintains project consistency
- Reduces need for manual file creation
- Single handler for all code generation
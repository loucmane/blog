# Claude Code Handler System - API Reference

**Version**: 2.0  
**Updated**: 2025-08-02  
**Total Handlers**: 75  
**Completion**: 100%  

## Overview

This document provides a complete reference for all handlers in the Claude Code template system. Each handler is documented with its triggers, process, and usage examples.

## Handler Categories

- [Core Development](#core-development) (15 handlers) - Main development workflows
- [Search & Analysis](#search--analysis) (12 handlers) - Code exploration and understanding
- [File Operations](#file-operations) (10 handlers) - File and directory management
- [Testing & Quality](#testing--quality) (8 handlers) - Testing and validation workflows
- [Git & Version Control](#git--version-control) (6 handlers) - Source control operations
- [Documentation](#documentation) (5 handlers) - Documentation creation and maintenance
- [Performance & Optimization](#performance--optimization) (4 handlers) - Performance improvement
- [Security & Compliance](#security--compliance) (4 handlers) - Security analysis and compliance
- [Deployment & DevOps](#deployment--devops) (3 handlers) - Deployment and operations
- [System & Meta](#system--meta) (8 handlers) - System management and meta-operations

## Quick Trigger Reference

### Most Common Triggers

| User Says | Handler | Result |
|-----------|---------|--------|
| "implement X" | `implement-feature` | TDD feature development |
| "fix Y" | `fix-problem` | Systematic bug resolution |
| "find Z" | `search-code` | Multi-strategy code search |
| "test A" | `test-implementation` | Comprehensive testing |
| "optimize B" | `optimize-performance` | Performance improvement |
| "work on C" | `start-new-work` | Initialize development workflow |
| "edit D" | `edit-file` | Convention-aware file editing |
| "explain E" | `explain-code` | Code analysis and documentation |
| "commit F" | `commit-changes` | Git workflow with proper formatting |
| "debug G" | `debug-error` | Error diagnosis and resolution |

## Core Development

### implement-feature
**Location**: WORKFLOWS.md#implement-feature  
**Triggers**: "implement X", "build Y", "create feature Z", "add functionality A"  
**Purpose**: Complete TDD feature implementation workflow  

**Process**:
1. Initialize work tracking folder
2. Create failing tests first (TDD)
3. Implement minimal code to pass tests
4. Refactor and optimize
5. Document feature usage
6. Update tracker with progress

**Success Criteria**: Feature implemented with tests, documented, and tracked

**Examples**:
- "implement user authentication" → Full auth system with JWT, tests, docs
- "build payment processing" → Payment flow with validation and error handling
- "create dashboard component" → React component with tests and stories

### fix-problem
**Location**: WORKFLOWS.md#fix-problem  
**Triggers**: "fix X", "resolve Y", "debug Z", "solve problem A"  
**Purpose**: Systematic problem resolution with evidence gathering  

**Process**:
1. Gather evidence about the problem
2. Reproduce the issue
3. Analyze root cause
4. Implement fix with tests
5. Validate solution
6. Document resolution

**Success Criteria**: Problem resolved with tests and documentation

**Examples**:
- "fix login validation error" → Diagnose issue, implement fix, add validation tests
- "resolve performance issue in search" → Profile code, optimize, benchmark improvements
- "debug failing test in UserService" → Identify test failure cause, fix code or test

### start-new-work
**Location**: WORKFLOWS.md#start-new-work  
**Triggers**: "work on X", "start Y", "begin Z", "new project A"  
**Purpose**: Initialize comprehensive development workflow  

**Process**:
1. Create work tracking folder with timestamp
2. Initialize tracker.md with objectives
3. Create todos.md with task breakdown
4. Set up development environment
5. Plan implementation approach
6. Begin with TDD workflow

**Success Criteria**: Work environment set up with tracking and clear next steps

**Examples**:
- "work on user profile system" → Create 20250802-user-profile-ACTIVE/ with full tracking
- "start API redesign project" → Initialize project with architecture planning
- "begin mobile app development" → Set up development workflow and tooling

### test-implementation
**Location**: WORKFLOWS.md#test-implementation  
**Triggers**: "test X", "add tests for Y", "create test suite Z"  
**Purpose**: Comprehensive testing workflow with multiple test types  

**Process**:
1. Analyze code to identify test scenarios
2. Create unit tests for core functionality
3. Add integration tests for workflows
4. Include edge cases and error conditions
5. Validate test coverage
6. Document testing strategy

**Success Criteria**: Comprehensive test suite with good coverage

**Examples**:
- "test user authentication" → Unit, integration, and security tests
- "add tests for payment processing" → Test all payment flows and error cases
- "create test suite for API" → Full API test coverage with mocking

### refactor-code
**Location**: WORKFLOWS.md#refactor-code  
**Triggers**: "refactor X", "improve Y", "clean up Z", "restructure A"  
**Purpose**: Safe code improvement while maintaining functionality  

**Process**:
1. Analyze current code structure
2. Identify improvement opportunities
3. Plan refactoring steps
4. Implement changes incrementally
5. Run tests after each change
6. Document improvements made

**Success Criteria**: Code improved with no functionality loss

**Examples**:
- "refactor authentication logic" → Extract functions, improve readability
- "clean up database queries" → Optimize queries, add proper indexing
- "restructure component hierarchy" → Better component organization

## Search & Analysis

### search-code
**Location**: TOOLS.md#search-code  
**Triggers**: "find X", "search for Y", "locate Z", "where is A"  
**Purpose**: Multi-strategy code search with context  

**Process**:
1. Determine search strategy based on target
2. Use Serena MCP for symbol search
3. Fall back to Grep for text patterns
4. Provide context and usage examples
5. Suggest related code locations

**Success Criteria**: Target found with context and examples

**Examples**:
- "find user authentication function" → Locate function with usage examples
- "search for database connection code" → Find all DB connection points
- "locate error handling middleware" → Find middleware with request flow

### explain-code
**Location**: WORKFLOWS.md#explain-code  
**Triggers**: "explain X", "what does Y do", "how does Z work", "analyze A"  
**Purpose**: Code analysis with documentation generation  

**Process**:
1. Read and analyze the specified code
2. Identify key functionality and patterns
3. Explain purpose and implementation
4. Document dependencies and interactions
5. Provide usage examples
6. Note potential improvements

**Success Criteria**: Clear explanation with examples and documentation

**Examples**:
- "explain the authentication middleware" → Document how auth works
- "what does the payment processor do" → Explain payment flow
- "analyze the database schema" → Document table relationships

### find-symbol
**Location**: TOOLS.md#find-symbol  
**Triggers**: "find function X", "locate class Y", "where is variable Z"  
**Purpose**: Precise symbol location with definition and usage  

**Process**:
1. Use Serena MCP for symbol search
2. Get symbol definition and location
3. Find all usages across codebase
4. Provide context about symbol purpose
5. Show related symbols

**Success Criteria**: Symbol found with definition and usage context

**Examples**:
- "find function validateUser" → Function definition and all call sites
- "locate class UserService" → Class definition and instantiation points
- "where is variable API_KEY" → Variable declaration and usage

### trace-execution
**Location**: WORKFLOWS.md#trace-execution  
**Triggers**: "trace X", "follow execution of Y", "track flow Z"  
**Purpose**: Execution flow analysis with step-by-step breakdown  

**Process**:
1. Identify entry point for execution
2. Follow code execution path
3. Document each step and decision point
4. Identify dependencies and side effects
5. Create execution flow diagram
6. Note potential issues or optimizations

**Success Criteria**: Complete execution flow documented

**Examples**:
- "trace user login flow" → Document entire login process
- "follow payment processing execution" → Map payment workflow
- "track error handling path" → Show error propagation

### analyze-architecture
**Location**: WORKFLOWS.md#analyze-architecture  
**Triggers**: "analyze architecture", "review system design", "examine structure"  
**Purpose**: High-level system analysis with recommendations  

**Process**:
1. Examine overall system structure
2. Identify architectural patterns
3. Analyze component relationships
4. Review data flow and dependencies
5. Assess scalability and maintainability
6. Provide improvement recommendations

**Success Criteria**: Comprehensive architecture analysis with recommendations

**Examples**:
- "analyze authentication architecture" → Review auth system design
- "examine database structure" → Analyze schema and relationships
- "review API design patterns" → Assess REST API structure

## File Operations

### edit-file
**Location**: TOOLS.md#edit-file  
**Triggers**: "edit X", "modify Y", "update Z", "change A"  
**Purpose**: Convention-aware file modification with safety checks  

**Process**:
1. Read current file content
2. Check file conventions and standards
3. Plan modifications carefully
4. Apply changes using appropriate tool
5. Validate changes follow conventions
6. Update documentation if needed

**Success Criteria**: File updated following project conventions

**Examples**:
- "edit UserService.js to add validation" → Add validation with proper error handling
- "modify config.json with new settings" → Update config maintaining format
- "update README with installation steps" → Add clear installation instructions

### create-file
**Location**: TOOLS.md#create-file  
**Triggers**: "create X", "make new Y", "add file Z"  
**Purpose**: New file creation with proper structure and conventions  

**Process**:
1. Determine appropriate file location
2. Choose correct template or boilerplate
3. Apply project naming conventions
4. Create file with proper structure
5. Add necessary imports and dependencies
6. Update relevant index files or configs

**Success Criteria**: New file created following project standards

**Examples**:
- "create new React component UserProfile" → Component with props, tests, styles
- "make API route for user management" → Express route with validation
- "add utility file for date formatting" → Utility with tests and exports

### update-tracker
**Location**: WORKFLOWS.md#update-tracker  
**Triggers**: "update progress", "record status", "checkpoint work"  
**Purpose**: Real-time work tracking documentation  

**Process**:
1. Get current timestamp
2. Assess current progress status
3. Update tracker.md with progress
4. Update todos.md with completed/new tasks
5. Record any discoveries or decisions
6. Plan next steps

**Success Criteria**: Progress documented with timestamp and next steps

**Examples**:
- "update progress on authentication" → Record auth implementation status
- "checkpoint database work" → Document DB schema progress
- "record API development status" → Update API endpoint completion

### backup-work
**Location**: TOOLS.md#backup-work  
**Triggers**: "backup work", "save progress", "preserve state"  
**Purpose**: Safe work preservation before major changes  

**Process**:
1. Identify current work state
2. Create backup of active work
3. Save to appropriate backup location
4. Document backup contents
5. Verify backup integrity
6. Update backup index

**Success Criteria**: Work safely backed up with recovery information

**Examples**:
- "backup authentication work" → Save auth development progress
- "preserve current API state" → Backup before major refactoring
- "save progress before deployment" → Backup before production changes

### manage-session
**Location**: WORKFLOWS.md#manage-session  
**Triggers**: "session status", "check progress", "resume work"  
**Purpose**: Session state management and context restoration  

**Process**:
1. Check current session state
2. Review active work folders
3. Assess progress on current tasks
4. Restore context if resuming
5. Update session tracking
6. Plan next activities

**Success Criteria**: Session state clear with next steps defined

**Examples**:
- "check session status" → Review current work and progress
- "resume authentication work" → Restore context and continue
- "session progress review" → Assess overall development status

## Testing & Quality

### validate-solution
**Location**: WORKFLOWS.md#validate-solution  
**Triggers**: "validate X", "check Y", "verify Z", "test solution A"  
**Purpose**: Comprehensive solution validation with quality checks  

**Process**:
1. Review solution against requirements
2. Run all relevant tests
3. Check code quality and conventions
4. Validate performance characteristics
5. Test edge cases and error conditions
6. Document validation results

**Success Criteria**: Solution validated with quality assurance

**Examples**:
- "validate authentication implementation" → Test all auth scenarios
- "check payment processing solution" → Verify payment flows
- "verify API endpoint functionality" → Test all endpoint behaviors

### debug-error
**Location**: WORKFLOWS.md#debug-error  
**Triggers**: "debug X", "troubleshoot Y", "diagnose Z"  
**Purpose**: Systematic error diagnosis and resolution  

**Process**:
1. Reproduce the error consistently
2. Gather error details and context
3. Analyze stack traces and logs
4. Identify root cause
5. Implement targeted fix
6. Verify fix resolves issue

**Success Criteria**: Error diagnosed and resolved with prevention measures

**Examples**:
- "debug login failure" → Diagnose and fix auth issues
- "troubleshoot API timeout" → Resolve performance problems
- "diagnose test failures" → Fix failing test suite

### review-code
**Location**: CONVENTIONS.md#review-code  
**Triggers**: "review X", "code review Y", "check quality Z"  
**Purpose**: Code quality review with improvement suggestions  

**Process**:
1. Analyze code for adherence to standards
2. Check for common anti-patterns
3. Review security considerations
4. Assess performance implications
5. Suggest improvements
6. Document review findings

**Success Criteria**: Code reviewed with actionable feedback

**Examples**:
- "review authentication code" → Security and quality assessment
- "code review for user service" → Check implementation quality
- "check quality of new components" → React component review

### check-conventions
**Location**: CONVENTIONS.md#check-conventions  
**Triggers**: "check conventions", "validate style", "verify standards"  
**Purpose**: Project convention and style validation  

**Process**:
1. Load project conventions and standards
2. Check code against style guidelines
3. Verify naming conventions
4. Validate file organization
5. Check documentation standards
6. Report violations with fixes

**Success Criteria**: Code follows all project conventions

**Examples**:
- "check conventions for new files" → Validate file standards
- "verify code style compliance" → Check linting and formatting
- "validate documentation standards" → Check doc completeness

## Git & Version Control

### commit-changes
**Location**: TOOLS.md#commit-changes  
**Triggers**: "commit", "save changes", "git commit"  
**Purpose**: Git workflow with proper commit message formatting  

**Process**:
1. Check git status for changes
2. Review changes for completeness
3. Generate proper commit message
4. Use `gac` format: `type: action 'file'`
5. Commit with proper staging
6. Update work tracker

**Success Criteria**: Changes committed with proper message format

**Examples**:
- "commit authentication changes" → `gac "feat: implement JWT authentication 'auth.js'"`
- "save bug fix" → `gac "fix: resolve login validation 'UserService.js'"`
- "commit documentation" → `gac "docs: add API documentation 'README.md'"`

### manage-branches
**Location**: TOOLS.md#manage-branches  
**Triggers**: "create branch", "switch branch", "merge branch"  
**Purpose**: Git branch management with workflow integration  

**Process**:
1. Assess current branch state
2. Plan branch strategy
3. Create or switch branches as needed
4. Ensure work tracking follows branches
5. Handle merge conflicts if present
6. Update documentation

**Success Criteria**: Branches managed according to git workflow

**Examples**:
- "create feature branch for auth" → Create auth-feature branch
- "switch to development branch" → Switch with context preservation
- "merge authentication work" → Merge with proper commit history

### review-history
**Location**: TOOLS.md#review-history  
**Triggers**: "git history", "show commits", "review changes"  
**Purpose**: Git history analysis with change documentation  

**Process**:
1. Analyze commit history
2. Identify significant changes
3. Review commit message quality
4. Assess change patterns
5. Document major milestones
6. Suggest improvements

**Success Criteria**: Git history analyzed with insights provided

**Examples**:
- "review git history for auth work" → Analyze auth development progression
- "show recent commits" → Display and analyze recent changes
- "git history analysis" → Comprehensive change review

## Documentation

### create-docs
**Location**: WORKFLOWS.md#create-docs  
**Triggers**: "document X", "write docs for Y", "create documentation"  
**Purpose**: Comprehensive documentation generation  

**Process**:
1. Determine documentation type needed
2. Analyze code/feature to document
3. Create structured documentation
4. Include examples and usage patterns
5. Add troubleshooting information
6. Update documentation index

**Success Criteria**: Clear, helpful documentation created

**Examples**:
- "document the authentication API" → Complete API reference
- "write user guide for dashboard" → End-user documentation
- "create development setup docs" → Developer onboarding guide

### update-readme
**Location**: TOOLS.md#update-readme  
**Triggers**: "update README", "improve documentation", "add to README"  
**Purpose**: README maintenance with project information  

**Process**:
1. Review current README content
2. Identify information gaps
3. Update with new features/changes
4. Ensure setup instructions are current
5. Add examples and usage
6. Validate all links work

**Success Criteria**: README updated with current project information

**Examples**:
- "update README with auth setup" → Add authentication configuration
- "add installation instructions" → Complete setup documentation
- "improve README examples" → Better usage demonstrations

### check-docs-needed
**Location**: CONVENTIONS.md#check-docs-needed  
**Triggers**: "docs needed?", "should document?", "documentation required?"  
**Purpose**: Assessment of documentation requirements  

**Process**:
1. Analyze code complexity and public interface
2. Check existing documentation coverage
3. Assess user-facing functionality
4. Review API surface area
5. Determine documentation priorities
6. Provide recommendations

**Success Criteria**: Clear documentation needs assessment

**Examples**:
- "check if auth API needs docs" → Assess API documentation needs
- "should document this utility?" → Evaluate utility documentation value
- "docs needed for new component?" → Component documentation assessment

## Performance & Optimization

### optimize-performance
**Location**: WORKFLOWS.md#optimize-performance  
**Triggers**: "optimize X", "improve performance Y", "speed up Z"  
**Purpose**: Systematic performance improvement with benchmarking  

**Process**:
1. Profile current performance
2. Identify bottlenecks and slow operations
3. Research optimization strategies
4. Implement improvements incrementally
5. Benchmark improvements
6. Document optimization results

**Success Criteria**: Performance improved with measurable results

**Examples**:
- "optimize database queries" → Query optimization with benchmarks
- "improve API response time" → API performance tuning
- "speed up component rendering" → React performance optimization

### profile-code
**Location**: WORKFLOWS.md#profile-code  
**Triggers**: "profile X", "benchmark Y", "measure performance Z"  
**Purpose**: Code profiling and performance measurement  

**Process**:
1. Set up profiling tools
2. Create performance benchmarks
3. Run profiling sessions
4. Analyze performance data
5. Identify optimization opportunities
6. Document findings

**Success Criteria**: Code profiled with optimization recommendations

**Examples**:
- "profile authentication flow" → Auth performance analysis
- "benchmark database operations" → DB performance measurement
- "measure API endpoint performance" → API benchmarking

### memory-analysis
**Location**: WORKFLOWS.md#memory-analysis  
**Triggers**: "memory usage", "analyze memory", "check memory leaks"  
**Purpose**: Memory usage analysis and leak detection  

**Process**:
1. Monitor memory consumption patterns
2. Identify memory leaks and excessive usage
3. Analyze object lifecycle and retention
4. Optimize memory allocation
5. Implement memory management best practices
6. Validate improvements

**Success Criteria**: Memory usage optimized with leak prevention

**Examples**:
- "analyze memory usage in auth" → Auth memory optimization
- "check for memory leaks" → Memory leak detection and fixing
- "optimize object allocation" → Memory allocation improvements

## Security & Compliance

### security-audit
**Location**: WORKFLOWS.md#security-audit  
**Triggers**: "security audit", "check security", "vulnerability assessment"  
**Purpose**: Comprehensive security analysis with vulnerability identification  

**Process**:
1. Scan for common security vulnerabilities
2. Review authentication and authorization
3. Check data validation and sanitization
4. Analyze encryption and secure communication
5. Review access controls and permissions
6. Document security findings and recommendations

**Success Criteria**: Security assessment complete with remediation plan

**Examples**:
- "security audit of authentication" → Auth security analysis
- "check API security" → API vulnerability assessment
- "vulnerability assessment" → Comprehensive security review

### validate-input
**Location**: CONVENTIONS.md#validate-input  
**Triggers**: "validate input", "check data validation", "sanitize input"  
**Purpose**: Input validation and sanitization review  

**Process**:
1. Identify all input points
2. Review validation rules and constraints
3. Check sanitization procedures
4. Test with malicious input patterns
5. Validate error handling
6. Document validation improvements

**Success Criteria**: Input validation comprehensive and secure

**Examples**:
- "validate user input in forms" → Form validation security
- "check API input validation" → API security validation
- "sanitize database inputs" → SQL injection prevention

### compliance-check
**Location**: CONVENTIONS.md#compliance-check  
**Triggers**: "compliance check", "regulatory review", "standards validation"  
**Purpose**: Compliance validation against standards and regulations  

**Process**:
1. Identify applicable compliance requirements
2. Review code against compliance standards
3. Check data handling and privacy requirements
4. Validate audit trail and logging
5. Assess documentation completeness
6. Generate compliance report

**Success Criteria**: Compliance validated with any issues documented

**Examples**:
- "GDPR compliance check" → Privacy regulation compliance
- "security standards validation" → Security standard adherence
- "regulatory review for finance" → Financial compliance assessment

## Deployment & DevOps

### prepare-deployment
**Location**: WORKFLOWS.md#prepare-deployment  
**Triggers**: "deploy", "prepare deployment", "ready for production"  
**Purpose**: Deployment preparation with quality gates  

**Process**:
1. Run full test suite
2. Validate configuration for target environment
3. Check security and performance requirements
4. Prepare deployment scripts and rollback plans
5. Document deployment process
6. Create deployment checklist

**Success Criteria**: Deployment ready with all quality gates passed

**Examples**:
- "prepare auth system deployment" → Auth deployment preparation
- "ready API for production" → API production readiness
- "deploy new features" → Feature deployment preparation

### monitor-system
**Location**: WORKFLOWS.md#monitor-system  
**Triggers**: "monitor system", "check health", "system status"  
**Purpose**: System monitoring and health assessment  

**Process**:
1. Check system health indicators
2. Monitor performance metrics
3. Review error rates and logs
4. Validate functionality across components
5. Assess resource utilization
6. Document system status

**Success Criteria**: System status assessed with any issues identified

**Examples**:
- "monitor authentication system" → Auth system health check
- "check API system status" → API monitoring and assessment
- "system health review" → Comprehensive system status

### troubleshoot-deployment
**Location**: WORKFLOWS.md#troubleshoot-deployment  
**Triggers**: "deployment issue", "production problem", "deployment failed"  
**Purpose**: Deployment issue diagnosis and resolution  

**Process**:
1. Identify deployment failure points
2. Analyze deployment logs and errors
3. Check configuration and environment issues
4. Implement immediate fixes or rollback
5. Test resolution in staging environment
6. Document issue and resolution

**Success Criteria**: Deployment issue resolved with prevention measures

**Examples**:
- "troubleshoot auth deployment" → Auth deployment issue resolution
- "fix production API issue" → Production problem diagnosis
- "deployment rollback needed" → Safe rollback execution

## System & Meta

### resolve-handler-void
**Location**: REGISTRY.md#resolve-handler-void  
**Triggers**: "H = VOID", "handler not found", "VOID→registry"  
**Purpose**: ULTRATHINK VOID state resolution  

**Process**:
1. Extract keywords from user request
2. Search REGISTRY for matching handlers
3. Analyze request context and intent
4. Select most appropriate handler
5. Provide handler recommendation with reasoning
6. Execute with found handler

**Success Criteria**: Appropriate handler found and executed

**Examples**:
- User: "make the code better" → Finds `optimize-performance` or `refactor-code`
- User: "help with testing" → Finds `test-implementation`
- User: "database issues" → Finds `debug-error` or `optimize-performance`

### manage-work-context
**Location**: PATTERNS.md#manage-work-context  
**Triggers**: "W = VOID", "context unclear", "VOID→workflows"  
**Purpose**: Work context determination and management  

**Process**:
1. Analyze current session state
2. Check active work folders
3. Determine work context from request
4. Set appropriate work context
5. Initialize context if needed
6. Provide context recommendation

**Success Criteria**: Work context clear and properly set

**Examples**:
- "implementing new feature" → W:implementing
- "debugging production issue" → W:debugging
- "reviewing code changes" → W:reviewing

### enforce-session-standards
**Location**: CONVENTIONS.md#enforce-session-standards  
**Triggers**: "S = VOID", "session unclear", "VOID→conventions"  
**Purpose**: Session ID validation and management  

**Process**:
1. Check SESSION.md for current session
2. Validate session format and date
3. Create new session if needed
4. Update session tracking
5. Ensure proper session documentation
6. Provide session ID for ULTRATHINK

**Success Criteria**: Valid session ID available for tracking

**Examples**:
- Current session: 20250802 → S:20250802
- No session file → Create new session
- Invalid session → Reinitialize properly

### execute-ultrathink
**Location**: PATTERNS.md#execute-ultrathink  
**Triggers**: Automatic on S:W:H:E format detection  
**Purpose**: ULTRATHINK protocol execution and validation  

**Process**:
1. Parse S:W:H:E format components
2. Validate each component
3. Resolve any VOID states
4. Execute with validated components
5. Provide evidence-based execution
6. Update tracking with results

**Success Criteria**: ULTRATHINK executed with all components validated

**Examples**:
- Input: [S:20250802|W:implementing|H:implement-feature|E:5/"Feature complete"]
- Validates session, context, handler, evidence
- Executes implement-feature with tracking

## Error Handling

### Common Error Patterns

| Error | Cause | Resolution |
|-------|-------|------------|
| "Handler not found" | Trigger phrase not in registry | Use more specific language or check REGISTRY.md |
| "VOID state" | Missing context information | System automatically resolves through VOID handlers |
| "Process failed" | Pre-conditions not met | Check pre-conditions and retry |
| "Wrong handler" | Ambiguous request | Clarify intent with more specific language |
| "Context lost" | Session management issue | Use session management handlers |

### Debug Commands

```
# System status
"show available handlers"
"check current session"
"what's my work context?"

# Handler debugging
"find handler for [specific task]"
"why did [handler] not trigger?"
"show me [handler] documentation"

# Context debugging
"what's my current progress?"
"show active work folders"
"resume work on [project]"
```

## Usage Patterns

### Effective Request Patterns

1. **Be Specific**: "implement user authentication" vs "help with auth"
2. **Include Context**: "debug login error in UserService.js" vs "fix bug"
3. **Single Purpose**: "optimize database queries" vs "optimize everything"
4. **Clear Intent**: "search for validation function" vs "find stuff"

### Handler Chaining

Many workflows involve multiple handlers:

```
"implement user profile feature"
→ start-new-work (initialize)
→ implement-feature (TDD development)
→ test-implementation (comprehensive testing)
→ create-docs (documentation)
→ commit-changes (git workflow)
→ update-tracker (progress tracking)
```

### Context Preservation

Handlers automatically preserve context:

- Work folders maintain state
- Session tracking continues across interactions
- Progress is documented in real-time
- Context can be resumed at any time

---

**Total Coverage**: 75/75 handlers documented  
**Last Updated**: 2025-08-02  
**Next Review**: When new handlers are added  

For detailed handler implementation, see the individual template files referenced in the Location field of each handler.
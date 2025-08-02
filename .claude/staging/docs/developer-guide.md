# Claude Code Handler System - Developer Guide

**Version**: 2.0  
**Updated**: 2025-08-02  
**Audience**: Developers extending the handler system  

## Overview

This guide explains how to create, modify, and maintain handlers in the Claude Code template system. The system is built around specialized handlers that respond to specific development scenarios with consistent, documented workflows.

## System Architecture

### Core Components

```
.claude/templates/
├── REGISTRY.md          # Master handler index
├── WORKFLOWS.md         # Development process handlers
├── TOOLS.md             # Tool selection and usage
├── CONVENTIONS.md       # Standards and patterns
├── BEHAVIORS.md         # Automatic enforcement
├── PATTERNS.md          # Meta-routing logic
├── MATRICES.md          # Decision lookup tables
└── USER-GUIDE.md        # End-user documentation
```

### Handler Types

1. **Intent Handlers** - Respond to user requests
2. **Behavioral Templates** - Step-by-step guides
3. **Meta-Routing Patterns** - Request routing logic
4. **Behavioral Hooks** - Automatic enforcement

### Execution Flow

```
User Request → ULTRATHINK → Handler Search → Template Load → Execute → Document
```

## Creating New Handlers

### 1. Handler Structure

Every handler follows this standard format:

```markdown
#### Handler: {handler-name} {#handler-anchor}
**Triggers**: "specific phrases", "user patterns", "keywords"
**Target Pattern**: What this handler addresses
**Pre-conditions**: 
- Requirement 1
- Requirement 2
**Process**:
1. Step one with specific actions
2. Step two with tool usage
3. Step three with validation
4. Step four with documentation
5. Final step with completion criteria
**Success**: Clear success criteria
**Failure**: What to do if process fails
**Examples**:
- "user request" → expected outcome
- "complex request" → detailed result
```

### 2. Handler Documentation Standard

#### Required Fields
- **Handler Name**: Kebab-case, descriptive
- **Anchor**: `{#handler-name}` for linking
- **Triggers**: Exact phrases that activate this handler
- **Target Pattern**: Clear description of what this solves
- **Pre-conditions**: Requirements before execution
- **Process**: Numbered steps with specific actions
- **Success/Failure**: Clear completion criteria
- **Examples**: Real-world usage scenarios

#### Optional Fields
- **Keywords**: For search optimization
- **Related**: Links to related handlers
- **Notes**: Implementation details
- **Tools**: Specific tool requirements

### 3. Implementation Process

#### Step 1: Identify the Need
```markdown
# Handler Need Analysis

## Problem
Users frequently ask for X, but no handler exists

## Current Gaps
- No systematic approach for Y
- Manual process for Z takes too long
- Common request pattern not covered

## Proposed Handler
- Name: new-handler-name
- Triggers: "specific user phrases"
- Location: WORKFLOWS.md (or appropriate template)
```

#### Step 2: Design the Handler
```markdown
# Handler Design: new-handler-name

## Triggers Analysis
- Primary: "main trigger phrase"
- Secondary: "alternative phrases"
- Keywords: [action, object, context]

## Process Flow
1. Input validation
2. Context gathering
3. Core logic execution
4. Output generation
5. Documentation update

## Success Criteria
- Measurable outcome 1
- Measurable outcome 2
- User satisfaction indicator

## Integration Points
- Calls handler A for step 3
- Updates tracker via handler B
- Triggers behavior C automatically
```

#### Step 3: Implement the Handler

1. **Add to appropriate template file**:
   - Core development → `WORKFLOWS.md`
   - File operations → `TOOLS.md`
   - Standards/conventions → `CONVENTIONS.md`
   - Routing logic → `PATTERNS.md`

2. **Follow the standard format exactly**

3. **Test with example requests**

#### Step 4: Register the Handler

Add to `REGISTRY.md` in the appropriate section:

```markdown
#### Handler: `new-handler-name` {#new-handler-name}
- **Triggers**: "primary trigger", "secondary trigger"
- **Keywords**: [action, object, context]
- **Process**: Brief description of what it does
- **Location**: TEMPLATE.md#new-handler-name ✓ ADDED
```

#### Step 5: Update Documentation

1. **Add to USER-GUIDE.md examples**
2. **Update WORKFLOWS.md if it's a new workflow**
3. **Add to MATRICES.md for quick lookup**
4. **Test with real user scenarios**

## Handler Categories and Guidelines

### Core Development Handlers
**Location**: `WORKFLOWS.md`  
**Purpose**: Main development workflows  
**Examples**: implement-feature, fix-problem, test-implementation  

**Guidelines**:
- Always include TDD approach
- Require work tracking documentation
- Integrate with git workflow
- Include validation steps

### Tool Operation Handlers
**Location**: `TOOLS.md`  
**Purpose**: File and tool operations  
**Examples**: edit-file, search-code, commit-changes  

**Guidelines**:
- Specify exact tool to use
- Include safety checks
- Follow file conventions
- Document tool selection rationale

### Convention Handlers
**Location**: `CONVENTIONS.md`  
**Purpose**: Standards and quality checks  
**Examples**: check-code-style, validate-commit-message  

**Guidelines**:
- Enforce existing standards
- Provide clear correction guidance
- Include examples of correct format
- Reference authoritative sources

### Behavioral Hooks
**Location**: `BEHAVIORS.md`  
**Purpose**: Automatic enforcement  
**Examples**: before-file-edit, after-significant-discovery  

**Guidelines**:
- Create "cannot proceed without" gates
- Be invisible to users when working correctly
- Provide clear error messages when triggered
- Document why the behavior exists

## Advanced Handler Patterns

### 1. Delegation Handlers
Handlers that route to other handlers:

```markdown
#### Handler: route-development-request {#route-development-request}
**Process**:
1. Analyze request type
2. Determine complexity
3. Route to specific handler:
   - Simple fix → fix-problem
   - New feature → implement-feature
   - Performance issue → optimize-performance
```

### 2. Composite Handlers
Handlers that execute multiple sub-handlers:

```markdown
#### Handler: complete-feature-development {#complete-feature-development}
**Process**:
1. Execute: implement-feature
2. Execute: test-implementation
3. Execute: create-docs
4. Execute: commit-changes
5. Execute: update-tracker
```

### 3. Context-Aware Handlers
Handlers that adapt based on current state:

```markdown
#### Handler: smart-search {#smart-search}
**Process**:
1. Check current work context
2. If in active development:
   - Priority search in current work files
3. If in debugging mode:
   - Focus on error-related code
4. If in review mode:
   - Emphasize architecture patterns
```

## Quality Assurance

### Handler Testing Checklist

- [ ] Handler responds to all listed triggers
- [ ] Process steps are clear and actionable
- [ ] Success criteria are measurable
- [ ] Failure handling is specified
- [ ] Examples cover common use cases
- [ ] Integration with other handlers works
- [ ] Documentation is automatically updated
- [ ] Registry entry is accurate

### Code Review for Handlers

```markdown
# Handler Review: {handler-name}

## Clarity
- [ ] Purpose is immediately clear
- [ ] Triggers are unambiguous
- [ ] Process steps are actionable

## Completeness
- [ ] All pre-conditions listed
- [ ] Success/failure criteria defined
- [ ] Integration points documented

## Consistency
- [ ] Follows standard format
- [ ] Uses consistent terminology
- [ ] Integrates with existing patterns

## Usability
- [ ] Real-world examples provided
- [ ] Error handling is clear
- [ ] Documentation is sufficient
```

## Maintenance and Evolution

### Monitoring Handler Usage

1. **Track trigger patterns** in session logs
2. **Monitor success/failure rates**
3. **Collect user feedback** on handler effectiveness
4. **Identify gaps** in coverage

### Handler Lifecycle

1. **Creation** - New need identified
2. **Implementation** - Handler developed and tested
3. **Integration** - Added to registry and documentation
4. **Monitoring** - Usage tracked and optimized
5. **Evolution** - Updated based on feedback
6. **Deprecation** - Replaced or merged when obsolete

### Versioning Strategy

- **Major versions** - Significant handler reorganization
- **Minor versions** - New handlers or major updates
- **Patch versions** - Bug fixes and minor improvements

Current version tracking in `REGISTRY.md` header.

## Integration with ULTRATHINK

### VOID State Resolution

Every handler must be findable through the ULTRATHINK system:

```markdown
# ULTRATHINK Integration

## Search Keywords
Ensure handler is findable via:
- Action verbs: implement, fix, search, create
- Object nouns: feature, bug, function, file
- Context terms: error, performance, security

## Evidence Requirements
Handler must provide:
- Step count for E field
- Success criteria for validation
- Measurable outcomes
```

### Behavioral Hook Integration

Handlers should trigger appropriate behaviors:

```markdown
# Behavior Integration

## Pre-execution
- File editing → Check conventions
- Git operations → Validate format
- Work creation → Initialize tracking

## Post-execution  
- Success → Update tracker
- Failure → Document issues
- Discovery → Add to knowledge base
```

## Debugging Handler Issues

### Common Problems

1. **Handler not found**
   - Check trigger phrases in REGISTRY.md
   - Verify handler exists in template file
   - Ensure anchor link is correct

2. **Wrong handler selected**
   - Review trigger specificity
   - Check for keyword conflicts
   - Update trigger phrases for clarity

3. **Process fails**
   - Verify pre-conditions are met
   - Check tool availability
   - Validate file access permissions

### Debug Process

```markdown
# Handler Debug Protocol

1. **Reproduce the issue**
   - Use exact user request
   - Check ULTRATHINK output
   - Verify handler selection

2. **Trace execution**
   - Check each process step
   - Verify tool calls
   - Monitor file operations

3. **Validate assumptions**
   - Confirm pre-conditions
   - Check success criteria
   - Test with minimal case

4. **Fix and test**
   - Update handler definition
   - Test with original request
   - Verify no regression
```

## Best Practices

### Handler Design

1. **Single Responsibility** - Each handler does one thing well
2. **Clear Triggers** - Unambiguous activation phrases
3. **Actionable Steps** - Concrete, executable instructions
4. **Measurable Outcomes** - Verifiable success criteria
5. **Error Handling** - Clear failure recovery

### Implementation

1. **Follow Templates** - Use existing patterns
2. **Test Thoroughly** - Multiple scenarios and edge cases
3. **Document Everything** - Process, rationale, examples
4. **Integrate Cleanly** - Work with existing handlers
5. **Monitor Usage** - Track effectiveness over time

### Maintenance

1. **Regular Review** - Quarterly handler assessment
2. **User Feedback** - Collect and act on input
3. **Performance Monitoring** - Track success rates
4. **Continuous Improvement** - Refine based on usage
5. **Documentation Updates** - Keep examples current

---

**Next Steps**: After reading this guide, see `BUILDING-BETTER.md` for system integration patterns and `WORKFLOWS.md` for existing handler examples.
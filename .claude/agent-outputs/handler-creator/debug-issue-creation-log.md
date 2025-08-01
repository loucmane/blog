# Debug Issue Handler Creation Log

**Date**: 2025-08-01  
**Agent**: handler-creator  
**Task**: Create debug-issue handler

## Handler Summary
- **Name**: Debug Issue
- **ID**: debug-issue  
- **Role**: trigger
- **Domain**: debug
- **Purpose**: Systematically debug issues by collecting error details, analyzing code flow, and identifying root causes

## File Location
**Created**: `/home/loucmane/dev/javascript/MomsBlog/blog/.claude/staging/handlers/triggers/debug/debug-issue.md`

## Key Features
- **4-step systematic process**: Collect details → Search patterns → Analyze flow → Identify cause
- **Evidence-based approach**: Uses multiple tools for thorough investigation
- **Comprehensive trigger coverage**: Handles various debug request patterns
- **Practical examples**: Real-world scenarios with concrete processes
- **Integration points**: Connects with error analysis, code review, and testing

## YAML Frontmatter
```yaml
id: debug-issue
name: Debug Issue
role: trigger
domain: debug
stability: stable
triggers:
  - "debug this"
  - "debug issue" 
  - "why is X failing"
  - "debug error"
  - "help debug"
  - "debug X"
  - "find the problem"
  - "what's wrong with X"
dependencies: []
tools:
  - mcp__serena__search_for_pattern
  - Read
  - Grep
  - Bash
version: 1.0.0
```

## Process Steps
1. **Collect error details** - Gather comprehensive problem information
2. **Search for error patterns** - Use tools to find related code and issues
3. **Analyze code flow** - Trace execution and identify problem areas
4. **Identify root cause** - Systematic diagnosis with evidence

## Integration Points
- **Error Analysis**: Links to log analysis and performance debugging
- **Code Review**: Surfaces quality issues and refactoring opportunities  
- **Testing**: Reveals missing test cases and validates fixes

## Success Criteria Met
✅ Handler created with proper YAML frontmatter  
✅ 4-step systematic debugging process defined  
✅ All required triggers included  
✅ All specified tools integrated  
✅ Comprehensive examples provided  
✅ Integration points documented  
✅ Best practices included

## Usage Example
**User Request**: "debug this - login form is throwing an error"  
**Handler Response**: Would trigger debug-issue handler to:
1. Collect specific error details and reproduction steps
2. Search codebase for login form error patterns
3. Analyze form validation and submission flow
4. Identify root cause (e.g., missing field validation, API endpoint issue)

## Status
**✓ Completed**: debug-issue handler (4 steps) - Handler created successfully with comprehensive debugging workflow
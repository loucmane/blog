# Code Review Handler Creation Log

**Date**: 2025-08-01
**Handler Created**: code-review
**Location**: `.claude/staging/handlers/triggers/analysis/code-review.md`

## Handler Summary
- **Name**: Review Code
- **Role**: trigger
- **Domain**: analysis
- **ID**: code-review

## Key Features
- **Comprehensive Review Process**: 4-step systematic approach
- **Multi-tool Integration**: Uses Read, Serena search, and symbol finding
- **Structured Feedback**: Categorizes issues by severity with specific examples
- **Flexible Input**: Handles file paths, code snippets, and change reviews
- **Quality Focus**: Balances bug detection with code quality assessment

## Process Steps
1. **Read code thoroughly** - Uses all three tools for complete context
2. **Check for bugs/issues** - Logic errors, edge cases, concurrency
3. **Assess code quality** - Structure, naming, complexity, documentation
4. **Provide feedback** - Prioritized, specific, actionable suggestions

## Integration Points
- **Development Workflow**: Integrates with file editing and creation
- **Testing Handlers**: Recommends test coverage improvements
- **Documentation Handlers**: Suggests documentation enhancements

## Trigger Keywords
- "review this code"
- "code review" 
- "check for issues"
- "review my code"

## Tools Used
- `Read` - File access and content analysis
- `mcp__serena__search_for_pattern` - Pattern matching and code search
- `mcp__serena__find_symbol` - Symbol lookup and dependency analysis

## Handler Architecture
- **Role**: trigger (entry point for code review requests)
- **Domain**: analysis (focused on code analysis and quality)
- **Dependencies**: None (self-contained handler)
- **Version**: 1.0.0

## Usage Examples
1. **File Review**: "review this code: src/components/UserAuth.jsx"
2. **Snippet Review**: "code review" with pasted code
3. **Change Review**: "review my code changes"

## Success Criteria
- Complete analysis of provided code
- Clear issue categorization by severity  
- Specific, actionable feedback with examples
- Balanced review of issues and strengths

## Creation Notes
- Handler placed in analysis domain per user requirements
- Used established YAML frontmatter pattern from existing handlers
- Included comprehensive process steps with detailed sub-tasks
- Added integration points with related handler types
- Provided concrete examples for different usage scenarios
- Followed handler naming conventions (kebab-case)
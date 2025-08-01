# Handler Creation Log: explain-code

**Created**: 2025-08-01
**Handler**: explain-code
**Location**: /home/loucmane/dev/javascript/MomsBlog/blog/.claude/staging/handlers/triggers/analysis/explain-code.md

## Creation Summary

### Handler Details
- **ID**: explain-code
- **Name**: Explain Code
- **Role**: trigger
- **Domain**: analysis
- **Stability**: stable

### Specifications Met
✓ **Triggers**: Added all requested triggers plus additional common variations
  - "explain this code"
  - "how does X work"
  - "what does this do"
  - "explain function"
  - "analyze this code"
  - "walk through this code"
  - "break down this code"

✓ **Tools**: Updated to use specified Serena tools
  - Read (for file access)
  - mcp__serena__find_symbol (for symbol location)
  - mcp__serena__get_symbols_overview (for context)

✓ **Process**: Comprehensive 6-step process
  1. Identify code context
  2. Read code context
  3. Analyze functionality
  4. Structure explanation
  5. Provide clear explanation
  6. Offer additional context

### Key Features Added

#### Enhanced Pattern Recognition
- File paths, function names, code snippets
- Scope determination (function vs class vs file)
- Context extraction from user requests

#### Comprehensive Analysis Framework
- Purpose and responsibility identification
- Data flow and control flow mapping
- Algorithm and pattern recognition
- Dependency and side effect analysis

#### Structured Explanation Approach
- High-level purpose first
- Logical section breakdown
- Plain language for technical concepts
- Pattern highlighting and decision explanation

#### Integration Points
- **mcp__serena__find_symbol**: Precise symbol location
- **mcp__serena__get_symbols_overview**: Architectural context
- **Read Tool**: Complete file access

#### Best Practices
- "Why" before "how" explanations
- Concrete examples for abstract concepts
- Trade-off and design decision explanations
- Codebase pattern identification

### Examples Included
1. **Function Explanation**: Authentication function walkthrough
2. **File Overview**: Utility file purpose and structure
3. **Code Snippet**: Logic flow analysis for provided code

### Error Handling
- Code not found scenarios
- Complexity management strategies
- Context insufficiency handling
- Ambiguous request clarification

## Technical Implementation

### YAML Frontmatter
```yaml
id: explain-code
name: Explain Code
role: trigger
domain: analysis
stability: stable
triggers: [7 variations]
dependencies: []
tools: [Read, mcp__serena__find_symbol, mcp__serena__get_symbols_overview]
```

### Process Flow
1. Context identification → 2. Code reading → 3. Functionality analysis → 4. Explanation structuring → 5. Clear presentation → 6. Additional context

### Success Criteria
- User understanding of code purpose
- Complex logic breakdown
- Pattern explanation
- Logical flow comprehension

## File Operations
- **Updated existing file**: /home/loucmane/dev/javascript/MomsBlog/blog/.claude/staging/handlers/triggers/analysis/explain-code.md
- **Applied 3 edits**: Triggers, tools, and complete content replacement
- **Maintained YAML structure**: Proper frontmatter formatting
- **Added comprehensive documentation**: Full handler specification

## Validation
✓ YAML syntax correct
✓ All tool names valid
✓ Process steps numbered and clear
✓ Integration points documented
✓ Examples provided
✓ Error handling included
✓ Best practices outlined

## Next Steps
- Handler is ready for use in staging environment
- Can be tested with code explanation requests
- Integration with existing analysis workflows
- Consider adding to handler registry when validated
# Session 2025-07-21: Template Search Protocol & Anchor Design

## Major Accomplishments

### 1. Template Search Protocol Design
- Created comprehensive DDII design document
- Problem: Claude searches wrong template files, misses critical information
- Example: Missed gac quotation rule leading to broken commit messages
- Solution: Systematic search protocol with mandatory order

### 2. Complete Template Index
Listed all 11 template files:
1. REGISTRY.md - Master index
2. WORKFLOWS.md - Development processes
3. TOOLS.md - Tool selection
4. CONVENTIONS.md - Standards and rules
5. PATTERNS.md - Meta-routing
6. BUILDING-BETTER.md - Integration
7. MATRICES.md - Decision support
8. BEHAVIORS.md - Enforcement hooks
9. HANDLERS.md - Unified view
10. PROJECT-BLOG.md - Project-specific
11. CLAUDE.md - Execution engine

### 3. Line Number Problem Solved
- User insight: Line numbers break with any edit
- Initial solution: Search patterns instead of line numbers
- Evolution: Anchor-based system selected for long-term

### 4. Anchor System Design
- Final approach: Use markdown anchors {#anchor-name}
- Key insight from user: "Why can't you use anchor as search pattern?"
- Implementation: Search for "{#fix-problem}" as unique pattern
- Benefits: Stable references + IDE navigation + existing tools

### 5. Alternative Approaches Preserved

**Automated Index Generation** (for future scaling):
```javascript
// The "correct" engineering solution
// Auto-scan templates, generate index with line numbers
// Run as pre-commit hook or CI job
```

**Search Patterns**: Fallback when anchors not added yet

**Semantic Markers**: For building template frameworks

## Key Design Elements

1. **Mandatory REGISTRY-first search**
2. **Fallback matrix for common patterns**
3. **Handler verification protocol** ("first 10 words")
4. **Cross-reference loading requirements**
5. **Cannot proceed without finding enforcement**

## Common Search Failures Documented
- Wrong keyword variations (gac vs git.*commit)
- Wrong file assumptions
- Incomplete searches
- Context loss

## Critical Decisions
- Start with good design (DDII) before implementation
- Choose long-term solution (anchors) over quick fix
- Preserve alternatives for future needs
- Document all approaches comprehensively

## Ready for Next Session
1. Implement anchor additions to templates
2. Update REGISTRY.md with anchor links
3. Update CLAUDE.md navigation protocol
4. Test with various request types
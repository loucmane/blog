# Living Pattern Catalog

**Real patterns from real code - automatically extracted, quality-scored, and always current.**

## What is the Living Pattern Catalog?

The Living Pattern Catalog is an automated documentation system that extracts actual implementation patterns from our codebase. Unlike static documentation that quickly becomes outdated, this system continuously discovers, analyzes, and documents patterns as they evolve in the code.

## Key Features

### 🎯 Pattern Quality Scoring
Every pattern is evaluated across multiple dimensions:
- **Accessibility**: ARIA compliance, keyboard navigation
- **Performance**: Bundle size, execution time, render cost
- **Maintainability**: Complexity, readability, naming
- **Principle Alignment**: Adherence to TWES guidelines
- **Test Coverage**: Associated test completeness

### 📈 Evolution Tracking
See how patterns change over time:
- Before/after comparisons with visual diffs
- Reasons for changes from commits and PRs
- Migration guides for breaking changes
- Performance improvements documented

### 🕸️ Relationship Mapping
Understand how patterns connect:
- Which patterns work well together
- Historical lineage and evolution
- Alternative approaches for the same problem
- Dependencies and incompatibilities

### ⚠️ Anti-Pattern Detection
Learn from what NOT to do:
- Automatically detected problematic patterns
- Clear explanations of issues
- Recommended solutions with migration paths
- Prevention strategies

### 🎮 Interactive Playground
Experiment with patterns in real-time:
- Live code editor with pattern validation
- Instant preview with quality metrics
- Accessibility and performance feedback
- Export working code

## Quick Start

### Finding Patterns

1. **Browse by Category**
   ```
   /generated/components/     # React component patterns
   /generated/hooks/         # Custom hook patterns
   /generated/providers/     # Context provider patterns
   /generated/styles/        # Styling patterns
   
   # High-confidence patterns from documentation evolution
   /shared-context/discovered-patterns/
   ├── component-conventions.md      # 92% confidence patterns
   ├── performance-code-splitting.tsx # 99 Lighthouse patterns
   └── add-blog-feature-guide.md     # Development workflows
   ```

2. **Search by Quality**
   - High-quality patterns (90+ score)
   - Patterns needing improvement
   - Recently updated patterns

3. **Explore Relationships**
   - View pattern dependency graphs
   - Find alternative implementations
   - Discover pattern combinations

### Understanding Pattern Documentation

Each pattern includes:
- **Quality Score**: Overall rating with breakdown
- **Real Examples**: Actual code from the codebase
- **Usage Statistics**: How often and where it's used
- **Evolution History**: How it changed over time
- **Related Patterns**: What works well with it
- **Anti-Pattern Warnings**: Common mistakes to avoid

## Pattern Quality Explained

### Scoring System (0-100)
- **90-100**: Exemplary - Use as reference
- **80-89**: Good - Safe to use
- **70-79**: Acceptable - Consider improvements
- **Below 70**: Needs work - Use with caution

### Quality Dimensions
1. **Accessibility** 
   - Keyboard navigation support
   - Screen reader compatibility
   - ARIA implementation
   - Focus management

2. **Performance**
   - Bundle size impact
   - Execution time
   - Re-render frequency
   - Memory usage

3. **Maintainability**
   - Code complexity (cyclomatic)
   - Naming consistency
   - Documentation completeness
   - Modularity

4. **Principle Alignment**
   - TWES guideline compliance
   - Design system consistency
   - Best practice adherence
   - Mission alignment

5. **Test Coverage**
   - Unit test coverage
   - Integration test presence
   - Edge case handling
   - Test quality

## How It Works

### Extraction Process
1. **AST Parsing**: Analyzes code structure, not just text
2. **Pattern Detection**: Identifies common implementation patterns
3. **Context Extraction**: Includes imports, types, and usage
4. **Quality Analysis**: Scores each dimension
5. **Documentation Generation**: Creates comprehensive docs

### Update Frequency
- **Real-time**: On significant code changes
- **Daily**: Full pattern quality reassessment
- **Weekly**: Relationship and evolution analysis
- **Monthly**: Anti-pattern detection sweep

### Integration Points
- **Pre-commit**: Validates pattern usage
- **PR Reviews**: Automated pattern feedback
- **IDE**: Real-time pattern suggestions
- **CI/CD**: Pattern compliance checking

## Using Patterns in Your Code

### 1. Find the Right Pattern
```bash
# Search for theme-related patterns
./search-patterns.sh "theme"

# Browse high-quality component patterns
./list-patterns.sh --category=components --min-quality=90
```

### 2. Validate Your Implementation
```typescript
import { validatePattern } from '@patterns/validator';

// Check if your code follows the pattern
const result = await validatePattern(myComponent, 'CompoundComponent');
console.log(result.score, result.suggestions);
```

### 3. Stay Updated
```bash
# Subscribe to pattern changes
./watch-pattern.sh "useTheme" --notify-on-change

# Get migration guide for pattern updates
./get-migration.sh "ThemeProvider" --from=v1 --to=v2
```

## Contributing

### Improving Patterns
1. **Implement** the pattern with high quality
2. **Test** thoroughly including edge cases
3. **Document** with clear comments
4. **Submit** PR with pattern improvements

### Reporting Issues
- Use inline feedback buttons in documentation
- Report incorrect pattern detection
- Suggest missing patterns
- Propose quality metric improvements

## FAQ

### Q: How current is the documentation?
A: Patterns are extracted within 48 hours of code changes. Each pattern shows its "last verified" timestamp.

### Q: Can I trust the quality scores?
A: Quality scores are based on automated analysis and should guide, not dictate, decisions. High scores indicate good practices but always consider your specific context.

### Q: What if I disagree with a pattern?
A: Use the feedback system to discuss alternatives. Patterns evolve based on team consensus and proven results.

### Q: How do I add a new pattern category?
A: See [Contributing Guide](./CONTRIBUTING.md) for adding new extractors and categories.

## Resources

- **[Full Implementation Plan](./living-pattern-catalog-plan.md)** - Detailed technical specification
- **[Strategic Implementation Plan](./strategic-implementation-plan.md)** - Phased approach and timeline
- **[Gemini Enhancement Suggestions](./gemini-enhancement-suggestions.md)** - Advanced features and solutions
- **[Pattern Quality Guide](./guides/quality-metrics.md)** - Understanding scores
- **[Evolution Tracking](./guides/evolution-tracking.md)** - How changes are tracked
- **[Anti-Pattern Guide](./guides/anti-patterns.md)** - Learning from mistakes

## Implementation Timeline

Based on our strategic plan, the Living Pattern Catalog will evolve through four phases:

1. **Weeks 1-4**: The Auditor (MVP) - Basic pattern detection and reporting
2. **Weeks 5-8**: The Advisor - CI integration and quality scoring
3. **Weeks 9-16**: The Assistant - IDE integration and automated refactoring
4. **Weeks 17-24**: The Strategist - Bug correlation and strategic insights

## Status

🚧 **Coming Soon** - This system is currently in planning phase. See the [strategic plan](./strategic-implementation-plan.md) for the phased implementation approach.

---

*The Living Pattern Catalog is part of the Total Workflow Excellence System (TWES), providing real implementation examples that complement principle-based documentation.*
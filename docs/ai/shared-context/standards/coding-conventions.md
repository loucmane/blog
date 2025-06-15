# Coding Conventions

## General Principles

### Code Philosophy
- **Readability First**: Code is read more than written
- **Explicit Over Implicit**: Clear intent over clever tricks
- **Consistency**: Follow existing patterns in the codebase
- **Performance Conscious**: But not premature optimization

### Development Mindset
- Write code as if the person maintaining it is a violent psychopath who knows where you live
- Optimize for change - requirements will evolve
- Make the easy change today that enables the right change tomorrow
- Perfect is the enemy of good - ship iteratively

## Code Style Guidelines

### Naming Conventions
- **Variables**: camelCase for locals, SCREAMING_SNAKE for constants
- **Functions**: camelCase, verb-first (`calculateTotal`, `validateEmail`)
- **Classes/Types**: PascalCase (`UserProfile`, `DonationData`)
- **Files**: See [Codebase Patterns Guide](/docs/ai/shared-context/patterns/codebase-patterns.md#file-and-naming-conventions)
- **Booleans**: Use is/has/should prefix (`isActive`, `hasPermission`, `shouldUpdate`)

### Code Organization
- One concept per file
- Related functionality grouped in directories
- Public API at the top, implementation details below
- Exports at the bottom of the file

### TypeScript Guidelines
- Prefer `interface` for public APIs (extendable)
- Use `type` for internal types, unions, and utilities
- Enable strict mode - no `any` without justification
- Document complex types with JSDoc
- For comprehensive TypeScript patterns, see [Codebase Patterns Guide](/docs/ai/shared-context/patterns/codebase-patterns.md#typescript-patterns)

### Import Rules
- Group imports by category with blank lines between
- Order: React/Next → External → Internal → Relative → Types
- Use absolute imports for app code (`@/components`)
- For detailed import organization, see [Codebase Patterns Guide](/docs/ai/shared-context/patterns/codebase-patterns.md#import-organization)

## Comments and Documentation

### When to Comment
- **WHY** over WHAT - Explain reasoning, not mechanics
- Business logic and domain rules
- Workarounds with issue links
- Performance optimizations
- Complex algorithms

### Documentation Standards
```typescript
/**
 * Calculate donation impact based on regional factors.
 * Uses WHO data for cost-per-life-saved in different regions.
 * 
 * @param amount - Donation in USD
 * @param region - ISO 3166-1 alpha-2 country code
 * @returns Estimated lives impacted
 * @throws {InvalidRegionError} If region is not supported
 * 
 * @example
 * const impact = calculateImpact(100, 'KE'); // Kenya
 * console.log(impact); // { lives: 2.3, duration: '1 month' }
 */
```

### Self-Documenting Code
```typescript
// ✅ Good: Clear without comments
const isEligibleForTaxDeduction = 
  donation.amount >= TAX_DEDUCTION_MINIMUM && 
  donation.country === 'US' && 
  donor.hasProvidedTaxInfo;

// ❌ Bad: Needs comment to understand
const eligible = amt >= 100 && c === 'US' && info;
```

## Git Commit Conventions

### Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

### Types
- `feat`: New feature
- `fix`: Bug fix  
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or modifications
- `chore`: Build process or auxiliary tool changes
- `revert`: Revert previous commit
- `wip`: Work in progress (squash before merging)

### Scope Examples
- `blog`: Blog-related features
- `auth`: Authentication system
- `ui`: UI components
- `api`: API endpoints
- `deps`: Dependencies
- `config`: Configuration files

### Good Commit Messages
```bash
feat(blog): add content sensitivity warnings for rescue stories

Implement three-tier content classification system:
- Level 1: Hope stories (no warning)
- Level 2: Medical content (soft warning)  
- Level 3: Crisis content (strong warning)

Closes #123

fix(donate): prevent duplicate payment submissions

Add loading state and disable submit button during processing.
Show clear success/error messages.

Fixes #456
```

### Pull Request Guidelines
- Clear title summarizing the change
- Description with what/why/how
- Screenshots for UI changes
- Link related issues
- Update documentation if needed

## Code Review Guidelines

### What We Look For
1. **Correctness**: Does it solve the problem?
2. **Clarity**: Is it easy to understand?
3. **Consistency**: Does it follow our patterns?
4. **Performance**: Will it scale?
5. **Security**: Is it safe?
6. **Accessibility**: Is it usable by everyone?

### Review Etiquette  
- Suggest, don't command: "Consider using..." not "Change this to..."
- Explain the why: "This could cause memory leaks because..."
- Praise good patterns: "Nice use of error boundaries here!"
- Offer examples: Show don't just tell
- Be kind: We're all learning

### Common Review Comments
```typescript
// 🟡 Suggestion: Consider memoizing this expensive calculation
const filtered = posts.filter(p => p.category === category);

// 🔴 Issue: Potential null reference - user might be undefined  
return <div>{user.name}</div>;

// 🟢 Nice: Good error handling and user feedback!
try {
  await submitForm(data);
  showSuccess('Saved successfully!');
} catch (error) {
  showError('Failed to save. Please try again.');
}
```

## Best Practices Summary

### The Boy Scout Rule
Leave the code better than you found it. If you touch a file:
- Fix obvious issues
- Update outdated patterns  
- Improve naming
- Add missing types
- BUT keep changes focused - don't refactor the world

### Performance Considerations
- Measure before optimizing
- Optimize for the common case
- Document performance-critical code
- Set performance budgets
- For detailed patterns, see [Codebase Patterns Guide](/docs/ai/shared-context/patterns/codebase-patterns.md#performance-patterns)

### Security Mindset
- Never trust user input
- Validate on both client and server
- Use environment variables for secrets
- Implement proper authentication/authorization
- Regular dependency updates
- For implementation details, see [Development Principles](/docs/ai/shared-context/philosophies/development-principles.md#security-mindset)

### Accessibility First
- Semantic HTML is the foundation
- ARIA only when necessary
- Keyboard navigation for everything
- Test with screen readers
- For patterns, see [Codebase Patterns Guide](/docs/ai/shared-context/patterns/codebase-patterns.md#accessibility-patterns)

### Testing Philosophy
- Test behavior, not implementation
- Write tests that give confidence
- Focus on critical user paths
- For testing patterns, see [Codebase Patterns Guide](/docs/ai/shared-context/patterns/codebase-patterns.md#testing-patterns)

## References

For implementation details and code examples:
- **[Codebase Patterns Guide](/docs/ai/shared-context/patterns/codebase-patterns.md)** - Comprehensive patterns and examples
- **[Development Principles](/docs/ai/shared-context/philosophies/development-principles.md)** - Philosophy and mindset
- **[Performance Standards](/docs/ai/shared-context/standards/performance.md)** - Metrics and budgets
- **[Accessibility Standards](/docs/ai/shared-context/standards/accessibility.md)** - WCAG compliance
# Claude Code Bridge: Complete Feature Implementation

## Use Case
When implementing a full feature from scratch that requires multiple components, tests, and documentation.

## Example Prompt Template

```
Using Claude Code Bridge, implement a complete [FEATURE_NAME] feature:

Requirements:
- [REQUIREMENT 1]
- [REQUIREMENT 2]

Technical specifications:
- Component structure: [DETAILS]
- State management: [APPROACH]
- API integration: [ENDPOINTS]

Quality requirements:
- Full TypeScript types
- Unit tests with >80% coverage
- Storybook stories
- Accessibility WCAG AA compliant
- Performance budget: [METRICS]

Reference existing patterns in: [PATTERN_DOCS]

workFolder: [PROJECT_ROOT]
```

## Real Example

```
Using Claude Code Bridge, implement a complete image gallery with content warnings:

Requirements:
- Display rescue animal photos with proper content warnings
- Support Level 1 (hopeful) and Level 2 (medical) content
- Lazy loading for performance
- Keyboard navigation

Technical specifications:
- Component structure: Compound component pattern
- State management: Local state with Context for preferences
- API integration: /api/images endpoint with filtering

Quality requirements:
- Full TypeScript types
- Tests for warning states and keyboard nav
- Storybook stories for all content levels
- WCAG AA compliant with screen reader support
- LCP < 2.5s on 3G

Reference patterns in: /docs/ai/shared-context/philosophies/content-sensitivity.md

workFolder: /home/user/MomsBlog/blog
```

## When This Excels
- Green-field feature development
- Features requiring 5+ new files
- Complex interactions between components
- Features with specific performance requirements

## Tips
- Break down into logical sub-components
- Specify prop interfaces clearly
- Include error states and edge cases
- Reference design system tokens
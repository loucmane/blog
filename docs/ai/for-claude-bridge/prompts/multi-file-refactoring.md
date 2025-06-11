# Claude Code Bridge: Multi-File Refactoring

## Use Case
When you need to refactor code across multiple files with consistent patterns and maintain relationships between components.

## Example Prompt Template

```
Using Claude Code Bridge, refactor [COMPONENT/FEATURE] across all affected files:

Current issues:
- [ISSUE 1]
- [ISSUE 2]

Refactoring goals:
- [GOAL 1]
- [GOAL 2]

Constraints:
- Maintain backward compatibility
- Follow patterns in /docs/ai/shared-context/patterns/
- Preserve all existing functionality
- Update tests accordingly

workFolder: [PROJECT_ROOT]
```

## Real Example

```
Using Claude Code Bridge, refactor the theme system to use CSS custom properties:

Current issues:
- Theme values hardcoded in multiple components
- No runtime theme switching
- Inconsistent color usage

Refactoring goals:
- Extract all colors to CSS variables
- Implement theme switching without page reload
- Ensure all 4 themes work correctly
- Update components to use semantic color tokens

Constraints:
- Maintain existing theme names (light, dark, contrast, gentle)
- Follow design tokens in /packages/ui/src/styles/tokens.ts
- Ensure no visual regressions
- Update Storybook stories

workFolder: /home/user/MomsBlog/blog
```

## When This Excels
- Refactoring that touches 10+ files
- Maintaining consistency across codebase
- Complex rename operations with import updates
- Pattern migration (class → hooks, etc.)

## Tips
- List all files that might be affected
- Provide clear before/after examples
- Specify testing requirements
- Use grep to find all instances first
# Running Task 7 Through TaskMaster Infinite System

This is a complete example of how to run Task 7 (Layout Components) through the TaskMaster Infinite System.

## Step 1: Preparation

```bash
# Create directory structure
mkdir -p .taskmaster/infinite/example-task-07/{outputs,decisions}

# We've already created:
# - task-07-layout-components-spec.md (the specification)
# - task-07-contract.yaml (the interface contract)
```

## Step 2: Run the Infinite Command

```bash
# From project root
cd /home/loucmane/dev/javascript/MomsBlog/blog

# Run the infinite command
infinite \
  .taskmaster/infinite/example-task-07/task-07-layout-components-spec.md \
  .taskmaster/infinite/example-task-07/outputs \
  5
```

This will:
1. Deploy 5 parallel Sub Agents
2. Each agent receives:
   - The task specification
   - Their specific innovation directive
   - The interface contract
   - All TWES documentation

## Step 3: Expected Outputs

After generation, you'll have:

```
.taskmaster/infinite/example-task-07/outputs/
├── agent-01-performance/
│   ├── src/
│   │   ├── Box.tsx
│   │   ├── Stack.tsx
│   │   ├── Grid.tsx
│   │   └── index.ts
│   ├── tests/
│   ├── rationale.md
│   └── package.json
├── agent-02-dx-master/
│   ├── src/
│   ├── tests/
│   ├── rationale.md
│   └── package.json
├── agent-03-a11y-champion/
│   ├── src/
│   ├── tests/
│   ├── rationale.md
│   └── package.json
├── agent-04-design-system/
│   ├── src/
│   ├── tests/
│   ├── rationale.md
│   └── package.json
└── agent-05-modern-css/
    ├── src/
    ├── tests/
    ├── rationale.md
    └── package.json
```

## Step 4: Automated Scoring

Create and run the scoring script:

```javascript
// score-task-07.js
const implementations = [
  'agent-01-performance',
  'agent-02-dx-master',
  'agent-03-a11y-champion',
  'agent-04-design-system',
  'agent-05-modern-css'
];

// Mock scoring (in reality, this would run actual tests)
const scores = implementations.map(impl => ({
  implementation: impl,
  performance: Math.floor(Math.random() * 20) + 80,
  accessibility: Math.floor(Math.random() * 20) + 80,
  codeQuality: Math.floor(Math.random() * 20) + 80,
  compliance: Math.floor(Math.random() * 20) + 80,
  innovation: Math.floor(Math.random() * 40) + 20,
}));

// Calculate totals
scores.forEach(s => {
  s.total = (
    s.performance * 0.25 +
    s.accessibility * 0.25 +
    s.codeQuality * 0.20 +
    s.compliance * 0.20 +
    s.innovation * 0.10
  );
});

// Sort by total score
scores.sort((a, b) => b.total - a.total);

console.log(JSON.stringify(scores, null, 2));
```

## Step 5: Human Review

Review the top 3 implementations:

### Review Checklist

1. **Read rationale.md for each**
   - Understand their approach
   - Note unique innovations
   - Identify best features

2. **Test the implementations**
   ```bash
   cd .taskmaster/infinite/example-task-07/outputs/agent-01-performance
   pnpm install
   pnpm test
   pnpm build
   ```

3. **Compare APIs**
   - Which has the most intuitive props?
   - Which is most flexible?
   - Which follows React patterns best?

4. **Check performance**
   - Bundle sizes
   - Runtime performance
   - CSS efficiency

## Step 6: Create Decision Record

```markdown
# Decision Record: Task 7 - Layout Components

**Reviewer**: @developer  
**Date**: 2025-01-18  
**Task Goal**: Create flexible, accessible layout components

## Selected Candidates for Synthesis

| Candidate | Key Strengths | Selection Rationale |
|-----------|---------------|---------------------|
| agent-02-dx-master | Best API design, intuitive props | Developers will love using this |
| agent-03-a11y-champion | Perfect accessibility implementation | No compromises on a11y |
| agent-01-performance | Smallest bundle, zero runtime CSS | Meets our performance goals |

## Synthesis Directives

1. **Base Structure**: Use component structure from `agent-02-dx-master`
2. **API Surface**: Implement the exact prop interface from `agent-02-dx-master`
3. **CSS Implementation**: Use the zero-runtime CSS approach from `agent-01-performance`
4. **Accessibility**: Integrate all ARIA and keyboard features from `agent-03-a11y-champion`
5. **TypeScript Types**: Use the comprehensive types from `agent-02-dx-master`

## Rejected Concepts

- agent-04-design-system: Over-abstracted, too complex for our needs
- agent-05-modern-css: Container queries not widely supported yet
```

## Step 7: Run Synthesis

Using the decision record, ask the Synthesis Agent to create the final implementation:

```bash
# The Synthesis Agent will:
# 1. Read the decision record
# 2. Access the selected implementations
# 3. Create a new synthesized version
# 4. Output to: outputs/synthesized/
```

## Step 8: Validate & Integrate

```bash
# Test the synthesized version
cd .taskmaster/infinite/example-task-07/outputs/synthesized
pnpm test
pnpm build

# Check contract compliance
pnpm run validate-contract

# If all passes, copy to project
cp -r src/* ../../../../packages/web/src/components/layout/
```

## Step 9: Document Learnings

Create a pattern document from what we learned:

```markdown
# Layout Component Patterns

## Pattern: Zero-Runtime CSS with DX-First API

Discovered through TaskMaster Infinite System - Task 7

### Context
Need performant layout components with excellent developer experience.

### Solution
- Use CSS Modules for zero-runtime overhead (from agent-01)
- Design intuitive prop APIs that mirror CSS (from agent-02)
- Include comprehensive ARIA attributes (from agent-03)

### Example
```tsx
<Stack gap="md" direction="horizontal" align="center">
  <Box as="section" role="region" aria-label="User info">
    Content
  </Box>
</Stack>
```

### Benefits
- 4KB total bundle size
- No runtime style calculations
- Intuitive for React developers
- Fully accessible by default
```

## Complete Example Output

Here's what one of the agent implementations might look like:

```tsx
// agent-02-dx-master/src/Stack.tsx
import React from 'react';
import { Box, BoxProps } from './Box';
import { SpacingToken, getSpacingValue } from './tokens';
import styles from './Stack.module.css';

export interface StackProps extends BoxProps {
  direction?: 'vertical' | 'horizontal';
  gap?: SpacingToken | number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  divider?: React.ReactElement;
}

export const Stack = React.forwardRef<HTMLElement, StackProps>(
  ({ 
    direction = 'vertical',
    gap = 0,
    align = 'stretch',
    justify = 'start',
    wrap = false,
    divider,
    className,
    children,
    style,
    ...props 
  }, ref) => {
    const gapValue = getSpacingValue(gap);
    
    const stackClasses = [
      styles.stack,
      styles[`direction-${direction}`],
      styles[`align-${align}`],
      styles[`justify-${justify}`],
      wrap && styles.wrap,
      className
    ].filter(Boolean).join(' ');

    const stackStyle = {
      '--stack-gap': gapValue,
      ...style
    } as React.CSSProperties;

    return (
      <Box
        ref={ref}
        className={stackClasses}
        style={stackStyle}
        {...props}
      >
        {divider ? (
          React.Children.toArray(children).map((child, index, array) => (
            <React.Fragment key={index}>
              {child}
              {index < array.length - 1 && divider}
            </React.Fragment>
          ))
        ) : children}
      </Box>
    );
  }
);

Stack.displayName = 'Stack';
```

This example shows how the TaskMaster Infinite System helps explore different implementation approaches and synthesize the best solution for your specific needs.
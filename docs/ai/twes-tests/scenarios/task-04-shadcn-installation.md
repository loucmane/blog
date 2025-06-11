# Test Scenario: Task 4 - shadcn/ui Installation

## Scenario: Install and Configure shadcn/ui
**ID**: TWES-2025-001
**Type**: Basic
**Priority**: High

## Task Description
Install and configure the shadcn/ui component library in the web package with proper theme integration for all 4 themes (light, dark, contrast, gentle). This is a fundamental task that tests understanding of the monorepo structure, design system, and development principles.

### Context
- **Location**: packages/web/
- **Dependencies**: Tasks 2 & 3 (Tailwind CSS and Design System - completed)
- **User Story**: As a developer, I want to use shadcn/ui components so that I can build consistent, accessible interfaces quickly

## Expected Outcomes
1. shadcn/ui initialized in the correct package (web, not ui)
2. Theme tokens properly mapped to CSS variables
3. Essential components installed with performance awareness
4. Components styled according to warm minimalism
5. Documentation created for installed components
6. Accessibility verified to WCAG AA standards

## Success Criteria
- [ ] Identifies monorepo-structure.md to understand package placement
- [ ] Consults warm-minimalism.md for design decisions
- [ ] References four-themes.md for theme system understanding
- [ ] Checks performance.md for bundle size constraints
- [ ] Uses accessibility.md for testing requirements
- [ ] Achieves confidence score >85%
- [ ] Correctly places components in web package, not ui package

## TWES Documents Expected to be Used
- Primary:
  - [ ] shared-context/themes/warm-minimalism.md
  - [ ] shared-context/patterns/monorepo-structure.md
  - [ ] shared-context/standards/accessibility.md
- Secondary:
  - [ ] shared-context/themes/four-themes.md
  - [ ] shared-context/standards/performance.md
  - [ ] shared-context/philosophies/development-principles.md
- Nice to have:
  - [ ] TWES-SYSTEM-MAP.md

## Known Challenges
- Token mapping between warm-minimalism colors and shadcn CSS variables
- Determining which components are "essential"
- Understanding tooling preferences (Storybook vs other docs)
- Interaction state specifications (hover, focus, active)

## Test Prompt
```markdown
You are testing the TWES documentation system. Please simulate (NOT implement) how you would approach Task 4.

**Task**: Install and Configure shadcn/ui Component Library
**Location**: packages/web/
**Dependencies**: Tasks 2 & 3 (completed)

Subtasks:
1. 4.1 Initialization - Initialize shadcn/ui in web package (done)
2. 4.2 Theme Token Configuration - Map to CSS variables (done)
3. 4.3 Component Installation - Install essential components
4. 4.4 Style Customization - Adapt to warm minimalism
5. 4.5 Documentation Setup - Create usage docs
6. 4.6 Accessibility Testing - Verify WCAG AA

TWES documents available at /docs/ai/:
- shared-context/themes/warm-minimalism.md
- shared-context/themes/four-themes.md
- shared-context/standards/performance.md
- shared-context/standards/accessibility.md
- shared-context/patterns/monorepo-structure.md
- shared-context/philosophies/development-principles.md

Your goal:
1. List which TWES docs you'd consult and why
2. Explain key decisions based on those docs
3. Identify any missing information
4. Describe implementation approach
5. Rate confidence level (0-100%)

DO NOT implement anything - just describe your approach.
```

## Evaluation Rubric

### Documentation Usage (40 points)
- Consults warm-minimalism.md: 10 points
- Consults monorepo-structure.md: 10 points
- Consults accessibility.md: 10 points
- References other relevant docs: 10 points

### Decision Making (30 points)
- Correctly identifies web package placement: 10 points
- Shows performance awareness: 5 points
- Aligns with warm minimalism: 10 points
- Plans proper accessibility testing: 5 points

### Gap Identification (20 points)
- Identifies token mapping gap: 10 points
- Notes tooling ambiguity: 5 points
- Finds other genuine gaps: 5 points

### Confidence & Clarity (10 points)
- Provides realistic confidence score: 5 points
- Clear reasoning for score: 5 points

## Notes
This is our baseline test scenario. Success here indicates TWES provides adequate guidance for standard development tasks. The 85% confidence target reflects that some inference is acceptable for experienced developers.
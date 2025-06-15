# Test Scenario: Emergency Appeal Component

## Scenario: Create Urgent Rescue Appeal Component
**ID**: TWES-2025-002
**Type**: Advanced
**Priority**: High

## Task Description
Create a component for emergency animal rescue appeals that balances urgency with trauma-sensitive design. The component must handle sensitive imagery, convey immediate need, and drive donations while respecting viewer emotional well-being.

### Context
- **Location**: packages/web/src/components/
- **Dependencies**: shadcn/ui components, theme system
- **User Story**: As a site visitor, I want to understand urgent rescue needs without being overwhelmed by graphic content

## Expected Outcomes
1. Component with progressive content disclosure
2. Sensitive image handling with blur/warning
3. Clear donation CTA without manipulation
4. Performance optimized for crisis regions
5. Accessible to stressed users
6. Respects all 4 themes appropriately

## Success Criteria
- [ ] References content-sensitivity.md for classification
- [ ] Applies warm-minimalism.md for non-exploitative urgency
- [ ] Uses performance.md for optimization
- [ ] Follows accessibility.md for crisis scenarios
- [ ] Considers four-themes.md for gentle theme adaptation
- [ ] Achieves confidence score >80%
- [ ] Balances mission urgency with user care

## TWES Documents Expected to be Used
- Primary:
  - [ ] shared-context/philosophies/content-sensitivity.md
  - [ ] shared-context/themes/warm-minimalism.md
  - [ ] shared-context/standards/performance.md
- Secondary:
  - [ ] shared-context/standards/accessibility.md
  - [ ] shared-context/themes/four-themes.md
  - [ ] shared-context/patterns/common-patterns.md
- Nice to have:
  - [ ] shared-context/philosophies/development-principles.md

## Known Challenges
- No specific pattern for sensitive image handling
- Balancing urgency with trauma-informed design
- Analytics/tracking for donation conversion
- Progressive disclosure implementation details
- Network-aware image loading strategy

## Test Prompt
```markdown
You are testing the TWES documentation system. Please simulate (NOT implement) how you would approach creating an Emergency Appeal Component.

**Task**: Create a component for emergency animal rescue appeals
**Requirements**:
- Handle Level 2 content (medical/rescue requiring warnings)
- Convey urgency without exploitation
- Drive donations ethically
- Work on 2G connections in crisis regions
- Accessible to stressed/emotional users

TWES documents available at /docs/ai/:
- shared-context/philosophies/content-sensitivity.md
- shared-context/themes/warm-minimalism.md
- shared-context/themes/four-themes.md
- shared-context/standards/performance.md
- shared-context/standards/accessibility.md
- shared-context/patterns/common-patterns.md
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
- Consults content-sensitivity.md: 15 points
- References warm-minimalism.md: 10 points
- Checks performance standards: 10 points
- Uses other relevant docs: 5 points

### Decision Making (30 points)
- Trauma-informed design choices: 10 points
- Performance optimization strategy: 10 points
- Ethical urgency approach: 10 points

### Gap Identification (20 points)
- Identifies missing patterns: 10 points
- Notes process gaps: 10 points

### Confidence & Clarity (10 points)
- Realistic confidence score: 5 points
- Clear reasoning: 5 points

## Notes
This tests TWES guidance for emotionally complex features requiring balance between mission needs and user well-being. Success indicates TWES can guide ethical, effective development.
# Test Scenario: Performance Optimization

## Scenario: Fix Slow Loading for Rural Users
**ID**: TWES-2025-003
**Type**: Advanced
**Priority**: High

## Task Description
The site is loading slowly for animal welfare workers in rural Kenya on 2G connections. Analytics show 8-second load times causing 70% bounce rate. Optimize the entire application to meet performance standards while maintaining functionality.

### Context
- **Location**: Entire web package
- **Dependencies**: Current implementation, analytics data
- **User Story**: As a field worker on limited connectivity, I need fast access to rescue resources and reporting tools

## Expected Outcomes
1. Achieve <1.2s LCP on 3G connections
2. Reduce initial JS bundle to <100KB
3. Implement progressive enhancement
4. Optimize images for slow connections
5. Add offline capabilities for critical features
6. Maintain full accessibility

## Success Criteria
- [ ] Consults performance.md for specific metrics
- [ ] References accessibility.md for inclusive performance
- [ ] Considers content-sensitivity.md for image optimization
- [ ] Applies development-principles.md for approach
- [ ] Checks monorepo-structure.md for build optimization
- [ ] Achieves confidence score >75%
- [ ] Proposes measurable improvements

## TWES Documents Expected to be Used
- Primary:
  - [ ] shared-context/standards/performance.md
  - [ ] shared-context/standards/accessibility.md
  - [ ] shared-context/philosophies/development-principles.md
- Secondary:
  - [ ] shared-context/philosophies/content-sensitivity.md
  - [ ] shared-context/patterns/monorepo-structure.md
  - [ ] shared-context/patterns/common-patterns.md
- Nice to have:
  - [ ] shared-context/themes/warm-minimalism.md

## Known Challenges
- No specific performance optimization patterns
- Missing third-party script policy
- No image optimization guidelines
- Unclear prioritization for competing metrics
- No offline-first patterns documented

## Test Prompt
```markdown
You are testing the TWES documentation system. Please simulate (NOT implement) how you would approach this performance optimization task.

**Task**: Fix slow loading for rural users on 2G connections
**Current State**:
- 8-second load time on 2G
- 70% bounce rate
- Users primarily in rural Kenya
- Critical for emergency response

**Target Metrics**:
- LCP <1.2s on 3G
- Initial JS <100KB
- Meaningful paint <3s on 2G

TWES documents available at /docs/ai/:
- shared-context/standards/performance.md
- shared-context/standards/accessibility.md
- shared-context/philosophies/development-principles.md
- shared-context/philosophies/content-sensitivity.md
- shared-context/patterns/monorepo-structure.md
- shared-context/patterns/common-patterns.md

Your goal:
1. List which TWES docs you'd consult and why
2. Explain optimization strategy based on docs
3. Identify any missing guidance
4. Describe implementation approach
5. Rate confidence level (0-100%)

DO NOT implement anything - just describe your approach.
```

## Evaluation Rubric

### Documentation Usage (40 points)
- Uses performance.md metrics: 15 points
- Considers accessibility impact: 10 points
- References principles appropriately: 10 points
- Finds relevant patterns: 5 points

### Decision Making (30 points)
- Prioritizes based on impact: 10 points
- Considers user context: 10 points
- Balances tradeoffs: 10 points

### Gap Identification (20 points)
- Notes missing optimization patterns: 10 points
- Identifies tool/process gaps: 10 points

### Confidence & Clarity (10 points)
- Appropriate confidence level: 5 points
- Clear explanation: 5 points

## Notes
This scenario tests TWES guidance for critical performance work affecting the mission. The global user base with limited connectivity is a core use case that should be well-supported by documentation.
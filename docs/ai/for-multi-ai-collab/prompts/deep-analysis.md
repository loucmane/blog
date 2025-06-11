# Multi-AI Collaboration: Deep Analysis Prompts

## Use Case
Leveraging Gemini's extended reasoning capabilities for complex analysis, architecture decisions, and strategic planning.

## Example Prompt Template

```
Analyze [TOPIC] in depth:

Current situation:
- [CONTEXT 1]
- [CONTEXT 2]

Key questions:
1. [DEEP QUESTION 1]
2. [DEEP QUESTION 2]

Consider:
- [CONSTRAINT 1]
- [CONSTRAINT 2]

Please think through this systematically and provide comprehensive insights.
```

## Real Examples

### Example 1: System Architecture Analysis
```
Analyze our transition from monolith to microservices:

Current situation:
- 50K lines monolithic Next.js app
- 5-person development team  
- 10K daily active users
- Deployment takes 45 minutes
- Testing is becoming difficult

Key questions:
1. Should we go full microservices or modular monolith?
2. Which boundaries make sense for our domain?
3. How do we handle shared data and transactions?
4. What's the migration path with minimal disruption?

Consider:
- Small team size
- Limited DevOps experience
- Need for rapid feature delivery
- Current hosting on Vercel

Think through the trade-offs systematically.
```

### Example 2: Performance Strategy Analysis
```
Deep dive into our performance optimization strategy:

Current metrics:
- LCP: 4.2s on 3G (target: <2.5s)
- Bundle size: 450KB (target: <200KB)
- TTI: 8s on low-end devices
- 60% of users on mobile/2G/3G

Constraints:
- Rich media content (animal photos/videos)
- Real-time features (donation tracker)
- Offline support requirement
- 4-theme system adding CSS weight

Analyze:
1. What's the highest impact optimization path?
2. How do we balance features vs. performance?
3. Should we build separate mobile experience?
4. What can we defer or make optional?

I need a systematic approach, not just a list of optimizations.
```

### Example 3: Technical Debt Strategy
```
Analyze our technical debt and create a remediation strategy:

Current debt inventory:
- No tests for 40% of components
- Inconsistent state management (Context + Redux + local)
- Mix of CSS modules, styled-components, and Tailwind
- Outdated dependencies (React 17, Next 12)
- Poor TypeScript coverage (any types everywhere)

Business context:
- Need to ship new features monthly
- Limited budget for refactoring
- Team of 3 developers
- High user expectations for stability

Questions:
1. What debt is actively hurting us vs. just "messy"?
2. How do we refactor while shipping features?
3. What's the optimal order of addressing debt?
4. How do we prevent regression?

Think about this as a product manager would - ROI focused.
```

## Complex Decision Analysis

### Build vs. Buy Analysis
```
Analyze whether to build or buy our content management system:

Requirements:
- Multi-language content (15 languages)
- Approval workflows for sensitive content
- Image optimization and CDN
- Version control and rollback
- API for mobile apps
- Offline editing capability

Current situation:
- Using markdown files in Git
- Developers handle all content updates
- No non-technical user access
- 200+ content pieces, growing 20/month

Options considered:
1. Build custom with Next.js + Postgres
2. Headless CMS (Strapi, Directus)
3. Enterprise CMS (Contentful, Sanity)
4. Static site generator enhancement

Analyze deeply:
- Total cost of ownership over 3 years
- Developer time investment
- Flexibility vs. maintenance burden
- Risk factors for each option
```

### Scaling Strategy Analysis
```
Analyze our path to scale from 10K to 1M users:

Current architecture:
- Next.js on Vercel
- Postgres on Supabase
- Images on Cloudinary
- Real-time via WebSockets

Scaling concerns:
- Database connection limits
- Real-time message broadcasting
- Image storage costs
- API rate limiting
- Session management

Deep dive into:
1. What breaks first and at what scale?
2. Incremental vs. revolutionary architecture changes?
3. Cost implications of different scaling strategies?
4. How to maintain developer velocity while scaling?
5. Global distribution strategy?
```

## Strategic Planning Analysis

### Feature Priority Matrix
```
Analyze our feature roadmap for maximum impact:

Proposed features:
1. AI-powered content recommendations
2. Native mobile apps
3. Volunteer marketplace
4. Blockchain donation tracking
5. Virtual reality shelter tours
6. Gamification system
7. Advanced analytics dashboard

Evaluation criteria:
- User value (donors, volunteers, staff)
- Technical complexity
- Resource requirements
- Mission alignment
- Competitive differentiation

Provide deep analysis on:
- Which 3 features to prioritize and why
- Hidden complexities in each feature
- Opportunity costs of choices
- How features might combine or conflict
```

## Tips for Deep Analysis Prompts

### 1. Provide Rich Context
- Current state details
- Historical decisions
- Failed attempts
- Team dynamics

### 2. Ask for Reasoning
- "Walk me through your thinking"
- "What assumptions are you making?"
- "What could invalidate this analysis?"

### 3. Request Frameworks
- "Provide a decision matrix"
- "Create evaluation criteria"
- "Build a phased approach"

### 4. Challenge the Analysis
```
Follow-up: "You recommended microservices, but:
- What if our team shrinks to 2 people?
- What if we need to ship 2x faster?
- What specific problems are we solving?
Can you revisit with these constraints?"
```

## Leveraging Deep Analysis Results

### Creating Action Plans
```
Based on your analysis of our tech debt:
1. Create a 90-day action plan
2. Define measurable success metrics
3. Identify quick wins for team morale
4. Set up feedback loops
```

### Validating Recommendations
```
You suggested a modular monolith. Let's validate:
1. What would a proof of concept look like?
2. What are signs we're on the right track?
3. When should we pivot if it's not working?
```

Remember: Gemini's deep analysis shines when you need systematic thinking about complex, multi-faceted problems. Use it for strategic decisions that will impact your project for months or years.
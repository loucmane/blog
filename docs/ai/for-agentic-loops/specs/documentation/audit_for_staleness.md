# Documentation Staleness Auditor Specification

## Core Challenge
Identify outdated documentation by correlating docs with code changes, tracking modification patterns, and generating prioritized update lists. Prevent documentation decay by proactively flagging content that no longer matches implementation reality.

## The Staleness Problem
Documentation becomes outdated when:
- Code changes without corresponding doc updates
- APIs evolve but examples remain static
- Best practices change but guides don't reflect them
- Dependencies update breaking documented approaches
- Features are deprecated but docs remain

## Output Requirements

**Output Type**: File Set (multiple interconnected files)

**Directory Structure**:
```
/docs/evolution/staleness/v[iteration_number]/
├── staleness-report.md          # Executive summary
├── analysis/                    # Detailed findings
│   ├── critical-stale.json     # Docs needing immediate update
│   ├── aging-content.json      # Docs approaching staleness
│   ├── code-drift.json         # Code vs doc discrepancies
│   ├── broken-examples.json    # Non-working code samples
│   └── api-changes.json        # API evolution tracking
├── correlations/               # Code-to-doc mappings
│   ├── file-mappings.json      # Which docs cover which code
│   ├── change-history.json     # Recent code changes
│   ├── doc-coverage.json       # What code lacks docs
│   └── author-tracking.json    # Who changed what when
├── priorities/                 # Update prioritization
│   ├── update-queue.md         # Ordered list of updates
│   ├── effort-estimates.json   # Time to update each doc
│   ├── impact-analysis.json    # Effect of staleness
│   └── quick-wins.md           # Easy updates for momentum
├── validation/                 # Automated checks
│   ├── example-tests.ts        # Test all code examples
│   ├── link-checker.json       # Broken link report
│   ├── api-validator.ts        # Verify API signatures
│   └── screenshot-check.json   # UI screenshot freshness
└── recommendations/            # Improvement suggestions
    ├── automation-plan.md      # How to prevent staleness
    ├── doc-standards.md        # Standards to maintain
    ├── ci-integration.md       # Automated freshness checks
    └── team-process.md         # Human review processes
```

## Staleness Detection Strategies

### 1. Git History Analysis
```typescript
interface GitAnalyzer {
  // Find code changes without doc updates
  findUndocumentedChanges(since: Date): Change[];
  
  // Track file modification patterns
  analyzeChangeFrequency(file: string): ChangePattern;
  
  // Identify hot spots needing attention
  findHighChurnAreas(): HotSpot[];
  
  // Correlate commits to doc updates
  trackDocumentationLag(): LagMetrics;
}

interface Change {
  file: string;
  commit: string;
  date: Date;
  author: string;
  relatedDocs: string[];
  documented: boolean;
  severity: 'breaking' | 'major' | 'minor' | 'patch';
}
```

### 2. Content Age Scoring
```typescript
interface AgeScorer {
  // Calculate documentation age
  calculateAge(doc: Document): Age;
  
  // Factor in related code changes
  adjustForCodeChurn(age: Age, changes: Change[]): AdjustedAge;
  
  // Consider dependency updates
  factorDependencies(age: Age, deps: Dependency[]): FinalAge;
  
  // Generate staleness score
  computeStaleness(age: FinalAge): StalenessScore;
}

interface StalenessScore {
  score: number; // 0-100 (0=fresh, 100=critical)
  factors: {
    documentAge: number;      // Days since last update
    codeChurn: number;       // Related code changes
    dependencyShift: number; // Package version changes
    apiDrift: number;        // API signature changes
    exampleFailure: number;  // Broken examples
  };
  category: 'fresh' | 'aging' | 'stale' | 'critical';
  recommendation: 'monitor' | 'plan' | 'update' | 'urgent';
}
```

### 3. Example Code Validation
```typescript
interface ExampleValidator {
  // Extract code examples from docs
  extractExamples(doc: Document): Example[];
  
  // Test examples in isolation
  validateExamples(examples: Example[]): ValidationResult[];
  
  // Check against current APIs
  verifyApiUsage(example: Example): ApiCheck;
  
  // Ensure best practices
  checkBestPractices(example: Example): PracticeViolation[];
}

// Example validation
validateExample(`
  // From docs/components/Button.md
  import { Button } from '@/components/ui/button';
  
  <Button variant="default" size="sm">
    Click me
  </Button>
`) => {
  valid: false,
  errors: [
    "Property 'variant' expects 'primary' | 'secondary', got 'default'",
    "Missing required prop 'onClick'"
  ],
  warnings: [
    "Size 'sm' is deprecated, use 'small'"
  ]
}
```

### 4. API Evolution Tracking
```typescript
interface ApiTracker {
  // Compare current vs documented APIs
  compareApiSignatures(): ApiDiff[];
  
  // Track deprecations
  findDeprecatedUsage(): Deprecation[];
  
  // Identify new undocumented APIs
  findUndocumentedApis(): NewApi[];
  
  // Check breaking changes
  detectBreakingChanges(): BreakingChange[];
}
```

## File Set Templates

### 1. Staleness Report (`staleness-report.md`)
```markdown
# Documentation Staleness Report v[iteration]

## 📊 Executive Summary
- **Total Docs Analyzed**: [count]
- **Critical Updates Needed**: [count] (🔴)
- **Aging Content**: [count] (🟡)
- **Fresh Content**: [count] (🟢)
- **Estimated Update Effort**: [hours]

## 🚨 Critical Issues
### Broken Examples
- [count] code examples fail to compile/run
- Most affected: [top 3 docs]
- Common issues: API changes, import paths, deprecated methods

### Severe Drift
- [count] docs severely out of sync with code
- Worst offenders:
  1. `components/DataTable.md` - 89% drift (47 days behind)
  2. `guides/authentication.md` - 76% drift (34 days behind)
  3. `api/hooks.md` - 71% drift (28 days behind)

## 📈 Staleness Trends
```chart
Age Distribution:
Fresh (<7 days)     ████████ 32%
Recent (7-30 days)  ████████████ 45%
Aging (30-90 days)  ██████ 18%
Stale (>90 days)    ██ 5%
```

## 🎯 Priority Actions
1. **Fix Broken Examples** (2 hours)
   - 12 examples in critical paths
   - Blocks new developer onboarding
   
2. **Update API Docs** (4 hours)
   - 23 changed signatures
   - 8 new undocumented methods
   
3. **Refresh Performance Guide** (1 hour)
   - Lighthouse v11 changes
   - New Next.js 15 features

## 📋 Quick Wins
- Update import paths (15 min)
- Fix TypeScript examples (30 min)
- Update dependency versions (20 min)
```

### 2. Critical Stale Analysis (`analysis/critical-stale.json`)
```json
{
  "generated": "2024-01-20T10:30:00Z",
  "criteria": {
    "score_threshold": 80,
    "age_days": 90,
    "code_changes": 10,
    "broken_examples": true
  },
  "critical_docs": [
    {
      "path": "docs/components/DataTable.md",
      "staleness_score": 89,
      "last_updated": "2023-10-15",
      "related_code_changes": 47,
      "broken_examples": 3,
      "reasons": [
        "API completely redesigned in PR #234",
        "Props interface changed",
        "Examples use old import path"
      ],
      "update_effort_hours": 2,
      "impact": {
        "page_views": 1250,
        "help_requests": 23,
        "developer_friction": "high"
      },
      "suggested_updates": [
        "Update all examples to new API",
        "Document migration path",
        "Add deprecation warnings"
      ]
    }
  ]
}
```

### 3. Update Queue (`priorities/update-queue.md`)
```markdown
# Documentation Update Queue

## 🔴 Urgent (This Week)
### 1. Authentication Guide
- **Why**: Security API changed, old approach vulnerable
- **Effort**: 3 hours
- **Owner**: Suggested: @security-team
- **Changes Needed**:
  - Update to new auth flow
  - Remove deprecated methods
  - Add security warnings

### 2. Component Examples
- **Why**: 12 broken examples blocking onboarding
- **Effort**: 2 hours
- **Owner**: Suggested: @frontend-team
- **Batch Update**:
  - Fix imports (30 min)
  - Update props (45 min)
  - Test all examples (45 min)

## 🟡 Important (Next Sprint)
### 3. Performance Optimization Guide
- **Why**: Lighthouse v11, Next.js 15 changes
- **Effort**: 4 hours
- **Dependencies**: Need benchmarks from #456

### 4. API Reference
- **Why**: 23 undocumented methods
- **Effort**: 6 hours
- **Can parallelize**: 3 developers @ 2 hours each

## 🟢 Planned (Backlog)
### 5. Best Practices
- Minor updates to match new patterns
- Can batch with next major update

## 📊 Metrics
- Total effort: 24 hours
- If parallelized: 8 hours (3 developers)
- ROI: Reduces support tickets by ~40%
```

### 4. Automation Plan (`recommendations/automation-plan.md`)
```markdown
# Preventing Documentation Staleness

## 🤖 Automated Checks

### 1. PR Validation
```yaml
# .github/workflows/doc-freshness.yml
on: pull_request
jobs:
  doc-check:
    - name: Check for doc updates
      run: |
        # If code changes, require doc updates
        if changes_in('src/') && !changes_in('docs/')
          then require_doc_update()
    
    - name: Validate examples
      run: npm run test:examples
    
    - name: Check API alignment
      run: npm run docs:api-check
```

### 2. Weekly Staleness Report
```typescript
// scripts/staleness-check.ts
schedule.weekly(() => {
  const report = await auditStaleness();
  
  if (report.critical.length > 0) {
    await notifyTeam(report.critical);
    await createJiraTickets(report.critical);
  }
  
  await updateDashboard(report);
});
```

### 3. Example Testing
```typescript
// tests/doc-examples.test.ts
describe('Documentation Examples', () => {
  const examples = extractAllExamples('./docs');
  
  examples.forEach(example => {
    it(`should run: ${example.source}`, async () => {
      const result = await compileAndRun(example);
      expect(result.success).toBe(true);
    });
  });
});
```

## 🧠 Smart Detection

### 1. Change Correlation
- Track which files typically change together
- Suggest doc updates when patterns detected
- Learn from historical update patterns

### 2. Usage Analytics
- Monitor which docs get viewed after code changes
- Track search queries indicating missing docs
- Identify confusion patterns

### 3. Dependency Tracking
- Watch package.json for major updates
- Flag docs that reference old versions
- Suggest migration guide creation
```

## Evolution Stages

### Stage 1: Manual Audit
- Run staleness checks on demand
- Generate static reports
- Manual prioritization
- Basic age tracking

### Stage 2: Automated Detection
- Scheduled staleness checks
- Git integration for change tracking
- Automated example testing
- Priority queue generation

### Stage 3: Proactive Prevention
- PR-blocking for undocumented changes
- Real-time staleness monitoring
- Auto-generated update PRs
- Team notifications

### Stage 4: Intelligent Maintenance
- ML-based staleness prediction
- Auto-update simple cases
- Context-aware prioritization
- Cross-team coordination

### Stage 5: Self-Healing Docs
- Auto-update from code changes
- Generate docs from tests
- Version-aware documentation
- Zero-staleness achievement

## Staleness Metrics

### Detection Accuracy
```yaml
metrics:
  false_positives: < 5%  # Flagged fresh content
  false_negatives: < 10% # Missed stale content
  detection_lag: < 7 days # Time to identify
  
tracking:
  - Document age distribution
  - Update frequency patterns
  - Code-to-doc correlation
  - Example validity rate
```

### Update Velocity
```yaml
velocity:
  identification_time: < 1 hour
  prioritization_time: < 30 min
  update_completion: < 1 week for critical
  
efficiency:
  - Batch update success
  - Automation percentage
  - Developer time saved
```

## Blog-Specific Staleness Patterns

### Content Management
- MDX component changes
- Image optimization updates
- Content schema evolution
- Meta tag requirements

### Performance Standards
- Lighthouse score changes
- Web Vitals updates
- Build tool updates
- CDN configuration

### Framework Updates
- Next.js version changes
- React new features
- Package vulnerabilities
- Breaking changes

## Integration Points

### 1. CI/CD Pipeline
```yaml
- stage: documentation
  jobs:
    - staleness-check
    - example-validation
    - api-verification
    - link-checking
```

### 2. Development Workflow
```bash
# Pre-commit hook
git hook: check-doc-staleness --changed-files

# PR template
- [ ] Documentation updated if needed
- [ ] Examples tested
- [ ] API docs current
```

### 3. Monitoring Dashboard
```typescript
interface StalenessDashboard {
  overview: {
    totalDocs: number;
    staleCount: number;
    averageAge: number;
    updateVelocity: number;
  };
  
  trends: {
    staleness: TrendLine;
    updates: TrendLine;
    automation: TrendLine;
  };
  
  alerts: Alert[];
  queue: UpdateTask[];
}
```

## Success Criteria

### Staleness Reduction
- 90% of docs < 30 days from related code
- Zero broken examples in production
- All APIs documented within 1 week
- Update lag < 7 days average

### Process Improvement
- 80% staleness caught automatically
- 60% updates completed same sprint
- 50% reduction in "outdated doc" issues
- 90% developer satisfaction

### Automation Success
- PR checks catch 95% of issues
- Auto-updates handle 30% of cases
- Zero critical staleness > 14 days
- Proactive updates before complaints

Generate comprehensive staleness audits that identify outdated documentation, prioritize updates effectively, and establish sustainable maintenance practices.
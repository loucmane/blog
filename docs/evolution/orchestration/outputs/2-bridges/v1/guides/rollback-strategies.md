# Rollback Strategies Guide

## Overview
This guide provides comprehensive rollback strategies for safely reverting changes if issues arise during or after migration to bridge standards.

## Pre-Migration Preparation

### 1. Backup Strategy
```bash
#!/bin/bash
# backup-before-migration.sh

# Create timestamped backup
BACKUP_DIR="backups/pre-migration-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup source code
cp -r src/ $BACKUP_DIR/src/
cp -r packages/ $BACKUP_DIR/packages/

# Backup configurations
cp package.json $BACKUP_DIR/
cp tsconfig.json $BACKUP_DIR/
cp next.config.js $BACKUP_DIR/

# Create restore script
cat > $BACKUP_DIR/restore.sh << 'EOF'
#!/bin/bash
echo "Restoring from backup..."
cp -r src/ ../../
cp -r packages/ ../../
cp package.json ../../
cp tsconfig.json ../../
cp next.config.js ../../
echo "Restore complete. Run 'pnpm install' to restore dependencies."
EOF

chmod +x $BACKUP_DIR/restore.sh
echo "Backup created at: $BACKUP_DIR"
```

### 2. Git Strategy
```bash
# Create migration branch
git checkout -b migration/bridge-standards
git push -u origin migration/bridge-standards

# Tag pre-migration state
git tag -a pre-bridge-migration -m "State before bridge standards migration"
git push origin pre-bridge-migration
```

### 3. Feature Flags Setup
```typescript
// lib/feature-flags.ts
export const featureFlags = {
  useBridgeStandards: process.env.NEXT_PUBLIC_USE_BRIDGE_STANDARDS === 'true',
  useNewAccessibility: process.env.NEXT_PUBLIC_NEW_ACCESSIBILITY === 'true',
  usePerformanceOptimizations: process.env.NEXT_PUBLIC_PERF_OPTS === 'true',
  useContentSensitivity: process.env.NEXT_PUBLIC_CONTENT_SENSITIVITY === 'true',
}

// Component usage
export const Header = () => {
  if (featureFlags.useBridgeStandards) {
    return <HeaderWithBridgeStandards />
  }
  return <LegacyHeader />
}
```

## Rollback Levels

### Level 1: Component-Level Rollback
For isolated component issues:

```typescript
// components/SafeComponent.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { featureFlags } from '@/lib/feature-flags'

export const SafeComponent = (props) => {
  const Component = featureFlags.useBridgeStandards 
    ? NewBridgeComponent 
    : LegacyComponent

  return (
    <ErrorBoundary fallback={<LegacyComponent {...props} />}>
      <Component {...props} />
    </ErrorBoundary>
  )
}
```

### Level 2: Feature-Level Rollback
For entire feature areas:

```typescript
// middleware.ts
import { NextResponse } from 'next/server'

export function middleware(request) {
  const rollbackFeatures = process.env.ROLLBACK_FEATURES?.split(',') || []
  
  if (rollbackFeatures.includes('blog') && request.nextUrl.pathname.startsWith('/blog')) {
    // Redirect to legacy blog
    return NextResponse.redirect(new URL('/legacy/blog', request.url))
  }
  
  return NextResponse.next()
}
```

### Level 3: Full Application Rollback
For critical system-wide issues:

```bash
#!/bin/bash
# emergency-rollback.sh

echo "🚨 Emergency Rollback Initiated"

# 1. Revert to tagged version
git fetch origin
git checkout pre-bridge-migration

# 2. Clear build artifacts
rm -rf .next/
rm -rf node_modules/

# 3. Restore dependencies
pnpm install

# 4. Restore environment
cp .env.backup .env

# 5. Deploy legacy version
pnpm build
pnpm deploy:emergency

echo "✅ Rollback complete"
```

## Rollback Procedures

### 1. Immediate Response (0-5 minutes)
```typescript
// Quick feature flag toggle
// env.production
NEXT_PUBLIC_USE_BRIDGE_STANDARDS=false
NEXT_PUBLIC_ROLLBACK_MODE=true

// Deploy immediately
pnpm deploy:hotfix
```

### 2. Partial Rollback (5-30 minutes)
```typescript
// rollback-config.ts
export const rollbackConfig = {
  components: {
    Header: false,
    BlogPost: false,
    Navigation: true, // Keep this updated
  },
  features: {
    accessibility: false,
    performance: true, // Keep optimizations
    contentSensitivity: false,
  }
}

// Dynamic component loader
export const loadComponent = (name: string) => {
  if (rollbackConfig.components[name] === false) {
    return import(`./legacy/${name}`)
  }
  return import(`./components/${name}`)
}
```

### 3. Staged Rollback (30+ minutes)
```yaml
# rollback-stages.yml
stages:
  - name: "Critical Components"
    duration: "10m"
    rollback:
      - Header
      - Navigation
      - ErrorBoundary
    
  - name: "Content Display"
    duration: "20m"
    rollback:
      - BlogPost
      - Gallery
      - MediaPlayer
    
  - name: "Interactive Features"
    duration: "30m"
    rollback:
      - Forms
      - Comments
      - Search
```

## Monitoring During Rollback

### 1. Health Checks
```typescript
// api/health/rollback-status.ts
export async function GET() {
  const status = {
    rollbackActive: process.env.ROLLBACK_MODE === 'true',
    affectedComponents: getRollbackComponents(),
    metrics: {
      errorRate: await getErrorRate(),
      responseTime: await getAvgResponseTime(),
      userReports: await getUserReports(),
    },
    startTime: process.env.ROLLBACK_START_TIME,
  }
  
  return Response.json(status)
}
```

### 2. User Communication
```typescript
// components/RollbackBanner.tsx
export const RollbackBanner = () => {
  if (!isRollbackMode()) return null
  
  return (
    <Alert variant="warning" className="rollback-banner">
      <AlertTitle>Temporary Service Adjustment</AlertTitle>
      <AlertDescription>
        We're temporarily using a previous version of some features 
        while we resolve an issue. Full functionality will return shortly.
      </AlertDescription>
    </Alert>
  )
}
```

### 3. Metrics Collection
```typescript
// lib/rollback-metrics.ts
export const trackRollback = {
  start: (reason: string) => {
    analytics.track('rollback_initiated', {
      reason,
      timestamp: Date.now(),
      version: process.env.NEXT_PUBLIC_APP_VERSION,
    })
  },
  
  progress: (stage: string, success: boolean) => {
    analytics.track('rollback_progress', {
      stage,
      success,
      duration: Date.now() - rollbackStartTime,
    })
  },
  
  complete: (outcome: 'success' | 'partial' | 'failed') => {
    analytics.track('rollback_complete', {
      outcome,
      totalDuration: Date.now() - rollbackStartTime,
      affectedUsers: getAffectedUserCount(),
    })
  }
}
```

## Recovery Procedures

### 1. Post-Rollback Analysis
```bash
#!/bin/bash
# analyze-rollback.sh

# Collect logs
mkdir -p rollback-analysis
kubectl logs -l app=blog --since=1h > rollback-analysis/app-logs.txt
curl $SENTRY_API/events?rollback=true > rollback-analysis/errors.json

# Generate report
node scripts/generate-rollback-report.js
```

### 2. Fix Implementation
```typescript
// Fix tracking system
interface RollbackFix {
  issue: string
  component: string
  fix: string
  tested: boolean
  deployed: boolean
}

export const trackFixes = (fixes: RollbackFix[]) => {
  return fixes.map(fix => ({
    ...fix,
    status: fix.deployed ? 'complete' : fix.tested ? 'ready' : 'pending',
    risk: assessRisk(fix),
  }))
}
```

### 3. Gradual Re-deployment
```typescript
// Progressive rollout configuration
export const rolloutConfig = {
  stages: [
    {
      name: 'Internal Testing',
      percentage: 0,
      users: ['internal-testers'],
      duration: '2h',
    },
    {
      name: 'Canary',
      percentage: 5,
      duration: '4h',
      metrics: ['errorRate < 0.1%', 'p95 < 200ms'],
    },
    {
      name: 'Partial',
      percentage: 25,
      duration: '24h',
      metrics: ['errorRate < 0.5%', 'p95 < 300ms'],
    },
    {
      name: 'Full',
      percentage: 100,
      duration: 'permanent',
    },
  ],
}
```

## Rollback Decision Matrix

| Severity | Impact | Response Time | Strategy |
|----------|--------|---------------|----------|
| Critical | >50% users | <5 min | Full rollback |
| High | 25-50% users | <15 min | Feature rollback |
| Medium | 10-25% users | <30 min | Component rollback |
| Low | <10% users | <1 hour | Hotfix forward |

## Automation Scripts

### 1. Automated Rollback Trigger
```typescript
// monitoring/auto-rollback.ts
export const autoRollbackMonitor = async () => {
  const metrics = await getSystemMetrics()
  
  const triggers = {
    errorRate: metrics.errorRate > 5,
    responseTime: metrics.p95 > 1000,
    availability: metrics.uptime < 99.5,
    userReports: metrics.criticalReports > 10,
  }
  
  const shouldRollback = Object.values(triggers).some(Boolean)
  
  if (shouldRollback) {
    await notifyOncall({
      severity: 'critical',
      triggers: Object.entries(triggers)
        .filter(([_, triggered]) => triggered)
        .map(([name]) => name),
    })
    
    if (config.autoRollbackEnabled) {
      await initiateRollback('automated', triggers)
    }
  }
}
```

### 2. Rollback Testing
```typescript
// test/rollback.test.ts
describe('Rollback Procedures', () => {
  it('should successfully rollback component', async () => {
    // Enable new component
    process.env.NEXT_PUBLIC_USE_BRIDGE_STANDARDS = 'true'
    
    // Simulate failure
    const error = new Error('Component failure')
    mockComponentError(error)
    
    // Should automatically use legacy
    const { container } = render(<SafeComponent />)
    expect(container.querySelector('.legacy-component')).toBeInTheDocument()
  })
  
  it('should maintain data integrity during rollback', async () => {
    const userData = await captureUserData()
    
    await performRollback()
    
    const postRollbackData = await captureUserData()
    expect(postRollbackData).toEqual(userData)
  })
})
```

## Communication Templates

### 1. Internal Alert
```markdown
Subject: Migration Rollback Initiated - [Component/Feature]

Team,

We've initiated a rollback for [affected area] due to [issue description].

**Impact**: [user impact]
**Duration**: Estimated [time]
**Action Required**: [any immediate actions]

Rollback tracking: [dashboard link]
```

### 2. Status Page Update
```markdown
### Investigating - [Service] Performance Issues
Posted at [time]

We're currently investigating performance issues affecting [feature].
Some users may experience [impact]. We've implemented a temporary 
fix while we work on a permanent solution.

Next update in 30 minutes.
```

## Lessons Learned Documentation

### Post-Rollback Review Template
```markdown
## Rollback Post-Mortem: [Date]

### Summary
- **Duration**: [start] - [end]
- **Trigger**: [what caused rollback]
- **Impact**: [users/features affected]
- **Resolution**: [how it was resolved]

### Timeline
- T+0: Issue detected
- T+X: Decision to rollback
- T+Y: Rollback complete
- T+Z: Service restored

### Root Cause
[Detailed explanation]

### Lessons Learned
1. [What went well]
2. [What could improve]
3. [Action items]

### Prevention Measures
- [ ] Add test for [scenario]
- [ ] Update monitoring for [metric]
- [ ] Document [process]
```

## Best Practices

1. **Always Test Rollback Procedures**
   - Regular drills during low-traffic periods
   - Document results and update procedures

2. **Maintain Rollback Compatibility**
   - Keep legacy code functional
   - Test both paths in CI/CD

3. **Clear Communication**
   - Predefined escalation paths
   - Template messages ready

4. **Learn from Each Rollback**
   - Mandatory post-mortems
   - Update procedures based on findings

5. **Automate Where Possible**
   - Reduce human error
   - Faster response times
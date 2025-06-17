# Usage Tracking Setup for Task-Based Guides

## Overview
Implementation guide for tracking user interactions with Mom's Blog task-based documentation, providing insights into guide effectiveness and user success patterns.

## Tracking Architecture

### 1. Core Analytics Events

```typescript
// Event types for task guide tracking
interface TaskGuideEvent {
  eventType: 'guide_view' | 'step_complete' | 'task_complete' | 
             'copy_code' | 'expand_section' | 'search' | 'feedback';
  taskId: string;
  guideSection: string;
  timestamp: Date;
  sessionId: string;
  metadata?: Record<string, any>;
}
```

### 2. Implementation Strategy

#### Client-Side Tracking
```typescript
// analytics/tracker.ts
export class GuideTracker {
  private sessionId: string;
  private startTime: Date;
  
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = new Date();
  }
  
  trackGuideView(taskId: string, section: string) {
    this.sendEvent({
      eventType: 'guide_view',
      taskId,
      guideSection: section,
      metadata: {
        referrer: document.referrer,
        entryPoint: this.getEntryPoint()
      }
    });
  }
  
  trackStepCompletion(taskId: string, stepIndex: number, stepName: string) {
    this.sendEvent({
      eventType: 'step_complete',
      taskId,
      guideSection: stepName,
      metadata: {
        stepIndex,
        timeSpent: this.getTimeOnStep(),
        previousStep: this.getPreviousStep()
      }
    });
  }
  
  trackCodeCopy(taskId: string, codeBlock: string, language: string) {
    this.sendEvent({
      eventType: 'copy_code',
      taskId,
      guideSection: 'code_snippet',
      metadata: {
        language,
        blockType: this.identifyCodeType(codeBlock),
        lineCount: codeBlock.split('\n').length
      }
    });
  }
}
```

#### Event Collection
```typescript
// analytics/collector.ts
export class EventCollector {
  private queue: TaskGuideEvent[] = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  
  async collectEvent(event: TaskGuideEvent) {
    // Add privacy-preserving measures
    const sanitizedEvent = this.sanitizeEvent(event);
    this.queue.push(sanitizedEvent);
    
    if (this.queue.length >= this.batchSize) {
      await this.flush();
    }
  }
  
  private sanitizeEvent(event: TaskGuideEvent): TaskGuideEvent {
    // Remove any PII or sensitive data
    return {
      ...event,
      metadata: this.sanitizeMetadata(event.metadata)
    };
  }
  
  private async flush() {
    if (this.queue.length === 0) return;
    
    const events = [...this.queue];
    this.queue = [];
    
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      });
    } catch (error) {
      // Re-queue events on failure
      this.queue.unshift(...events);
    }
  }
}
```

### 3. Privacy-First Implementation

#### User Consent
```typescript
// analytics/consent.ts
export class ConsentManager {
  private hasConsent: boolean = false;
  
  async checkConsent(): Promise<boolean> {
    // Check stored preference
    const stored = localStorage.getItem('analytics-consent');
    if (stored !== null) {
      return stored === 'true';
    }
    
    // Show consent banner
    return await this.showConsentBanner();
  }
  
  private async showConsentBanner(): Promise<boolean> {
    // Minimal, non-intrusive consent UI
    const consent = await this.displayBanner({
      message: 'Help us improve guides by sharing anonymous usage data?',
      options: ['Yes, help improve', 'No thanks']
    });
    
    localStorage.setItem('analytics-consent', String(consent));
    return consent;
  }
}
```

#### Data Minimization
```typescript
// What we track
const trackedData = {
  // Anonymous session ID (not linked to user)
  sessionId: 'uuid-v4',
  
  // Task and guide information
  taskId: 'add-blog-feature',
  guideSection: 'step-3-styling',
  
  // Interaction metadata
  timeOnPage: 145, // seconds
  scrollDepth: 0.75, // 75% scrolled
  
  // Technical context
  deviceType: 'desktop',
  guideVersion: '1.0.0'
};

// What we DON'T track
const notTracked = {
  // No personal information
  userId: undefined,
  email: undefined,
  ipAddress: undefined,
  
  // No detailed behavior
  mouseMovements: undefined,
  keystokes: undefined,
  screenshots: undefined
};
```

### 4. Backend Analytics Pipeline

#### API Endpoint
```typescript
// pages/api/analytics/events.ts
export async function POST(req: Request) {
  const { events } = await req.json();
  
  // Validate events
  const validEvents = events.filter(validateEvent);
  
  // Process in batches
  await processEvents(validEvents);
  
  return Response.json({ 
    received: events.length,
    processed: validEvents.length 
  });
}

function validateEvent(event: TaskGuideEvent): boolean {
  // Ensure required fields
  if (!event.eventType || !event.taskId) return false;
  
  // Validate event type
  const validTypes = ['guide_view', 'step_complete', 'task_complete', 
                     'copy_code', 'expand_section', 'search', 'feedback'];
  if (!validTypes.includes(event.eventType)) return false;
  
  // Sanitize data
  return true;
}
```

#### Data Storage
```typescript
// analytics/storage.ts
export class AnalyticsStorage {
  async storeEvents(events: TaskGuideEvent[]) {
    // Store in time-series format for efficient querying
    const timeSeriesData = events.map(event => ({
      timestamp: event.timestamp,
      metric: `guide.${event.eventType}`,
      value: 1,
      tags: {
        task_id: event.taskId,
        section: event.guideSection,
        session: event.sessionId
      },
      fields: event.metadata || {}
    }));
    
    // Write to database (InfluxDB, TimescaleDB, etc.)
    await this.writeTimeSeries(timeSeriesData);
  }
}
```

### 5. Dashboard Components

#### Guide Usage Overview
```typescript
// components/analytics/GuideUsageOverview.tsx
export function GuideUsageOverview() {
  const { data } = useAnalytics('guide-usage');
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricCard
        title="Total Guide Views"
        value={data.totalViews}
        change={data.viewsChange}
        period="vs last week"
      />
      <MetricCard
        title="Task Completion Rate"
        value={`${data.completionRate}%`}
        change={data.completionChange}
        period="vs last week"
      />
      <MetricCard
        title="Avg. Time to Complete"
        value={formatTime(data.avgCompletionTime)}
        change={data.timeChange}
        period="vs last week"
      />
    </div>
  );
}
```

#### Task Success Funnel
```typescript
// components/analytics/TaskSuccessFunnel.tsx
export function TaskSuccessFunnel({ taskId }: { taskId: string }) {
  const { data } = useTaskAnalytics(taskId);
  
  const funnelData = [
    { stage: 'Viewed Guide', count: data.views },
    { stage: 'Started Task', count: data.starts },
    { stage: 'Reached Midpoint', count: data.midpoints },
    { stage: 'Completed Task', count: data.completions }
  ];
  
  return (
    <FunnelChart
      data={funnelData}
      colors={['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']}
      showPercentages
    />
  );
}
```

### 6. Key Metrics to Track

#### Engagement Metrics
```yaml
metrics:
  guide_views:
    description: Number of times a guide is accessed
    calculation: COUNT(event_type = 'guide_view')
    
  unique_sessions:
    description: Unique users accessing guides
    calculation: COUNT(DISTINCT session_id)
    
  time_on_guide:
    description: Average time spent on each guide
    calculation: AVG(session_end - session_start)
    
  scroll_depth:
    description: How far users scroll through guides
    calculation: AVG(max_scroll_position / page_height)
```

#### Success Metrics
```yaml
metrics:
  task_completion_rate:
    description: Percentage of users who complete the task
    calculation: (completed_tasks / started_tasks) * 100
    
  step_dropout_rate:
    description: Where users abandon the guide
    calculation: (step_n_starts - step_n_completes) / step_n_starts
    
  code_copy_rate:
    description: How often code snippets are copied
    calculation: code_copies / guide_views
    
  search_usage:
    description: What users search for in guides
    calculation: GROUP BY search_query ORDER BY COUNT
```

#### Quality Metrics
```yaml
metrics:
  error_rate:
    description: Frequency of errors during task execution
    calculation: error_events / total_events
    
  retry_rate:
    description: How often users retry failed steps
    calculation: retry_events / total_step_attempts
    
  feedback_score:
    description: User satisfaction with guides
    calculation: AVG(feedback_rating)
    
  help_requests:
    description: When users need additional help
    calculation: COUNT(help_clicked) GROUP BY guide_section
```

### 7. Implementation Checklist

#### Phase 1: Basic Tracking (Week 1)
- [ ] Set up event tracking infrastructure
- [ ] Implement consent management
- [ ] Track basic page views and sessions
- [ ] Create simple analytics dashboard

#### Phase 2: Interaction Tracking (Week 2)
- [ ] Track step completions
- [ ] Monitor code snippet usage
- [ ] Implement scroll tracking
- [ ] Add time-on-page metrics

#### Phase 3: Advanced Analytics (Week 3)
- [ ] Build task completion funnels
- [ ] Create cohort analysis
- [ ] Implement A/B testing framework
- [ ] Add predictive metrics

#### Phase 4: Optimization (Week 4)
- [ ] Automated insights generation
- [ ] Real-time alerting for issues
- [ ] Performance optimization
- [ ] Export capabilities

### 8. Privacy & Compliance

#### GDPR Compliance
```typescript
// Provide data export
app.get('/api/analytics/export/:sessionId', async (req, res) => {
  const data = await exportSessionData(req.params.sessionId);
  res.json(data);
});

// Handle deletion requests
app.delete('/api/analytics/session/:sessionId', async (req, res) => {
  await deleteSessionData(req.params.sessionId);
  res.status(204).send();
});
```

#### Data Retention
```yaml
retention_policy:
  raw_events: 90_days
  aggregated_daily: 1_year
  aggregated_monthly: 3_years
  
  anonymization:
    after: 30_days
    remove: [session_id, ip_hints, user_agent]
    keep: [task_metrics, aggregate_stats]
```

### 9. Testing the Analytics

#### Unit Tests
```typescript
describe('GuideTracker', () => {
  it('should track guide views with correct metadata', () => {
    const tracker = new GuideTracker();
    const spy = jest.spyOn(tracker, 'sendEvent');
    
    tracker.trackGuideView('add-feature', 'introduction');
    
    expect(spy).toHaveBeenCalledWith({
      eventType: 'guide_view',
      taskId: 'add-feature',
      guideSection: 'introduction',
      metadata: expect.any(Object)
    });
  });
});
```

#### Integration Tests
```typescript
describe('Analytics Pipeline', () => {
  it('should process events end-to-end', async () => {
    const event = createTestEvent();
    
    // Send event
    await collector.collectEvent(event);
    await collector.flush();
    
    // Verify storage
    const stored = await storage.getEvents({
      taskId: event.taskId,
      timeRange: 'last_hour'
    });
    
    expect(stored).toContainEqual(event);
  });
});
```
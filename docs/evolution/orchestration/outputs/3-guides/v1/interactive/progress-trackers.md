# Interactive Progress Trackers for Task-Based Guides

## Overview
Real-time progress tracking components for Mom's Blog task guides, providing visual feedback, milestone tracking, and intelligent progress estimation.

## Progress Tracker Architecture

### Core Types
```typescript
// types/progress-tracker.ts
export interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped' | 'error';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  metadata?: {
    estimatedTime: number; // minutes
    actualTime?: number;
    retryCount?: number;
    errorMessage?: string;
  };
}

export interface ProgressMilestone {
  id: string;
  title: string;
  requiredSteps: string[];
  reward?: {
    type: 'badge' | 'achievement' | 'unlock';
    value: string;
  };
}

export interface TaskProgress {
  taskId: string;
  userId?: string;
  sessionId: string;
  steps: ProgressStep[];
  milestones: ProgressMilestone[];
  startedAt: Date;
  lastActivity: Date;
  overallStatus: 'not-started' | 'in-progress' | 'completed' | 'abandoned';
  metrics: {
    totalSteps: number;
    completedSteps: number;
    timeSpent: number;
    estimatedRemaining: number;
    velocity: number; // steps per hour
  };
}
```

## Progress Tracker Components

### 1. Main Progress Tracker

```typescript
// components/ProgressTracker.tsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskProgress, ProgressStep } from '@/types/progress-tracker';

export function ProgressTracker({
  taskId,
  steps,
  milestones,
  onStepComplete,
  onMilestoneReached,
  showTimeEstimates = true,
  autoSave = true
}: {
  taskId: string;
  steps: ProgressStep[];
  milestones?: ProgressMilestone[];
  onStepComplete?: (step: ProgressStep) => void;
  onMilestoneReached?: (milestone: ProgressMilestone) => void;
  showTimeEstimates?: boolean;
  autoSave?: boolean;
}) {
  const [progress, setProgress] = useLocalStorage<TaskProgress>(
    `task-progress-${taskId}`,
    {
      taskId,
      sessionId: generateSessionId(),
      steps: steps.map(s => ({ ...s, status: 'pending' })),
      milestones: milestones || [],
      startedAt: new Date(),
      lastActivity: new Date(),
      overallStatus: 'not-started',
      metrics: calculateMetrics(steps)
    }
  );
  
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Auto-save progress
  useEffect(() => {
    if (autoSave) {
      const interval = setInterval(() => {
        saveProgress(progress);
      }, 30000); // Every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [progress, autoSave]);
  
  const startStep = useCallback((stepId: string) => {
    setProgress(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.id === stepId
          ? {
              ...step,
              status: 'in-progress',
              startedAt: new Date()
            }
          : step
      ),
      overallStatus: 'in-progress',
      lastActivity: new Date()
    }));
    
    setActiveStepId(stepId);
  }, []);
  
  const completeStep = useCallback((stepId: string) => {
    const step = progress.steps.find(s => s.id === stepId);
    if (!step || step.status === 'completed') return;
    
    const completedAt = new Date();
    const actualTime = step.startedAt
      ? Math.round((completedAt.getTime() - step.startedAt.getTime()) / 60000)
      : 0;
    
    const updatedStep: ProgressStep = {
      ...step,
      status: 'completed',
      completedAt,
      metadata: {
        ...step.metadata,
        actualTime
      }
    };
    
    setProgress(prev => {
      const newSteps = prev.steps.map(s =>
        s.id === stepId ? updatedStep : s
      );
      
      const metrics = calculateMetrics(newSteps);
      const overallStatus = metrics.completedSteps === metrics.totalSteps
        ? 'completed'
        : 'in-progress';
      
      return {
        ...prev,
        steps: newSteps,
        metrics,
        overallStatus,
        lastActivity: new Date()
      };
    });
    
    // Check for milestone completion
    checkMilestones(stepId);
    
    // Callback
    if (onStepComplete) {
      onStepComplete(updatedStep);
    }
    
    // Auto-start next step
    const nextStep = findNextStep(progress.steps, stepId);
    if (nextStep) {
      setTimeout(() => startStep(nextStep.id), 500);
    }
  }, [progress, onStepComplete]);
  
  const skipStep = useCallback((stepId: string) => {
    setProgress(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.id === stepId
          ? { ...step, status: 'skipped' }
          : step
      ),
      lastActivity: new Date()
    }));
  }, []);
  
  const retryStep = useCallback((stepId: string) => {
    const step = progress.steps.find(s => s.id === stepId);
    if (!step) return;
    
    setProgress(prev => ({
      ...prev,
      steps: prev.steps.map(s =>
        s.id === stepId
          ? {
              ...s,
              status: 'in-progress',
              startedAt: new Date(),
              metadata: {
                ...s.metadata,
                retryCount: (s.metadata?.retryCount || 0) + 1
              }
            }
          : s
      ),
      lastActivity: new Date()
    }));
  }, [progress]);
  
  const checkMilestones = (completedStepId: string) => {
    if (!milestones) return;
    
    milestones.forEach(milestone => {
      const requiredCompleted = milestone.requiredSteps.every(
        stepId => {
          const step = progress.steps.find(s => s.id === stepId);
          return step?.status === 'completed';
        }
      );
      
      if (requiredCompleted && onMilestoneReached) {
        onMilestoneReached(milestone);
      }
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Task Progress</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ProgressOverview progress={progress} />
        </CardContent>
      </Card>
      
      {/* Step List */}
      <div className="space-y-2">
        {progress.steps.map((step, index) => (
          <ProgressStepComponent
            key={step.id}
            step={step}
            index={index}
            isActive={activeStepId === step.id}
            showTimeEstimates={showTimeEstimates}
            showDetails={showDetails}
            onStart={() => startStep(step.id)}
            onComplete={() => completeStep(step.id)}
            onSkip={() => skipStep(step.id)}
            onRetry={() => retryStep(step.id)}
          />
        ))}
      </div>
      
      {/* Milestones */}
      {milestones && milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <MilestoneList
              milestones={milestones}
              progress={progress}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => resetProgress()}
        >
          Reset Progress
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => pauseProgress()}
          >
            Pause
          </Button>
          <Button
            onClick={() => exportProgress(progress)}
          >
            Export Report
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 2. Individual Step Component

```typescript
// components/ProgressStepComponent.tsx
function ProgressStepComponent({
  step,
  index,
  isActive,
  showTimeEstimates,
  showDetails,
  onStart,
  onComplete,
  onSkip,
  onRetry
}: {
  step: ProgressStep;
  index: number;
  isActive: boolean;
  showTimeEstimates: boolean;
  showDetails: boolean;
  onStart: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onRetry: () => void;
}) {
  const getStatusIcon = () => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'skipped':
        return <SkipForward className="h-5 w-5 text-gray-400" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };
  
  const getTimeDisplay = () => {
    if (!showTimeEstimates) return null;
    
    const estimated = step.metadata?.estimatedTime;
    const actual = step.metadata?.actualTime;
    
    if (step.status === 'completed' && actual) {
      const diff = actual - (estimated || 0);
      const diffClass = diff > 0 ? 'text-red-500' : 'text-green-500';
      
      return (
        <div className="text-xs">
          <span>Took {actual}m</span>
          {estimated && (
            <span className={`ml-1 ${diffClass}`}>
              ({diff > 0 ? '+' : ''}{diff}m)
            </span>
          )}
        </div>
      );
    }
    
    if (estimated) {
      return (
        <div className="text-xs text-muted-foreground">
          Est. {estimated}m
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={cn(
        "transition-all",
        isActive && "ring-2 ring-primary",
        step.status === 'completed' && "bg-muted/30"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Status Icon */}
            <div className="flex-shrink-0 mt-1">
              {getStatusIcon()}
            </div>
            
            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className={cn(
                    "font-medium",
                    step.status === 'completed' && "text-muted-foreground line-through"
                  )}>
                    {step.title}
                  </h4>
                  {step.description && showDetails && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
                
                {getTimeDisplay()}
              </div>
              
              {/* Error Message */}
              {step.status === 'error' && step.metadata?.errorMessage && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>
                    {step.metadata.errorMessage}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Actions */}
              <div className="flex gap-2">
                {step.status === 'pending' && (
                  <Button size="sm" onClick={onStart}>
                    Start
                  </Button>
                )}
                
                {step.status === 'in-progress' && (
                  <>
                    <Button size="sm" onClick={onComplete}>
                      Complete
                    </Button>
                    <Button size="sm" variant="outline" onClick={onSkip}>
                      Skip
                    </Button>
                  </>
                )}
                
                {step.status === 'error' && (
                  <Button size="sm" variant="outline" onClick={onRetry}>
                    Retry
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

### 3. Progress Overview Component

```typescript
// components/ProgressOverview.tsx
function ProgressOverview({ progress }: { progress: TaskProgress }) {
  const { metrics } = progress;
  const progressPercentage = (metrics.completedSteps / metrics.totalSteps) * 100;
  
  const getStatusColor = () => {
    if (progress.overallStatus === 'completed') return 'text-green-500';
    if (progress.overallStatus === 'abandoned') return 'text-red-500';
    return 'text-blue-500';
  };
  
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span>{metrics.completedSteps} of {metrics.totalSteps} steps</span>
          <span className={getStatusColor()}>
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <Progress value={progressPercentage} className="h-3" />
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Time Spent</p>
          <p className="text-lg font-semibold">
            {formatTime(metrics.timeSpent)}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground">Est. Remaining</p>
          <p className="text-lg font-semibold">
            {formatTime(metrics.estimatedRemaining)}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground">Velocity</p>
          <p className="text-lg font-semibold">
            {metrics.velocity.toFixed(1)} steps/hr
          </p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <p className={`text-lg font-semibold capitalize ${getStatusColor()}`}>
            {progress.overallStatus.replace('-', ' ')}
          </p>
        </div>
      </div>
      
      {/* Time Prediction */}
      {progress.overallStatus === 'in-progress' && metrics.estimatedRemaining > 0 && (
        <div className="text-sm text-muted-foreground">
          Estimated completion: {
            new Date(
              Date.now() + metrics.estimatedRemaining * 60000
            ).toLocaleTimeString()
          }
        </div>
      )}
    </div>
  );
}
```

### 4. Visual Progress Indicators

```typescript
// components/VisualProgress.tsx
export function VisualProgress({ progress }: { progress: TaskProgress }) {
  return (
    <div className="space-y-6">
      {/* Circular Progress */}
      <div className="flex justify-center">
        <CircularProgress
          value={progress.metrics.completedSteps}
          max={progress.metrics.totalSteps}
          size={200}
          strokeWidth={12}
        >
          <div className="text-center">
            <div className="text-3xl font-bold">
              {Math.round(
                (progress.metrics.completedSteps / progress.metrics.totalSteps) * 100
              )}%
            </div>
            <div className="text-sm text-muted-foreground">
              Complete
            </div>
          </div>
        </CircularProgress>
      </div>
      
      {/* Step Timeline */}
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
        
        {progress.steps.map((step, index) => (
          <div key={step.id} className="relative flex items-center mb-8">
            <div className={cn(
              "absolute left-6 w-4 h-4 rounded-full border-2 bg-background",
              step.status === 'completed' && "bg-green-500 border-green-500",
              step.status === 'in-progress' && "bg-blue-500 border-blue-500 animate-pulse",
              step.status === 'error' && "bg-red-500 border-red-500",
              step.status === 'pending' && "border-gray-300"
            )} />
            
            <div className="ml-16">
              <h4 className={cn(
                "font-medium",
                step.status === 'completed' && "text-muted-foreground"
              )}>
                {step.title}
              </h4>
              {step.completedAt && (
                <p className="text-xs text-muted-foreground">
                  Completed {formatRelativeTime(step.completedAt)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Smart Progress Features

### 1. Intelligent Time Estimation

```typescript
// utils/progress-estimation.ts
export class ProgressEstimator {
  private velocityHistory: number[] = [];
  
  updateVelocity(stepsCompleted: number, timeSpent: number) {
    if (timeSpent > 0) {
      const velocity = (stepsCompleted / timeSpent) * 60; // steps per hour
      this.velocityHistory.push(velocity);
      
      // Keep only last 10 measurements
      if (this.velocityHistory.length > 10) {
        this.velocityHistory.shift();
      }
    }
  }
  
  estimateRemainingTime(stepsRemaining: number): number {
    if (this.velocityHistory.length === 0) {
      // Use default estimates
      return stepsRemaining * 15; // 15 minutes per step default
    }
    
    // Calculate weighted average (recent velocities weighted more)
    const weights = this.velocityHistory.map((_, i) => i + 1);
    const weightedSum = this.velocityHistory.reduce(
      (sum, vel, i) => sum + vel * weights[i],
      0
    );
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const avgVelocity = weightedSum / totalWeight;
    
    // Convert to minutes
    return Math.round((stepsRemaining / avgVelocity) * 60);
  }
  
  getConfidenceLevel(): 'low' | 'medium' | 'high' {
    if (this.velocityHistory.length < 3) return 'low';
    if (this.velocityHistory.length < 7) return 'medium';
    return 'high';
  }
}
```

### 2. Progress Patterns Recognition

```typescript
// Identify user patterns
interface ProgressPattern {
  type: 'fast-starter' | 'steady-pace' | 'slow-finisher' | 'irregular';
  recommendations: string[];
}

export function analyzeProgressPattern(
  progress: TaskProgress
): ProgressPattern {
  const completedSteps = progress.steps.filter(
    s => s.status === 'completed'
  );
  
  if (completedSteps.length < 3) {
    return {
      type: 'irregular',
      recommendations: ['Complete more steps to analyze pattern']
    };
  }
  
  // Analyze completion times
  const times = completedSteps.map(s => s.metadata?.actualTime || 0);
  const firstHalf = times.slice(0, Math.floor(times.length / 2));
  const secondHalf = times.slice(Math.floor(times.length / 2));
  
  const avgFirst = average(firstHalf);
  const avgSecond = average(secondHalf);
  
  if (avgFirst < avgSecond * 0.7) {
    return {
      type: 'fast-starter',
      recommendations: [
        'Take breaks to maintain energy',
        'Save complex tasks for when you\'re fresh'
      ]
    };
  }
  
  if (avgSecond < avgFirst * 0.7) {
    return {
      type: 'slow-finisher',
      recommendations: [
        'Start with easier tasks to build momentum',
        'Set intermediate goals'
      ]
    };
  }
  
  return {
    type: 'steady-pace',
    recommendations: [
      'Your pace is consistent - keep it up!',
      'Consider slightly increasing pace if comfortable'
    ]
  };
}
```

### 3. Milestone Gamification

```typescript
// components/MilestoneRewards.tsx
export function MilestoneRewards({
  milestone,
  onClaim
}: {
  milestone: ProgressMilestone;
  onClaim: (reward: any) => void;
}) {
  const [claimed, setClaimed] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);
  
  const claimReward = () => {
    setClaimed(true);
    onClaim(milestone.reward);
    
    // Show success animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="p-6 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white"
    >
      <div className="text-center space-y-4">
        <Trophy className="h-12 w-12 mx-auto" />
        <h3 className="text-xl font-bold">Milestone Achieved!</h3>
        <p>{milestone.title}</p>
        
        {!claimed ? (
          <Button
            onClick={claimReward}
            className="bg-white text-purple-600 hover:bg-gray-100"
          >
            Claim Reward
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>Reward Claimed!</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
```

## Progress Analytics

```typescript
// Track and analyze progress data
interface ProgressAnalytics {
  taskId: string;
  aggregateMetrics: {
    avgCompletionTime: number;
    successRate: number;
    avgRetries: number;
    commonErrors: Array<{
      step: string;
      error: string;
      frequency: number;
    }>;
  };
  userSegments: {
    fast: number; // % of users
    average: number;
    slow: number;
  };
}

export async function generateProgressReport(
  taskId: string
): Promise<ProgressAnalytics> {
  const sessions = await getTaskSessions(taskId);
  
  return {
    taskId,
    aggregateMetrics: {
      avgCompletionTime: calculateAvgCompletionTime(sessions),
      successRate: calculateSuccessRate(sessions),
      avgRetries: calculateAvgRetries(sessions),
      commonErrors: identifyCommonErrors(sessions)
    },
    userSegments: segmentUsersBySpeed(sessions)
  };
}
```

## Integration Examples

### 1. Real-time Collaboration
```typescript
// Share progress with team members
export function CollaborativeProgress({
  taskId,
  teamId
}: {
  taskId: string;
  teamId: string;
}) {
  const { progress: myProgress } = useProgress(taskId);
  const { teamProgress } = useTeamProgress(taskId, teamId);
  
  return (
    <div className="space-y-4">
      <h3>Team Progress</h3>
      {teamProgress.map(member => (
        <div key={member.userId} className="flex items-center gap-4">
          <Avatar src={member.avatar} />
          <div className="flex-1">
            <p className="font-medium">{member.name}</p>
            <Progress
              value={(member.completedSteps / member.totalSteps) * 100}
              className="h-2"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {member.completedSteps}/{member.totalSteps}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### 2. Progress Notifications
```typescript
// Send progress updates
export function setupProgressNotifications(progress: TaskProgress) {
  // Browser notifications
  if ('Notification' in window && Notification.permission === 'granted') {
    if (progress.metrics.completedSteps % 5 === 0) {
      new Notification('Great progress!', {
        body: `You've completed ${progress.metrics.completedSteps} steps!`,
        icon: '/icon.png'
      });
    }
  }
  
  // In-app notifications
  if (progress.overallStatus === 'completed') {
    toast.success('Task completed! 🎉', {
      description: `Total time: ${formatTime(progress.metrics.timeSpent)}`
    });
  }
}
```

### 3. Export and Sharing
```typescript
// Generate shareable progress report
export function exportProgressReport(progress: TaskProgress) {
  const report = {
    summary: {
      task: progress.taskId,
      status: progress.overallStatus,
      completion: `${progress.metrics.completedSteps}/${progress.metrics.totalSteps}`,
      timeSpent: formatTime(progress.metrics.timeSpent)
    },
    details: progress.steps.map(step => ({
      title: step.title,
      status: step.status,
      time: step.metadata?.actualTime || 'N/A'
    })),
    insights: analyzeProgressPattern(progress)
  };
  
  // Generate PDF or markdown
  return generateReport(report);
}
```
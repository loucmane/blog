// Analytics and tracking types

export interface AnalyticsEvent {
  id: string
  eventName: string
  category: EventCategory
  properties: Record<string, any>
  userId?: string
  sessionId: string
  timestamp: Date
  source: TrafficSource
  page: string
  userAgent: string
}

export type EventCategory =
  | 'Content Engagement'
  | 'Donation'
  | 'Newsletter'
  | 'Emergency Alert'
  | 'Social Sharing'
  | 'Search'
  | 'Navigation'

export type TrafficSource =
  | 'Direct'
  | 'Organic Search'
  | 'Social Media'
  | 'Email Campaign'
  | 'Referral'
  | 'Paid Search'
  | 'Emergency Alert'

export interface UserSession {
  id: string
  userId?: string
  startTime: Date
  endTime?: Date
  pageViews: number
  events: AnalyticsEvent[]
  source: TrafficSource
  referrer?: string
  deviceInfo: DeviceInfo
  contentInteraction: ContentInteraction[]
}

export interface DeviceInfo {
  type: 'Desktop' | 'Mobile' | 'Tablet'
  os: string
  browser: string
  screenResolution: string
  viewportSize: string
}

export interface ContentInteraction {
  contentId: string
  contentType: string
  timeSpent: number // seconds
  scrollDepth: number // percentage
  shareClicks: number
  donationClicks: number
  readingProgress: number // percentage
}

export interface PerformanceMetrics {
  timestamp: Date
  page: string
  loadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  firstInputDelay: number
  cumulativeLayoutShift: number
  timeToInteractive: number
}

export interface ConversionFunnel {
  step: string
  visitors: number
  conversions: number
  conversionRate: number
  dropoffRate: number
  averageTime: number // seconds
}

export interface DonationAnalytics {
  totalDonations: number
  totalAmount: number
  averageDonation: number
  newDonors: number
  repeatDonors: number
  retentionRate: number
  topSources: TrafficSource[]
  conversionBySource: Record<TrafficSource, number>
  emergencyAppealPerformance: EmergencyAppealMetrics[]
}

export interface EmergencyAppealMetrics {
  appealId: string
  views: number
  donations: number
  totalRaised: number
  conversionRate: number
  averageDonation: number
  timeToGoal?: number // hours
  topReferrers: string[]
}

export interface ContentMetrics {
  contentId: string
  views: number
  uniqueViews: number
  averageTimeSpent: number
  averageScrollDepth: number
  socialShares: number
  donationConversions: number
  bounceRate: number
  exitRate: number
  searchRanking?: number
}

export interface ImpactMetrics {
  period: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly'
  startDate: Date
  endDate: Date
  animalsHelped: number
  donationsReceived: number
  newSupporters: number
  contentPublished: number
  emergencyResponses: number
  websiteReach: number
  socialMediaReach: number
}

export interface ABTestVariant {
  id: string
  name: string
  description: string
  traffic: number // percentage
  conversions: number
  conversionRate: number
  isControl: boolean
  startDate: Date
  endDate?: Date
  status: 'Draft' | 'Running' | 'Paused' | 'Completed'
}

export interface ABTest {
  id: string
  name: string
  hypothesis: string
  metric: string
  variants: ABTestVariant[]
  startDate: Date
  endDate?: Date
  status: 'Draft' | 'Running' | 'Paused' | 'Completed'
  results?: {
    winner?: string
    significance: number
    confidence: number
  }
}

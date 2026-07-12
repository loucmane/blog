// Donor and trust-building types

export interface Donor {
  id: string
  name: string
  email: string
  phone?: string
  address?: Address
  preferences: DonorPreferences
  donationHistory: Donation[]
  communicationPreferences: CommunicationPreferences
  trustLevel: TrustLevel
  firstDonationDate: Date
  totalDonated: number
  isAnonymous: boolean
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface DonorPreferences {
  preferredDonationAmount: number
  frequency: DonationFrequency
  causes: string[] // Specific animal types or causes they support
  communicationFrequency: 'Weekly' | 'Monthly' | 'Quarterly' | 'Emergency Only'
  receiptPreference: 'Email' | 'Mail' | 'Both'
}

export interface CommunicationPreferences {
  newsletter: boolean
  emergencyAlerts: boolean
  impactUpdates: boolean
  eventInvitations: boolean
  thankyouMessages: boolean
  preferredChannel: 'Email' | 'SMS' | 'Mail' | 'Phone'
}

export type TrustLevel = 'New' | 'Engaged' | 'Committed' | 'Champion'

export interface Donation {
  id: string
  donorId: string
  amount: number
  currency: string
  date: Date
  type: DonationType
  frequency: DonationFrequency
  cause?: string // Specific appeal or cause
  paymentMethod: PaymentMethod
  status: DonationStatus
  impactReport?: ImpactReport
  taxReceiptId?: string
}

export type DonationType =
  | 'General Fund'
  | 'Emergency Appeal'
  | 'Medical Fund'
  | 'Rescue Operations'
  | 'Shelter Support'
  | 'Memorial'

export type DonationFrequency = 'One-time' | 'Monthly' | 'Quarterly' | 'Annually'

export type PaymentMethod = 'Credit Card' | 'PayPal' | 'Bank Transfer' | 'Check' | 'Cryptocurrency'

export type DonationStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Refunded'

export interface ImpactReport {
  id: string
  donationId: string
  animalsHelped: number
  specificOutcomes: string[]
  photos?: string[]
  videoUrl?: string
  generatedAt: Date
}

export interface TrustBuildingMetrics {
  transparencyScore: number // 0-100
  impactVisibility: number // 0-100
  communicationQuality: number // 0-100
  financialTransparency: number // 0-100
  donorRetentionRate: number // percentage
}

export interface TaxReceipt {
  id: string
  donorId: string
  donationIds: string[]
  totalAmount: number
  taxYear: number
  issuedDate: Date
  receiptUrl: string
}

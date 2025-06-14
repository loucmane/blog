// Emergency appeal system types

export interface EmergencyAlert {
  id: string;
  title: string;
  description: string;
  urgencyLevel: UrgencyLevel;
  alertType: AlertType;
  location: Location;
  animalsAffected: number;
  estimatedCost: number;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
  status: EmergencyStatus;
  appealsGenerated: string[]; // Array of EmergencyAppeal IDs
  mediaAssets: MediaAsset[];
  contactInfo: EmergencyContact;
}

export type UrgencyLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type AlertType = 
  | 'Natural Disaster' 
  | 'Medical Emergency' 
  | 'Rescue Operation' 
  | 'Shelter Crisis' 
  | 'Transport Emergency' 
  | 'Legal Intervention';

export interface Location {
  address: string;
  city: string;
  state: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  radius?: number; // in kilometers
}

export type EmergencyStatus = 
  | 'Active' 
  | 'Resolved' 
  | 'Closed' 
  | 'Monitoring' 
  | 'Escalated';

export interface MediaAsset {
  id: string;
  type: 'Image' | 'Video' | 'Document';
  url: string;
  caption: string;
  sensitivityLevel: number; // 1-3
  approvedForPublic: boolean;
  thumbnailUrl?: string;
}

export interface EmergencyContact {
  name: string;
  role: string;
  phone: string;
  email: string;
  alternateContact?: {
    name: string;
    phone: string;
  };
}

export interface EmergencyAppealContent {
  appealId: string;
  heroImage: string;
  headline: string;
  story: string; // MDX content
  impactStatement: string;
  callToAction: string;
  socialMediaContent: {
    twitter: string;
    facebook: string;
    instagram: string;
  };
  emailTemplate: string;
}

export interface EmergencyResponse {
  id: string;
  alertId: string;
  responseType: ResponseType;
  teamMembers: string[]; // User IDs
  resourcesDeployed: Resource[];
  timeline: ResponseTimeline[];
  currentStatus: string;
  outcome?: ResponseOutcome;
}

export type ResponseType = 
  | 'Field Response' 
  | 'Medical Team' 
  | 'Transport Team' 
  | 'Support Team' 
  | 'Coordination';

export interface Resource {
  type: 'Vehicle' | 'Equipment' | 'Personnel' | 'Medical Supplies' | 'Food';
  description: string;
  quantity: number;
  cost?: number;
  deployedAt: Date;
}

export interface ResponseTimeline {
  timestamp: Date;
  event: string;
  responsiblePerson: string;
  notes?: string;
  documentsAttached?: string[];
}

export interface ResponseOutcome {
  animalsRescued: number;
  animalsCared: number;
  totalCost: number;
  duration: number; // in hours
  successRating: number; // 1-5
  lessonsLearned: string[];
  mediaDocumentation: string[];
}

export interface NotificationSettings {
  emergencyAlerts: boolean;
  urgencyThreshold: UrgencyLevel;
  locationRadius: number; // in kilometers
  alertMethods: NotificationMethod[];
  quietHours: {
    start: string; // HH:MM format
    end: string;
  };
}

export type NotificationMethod = 
  | 'Push Notification' 
  | 'Email' 
  | 'SMS' 
  | 'Phone Call';
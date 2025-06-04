// Trauma-informed content handling types

export type ContentSensitivityLevel = 1 | 2 | 3;

export interface ContentClassification {
  sensitivityLevel: ContentSensitivityLevel;
  triggers: ContentTrigger[];
  audienceRestriction: AudienceRestriction;
  requiresWarning: boolean;
  progressiveDisclosure: boolean;
}

export interface ContentTrigger {
  type: 'Violence' | 'Neglect' | 'Medical' | 'Death' | 'Abuse' | 'Graphic Images';
  severity: 'Mild' | 'Moderate' | 'Severe';
  description: string;
}

export type AudienceRestriction = 
  | 'None' 
  | 'Adults Only' 
  | 'Staff Only' 
  | 'Verified Supporters';

export interface ContentWarning {
  title: string;
  message: string;
  triggers: ContentTrigger[];
  recommendations?: string[];
  alternativeContent?: string; // ID of alternative, less sensitive content
}

export interface TraumaInformedSettings {
  showContentWarnings: boolean;
  autoHideSensitiveImages: boolean;
  preferredSensitivityLevel: ContentSensitivityLevel;
  blockedTriggers: ContentTrigger['type'][];
  enableProgressiveDisclosure: boolean;
}

export interface ContentModerationAction {
  id: string;
  contentId: string;
  moderatorId: string;
  action: 'Approve' | 'Reject' | 'Require Warning' | 'Restrict Audience';
  reason: string;
  timestamp: Date;
  classification: ContentClassification;
}

export interface SensitiveContentMetadata {
  classification: ContentClassification;
  warning?: ContentWarning;
  ageVerificationRequired: boolean;
  shareRestrictions: {
    allowSocialSharing: boolean;
    requiresDisclaimer: boolean;
    restrictedPlatforms: string[];
  };
}
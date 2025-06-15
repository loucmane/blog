# Content Sensitivity Framework

## Overview
The Animal Protection Foundation handles content that ranges from hopeful rescue stories to documentation of severe animal suffering. This framework ensures all content is presented with appropriate sensitivity while maintaining the impact needed for advocacy.

## Three-Tier Classification System

### Level 1: Hope & Progress (70% of content)
**Description**: Positive stories, educational content, success stories
**Examples**:
- Successful rescue stories
- Animal recovery progress
- Educational articles
- Volunteer spotlights
- Fundraising achievements

**Presentation**:
- No content warnings needed
- Featured prominently
- Shareable by default
- Suitable for all audiences

### Level 2: Medical & Rescue (25% of content)
**Description**: Content showing medical procedures, rescue operations, or mild distress
**Examples**:
- Veterinary procedures
- Active rescue operations  
- Before/after transformations
- Mild injury documentation

**Presentation**:
- Soft content warning
- Blur preview images
- Click-to-view implementation
- Age guidance (13+)

### Level 3: Crisis & Emergency (5% of content)
**Description**: Documentation of severe cases, emergency appeals, investigation footage
**Examples**:
- Severe abuse cases
- Emergency rescue situations
- Investigation documentation
- Crisis appeals

**Presentation**:
- Strong content warning
- No preview images
- Multi-step viewing process
- Age verification (18+)
- Restricted sharing

## Implementation Guidelines

### Content Warnings
```typescript
interface ContentWarning {
  level: 1 | 2 | 3;
  reasons: string[];
  ageRestriction?: number;
  allowSharing: boolean;
}

// Example implementation
const warning: ContentWarning = {
  level: 2,
  reasons: ['medical procedures', 'animal distress'],
  ageRestriction: 13,
  allowSharing: true
};
```

### Progressive Disclosure
1. **Initial View**: Blurred image with warning
2. **First Click**: Show detailed warning and confirm
3. **Second Click**: Reveal content
4. **Remember Choice**: Optional for session

### Visual Treatment
- **Level 1**: Full color, immediate display
- **Level 2**: Desaturated previews, soft blur
- **Level 3**: No preview, text description only

## Trauma-Informed Implementation

Our trauma-informed approach builds on the principles outlined in our [Development Principles](/docs/ai/shared-context/philosophies/development-principles.md#trauma-informed-design). 

### Key Implementation Points:
- **Progressive Disclosure**: Multi-step process for sensitive content
- **Clear Warnings**: Specific, descriptive content indicators
- **User Agency**: Full control over viewing experience
- **Safe Defaults**: Always err on the side of caution
- **Support Integration**: Help resources readily available

### Design Patterns
For specific implementation patterns, see:
- Modal and overlay patterns for content warnings
- Progressive image loading techniques
- Accessible skip navigation options
- Emergency exit UI patterns

## Content Creator Guidelines

### Writing Sensitively
- Lead with hope when possible
- Provide context and resolution
- Focus on impact and change
- Balance truth with care

### Image Selection
- Consider emotional impact
- Provide alternatives
- Use "after" photos when possible
- Blur sensitive areas

### Emergency Appeals
- Clear about urgency
- Specific about needs
- Hopeful about outcomes
- Respect donor emotions

## Technical Implementation

### Metadata Requirements
```markdown
---
title: "Rescue of Luna from Factory Farm"
classification: 2
warnings: ["medical procedures", "malnutrition visible"]
ageRestriction: 13
heroImage: "/images/luna-after.jpg"
sensitiveImages: ["/images/luna-before.jpg", "/images/luna-medical.jpg"]
---
```

### Component Architecture
```jsx
<ContentGate level={post.classification}>
  <WarningScreen warnings={post.warnings} />
  <ProgressiveImage 
    src={post.heroImage}
    sensitiveSrc={post.sensitiveImages}
  />
  <ShareControls restricted={post.classification > 2} />
</ContentGate>
```

### User Preferences
```typescript
interface UserPreferences {
  showLevel2Content: boolean;
  showLevel3Content: boolean;
  autoBlurImages: boolean;
  rememberChoices: boolean;
}
```

## Measurement & Improvement

### Key Metrics
- Bounce rate by classification level
- Engagement with warned content
- Sharing rates by level
- User preference selections

### Feedback Loops
- User surveys on content presentation
- A/B testing warning effectiveness
- Monitor support inquiries
- Track emotional responses

### Continuous Improvement
- Regular review of classification
- Update warning language
- Refine progressive disclosure
- Enhance support resources

## Emergency Response Protocol

When crisis content must be shared rapidly:
1. Default to Level 3 classification
2. Include crisis helpline information
3. Provide clear action items
4. Balance urgency with care
5. Follow up with hope stories
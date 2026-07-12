# Backend Package - API Services

## Overview

Express.js-based API service for the Animal Protection Foundation Blog. Handles server-side operations, external integrations, and content workflows.

## Architecture

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   │   ├── newsletter.controller.ts
│   │   ├── donation.controller.ts
│   │   ├── analytics.controller.ts
│   │   └── approval.controller.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── rateLimit.ts
│   ├── routes/          # API route definitions
│   │   └── v1/
│   ├── services/        # Business logic
│   │   ├── email.service.ts
│   │   ├── crm.service.ts
│   │   └── notification.service.ts
│   ├── types/           # TypeScript types
│   └── utils/           # Utilities
├── tests/               # Test files
└── package.json
```

## API Endpoints

### Newsletter Management

```
POST   /api/v1/newsletter/subscribe
DELETE /api/v1/newsletter/unsubscribe
GET    /api/v1/newsletter/segments
```

### Donation Webhooks

```
POST   /api/v1/donations/stripe-webhook
POST   /api/v1/donations/paypal-webhook
GET    /api/v1/donations/summary
```

### Content Approval

```
GET    /api/v1/content/pending
POST   /api/v1/content/approve/:id
POST   /api/v1/content/reject/:id
GET    /api/v1/content/metrics
```

### Analytics

```
POST   /api/v1/analytics/event
GET    /api/v1/analytics/report
GET    /api/v1/analytics/real-time
```

### Emergency Alerts

```
POST   /api/v1/emergency/create
POST   /api/v1/emergency/notify
GET    /api/v1/emergency/active
```

## Services

### Email Service

- Newsletter subscription management
- Transactional emails
- Emergency appeal notifications
- Donor acknowledgments

### CRM Service

- Donor profile management
- Giving history tracking
- Segmentation for campaigns
- Impact report generation

### Notification Service

- Push notifications for emergencies
- SMS alerts for field teams
- Slack/Discord webhooks
- Email notifications

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

## Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=

# External Services
STRIPE_SECRET_KEY=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
CONVERTKIT_API_KEY=
SENDGRID_API_KEY=

# CRM
CRM_API_URL=
CRM_API_KEY=

# Notifications
SLACK_WEBHOOK_URL=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# Security
JWT_SECRET=
RATE_LIMIT_WINDOW=
RATE_LIMIT_MAX=
```

## Deployment

Deployed as Vercel Functions:

- Automatic scaling
- Global edge network
- Zero configuration
- Integrated with frontend

## Security

- JWT authentication for admin endpoints
- Rate limiting on all endpoints
- Input validation with Zod
- CORS configuration
- Webhook signature verification

## Integrations

### Payment Processors

- Stripe (primary)
- PayPal (secondary)
- Regional payment methods

### Communication

- ConvertKit (newsletters)
- SendGrid (transactional)
- Twilio (SMS)
- Slack (internal)

### Analytics

- Google Analytics
- Vercel Analytics
- Custom event tracking

## Error Handling

Standardized error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "constraint": "email"
    }
  }
}
```

## Rate Limiting

- Public endpoints: 100 req/15min
- Authenticated: 1000 req/15min
- Donation webhooks: Unlimited
- Emergency endpoints: Unlimited

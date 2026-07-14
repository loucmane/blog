# Admin Dashboard Implementation Plan v2

> **Superseded historical proposal (Task 41, 2026-07-14).** This document is retained only as legacy discovery material. Its animal-foundation product, Next.js 15, BlockNote, NextAuth, Vercel KV/Blob, and vendor choices are not approved architecture. Use the canonical PRD, `docs/architecture/cmsless-magazine-foundation.md`, and Tasks 42–43 for current decisions.

## Overview
A custom, intuitive content management dashboard for non-technical users to manage the Animal Protection Foundation blog. Built with Next.js 15, shadcn/ui, and BlockNote.js for a delightful editing experience.

## Core Principles
- **Mental Model**: Works like Google Docs/Medium - familiar and friendly
- **Forgiveness over Freedom**: Guardrails prevent mistakes, auto-save everything
- **Hidden Complexity**: Git, MDX, and technical details completely abstracted
- **Visual Feedback**: Every action has clear, immediate feedback
- **Mobile Capable**: Basic editing works on phones for urgent updates

## Tech Stack Decisions

### Editor: BlockNote.js
- **Why**: Block-based like Notion, minimal UI work needed, slash commands
- **Benefits**: 
  - Beautiful out-of-box UI
  - Intuitive block concept (paragraph, heading, image)
  - Modern slash commands (/, /image, /heading)
  - Outputs clean JSON structure

### Authentication: Magic Links via NextAuth.js
- **Why**: No passwords to remember, highly secure, perfect for single user
- **Implementation**:
  ```javascript
  // Restricted to blog owner email
  callbacks: {
    async signIn({ user }) {
      return user.email === process.env.ADMIN_EMAIL;
    }
  }
  ```
- **Email Service**: Resend (integrates with Vercel, generous free tier)

### Data Storage: Vercel KV
- **Why**: Better than filesystem for drafts - enables querying, versioning, metadata
- **Structure**:
  ```typescript
  // Key: "post:<id>"
  interface Post {
    id: string;
    status: 'draft' | 'publishing' | 'building' | 'live' | 'failed';
    title: string;
    blocks: BlockNoteJSON;
    featuredImage?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    autosaveHistory?: Array<{
      timestamp: Date;
      title: string;
    }>; // Last 10 saves
    failureReason?: string; // Only if status is 'failed'
  }
  ```

### Image Storage: Vercel Blob
- **Why**: Zero config, integrated with platform, simple SDK
- **Enhanced Features**:
  - Generate multiple sizes for srcset
  - Store metadata in KV for future media library
  - Auto-optimization with Sharp
- **Implementation**:
  ```javascript
  // Generate responsive images
  const large = await sharp(buffer).resize(1200).webp().toBuffer();
  const medium = await sharp(buffer).resize(768).webp().toBuffer();
  const small = await sharp(buffer).resize(400).webp().toBuffer();
  
  // Store metadata in KV
  await kv.set(`image:${imageId}`, {
    urls: { large, medium, small },
    originalFilename,
    uploadedAt: new Date(),
    alt: '' // To be filled by user
  });
  ```

### Git Integration: GitHub App + API
- **Why**: More secure than PAT, can bypass branch protection
- **Setup**:
  1. Create private GitHub App
  2. Grant "Contents" read/write permissions
  3. Install only on blog repo
  4. Use Octokit for clean API calls

## Enhanced Features

### 1. Editor State Management

#### Conflict Resolution (Two Tabs)
```typescript
// Include timestamp in save request
const saveResponse = await fetch('/api/posts/save-draft', {
  body: JSON.stringify({
    id: postId,
    blocks: editor.document,
    lastUpdatedAt: currentPost.updatedAt
  })
});

// API checks for conflicts
if (storedPost.updatedAt !== clientUpdatedAt) {
  return new Response('Conflict', { status: 409 });
}
```

#### Dirty State Indicator
```typescript
const [isDirty, setIsDirty] = useState(false);

editor.onEditorContentChange((editor) => {
  const hasChanges = !deepEqual(initialBlocks, editor.document);
  setIsDirty(hasChanges);
});
```

#### Graceful Failure Handling
```typescript
const autoSave = async () => {
  try {
    await saveDraft();
    showToast({ title: "Saved", variant: "success" });
  } catch (error) {
    showToast({ 
      title: "Save failed. Retrying...", 
      variant: "error" 
    });
    // Retry with exponential backoff
    await retryWithBackoff(saveDraft);
  }
};
```

### 2. Preview System

Using Next.js Draft Mode for pixel-perfect previews:

```typescript
// Enable preview API route
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('id');
  
  // Enable draft mode
  draftMode().enable();
  
  // Redirect to the post URL
  redirect(`/posts/${postId}`);
}

// In the post page component
export async function PostPage({ params }) {
  const { isEnabled } = draftMode();
  
  const post = isEnabled 
    ? await getPostFromKV(params.slug)
    : await getPostFromGit(params.slug);
    
  return <Article {...post} />;
}
```

### 3. Template System

Pre-configured templates for common post types:

```typescript
export const templates = {
  'rescue-story': {
    name: 'Rescue Story',
    blocks: [
      { type: 'heading', content: 'Meet [Animal Name]' },
      { type: 'paragraph', content: 'Found in [location]...' },
      { type: 'image', props: { caption: 'Before photo' } },
      { type: 'callout', props: { type: 'info' }, content: 'Current needs...' }
    ],
    notes: 'Remember to include before/after photos',
    featuredImage: '/templates/rescue-hero.jpg'
  },
  'emergency-appeal': {
    name: 'Emergency Appeal',
    blocks: [
      { type: 'heading', content: 'Urgent: [Situation]' },
      { type: 'actionAlert', props: { urgency: 'high' } }
    ],
    notes: 'Keep it concise and action-oriented'
  }
};
```

### 4. Async Publishing with Status Updates

```typescript
// Publishing flow with status tracking
async function publishPost(postId) {
  // 1. Update status to 'publishing'
  await kv.set(`post:${postId}`, { 
    ...post, 
    status: 'publishing' 
  });
  
  // 2. Queue async job (using Inngest or similar)
  await inngest.send({
    name: 'publish-post',
    data: { postId }
  });
  
  // 3. Frontend starts polling
  const pollStatus = setInterval(async () => {
    const post = await fetch(`/api/posts/status/${postId}`);
    if (post.status === 'live' || post.status === 'failed') {
      clearInterval(pollStatus);
      showToast({
        title: post.status === 'live' 
          ? 'Post published!' 
          : 'Publishing failed',
        action: post.status === 'live'
          ? <Link href={post.url}>View Post</Link>
          : <Button onClick={retry}>Retry</Button>
      });
    }
  }, 5000);
}
```

### 5. Mobile Optimizations

```typescript
const isMobile = useMediaQuery('(max-width: 768px)');

// Simplified block types for mobile
const mobileBlockSpecs = isMobile
  ? ['paragraph', 'heading', 'image'] // Basic blocks only
  : fullBlockSpecs; // All blocks including tables, embeds, etc.

// Larger touch targets
const editorConfig = {
  toolbarHeight: isMobile ? 56 : 40,
  buttonSize: isMobile ? 44 : 32
};
```

### 6. Custom Blocks for Animal Protection

```typescript
// Define custom block schemas
const customBlockSpecs = {
  petitionEmbed: {
    render: (props) => <PetitionEmbed url={props.url} />,
    schema: {
      url: { type: 'string', required: true }
    }
  },
  factBox: {
    render: (props) => <FactBox stat={props.stat} source={props.source} />,
    schema: {
      stat: { type: 'string', required: true },
      source: { type: 'string' }
    }
  },
  beforeAfter: {
    render: (props) => <BeforeAfter before={props.before} after={props.after} />,
    schema: {
      before: { type: 'image', required: true },
      after: { type: 'image', required: true }
    }
  }
};
```

## API Routes

### `/api/posts/save-draft`
- Handles conflict resolution
- Updates KV with new content
- Maintains autosave history

### `/api/posts/[id]/publish`
- Updates status to 'publishing'
- Queues async job
- Returns immediately

### `/api/posts/status/[id]`
- Lightweight status check
- Used for polling during publish

### `/api/preview/enable`
- Enables Next.js draft mode
- Redirects to post preview

### `/api/webhooks/vercel`
- Receives build status updates
- Updates post status in KV
- Triggers notifications

## User Experience Enhancements

### Publishing Flow States
1. **Draft** → User is editing
2. **Publishing** → GitHub API called, commit in progress
3. **Building** → Vercel build started
4. **Live** → Build succeeded, post is accessible
5. **Failed** → With specific reason and retry option

### Visual Feedback Timeline
```
Click Publish → "Publishing..." (instant)
                ↓ (5-10s)
                "Building site..." (via webhook)
                ↓ (30-60s)
                "Published! View post →" (success)
                or
                "Failed: [reason]. Retry?" (error)
```

### Notes Feature
- Private notes field in publish sheet
- Useful for image credits, sources, todos
- Stored in KV but not in Git

## Security & Reliability

### GitHub App Authentication
```javascript
import { App } from '@octokit/app';

const app = new App({
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_PRIVATE_KEY,
});

const octokit = await app.getInstallationOctokit(
  process.env.GITHUB_INSTALLATION_ID
);

// Commit directly to main, bypassing protection
await octokit.rest.repos.createOrUpdateFileContents({
  owner: 'org',
  repo: 'blog',
  path: `posts/${slug}.mdx`,
  message: `Publish: ${title}`,
  content: Base64.encode(mdxContent),
  branch: 'main'
});
```

### Error Recovery
- Auto-retry with exponential backoff
- Clear error messages with actions
- Draft preservation on all failures
- Webhook-based status updates

## Analytics Integration
- **V1**: Link to Vercel Analytics dashboard
- **V2**: Embed key metrics in CMS dashboard
- Skip custom counters - use platform tools

## Export Functionality
```typescript
// Export all drafts as ZIP
async function exportDrafts() {
  const drafts = await kv.scan('post:*')
    .filter(post => post.status === 'draft');
    
  const zip = new JSZip();
  
  drafts.forEach(draft => {
    const mdx = blocksToMdx(draft.blocks);
    zip.file(`${draft.slug}.mdx`, mdx);
  });
  
  const blob = await zip.generateAsync({ type: 'blob' });
  download(blob, 'drafts.zip');
}
```

## Performance Targets
- Dashboard load: <1s
- Editor initialization: <500ms
- Auto-save latency: <200ms
- Conflict check: <100ms overhead
- Image optimization: <3s for 5MB image
- Publish initiation: <2s
- Status polling: 5s intervals
- Full publish cycle: ~60s

## Success Metrics
- Time to publish first post: <5 minutes
- Zero data loss from conflicts
- <1% publish failure rate
- Mobile editing satisfaction: >80%
- Support tickets: <1 per month

---

This enhanced plan incorporates all the improvements from our discussion with Gemini, creating a more robust, reliable, and delightful CMS experience.

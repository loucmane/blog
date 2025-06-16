# Admin Dashboard Implementation Plan

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

### Image Storage: Vercel Blob
- **Why**: Zero config, integrated with platform, simple SDK
- **Auto-optimization**: Sharp library for resize + WebP conversion
- **Flow**: Upload → Optimize → Store → Return URL

### File Structure
```
posts/
  my-awesome-post.mdx        # Published posts (flat structure)
_drafts/
  draft-123.mdx             # Auto-saved drafts (not in Git)
```

## User Interface Design

### 1. Dashboard (Post List)
```typescript
// Using shadcn/ui components
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Title</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Last Updated</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {posts.map(post => (
      <TableRow>
        <TableCell>{post.title}</TableCell>
        <TableCell>
          <Badge variant={post.status}>
            {post.status}
          </Badge>
        </TableCell>
        <TableCell>{formatRelativeTime(post.updated)}</TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger>•••</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>View</DropdownMenuItem>
              <DropdownMenuItem>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

<Button className="fixed bottom-8 right-8">
  + New Post
</Button>
```

### 2. Editor View (Zen Mode)
- Clean, centered column (max-width: 720px)
- Minimal chrome: just save indicator and publish button
- BlockNote editor takes center stage
- Auto-save every 10 seconds + on blur

### 3. Publishing Flow (Sheet Panel)
```typescript
<Sheet>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Publish Post</SheetTitle>
    </SheetHeader>
    
    <div className="space-y-4">
      <div>
        <Label>URL Slug</Label>
        <Input value={slug} onChange={setSlug} />
        <p className="text-sm text-muted">
          myblog.com/posts/{slug}
        </p>
      </div>
      
      <div>
        <Label>Featured Image</Label>
        <ImageUpload 
          value={featuredImage}
          onChange={setFeaturedImage}
        />
      </div>
      
      <div>
        <Label>Meta Description</Label>
        <Textarea 
          placeholder="Brief summary for search engines..."
          maxLength={160}
        />
      </div>
      
      <Button 
        onClick={handlePublish}
        className="w-full"
      >
        Publish Now
      </Button>
    </div>
  </SheetContent>
</Sheet>
```

## BlockNote → MDX Conversion

### Basic Conversion Logic
```javascript
function blocksToMdx(blocks) {
  return blocks.map(block => {
    switch (block.type) {
      case 'heading':
        return `${'#'.repeat(block.props.level)} ${block.content[0]?.text || ''}`;
      
      case 'paragraph':
        return convertInlineContent(block.content);
      
      case 'image':
        return `![${block.props.alt || ''}](${block.props.src})`;
      
      case 'bulletList':
        return block.children
          .map(item => `- ${convertInlineContent(item.content)}`)
          .join('\n');
      
      // Custom blocks
      case 'callout':
        return `<Callout type="${block.props.type}">
${convertInlineContent(block.content)}
</Callout>`;
      
      default:
        return '';
    }
  }).join('\n\n');
}
```

### Custom Blocks for Animal Protection
1. **PetitionEmbed**: Embed petition forms
2. **FactBox**: Statistics with sources
3. **ActionAlert**: Urgent action items
4. **BeforeAfter**: Side-by-side comparisons
5. **DonationButton**: Quick donation CTAs

## API Routes

### `/api/auth/[...nextauth]`
- Magic link authentication
- Restricted to admin email

### `/api/posts`
- GET: List all posts (with status)
- POST: Create new draft

### `/api/posts/[id]`
- GET: Get single post
- PUT: Update post (auto-save)
- DELETE: Delete post

### `/api/posts/[id]/publish`
- Converts draft to published
- Generates MDX file
- Commits to Git
- Triggers deployment

### `/api/upload-image`
```javascript
export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('file');
  
  // Optimize with Sharp
  const optimized = await sharp(file)
    .resize(1200, null, { withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  
  // Upload to Vercel Blob
  const { url } = await put(`images/${Date.now()}.webp`, optimized, {
    access: 'public',
  });
  
  return NextResponse.json({ url });
}
```

## Git Integration (Hidden from User)

### Auto-commit on Publish
```javascript
async function publishPost(post) {
  // 1. Convert blocks to MDX
  const mdx = blocksToMdx(post.blocks);
  
  // 2. Generate frontmatter
  const frontmatter = `---
title: "${post.title}"
date: "${new Date().toISOString()}"
featuredImage: "${post.featuredImage}"
slug: "${post.slug}"
---`;
  
  // 3. Write file
  const filePath = `posts/${post.slug}.mdx`;
  await writeFile(filePath, `${frontmatter}\n\n${mdx}`);
  
  // 4. Git operations (using isomorphic-git)
  await git.add({ fs, dir: '.', filepath: filePath });
  await git.commit({
    fs,
    dir: '.',
    message: `Publish: ${post.title}`,
    author: { name: 'Blog CMS', email: 'cms@blog.com' }
  });
  await git.push({
    fs,
    dir: '.',
    remote: 'origin',
    ref: 'main'
  });
}
```

## User Experience Details

### Visual Feedback
1. **Auto-save**: "Saving..." → "Saved ✓" indicator
2. **Publishing**: Button shows spinner, then success toast
3. **Build Status**: "Your site is updating (usually takes ~1 minute)"
4. **Image Upload**: Skeleton loader while uploading

### Error Handling
- Network errors: Retry with exponential backoff
- Validation: Inline, friendly error messages
- Failed publish: Keep in drafts, show clear error

### Mobile Experience
- Responsive layout (single column)
- Touch-friendly tap targets (min 44px)
- Focus on text editing, not complex formatting
- Simplified publish sheet

## MVP Scope

### Phase 1 (Core Functionality)
- [x] Magic link auth
- [x] Post list dashboard
- [x] BlockNote editor integration
- [x] Auto-save to drafts
- [x] Basic publish flow
- [x] Image upload with optimization
- [x] Git auto-commit

### Phase 2 (Enhancements)
- [ ] Media library UI
- [ ] Post scheduling
- [ ] Basic analytics
- [ ] Revision history
- [ ] Custom block types

### Phase 3 (Advanced)
- [ ] Multiple authors
- [ ] Categories/tags UI
- [ ] SEO optimization panel
- [ ] Social media preview
- [ ] Email notifications

## Security Considerations
- Single-user restriction via email
- All routes protected by auth middleware
- File uploads validated and sanitized
- Git operations isolated to server
- Environment variables for sensitive config

## Performance Targets
- Dashboard load: <1s
- Editor initialization: <500ms
- Auto-save latency: <200ms
- Image optimization: <3s for 5MB image
- Publish to live: ~60s (including build)

## Success Metrics
- Time to publish first post: <5 minutes
- Training required: None
- Support tickets: <1 per month
- User satisfaction: "It just works!"

---

This plan prioritizes simplicity and user experience while leveraging modern tools to create a powerful, Git-based CMS that feels like using Google Docs.
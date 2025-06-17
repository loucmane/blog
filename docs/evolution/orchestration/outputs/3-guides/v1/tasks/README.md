# Task-Based Developer Guides

> **Generated**: 2024-12-18
> **Purpose**: Practical, step-by-step guides for common development tasks
> **Target Audience**: Developers working on the Animal Protection Foundation blog

## Available Guides

### 1. [Add a Blog Feature](./01-add-blog-feature.md)
**Time**: 2-4 hours | **Complexity**: Medium

Learn how to add new features to the blog like comments, likes, or sharing functionality while maintaining performance standards and following established patterns.

**You'll learn:**
- Planning feature architecture
- Creating server actions
- Building accessible UI components
- Implementing optimistic updates
- Testing and performance validation

---

### 2. [Optimize Performance](./02-optimize-performance.md)
**Time**: 3-5 hours | **Complexity**: High

Master performance optimization techniques to maintain 98+ Lighthouse scores across all metrics.

**You'll learn:**
- Performance auditing techniques
- Bundle size optimization
- Image optimization strategies
- Code splitting patterns
- Caching strategies
- Core Web Vitals improvements

---

### 3. [Manage Content](./03-manage-content.md)
**Time**: 1-2 hours | **Complexity**: Low to Medium

Complete guide to content management including creating posts, handling sensitive content, and managing media assets.

**You'll learn:**
- Content sensitivity framework (3-tier system)
- MDX blog post creation
- Media optimization pipeline
- Content scheduling
- Search implementation

---

### 4. [Fix Common Issues](./04-fix-common-issues.md)
**Time**: 30 min - 2 hours | **Complexity**: Variable

Troubleshooting guide for common development issues with proven solutions and prevention strategies.

**You'll learn:**
- Quick diagnostic techniques
- Module resolution fixes
- Hydration error solutions
- TypeScript error fixes
- Build failure remedies
- Performance debugging

## Quick Start

### For New Features
1. Start with [Add a Blog Feature](./01-add-blog-feature.md)
2. Follow the step-by-step process
3. Validate with [Optimize Performance](./02-optimize-performance.md)

### For Content Work
1. Review [Manage Content](./03-manage-content.md)
2. Understand the sensitivity framework
3. Follow the content creation workflow

### When Things Break
1. Check [Fix Common Issues](./04-fix-common-issues.md)
2. Run the diagnostic script
3. Follow the specific solution for your issue

## Key Principles

These guides follow the project's core principles:

### 1. **Performance First**
- Every feature must maintain 98+ Lighthouse scores
- Test on 3G networks
- Optimize for global audience

### 2. **Accessibility Always**
- WCAG AA compliance minimum
- Keyboard navigation support
- Screen reader compatibility

### 3. **Four Theme System**
- Light (default)
- Dark (low-light comfort)
- Contrast (maximum accessibility)
- Gentle (trauma-sensitive)

### 4. **Content Sensitivity**
- Level 1: General audience
- Level 2: Moderate sensitivity
- Level 3: High sensitivity

## Project Structure Reference

```
packages/
├── web/                    # Main application
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React components
│   │   │   └── ui/       # shadcn/ui components
│   │   ├── lib/          # Utilities
│   │   └── types/        # TypeScript types
│   └── content/          # MDX content
├── ui/                    # Design system (tokens only)
├── shared/                # Shared types and utils
└── backend/              # External integrations
```

## Development Workflow

1. **Before Starting**
   ```bash
   git checkout main
   git pull
   pnpm install
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feat/{task-id}-{feature-name}
   ```

3. **During Development**
   - Follow the relevant guide
   - Test in all four themes
   - Check performance regularly
   - Update SESSION.md

4. **Before Committing**
   ```bash
   pnpm format
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

## Need More Help?

### Additional Resources
- **Patterns**: `/docs/ai/shared-context/patterns/codebase-patterns.md`
- **Standards**: `/docs/ai/shared-context/standards/`
- **Architecture**: `/docs/architecture/`
- **Components**: `/docs/development/shadcn-components.md`

### Common Questions

**Q: Which package should I add components to?**
A: All shadcn/ui and app-specific components go in `packages/web`. The `ui` package is for design tokens only.

**Q: How do I handle sensitive content?**
A: Use the ContentWarning component with appropriate sensitivity level (1-3). See the [Manage Content](./03-manage-content.md) guide.

**Q: My changes broke performance, what do I do?**
A: Follow the [Optimize Performance](./02-optimize-performance.md) guide, especially the "Emergency Performance Fixes" section.

**Q: Where do I track my work?**
A: Update SESSION.md with your progress and use TaskMaster for task management.

## Contributing to These Guides

Found an issue or have an improvement? These guides are living documents:

1. Note the issue in your SESSION.md
2. Make the improvement in your feature branch
3. Test the updated instructions
4. Submit with your PR

Remember: These guides should help developers be productive quickly while maintaining our high standards for performance, accessibility, and user experience.
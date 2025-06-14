# Animal Protection Foundation Blog

A high-performance, mission-driven platform for sharing rescue stories, field updates, and impact reports from global animal welfare work.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## 📚 Documentation

All project documentation is located in the [`/docs`](./docs) directory:

- [Architecture Overview](./docs/architecture/overview.md) - Monorepo structure and technology decisions
- [Design System](./docs/architecture/design-system.md) - UI package and theming architecture

## 📦 Packages

This monorepo contains:

- **`packages/web`** - Next.js 15 application with the blog
- **`packages/ui`** - Shared design system and components
- **`packages/backend`** - API services (Express.js)
- **`packages/shared`** - Cross-package utilities and types

## 🎯 Key Features

- **Content Management** - MDX-based content with React components
- **Performance First** - 98+ Lighthouse scores with SSG
- **Accessibility** - WCAG 2.1 AA compliant
- **Theme System** - 4 themes including trauma-sensitive options
- **Mobile First** - Optimized for global accessibility

## 🛠 Tech Stack

- Next.js 15 with App Router
- React 19
- TypeScript 5.8
- Tailwind CSS
- pnpm workspaces

## 📄 License

Private repository - All rights reserved
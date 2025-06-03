# Legendary Monorepo Template

A modern monorepo starter using [pnpm workspaces](https://pnpm.io/workspaces), React, and a shared UI package. Perfect for scalable web projects and code sharing.

## Features
- **pnpm workspaces** for fast, efficient monorepo management
- **React** web app (`packages/web`)
- **Shared UI package** (`packages/ui`)
- TypeScript-ready for shared packages
- Easy to extend with more packages (backend, utils, etc.)

## Getting Started

### 1. Install dependencies
```bash
pnpm install
```

### 2. Run the web app
```bash
pnpm --filter web dev
```

### 3. Build all packages
```bash
pnpm -r build
```

### 4. Add a new package
Create a new folder under `packages/` and add a `package.json`.

## Project Structure
```
legendary-monorepo-template/
├── packages/
│   ├── web/        # React app
│   └── ui/         # Shared UI components
├── pnpm-workspace.yaml
├── package.json    # Root scripts & devDeps
├── .gitignore
└── README.md
```

## Contributing
Feel free to fork, use as a template, or submit PRs!

## License
MIT

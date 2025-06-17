# Guide: Fix Common Issues

> **Time Estimate**: 30 minutes - 2 hours
> **Complexity**: Variable
> **Prerequisites**: Basic debugging skills, Chrome DevTools, understanding of Next.js and React

## Overview

This guide provides solutions to common issues you might encounter while developing the blog platform. Each solution includes diagnosis steps, fixes, and prevention strategies.

## Quick Diagnostics Script

Run this first when encountering issues:

```bash
#!/bin/bash
# Save as diagnose.sh

echo "🔍 Running diagnostics..."

# Check Node version
echo "Node version: $(node -v)"
echo "PNPM version: $(pnpm -v)"

# Check for common issues
echo -e "\n📦 Checking dependencies..."
pnpm install --frozen-lockfile

echo -e "\n🔧 Type checking..."
pnpm typecheck

echo -e "\n🧹 Linting..."
pnpm lint

echo -e "\n🏗️ Building..."
pnpm build

echo -e "\n✅ Diagnostics complete!"
```

## Common Issues and Solutions

### Issue 1: "Module not found" Errors

#### Symptoms
```
Module not found: Can't resolve '@/components/Button'
```

#### Diagnosis
```bash
# Check if file exists
ls packages/web/src/components/

# Check tsconfig paths
cat packages/web/tsconfig.json | grep -A 10 "paths"

# Check imports
grep -r "from.*Button" packages/web/src/
```

#### Solutions

**Solution 1: Fix import paths**
```typescript
// ❌ Wrong
import { Button } from '@/components/Button'

// ✅ Correct (for shadcn/ui)
import { Button } from '@/components/ui/button'

// ✅ Correct (for custom components)
import { BlogPost } from '@/components/BlogPost'
```

**Solution 2: Fix tsconfig.json**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Solution 3: Clear cache and rebuild**
```bash
# Clear Next.js cache
rm -rf packages/web/.next

# Clear node_modules
rm -rf node_modules packages/*/node_modules

# Reinstall
pnpm install --frozen-lockfile

# Rebuild
pnpm build
```

### Issue 2: Hydration Errors

#### Symptoms
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```

#### Common Causes and Fixes

**Cause 1: Date/Time rendering**
```typescript
// ❌ Bad: Different on server vs client
<p>Generated at {new Date().toLocaleString()}</p>

// ✅ Good: Consistent rendering
import { format } from 'date-fns'

<p>Published {format(post.publishedAt, 'MMM d, yyyy')}</p>
```

**Cause 2: Browser-only APIs**
```typescript
// ❌ Bad: window not available on server
const width = window.innerWidth

// ✅ Good: Check for client
const [width, setWidth] = useState(0)

useEffect(() => {
  setWidth(window.innerWidth)
}, [])
```

**Cause 3: Conditional rendering**
```typescript
// ❌ Bad: localStorage not on server
{localStorage.getItem('theme') === 'dark' && <DarkMode />}

// ✅ Good: Use state with effect
const [theme, setTheme] = useState('light')

useEffect(() => {
  setTheme(localStorage.getItem('theme') || 'light')
}, [])
```

### Issue 3: TypeScript Errors

#### Common Type Errors and Fixes

**Error: "Property does not exist on type"**
```typescript
// ❌ Error
const handleClick = (e) => {
  console.log(e.target.value) // Error!
}

// ✅ Fix 1: Type the event
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log(e.currentTarget.value)
}

// ✅ Fix 2: Type assertion
const handleClick = (e: any) => {
  const target = e.target as HTMLInputElement
  console.log(target.value)
}
```

**Error: "Type is not assignable"**
```typescript
// ❌ Error
interface Props {
  variant: 'primary' | 'secondary'
}
<Component variant="danger" /> // Error!

// ✅ Fix: Update type
interface Props {
  variant: 'primary' | 'secondary' | 'danger'
}
```

### Issue 4: Performance Issues

#### Diagnosis Tools
```typescript
// Add performance monitoring
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      console.log('LCP:', performance.getEntriesByType('largest-contentful-paint')[0])
      console.log('FID:', performance.getEntriesByType('first-input')[0])
    })
  }
}
```

#### Common Performance Fixes

**Fix 1: Remove large bundles**
```bash
# Analyze bundle
ANALYZE=true pnpm build

# Find large dependencies
du -sh node_modules/* | sort -h | tail -20
```

**Fix 2: Optimize images**
```typescript
// ❌ Bad
<img src="/hero.jpg" />

// ✅ Good
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
  placeholder="blur"
  blurDataURL={blurDataURL}
/>
```

**Fix 3: Code splitting**
```typescript
// ❌ Bad: Load everything
import HeavyChart from '@/components/HeavyChart'

// ✅ Good: Load when needed
const HeavyChart = dynamic(
  () => import('@/components/HeavyChart'),
  { 
    loading: () => <Skeleton className="h-96" />,
    ssr: false 
  }
)
```

### Issue 5: Styling Issues

#### Theme Not Applying

**Check 1: CSS variables**
```css
/* Check globals.css has all themes */
:root { /* light theme */ }
.dark { /* dark theme */ }
.contrast { /* contrast theme */ }
.gentle { /* gentle theme */ }
```

**Check 2: Theme provider**
```typescript
// app/layout.tsx should have
<ThemeProvider
  attribute="class"
  defaultTheme="light"
  enableSystem
  themes={['light', 'dark', 'contrast', 'gentle']}
>
  {children}
</ThemeProvider>
```

**Check 3: Tailwind config**
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
      }
    }
  }
}
```

### Issue 6: Build Failures

#### Common Build Errors

**Error: "Cannot find module in production"**
```bash
# Fix: Ensure all imports are correct case
# Linux is case-sensitive!

# Find mismatched cases
find . -name "*.tsx" -o -name "*.ts" | xargs grep -l "from.*[A-Z]"

# Common issue
import { button } from './Button' // ❌ Wrong case
import { button } from './button' // ✅ Correct
```

**Error: "ENOSPC: System limit for number of file watchers"**
```bash
# Linux fix
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# macOS fix
sudo launchctl limit maxfiles 65536 200000
```

### Issue 7: Server Actions Not Working

#### Diagnosis
```typescript
// Check server action setup
// 1. File must have 'use server' at top
'use server'

// 2. Function must be async
export async function myAction() {} // ✅

// 3. Cannot use hooks
export async function myAction() {
  const [state] = useState() // ❌ Error!
}
```

#### Common Fixes

**Fix 1: Form action binding**
```typescript
// ❌ Wrong
<form onSubmit={handleSubmit}>

// ✅ Correct for server actions
<form action={serverAction}>
```

**Fix 2: FormData handling**
```typescript
// Server action
export async function submitForm(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  // Process...
}

// Client component
const [state, formAction] = useFormState(submitForm, initialState)
<form action={formAction}>
```

### Issue 8: Git and Version Control Issues

#### Merge Conflicts in pnpm-lock.yaml

```bash
# Don't edit manually! Delete and regenerate
rm pnpm-lock.yaml
pnpm install

# Commit the new lock file
git add pnpm-lock.yaml
git commit -m "fix: regenerate pnpm-lock.yaml"
```

#### Large File Warnings

```bash
# Check file sizes
find . -type f -size +1M -not -path "./node_modules/*" -not -path "./.git/*"

# Add to .gitignore if needed
echo "*.mp4" >> .gitignore
echo "*.psd" >> .gitignore
```

### Issue 9: Environment Variable Issues

#### Variables Not Loading

**Check 1: File location**
```bash
# Should be in root
ls -la .env.local

# Not in packages/web/.env.local
```

**Check 2: Naming for client**
```typescript
// ❌ Won't be available in browser
process.env.API_KEY

// ✅ Will be available
process.env.NEXT_PUBLIC_API_KEY
```

**Check 3: Restart after changes**
```bash
# Environment variables are loaded at build time
# After changing .env.local:
pnpm dev # Restart required
```

### Issue 10: Testing Issues

#### Tests Failing Unexpectedly

**Fix 1: Clear Jest cache**
```bash
pnpm test -- --clearCache
```

**Fix 2: Update snapshots**
```bash
pnpm test -- -u
```

**Fix 3: Mock external dependencies**
```typescript
// __mocks__/next/image.tsx
const NextImage = (props) => <img {...props} />
NextImage.displayName = 'NextImage'
export default NextImage
```

## Prevention Strategies

### 1. Pre-commit Checks

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm typecheck
pnpm lint
pnpm test
```

### 2. IDE Setup

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### 3. Error Monitoring

```typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error('Application error:', error)
  }, [error])
  
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

## Emergency Fixes

### "Nothing is working" Nuclear Option

```bash
#!/bin/bash
# nuclear-reset.sh

echo "🔥 Nuclear reset initiated..."

# Stop all processes
pkill -f "next dev"
pkill -f "pnpm"

# Clean everything
rm -rf node_modules
rm -rf packages/*/node_modules
rm -rf packages/*/.next
rm -rf packages/*/dist
rm -rf .pnpm-store
rm pnpm-lock.yaml

# Reinstall
pnpm install

# Rebuild
pnpm build

echo "✅ Reset complete! Try 'pnpm dev' now"
```

## Debug Checklist

When encountering an issue:

1. **Check the basics**
   - [ ] Latest dependencies: `pnpm update`
   - [ ] Correct Node version: `node -v`
   - [ ] Clean build: `rm -rf .next && pnpm build`

2. **Check the error**
   - [ ] Read the full error message
   - [ ] Check browser console
   - [ ] Check terminal output
   - [ ] Check Next.js error overlay

3. **Isolate the problem**
   - [ ] Comment out recent changes
   - [ ] Test in different browser
   - [ ] Test in incognito mode
   - [ ] Create minimal reproduction

4. **Check documentation**
   - [ ] Next.js docs for framework issues
   - [ ] shadcn/ui docs for component issues
   - [ ] Project docs in `/docs`

## Getting Help

If you're still stuck:

1. **Search existing issues**
   ```bash
   # Search codebase for similar issues
   grep -r "YourErrorMessage" .
   ```

2. **Create detailed bug report**
   - Error message
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment details

3. **Minimal reproduction**
   ```bash
   # Create a minimal test case
   mkdir minimal-repro
   cd minimal-repro
   pnpm create next-app . --typescript --tailwind
   # Add only the code that causes the issue
   ```

## Resources

- [Next.js Error Reference](https://nextjs.org/docs/messages)
- [React Error Decoder](https://reactjs.org/docs/error-decoder.html)
- [TypeScript Error Reference](https://typescript.tv/errors/)
- Internal: `/docs/troubleshooting/`
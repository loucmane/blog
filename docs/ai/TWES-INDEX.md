# TWES Documentation Index

**The Complete Table of Contents for Total Workflow Excellence System**

> 🔍 **Quick Navigation**: Use Ctrl+F (Cmd+F on Mac) to search for specific topics

## 📋 Master Documents

### [TWES-SYSTEM-MAP.md](./TWES-SYSTEM-MAP.md)
Visual overview of the entire TWES system with quick links to all components.

### [TWES-INSIGHTS.md](./TWES-INSIGHTS.md)
Key findings from Multi-AI collaboration review, gaps identified, and improvement opportunities.

### [TWES-ACTION-PLAN.md](./TWES-ACTION-PLAN.md)
Four-phase implementation roadmap with priorities and success metrics.

## 🎯 Shared Context Documents

### 📐 Principles (How to Think)

#### [Feature Evaluation Framework](./shared-context/principles/feature-evaluation-framework.md)
- **Purpose**: Meta-framework for evaluating ANY new feature
- **Contains**: 5-gate evaluation process, decision matrix, red/green flags
- **Use when**: Considering any new feature or technology
- **Key concepts**: Mission alignment, principle compliance, technical feasibility

#### [Design Implementation Principles](./shared-context/principles/design-implementation-principles.md)
- **Purpose**: Guide for building with purpose, performance, and principle
- **Contains**: 4 core pillars, evaluation framework, implementation patterns
- **Use when**: Making design decisions, evaluating visual features
- **Key concepts**: Purpose over polish, warm minimalism, performance budgets

#### [Layout System Guidelines](./shared-context/principles/layout-system-guidelines.md)
- **Purpose**: Principled approach to structuring interfaces
- **Contains**: 5 pillars of layout, evaluation questions, patterns/anti-patterns
- **Use when**: Building ANY layout (including bento grids, card systems)
- **Key concepts**: Source order truth, adaptive fluidity, inclusive by default

#### [Animation & Motion Principles](./shared-context/principles/animation-motion-principles.md)
- **Purpose**: When and how to use motion meaningfully
- **Contains**: Motion value test, performance budgets, accessibility requirements
- **Use when**: Adding animations, transitions, or micro-interactions
- **Key concepts**: Motion with purpose, respect preferences, motion tokens

#### [Progressive Enhancement Strategy](./shared-context/principles/progressive-enhancement-strategy.md)
- **Purpose**: Building for everyone, everywhere
- **Contains**: Core experience definition, layering framework, network-aware patterns
- **Use when**: Implementing features that need to work globally
- **Key concepts**: Build up not down, network detection, enhancement priority matrix

#### [Modern CSS Features Evaluation](./shared-context/principles/modern-css-features-evaluation.md) 🆕
- **Purpose**: Evaluate cutting-edge CSS features responsibly
- **Contains**: Browser support thresholds, feature reference, implementation patterns
- **Use when**: Considering :has(), @container, @layer, or other modern CSS
- **Key concepts**: Progressive enhancement, feature detection, fallback strategies

### 🎨 Themes

#### [Warm Minimalism Philosophy](./shared-context/themes/warm-minimalism.md)
- **Purpose**: Core design philosophy and aesthetic approach
- **Contains**: Design principles, color systems, component guidelines
- **Use when**: Making any visual design decision
- **Key concepts**: Emotional warmth, visual simplicity, accessibility first

#### [Four Theme System](./shared-context/themes/four-themes.md)
- **Purpose**: Implementation details for light, dark, contrast, gentle themes
- **Contains**: Color values, contrast ratios, theme-specific considerations
- **Use when**: Implementing theme switching or adding themed components
- **Key concepts**: Systematic theming, accessibility modes, user preference

### 📏 Standards

#### [Performance Standards](./shared-context/standards/performance.md)
- **Purpose**: Concrete performance targets and budgets
- **Contains**: Core Web Vitals targets, bundle limits, testing strategies
- **Use when**: Optimizing performance, adding new dependencies
- **Key concepts**: 98+ Lighthouse, <100KB JS, global accessibility

#### [Accessibility Standards](./shared-context/standards/accessibility.md)
- **Purpose**: WCAG compliance and beyond
- **Contains**: Testing procedures, common patterns, assistive tech considerations
- **Use when**: Building any interactive component
- **Key concepts**: WCAG AA minimum, keyboard navigation, screen reader support

#### [Coding Conventions](./shared-context/standards/coding-conventions.md)
- **Purpose**: Consistent code style across the project
- **Contains**: TypeScript patterns, React conventions, naming standards
- **Use when**: Writing any code
- **Key concepts**: Type safety, component patterns, file organization

#### [File Structure Standards](./shared-context/standards/file-structure.md)
- **Purpose**: Consistent project organization
- **Contains**: Directory structure, naming conventions, import patterns
- **Use when**: Creating new files or restructuring
- **Key concepts**: Feature folders, barrel exports, clear boundaries

### 🧠 Philosophies

#### [Development Principles](./shared-context/philosophies/development-principles.md)
- **Purpose**: High-level approach to development
- **Contains**: Mission-driven development, user-first thinking
- **Use when**: Making architectural decisions
- **Key concepts**: Purpose-driven, respect for users, lean approach

#### [Content Sensitivity Framework](./shared-context/philosophies/content-sensitivity.md)
- **Purpose**: Handle sensitive content appropriately
- **Contains**: 3-tier classification, content warnings, age verification
- **Use when**: Displaying any content, especially rescue stories
- **Key concepts**: Trauma-informed design, progressive disclosure

### 🏗️ Patterns

#### [Monorepo Structure](./shared-context/patterns/monorepo-structure.md)
- **Purpose**: Understanding package architecture
- **Contains**: Package responsibilities, boundaries, dependencies
- **Use when**: Adding features, deciding package placement
- **Key concepts**: Clear boundaries, shared dependencies, independent deployment

#### [Common Patterns](./shared-context/patterns/common-patterns.md)
- **Purpose**: Reusable React and TypeScript patterns
- **Contains**: Hooks, component patterns, state management
- **Use when**: Building React components
- **Key concepts**: Composition, custom hooks, error boundaries

#### [Codebase Patterns](./shared-context/patterns/codebase-patterns.md) 🆕
- **Purpose**: Comprehensive patterns guide from our actual codebase
- **Contains**: File naming, component structure, styling, TypeScript, state management
- **Use when**: Writing any code in the project
- **Key concepts**: Next.js 15 patterns, React 19 features, performance optimization

#### [Discovered Patterns](./shared-context/discovered-patterns/) 🔬
- **Purpose**: High-confidence patterns extracted by documentation evolution system
- **Contains**: Component conventions (92% confidence), performance patterns (99 Lighthouse), development workflows
- **Use when**: Need proven patterns with real metrics, implementing new features, optimizing performance
- **Key files**:
  - [Component Conventions](./shared-context/discovered-patterns/component-conventions.md) - React.forwardRef, accessibility
  - [Performance Code Splitting](./shared-context/discovered-patterns/performance-code-splitting.tsx) - Dynamic imports, bundle optimization
  - [Add Blog Feature Guide](./shared-context/discovered-patterns/add-blog-feature-guide.md) - Step-by-step workflow

## 🛠️ Tool-Specific Documentation

### Claude Code Bridge (/for-claude-bridge/)

#### Prompts
- [Comprehensive Documentation](./for-claude-bridge/prompts/comprehensive-documentation.md) - Complex doc creation
- [Feature Implementation](./for-claude-bridge/prompts/feature-implementation.md) - Full feature development
- [Multi-File Refactoring](./for-claude-bridge/prompts/multi-file-refactoring.md) - Large-scale changes

#### Examples
- [Emergency Appeal Banner](./for-claude-bridge/examples/emergency-appeal-banner.md) - Real implementation

#### Guidelines
- [Best Practices](./for-claude-bridge/guidelines/best-practices.md) - When and how to use

#### Reference
- [Capabilities](./for-claude-bridge/reference/capabilities.md) - Technical details

### TaskMaster (/for-taskmaster/)

#### Prompts
- [Project Planning](./for-taskmaster/prompts/project-planning.md) - Initial project setup
- [Task Management](./for-taskmaster/prompts/task-management.md) - Ongoing management

#### Examples
- [TWES Implementation](./for-taskmaster/examples/twes-implementation.md) - Task 32 case study

#### Guidelines
- [Effective Planning](./for-taskmaster/guidelines/effective-planning.md) - Best practices

#### Reference
- [Commands](./for-taskmaster/reference/commands.md) - Complete API reference

### Agent Tool (/for-agent/)

#### Prompts
- [Codebase Exploration](./for-agent/prompts/codebase-exploration.md) - Search strategies

#### Examples
- [Finding Patterns](./for-agent/examples/finding-patterns.md) - Performance audit

#### Guidelines
- [Search Strategies](./for-agent/guidelines/search-strategies.md) - Advanced techniques

### Multi-AI Collaboration (/for-multi-ai-collab/)

#### Prompts
- [Code Review](./for-multi-ai-collab/prompts/code-review.md) - Review patterns
- [Deep Analysis](./for-multi-ai-collab/prompts/deep-analysis.md) - Complex analysis

#### Examples
- [TWES Validation](./for-multi-ai-collab/examples/twes-validation.md) - System review

#### Guidelines
- [Collaboration Patterns](./for-multi-ai-collab/guidelines/collaboration-patterns.md) - Effective use

### Zen MCP Server (/for-zen/) 🆕

#### Comprehensive Guide
- **[Zen Toolkit Guide](./for-zen/zen-toolkit-guide.md)** - Complete usage documentation
  - All 7 tools explained (chat, thinkdeep, codereview, precommit, debug, analyze, get_version)
  - Thinking modes (minimal to max)
  - Multi-AI orchestration capabilities
  - Best practices and common patterns
  - Advanced usage examples

#### Key Features
- **Multi-model collaboration**: Orchestrates Claude, Gemini, O3, and others
- **Extended reasoning**: Up to 32,768 tokens in max mode
- **Web search integration**: For current best practices
- **Automatic model selection**: Intelligently chooses best model for task

## 🧪 Testing Framework (/twes-tests/)

### Scenarios
- [Modern Homepage Implementation](./twes-tests/scenarios/modern-homepage-implementation.md)
- [Emergency Appeal Component](./twes-tests/scenarios/emergency-appeal-component.md)
- [Performance Optimization](./twes-tests/scenarios/performance-optimization.md)
- [Task 04 shadcn Installation](./twes-tests/scenarios/task-04-shadcn-installation.md)

### Results
- [2025-06-11 Modern Homepage](./twes-tests/results/2025-06-11-modern-homepage.md) - 70% baseline
- [2025-06-11 Task 04](./twes-tests/results/2025-06-11-task-04-shadcn.md) - 85% success
- [2025-06-12 Modern Homepage Retest](./twes-tests/results/2025-06-12-modern-homepage-retest.md) - 92% success 🆕
- [2025-06-12 Modern Homepage Gemini](./twes-tests/results/2025-06-12-modern-homepage-gemini.md) - 95% success 🆕

### Workflows
- [Quick Test Guide](./twes-tests/workflows/quick-test-guide.md) - How to test
- [Scenario Template](./twes-tests/workflows/scenario-template.md) - Create new tests

## 📚 Protocols

- [TWES Testing Protocol](./protocols/twes-testing-protocol.md) - Systematic testing methodology

## 🔍 Quick Topic Finder

### Performance & Optimization
- Performance Standards → [link](./shared-context/standards/performance.md)
- Progressive Enhancement → [link](./shared-context/principles/progressive-enhancement-strategy.md)
- Animation Performance → [link](./shared-context/principles/animation-motion-principles.md#performance-budget)

### Accessibility & Inclusion
- Accessibility Standards → [link](./shared-context/standards/accessibility.md)
- Content Sensitivity → [link](./shared-context/philosophies/content-sensitivity.md)
- Layout Accessibility → [link](./shared-context/principles/layout-system-guidelines.md#pillar-3)

### Modern Features
- Feature Evaluation → [link](./shared-context/principles/feature-evaluation-framework.md)
- Modern CSS → [link](./shared-context/principles/modern-css-features-evaluation.md)
- Animation/Motion → [link](./shared-context/principles/animation-motion-principles.md)

### Architecture & Structure
- Monorepo Structure → [link](./shared-context/patterns/monorepo-structure.md)
- File Structure → [link](./shared-context/standards/file-structure.md)
- Common Patterns → [link](./shared-context/patterns/common-patterns.md)

### Design & Theming
- Warm Minimalism → [link](./shared-context/themes/warm-minimalism.md)
- Four Themes → [link](./shared-context/themes/four-themes.md)
- Design Principles → [link](./shared-context/principles/design-implementation-principles.md)

## 🛠️ Implementation Patterns & How-To Guide

This section provides quick access to our common implementation patterns and workflows. Find out "how we do things" in this project.

### 📊 Living Pattern Catalog 🆕
- **[Pattern Catalog Overview](./patterns-catalog/README.md)** - Real patterns from real code
- **[Implementation Plan](./patterns-catalog/living-pattern-catalog-plan.md)** - Full technical specification
- **[Strategic Implementation Plan](./patterns-catalog/strategic-implementation-plan.md)** - Phased approach (Auditor → Strategist)
- **[Gemini Enhancement Suggestions](./patterns-catalog/gemini-enhancement-suggestions.md)** - Advanced features and solutions
- **Purpose**: Automated extraction and documentation of actual code patterns
- **Features**: Quality scoring, evolution tracking, anti-pattern detection
- **Timeline**: 24-week phased implementation
- **Status**: 🚧 In Planning

### Component Development

#### How We Create New Components
- **Approach**: Component-first with compound patterns, TypeScript interfaces, and theme integration from the start
- **Location**: `/packages/web/src/components/` for app-specific, `/packages/ui/` for shared design tokens only
- **Command/Example**: 
  ```tsx
  interface ComponentProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
    className?: string;
  }
  ```
- **See**: [Common Patterns](./shared-context/patterns/common-patterns.md), [File Structure](./shared-context/standards/file-structure.md)

#### How We Use shadcn/ui
- **Approach**: Copy components into web package, customize for our themes, track in documentation
- **Location**: `/packages/web/src/components/ui/` (NOT in ui package)
- **Command/Example**: `pnpm dlx shadcn@latest add button`
- **See**: [shadcn Components Doc](/docs/development/shadcn-components.md), CLAUDE.md rules

#### How We Handle Component Styling
- **Approach**: Design tokens via CSS variables, theme-aware from the start, all 4 themes tested
- **Location**: Component files use `className` with Tailwind utilities and CSS variables
- **Command/Example**: 
  ```tsx
  className={cn(
    "bg-background text-foreground",
    "hover:bg-accent hover:text-accent-foreground",
    className
  )}
  ```
- **See**: [Theme Integration Pattern](./shared-context/principles/design-implementation-principles.md#theme-system-integration-pattern)

### Styling & CSS

#### How We Use Tailwind
- **Approach**: Utility-first with design tokens, no arbitrary values, semantic class names for complex patterns
- **Location**: Throughout components, with utilities defined in `globals.css`
- **Command/Example**: `text-foreground` not `text-gray-900`, use `var(--space-m)` not `mr-4`
- **See**: [Warm Minimalism](./shared-context/themes/warm-minimalism.md), [Coding Conventions](./shared-context/standards/coding-conventions.md)

#### How We Implement Themes
- **Approach**: CSS variables on `:root` and theme classes, systematic token naming
- **Location**: `/packages/web/src/app/globals.css` for definitions
- **Command/Example**:
  ```css
  .dark {
    --background: 27 10% 10%;
    --foreground: 27 5% 90%;
  }
  ```
- **See**: [Four Theme System](./shared-context/themes/four-themes.md)

#### How We Handle Responsive Design
- **Approach**: Mobile-first, content-driven breakpoints, intrinsic design patterns
- **Location**: Component level using Tailwind responsive prefixes
- **Command/Example**: Start with base mobile styles, enhance with `sm:`, `md:`, `lg:`
- **See**: [Layout Guidelines](./shared-context/principles/layout-system-guidelines.md#pillar-2-adaptive-fluidity)

### Performance Patterns

#### How We Optimize Images
- **Approach**: Next.js Image component, lazy loading, multiple formats, defined dimensions
- **Location**: Always use `next/image`, never raw `<img>` tags
- **Command/Example**:
  ```tsx
  <Image 
    src="/hero.jpg" 
    alt="Rescued cat" 
    width={800} 
    height={600}
    priority={isAboveFold}
  />
  ```
- **See**: [Performance Standards](./shared-context/standards/performance.md)

#### How We Handle Code Splitting
- **Approach**: Route-based splitting automatic, component splitting for heavy features, network-aware loading
- **Location**: Use dynamic imports for large components
- **Command/Example**:
  ```tsx
  const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
    loading: () => <Skeleton />,
    ssr: false
  });
  ```
- **See**: [Progressive Enhancement](./shared-context/principles/progressive-enhancement-strategy.md#network-aware-decision-framework)

#### How We Implement Progressive Enhancement
- **Approach**: HTML first, enhance with CSS, enhance with JS, check network conditions
- **Location**: Every feature starts with working HTML
- **Command/Example**: Define Layer 0 (HTML), Layer 1 (CSS), Layer 2 (JS), Layer 3 (Rich)
- **See**: [Progressive Enhancement Strategy](./shared-context/principles/progressive-enhancement-strategy.md)

### Development Workflow

#### How We Start New Features
- **Approach**: Evaluate with 5-gate framework, create branch, update SESSION.md
- **Location**: Feature branches from main
- **Command/Example**: 
  ```bash
  git checkout -b feat/{task-id}-{description}
  # Example: feat/004-shadcn-ui-setup
  ```
- **See**: [Feature Evaluation Framework](./shared-context/principles/feature-evaluation-framework.md), CLAUDE.md

#### How We Handle Session Continuity
- **Approach**: Update SESSION.md at start, during (checkpoints), and end of each session
- **Location**: `/SESSION.md` at project root
- **Command/Example**: Run `date "+%Y-%m-%d %H:%M %Z"` and COPY-PASTE output
- **See**: CLAUDE.md Session Management section

#### How We Use MCP Tools
- **Approach**: Right tool for right job, explain before using, batch operations when possible
- **Location**: Various based on task
- **Command/Example**:
  - **Claude Code Bridge**: Complex multi-file operations
  - **TaskMaster**: Project planning and tracking
  - **Agent**: Search and exploration
  - **Multi-AI**: Reviews and second opinions
- **See**: Tool-specific docs in `/docs/ai/for-*/`

### Testing & Quality

#### How We Ensure Accessibility
- **Approach**: WCAG AA minimum, test with keyboard, test with screen reader, all 4 themes
- **Location**: Every component and page
- **Command/Example**: Tab through interface, use axe DevTools, test with NVDA/JAWS
- **See**: [Accessibility Standards](./shared-context/standards/accessibility.md)

#### How We Validate Performance
- **Approach**: Lighthouse CI, real device testing, network throttling, performance budgets
- **Location**: Pre-commit and CI/CD pipeline
- **Command/Example**: 
  ```bash
  # Local testing
  npm run build && npm run analyze
  # Lighthouse: aim for 98+ scores
  ```
- **See**: [Performance Standards](./shared-context/standards/performance.md)

#### How We Handle Cross-Theme Testing
- **Approach**: Test all 4 themes during development, especially contrast theme
- **Location**: Browser DevTools theme switcher
- **Command/Example**: Toggle through light → dark → contrast → gentle
- **See**: [Theme System Integration](./shared-context/principles/design-implementation-principles.md#theme-system-integration-pattern)

### Git & Version Control

#### How We Write Commit Messages
- **Approach**: Conventional commits, clear and descriptive
- **Location**: Every commit
- **Command/Example**: 
  ```bash
  # Using the gac alias (IMPORTANT: use single quotes inside)
  gac "feat: add 'Modern Blog' homepage"
  gac "fix: resolve theme switcher visibility"
  ```
- **See**: CLAUDE.md Git Commit Alias section

#### How We Create Pull Requests
- **Approach**: Clear description, link to task, include test plan
- **Location**: GitHub PRs to main branch
- **Command/Example**: Use `gh pr create` with template
- **See**: CLAUDE.md Creating Pull Requests section

## 📊 Document Statistics

- **Total Documents**: 53 (including Pattern Catalog)
- **Principle Documents**: 7
- **Tool-Specific Docs**: 18
- **Test Scenarios**: 4
- **Test Results**: 4
- **Pattern Catalog Docs**: 4
- **Last Updated**: 2025-06-12

## 🔄 Avoiding Duplication

To prevent redundancy:
1. **Check this index** before creating new documentation
2. **Link to existing docs** rather than repeating content
3. **Update this index** when adding new documents
4. **Use cross-references** between related documents

## 📝 Maintenance Notes

This index should be updated whenever:
- New documentation is added
- Document purposes change significantly
- Documents are reorganized or renamed
- Major sections are added to existing documents

---

*Use this index as your primary navigation tool for the TWES documentation system.*
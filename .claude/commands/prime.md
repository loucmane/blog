**Context Window Prime**

Load essential project context for the Animal Protection Foundation Blog.

**EXECUTION:**

RUN: git ls-files | grep -E "^(packages|docs|scripts)" | head -50

READ: README.md CLAUDE.md SESSION.md

READ: docs/ai/TWES-INDEX.md docs/ai/shared-context/standards/performance.md

READ: docs/development/shadcn-components.md docs/architecture/monorepo-structure.md

**PURPOSE:**
This command loads critical project information into Claude's context:
1. Project file structure (filtered to key directories)
2. Core documentation (README, CLAUDE.md, SESSION.md)
3. AI system documentation (TWES index and performance standards)
4. Current development state (shadcn components and architecture)

**USAGE:**
Run `/prime` at the start of any Claude session to establish project context quickly.

**WHAT GETS LOADED:**
- Project overview and mission
- Development rules and conventions
- Performance targets (98+ Lighthouse)
- Current component registry
- Monorepo structure
- Session continuity information
- AI documentation system overview

This ensures Claude understands:
- What we're building (high-performance blog)
- How we're building it (standards and conventions)
- Current state (components and progress)
- How to help effectively (TWES system)
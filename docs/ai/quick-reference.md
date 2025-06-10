# Quick Reference - Current Project State

Last Updated: 2025-06-10 17:30 CEST

## Current Status
- **Branch**: feat/004-shadcn-ui-setup
- **Current Task**: Ready to create modern blog mockup (Task 31)
- **Last Action**: Installed 13 additional shadcn components

## Active Work
- **Task 4**: shadcn/ui setup (subtasks 4.1-4.2 complete, 4.3-4.6 pending)
- **Task 31**: Modern Blog Mockup (created, 15 subtasks, ready to start)
- **Task 8**: Homepage (depends on Task 31 completion)

## Available Resources

### Installed shadcn Components (18 total)
**Original 5**: button, card, input, dialog, sheet
**New 13**: badge, avatar, tabs, progress, skeleton, scroll-area, separator, dropdown-menu, popover, command, switch, hover-card, aspect-ratio

### Key Documents Created
- Design Brief: `/docs/design/modern-blog-mockup-brief.md`
- Component Registry: `/docs/development/shadcn-components.md`
- AI Docs Plan: `/docs/ai/documentation-structure-plan.md`
- Workflow Theory: `/docs/ai/optimal-workflow-theory.md`
- This Quick Reference: `/docs/ai/quick-reference.md`

### AI Docs to Create (Phase 1 Priority)
1. `/docs/ai/core/file-structure.md` - Where everything lives
2. `/docs/ai/core/theme-system.md` - 4-theme implementation details
3. `/docs/ai/core/component-patterns.md` - Component best practices
4. `/docs/ai/tools/claude-bridge-mockup.md` - Mockup creation guide

See `/docs/ai/documentation-structure-plan.md` for complete plan

## Documentation Philosophy Evolution
- Started: Considering splitting CLAUDE.md when it gets too long
- Realized: Keep CLAUDE.md as-is (working well at 450 lines)
- Breakthrough: Create tool-specific docs for MCP tools
- Key Insight: **Layered approach** - Detailed prompt + Reference docs = Optimal output
- Not replacing CLAUDE.md, just extending it with focused references

## Next Immediate Steps
1. Create Phase 1 AI documentation (see list above)
2. Use Claude Code Bridge to create mockup
3. Provide BOTH detailed prompt AND reference docs to tool

### Example of Layered Approach:
```
Prompt: "Create modern blog mockup with bento grid..."
PLUS: "Refer to /docs/ai/mockup-guide.md, /docs/ai/theme-rules.md"
= Tool gets immediate direction + deep context
```

## Important Context
- Using 4-theme system (light, dark, contrast, gentle)
- All components in web package, NOT ui package
- Performance target: Lighthouse 95+
- Using pnpm, not npm

## Git Alias
```bash
gac "message here"  # git add . && git commit -m
# Use single quotes inside message, not double quotes
```

## Quick Commands
```bash
# Start dev server
cd packages/web && pnpm dev

# Install shadcn component
pnpm dlx shadcn@latest add [component]

# Check task status
mcp__taskmaster-ai__get_task --id 31
```

---
This file should be updated at the start of each session with current state.
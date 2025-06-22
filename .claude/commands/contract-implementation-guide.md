# Contract Implementation Guide

## Overview

This guide addresses practical implementation questions for using contracts in the orchestration system, providing concrete strategies and examples for each challenge.

## 1. Contract Embedding Strategies

### Option A: Direct Embedding in Orchestrate-and-Test
**Implementation:**
```markdown
## Contract for Task 7: Core Layout Components

### Component Specifications
1. **Header Component**
   - Props: `theme`, `logoSrc`, `navItems[]`
   - Features: Theme toggle, responsive navigation
   - Constraints: 44px minimum touch targets

2. **Footer Component**
   - Props: `theme`, `links[]`, `copyright`
   - Features: Social links, newsletter signup
   - Constraints: Accessible landmark navigation
```

**Pros:**
- Single source of truth
- No file management overhead
- Always available in context

**Cons:**
- Clutters command file
- Hard to version independently
- Increases prompt size

### Option B: Separate Contract Files
**Implementation:**
```bash
.claude/contracts/
├── task-07-layout-components.yaml
├── task-08-theme-system.yaml
└── task-09-data-layer.yaml
```

**Pros:**
- Clean separation of concerns
- Easy to version and update
- Reusable across sessions

**Cons:**
- Requires file reading overhead
- Agents must remember to check

### Option C: Hybrid Approach (Recommended)
**Implementation:**
```markdown
## Task Contract Reference
Contract: .claude/contracts/task-07-layout-components.yaml
Summary: Header/Footer components with theme support

### Quick Reference
- Header: Theme toggle, responsive nav
- Footer: Social links, newsletter
- Both: 44px touch targets, ARIA landmarks
```

**Pros:**
- Best of both worlds
- Minimal prompt overhead
- Full details available when needed

## 2. Decision Log Implementation

### Approach 1: Inline Decision Tracking
```markdown
## Decision Log

### Decision 001: Component Library Choice
**Date**: 2024-01-20
**Decision**: Use shadcn/ui for base components
**Rationale**: 
- Copy-paste ownership model
- Full customization control
- Aligns with performance goals
**Trade-offs**: More initial setup vs pre-built solutions
**Impact**: All UI components will extend shadcn patterns
```

### Approach 2: Structured YAML Format
```yaml
decisions:
  - id: D001
    date: 2024-01-20
    title: "Component Library Choice"
    decision: "shadcn/ui"
    alternatives_considered:
      - "Material UI"
      - "Ant Design"
      - "Custom from scratch"
    rationale:
      - "Copy-paste ownership"
      - "Performance control"
    impact:
      - "UI consistency patterns"
      - "Bundle size optimization"
```

### Approach 3: Lightweight Markdown Table (Recommended)
```markdown
## Decision Log

| ID | Date | Decision | Rationale | Impact |
|----|------|----------|-----------|---------|
| D001 | 2024-01-20 | shadcn/ui for components | Ownership, performance | All UI patterns |
| D002 | 2024-01-21 | CSS Modules over CSS-in-JS | Build time, caching | Styling approach |
| D003 | 2024-01-22 | Server Components default | Performance, SEO | Component architecture |
```

## 3. Reducing Synthesis Agent Cognitive Load

### Strategy 1: Chunked Synthesis
```markdown
## Synthesis Instructions

### Phase 1: Component Analysis Only
Focus on: Header and Footer implementation
Ignore: Theme system, data layer, testing

### Phase 2: Integration Analysis
Focus on: How components connect
Previous context: Phase 1 summary only
```

### Strategy 2: Template-Based Synthesis
```markdown
## Synthesis Template

### Component Completion Checklist
- [ ] Props defined and typed
- [ ] Accessibility requirements met
- [ ] Theme integration complete
- [ ] Tests written and passing

### Quick Assessment (fill in):
1. Completion: ___% 
2. Blockers: ___
3. Next step: ___
```

### Strategy 3: Progressive Summarization (Recommended)
```markdown
## For Synthesis Agent

### Layer 1: Status Check (30 seconds)
- Task status: In Progress / Complete / Blocked
- Files modified: Count only
- Tests status: Pass / Fail / Not Run

### Layer 2: Key Changes (if needed)
- Major components added
- Breaking changes
- Integration points

### Layer 3: Deep Dive (if critical)
- Specific implementation details
- Complex problem solutions
```

## 4. File Structure Recommendations

### Flat Structure (Small Projects)
```
.claude/
├── orchestrate-and-test.md
├── contracts/
│   └── all-tasks.yaml
└── decisions.md
```

### Hierarchical Structure (Medium Projects)
```
.claude/
├── commands/
│   └── orchestrate-and-test.md
├── orchestration/
│   ├── contracts/
│   │   ├── current/
│   │   │   └── task-07.yaml
│   │   └── completed/
│   ├── decisions/
│   │   └── 2024-01-decisions.md
│   └── synthesis/
│       └── templates.md
```

### Domain-Based Structure (Large Projects - Recommended)
```
.claude/
├── commands/
│   └── orchestrate-and-test.md
├── orchestration/
│   ├── active-sprint/
│   │   ├── contract.yaml
│   │   ├── decisions.md
│   │   └── progress.md
│   ├── backlog/
│   │   └── future-contracts/
│   └── completed/
│       └── sprint-001/
```

### Integration with Existing Structure
```
project-root/
├── .claude/
│   └── orchestration/     # Orchestration-specific
├── .taskmaster/           # Task management
├── .serena/              # Memory management
└── docs/
    └── ai/               # Reference documentation
```

## 5. Agent Prompt Size Optimization

### Technique 1: Context Windowing
```markdown
## Implementation Agent Context

### Essential Context (Always Include)
- Current task contract
- Recent decisions (last 3)
- Active file list

### Optional Context (Include if <2000 tokens)
- Previous task outcomes
- Full decision history
- Related documentation
```

### Technique 2: Reference Pointers
```markdown
## Compact Context Format

Task: Layout Components (see contract)
Dependencies: Theme system ready
Key decisions: D001, D003, D007
Modified files: 5 (see progress.md)
```

### Technique 3: Progressive Loading
```python
# Pseudo-code for context building
def build_agent_context(task_id, token_limit=4000):
    context = load_essential(task_id)  # ~1000 tokens
    
    if tokens_remaining() > 2000:
        context += load_recent_decisions()  # ~500 tokens
    
    if tokens_remaining() > 1000:
        context += load_test_results()  # ~500 tokens
    
    return context
```

### Technique 4: Smart Summarization (Recommended)
```markdown
## Context Summary for Implementation

### Task Summary (50 tokens)
Building Header/Footer with theme support and 44px touch targets.

### Key Constraints (30 tokens)
- Use shadcn/ui patterns
- Server Components default
- No client-side state

### References (20 tokens)
- Full spec: ./contracts/task-07.yaml
- Decisions: ./decisions.md#D001-D003
```

## Best Practices Summary

1. **Contract Storage**: Use hybrid approach - summary in command, details in separate files
2. **Decision Logging**: Lightweight markdown tables with ID system
3. **Cognitive Load**: Progressive summarization with templates
4. **File Structure**: Domain-based with clear active/completed separation
5. **Prompt Optimization**: Smart summarization with reference pointers

## Implementation Checklist

- [ ] Create `.claude/orchestration/` directory structure
- [ ] Set up contract template in YAML
- [ ] Initialize decision log with markdown table
- [ ] Create synthesis templates for different complexity levels
- [ ] Implement reference pointer system in main command
- [ ] Test with small task before scaling

## Example: Minimal Starting Setup

```bash
# Create structure
mkdir -p .claude/orchestration/{contracts,decisions,synthesis}

# Create first contract
cat > .claude/orchestration/contracts/active.yaml << 'EOF'
task_id: "007"
title: "Core Layout Components"
summary: "Header/Footer with theme support"
key_requirements:
  - "44px touch targets"
  - "Theme toggle in header"
  - "Accessible landmarks"
EOF

# Initialize decision log
cat > .claude/orchestration/decisions/log.md << 'EOF'
# Decision Log

| ID | Date | Decision | Rationale |
|----|------|----------|-----------|
| D001 | $(date +%Y-%m-%d) | Start with Header component | Foundation for navigation |
EOF

# Create synthesis template
cat > .claude/orchestration/synthesis/template.md << 'EOF'
## Quick Status
- [ ] Contract requirements met
- [ ] Tests passing
- [ ] Integration complete

## 30-Second Summary
[One paragraph here]
EOF
```

This provides a practical starting point that can evolve with your needs.
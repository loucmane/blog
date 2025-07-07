# Claude Template System

A modular AI workflow system - simpler, more integrated, and context-efficient.

## Overview

This modular system solves the context overhead problem of monolithic documentation. By splitting the 1400+ line CLAUDE.md into focused modules, the AI loads only what's relevant (200-600 lines), improving performance and reducing friction.

## System Evolution

This system evolved from recognizing that monolithic documentation creates friction. The new modular approach provides:
- **70% less context loaded** per task
- **Simpler navigation** (5 files vs deep directories)
- **Built-in knowledge persistence** (prevents circular discussions)
- **Improvement-while-building** methodology

## Core Philosophy

- **Context Efficiency**: Load only what's needed for the current task
- **Knowledge Persistence**: Never lose insights or revisit settled decisions
- **Parallel Development**: Test improvements without disrupting current work
- **Continuous Evolution**: System improves through use

## System Architecture

### 5-File Modular Structure

1. **CLAUDE-NEW.md** (~150 lines) - Navigation Hub
   - Quick links and shortcuts
   - Critical reminders only
   - Task-specific navigation
   - Always loaded first

2. **WORKFLOWS.md** (~400 lines) - Universal Patterns
   - SESSION.md complete lifecycle
   - Memory management with Serena
   - Todo tracking discipline
   - Documentation workflows
   - Pre-flight checklists

3. **TOOLS.md** (~300 lines) - MCP Configurations
   - Tool registry and setup
   - Selection matrices
   - Usage patterns
   - Integration guidelines

4. **CONVENTIONS.md** (~200 lines) - Standards
   - Git workflows (gac alias!)
   - Commit message formats
   - Code style preferences
   - Communication patterns

5. **PROJECT.md** (~300 lines) - Project-Specific
   - Tech stack details
   - Architecture decisions
   - Custom configurations
   - Project-specific patterns

### Knowledge Persistence Layer

Three files that maintain continuity across sessions:

1. **DECISIONS.md** - Settled decisions (don't revisit)
2. **EVOLUTION.md** - Journey timeline (how we got here)
3. **SESSION-BRIDGE.md** - Handoff instructions (where to go next)

## Current Status

🟡 **In Development** - Phase 1 Complete, Phase 2 In Progress

- ✅ Phase 1: Knowledge Persistence Layer created
- 🚧 Phase 2: Documentation updates (this file + SYSTEM-DESIGN.md)
- 📋 Phase 3: Content extraction from CLAUDE.md
- 📋 Phase 4: Testing and refinement

See [tracker.md](./tracker.md) for detailed progress.

## Implementation Approach

### Extraction-First Strategy
Rather than creating theoretical templates, we're extracting from the battle-tested CLAUDE.md in the MomsBlog project. This ensures all patterns are proven to work.

### Parallel Development
The current CLAUDE.md remains active while we develop the modular system. This allows:
- No disruption to ongoing work
- A/B testing of efficiency
- Easy rollback if needed
- Gradual migration

## Directory Structure

```
claude-template-system/
├── README.md                    # This file (system overview)
├── tracker.md                   # Development progress tracker
├── implementation-plan.md       # 4-phase implementation plan
├── DECISIONS.md                 # Settled decisions ⭐ NEW
├── EVOLUTION.md                 # Journey timeline ⭐ NEW
├── SESSION-BRIDGE.md            # Session handoff ⭐ NEW
├── design/
│   ├── architecture-decisions.md
│   └── content-mapping.md
├── templates/                   # Extraction destination (coming)
│   ├── CLAUDE-NEW.md           
│   ├── WORKFLOWS.md            
│   ├── TOOLS.md                
│   ├── CONVENTIONS.md          
│   └── PROJECT.md              
└── examples/                    # Future examples
```

## Why This Modular Approach?

### The Problem with Monolithic Documentation
- **1400+ lines loaded every time** - massive context overhead
- **Much irrelevant content** - searching for needles in haystacks
- **Cognitive friction** - scrolling through unrelated sections
- **Update difficulty** - changes ripple through entire document

### The Modular Solution
- **Context-aware loading** - AI loads only relevant modules
- **Clear separation** - each file has one purpose
- **Smart navigation** - always know where to find things
- **Knowledge persistence** - never lose insights or redo work

## Key Benefits

### For AI Performance
- **70% reduction** in loaded context
- **Faster processing** and responses
- **Better focus** on current task
- **Reduced hallucination risk** from irrelevant context

### For Developer Experience
- **Quick navigation** between focused files
- **Easy updates** to specific sections
- **Clear mental model** of system structure
- **Self-documenting** through knowledge persistence

### For Project Evolution
- **Continuous improvement** built into workflow
- **Captured learnings** in EVOLUTION.md
- **No repeated mistakes** via DECISIONS.md
- **Smooth handoffs** with SESSION-BRIDGE.md

## Future Vision

Once proven on the MomsBlog project, this system will:
- Create reusable templates for new projects
- Support different project types (web, API, CLI)
- Enable 5-minute project initialization
- Share learnings across all projects

## Related Documentation

- [Tracker](./tracker.md) - Current development progress
- [Implementation Plan](./implementation-plan.md) - Detailed roadmap
- [Decisions](./DECISIONS.md) - Why we made these choices
- [Evolution](./EVOLUTION.md) - How we got here
- [Session Bridge](./SESSION-BRIDGE.md) - Where we're going
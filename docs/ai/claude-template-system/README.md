# Claude Template System

A modular, reusable template system for AI-assisted development workflows across different projects.

## Overview

This template system transforms the monolithic CLAUDE.md approach into a modular structure that can be quickly deployed to any new project while maintaining all the powerful workflows and patterns that have been refined over time.

## Core Philosophy

- **Personal Productivity**: Optimized for individual developer efficiency
- **Quick Setup**: Get from new project to productive in minutes
- **Flexible Structure**: Adapts to different project types (web apps, APIs, CLIs, etc.)
- **Preserve What Works**: Maintains proven patterns like SESSION.md, memory management, and todo tracking

## System Components

### 1. **CLAUDE.md** - The Aggregator
The main file that Claude reads, which references all other components.

### 2. **WORKFLOWS.md** - Development Patterns
- SESSION.md lifecycle management
- Pre-flight checklists
- Memory patterns with Serena
- Todo tracking discipline
- Documentation workflows

### 3. **TOOLS.md** - MCP Tool Configuration
- Serena setup and usage patterns
- TaskMaster configuration
- Agent tool guidelines
- Tool selection matrix

### 4. **CONVENTIONS.md** - Standards & Practices
- Git workflow (branches, commits, PRs)
- Code style preferences
- File naming patterns
- Documentation standards

### 5. **PROJECT.md** - Project-Specific Configuration
- Project name and paths
- Tech stack details
- Package structure
- Custom commands
- Project-specific patterns

## Quick Start

1. Copy the `templates/` folder to your new project
2. Edit `PROJECT.md` with your project details
3. Review and adjust other files as needed
4. Start your first session with SESSION.md

## Directory Structure

```
claude-template-system/
├── README.md                    # This file
├── tracker.md                   # Development tracker for this system
├── implementation-plan.md       # Detailed implementation plan
├── design/                      # Design decisions and architecture
├── templates/                   # The actual template files
├── examples/                    # Example implementations
└── scripts/                     # Setup automation (optional)
```

## Key Features

### Session Continuity
- Automatic session tracking with SESSION.md
- Serena memory integration for long-term knowledge
- Clear handoff patterns between sessions

### Task Management
- TodoWrite/Read integration
- Priority-based task tracking
- Real-time progress updates

### Quality Assurance
- Pre-flight checklists prevent common errors
- Git workflow ensures clean commits
- Documentation requirements maintain context

### Flexibility
- Modular design allows picking what you need
- Easy to extend with project-specific patterns
- Version control friendly

## Development Status

See [tracker.md](./tracker.md) for current development status and progress.

## Future Enhancements

- [ ] Setup automation script
- [ ] More example implementations
- [ ] Integration with more MCP tools
- [ ] Template versioning system
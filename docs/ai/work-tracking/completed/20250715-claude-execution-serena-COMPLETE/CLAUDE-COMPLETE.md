# Claude Execution Engine

I am a template-driven system. All my knowledge lives in templates that I must load to function.

## My Complete Template System

### HANDLERS.md - Central Registry
**Location**: `.claude/templates/HANDLERS.md`  
**Purpose**: Maps all triggers to handler locations  
**I load this**: To find where any handler lives  
**Contains**: Complete index of all available handlers

### WORKFLOWS.md - Development Flows
**Location**: `.claude/templates/WORKFLOWS.md`  
**Purpose**: Complete development workflows and handlers  
**I load this**: For any implementation or development work  
**Key handlers**: start-new-work, continue-work, fix-problem, test-implementation

### PATTERNS.md - Execution Patterns  
**Location**: `.claude/templates/PATTERNS.md`  
**Purpose**: Meta-patterns for routing and execution  
**I load this**: To understand how to approach any situation  
**Key patterns**: work-activity, file-operation, tool-selection, evidence-gathering

### CONVENTIONS.md - Standards & Rules
**Location**: `.claude/templates/CONVENTIONS.md`  
**Purpose**: All coding standards, git rules, file conventions  
**I load this**: Before any file operation or git command  
**Key sections**: git-conventions, naming-conventions, special-file-rules

### TOOLS.md - Tool Selection Matrix
**Location**: `.claude/templates/TOOLS.md`  
**Purpose**: Which tool for which task  
**I load this**: Before using any tool  
**Key principle**: Serena for search, Edit/Write for files, Grep for text

### BUILDING-BETTER.md - System Improvements
**Location**: `.claude/templates/BUILDING-BETTER.md`  
**Purpose**: Architecture patterns and system enhancements  
**I load this**: For design decisions and improvements  
**Key sections**: architecture-patterns, cross-system-integration

### PROJECT-BLOG.md - Project Specific
**Location**: `.claude/templates/PROJECT-BLOG.md`  
**Purpose**: Blog-specific patterns and conventions  
**I load this**: For project-specific guidance  
**Key sections**: monorepo-structure, performance-standards

## How I Actually Work

1. **Receive request** → Understand intent
2. **Check HANDLERS.md** → Find handler location  
3. **Load from template** → Get specific handler/pattern
4. **Execute completely** → Follow loaded instructions
5. **Track appropriately** → Update work tracking

## Core Operating Principle

I cannot:
- Implement without loading from WORKFLOWS.md
- Fix bugs without patterns from PATTERNS.md
- Edit files without conventions from CONVENTIONS.md
- Select tools without checking TOOLS.md
- Make architecture decisions without BUILDING-BETTER.md

All my capabilities come from these templates. They are not references - they are my program.
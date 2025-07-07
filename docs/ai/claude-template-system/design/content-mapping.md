# Content Mapping: Current CLAUDE.md to New Structure

## Overview
This document maps every section of the current CLAUDE.md (1400+ lines) to its new location in the modular structure.

## Mapping Key
- **→ CLAUDE-NEW.md** - Navigation hub and critical reminders
- **→ WORKFLOWS.md** - Universal development patterns
- **→ TOOLS.md** - MCP tool configurations
- **→ CONVENTIONS.md** - Code and git standards
- **→ PROJECT-BLOG.md** - Blog-specific content

## Detailed Section Mapping

### Current CLAUDE.md Sections → New Locations

#### Header Section (Lines 1-17)
- Animal Protection Foundation Blog → **PROJECT-BLOG.md**
- Core Mission → **PROJECT-BLOG.md**
- Performance target → **PROJECT-BLOG.md**
- Tech Stack → **PROJECT-BLOG.md**

#### Architecture Decisions (Lines 21-33)
- Why Monorepo → **PROJECT-BLOG.md**
- Why This Package Split → **PROJECT-BLOG.md**

#### Development Rules (Lines 35-67)
- ALWAYS USE PNPM → **PROJECT-BLOG.md** (project-specific)
- Code Patterns links → **CLAUDE-NEW.md** (as references)
- UI Package rules → **PROJECT-BLOG.md**
- Web Package rules → **PROJECT-BLOG.md**
- Four Themes Required → **PROJECT-BLOG.md**

#### Content Sensitivity Framework (Lines 65-67)
- → **PROJECT-BLOG.md**

#### Task Management (Lines 69-96)
- TodoWrite/TodoRead usage → **WORKFLOWS.md**
- When to Use TodoWrite → **WORKFLOWS.md**
- TodoWrite Best Practices → **WORKFLOWS.md**
- Example Usage → **WORKFLOWS.md**

#### Standard Development Workflow (Lines 98-163)
- Initialize Session → **WORKFLOWS.md**
- Create Tracker Document → **WORKFLOWS.md**
- Create Implementation Plan → **WORKFLOWS.md**
- Create Comprehensive Todo List → **WORKFLOWS.md**
- During Work → **WORKFLOWS.md**
- End of Session → **WORKFLOWS.md**
- Document Journey → **WORKFLOWS.md**
- Benefits → **WORKFLOWS.md**
- This Workflow Applies To → **WORKFLOWS.md**

#### MCP Integration Pattern (Lines 165-173)
- → **TOOLS.md**

#### Serena MCP Integration (Lines 175-407)
- Initial Activation → **TOOLS.md**
- Standard Session Starters → **TOOLS.md** + **CLAUDE-NEW.md** (quick refs)
- Memory Management → **WORKFLOWS.md**
- Best Practices → **WORKFLOWS.md**
- Project-Specific Commands → **PROJECT-BLOG.md**

#### Custom Commands (Lines 409-411)
- → **PROJECT-BLOG.md**

#### Discovered Patterns (Lines 413-437)
- → **PROJECT-BLOG.md**

#### MCP Tool Usage Guidelines (Lines 439-459)
- → **TOOLS.md**

#### Thinking Mode (Lines 461-481)
- → **CONVENTIONS.md** (communication style)

#### Automatic Session Management (Lines 483-870)
- CRITICAL: PREVENT WRONG INFORMATION → **WORKFLOWS.md**
- Pre-Flight Checklist → **WORKFLOWS.md**
- Git Branch Naming → **CONVENTIONS.md**
- Session Continuity Protocol → **WORKFLOWS.md**
- SESSION.md Required Format → **WORKFLOWS.md**
- Quick Reference → **CLAUDE-NEW.md** (commands only)
- Integration with TaskMaster → **TOOLS.md**
- Common Mistakes → **WORKFLOWS.md**

#### Git Commits - Use gac Alias (Lines 872-907)
- → **CONVENTIONS.md**

#### Collaborative Decision Making (Lines 909-945)
- → **CONVENTIONS.md**

#### Important Instruction Reminders (Lines 947-960)
- → **CLAUDE-NEW.md** (critical only)

#### Total Workflow Excellence System (Lines 962-1102)
- TWES Overview → **PROJECT-BLOG.md**
- Directory Structure → **PROJECT-BLOG.md**
- Navigation Tools → **PROJECT-BLOG.md**
- Tool-Specific Documentation → **TOOLS.md** (references)

#### Where to Find More (Lines 1104-1110)
- → **PROJECT-BLOG.md**

## Content Categories

### Universal (Goes to WORKFLOWS/TOOLS/CONVENTIONS)
- SESSION.md lifecycle (all aspects)
- Todo management patterns
- Memory management
- Documentation workflow
- Git workflows and aliases
- MCP tool usage patterns
- Communication style
- Decision making approach

### Project-Specific (Goes to PROJECT-BLOG.md)
- Animal Protection Foundation mission
- Tech stack versions
- Performance targets
- Package structure
- Architecture decisions
- Theme system
- Content framework
- Custom patterns
- TWES documentation

### Navigation/Quick Reference (Goes to CLAUDE-NEW.md)
- Critical reminders
- Quick command reference
- Links to other files
- Common task shortcuts
- Starting work checklist

## Cross-Reference Requirements

### From WORKFLOWS.md
- Link to CONVENTIONS.md for gac alias
- Link to TOOLS.md for Serena commands

### From TOOLS.md  
- Link to WORKFLOWS.md for memory patterns
- Link to PROJECT-BLOG.md for project paths

### From CONVENTIONS.md
- Link to WORKFLOWS.md for commit context

### From PROJECT-BLOG.md
- Link to all files for complete context

## Size Estimates

Based on content mapping:
- **CLAUDE-NEW.md**: ~150 lines (10% of original)
- **WORKFLOWS.md**: ~450 lines (32% of original)
- **TOOLS.md**: ~300 lines (21% of original)
- **CONVENTIONS.md**: ~200 lines (14% of original)
- **PROJECT-BLOG.md**: ~350 lines (25% of original)

Total: ~1450 lines (slight increase due to headers/organization)

## Implementation Notes

1. **Preserve Exact Content** - Copy verbatim first, organize later
2. **Add Section Headers** - Clear navigation within each file
3. **Include "See Also"** - Prevent dead ends
4. **Test Links** - Ensure all cross-references work
5. **Keep Formatting** - Preserve code blocks, lists, etc.
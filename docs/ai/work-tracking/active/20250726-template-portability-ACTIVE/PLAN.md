# Template Portability Plan

## Objective
Make the Claude Template System project-agnostic and idempotent for use across all projects.

## Key Requirements
1. **Project Agnostic** - Works in any codebase
2. **Idempotent** - Safe to run multiple times
3. **Preservation** - Doesn't overwrite existing customizations
4. **Discovery** - Easy to install and update

## Design Considerations

### 1. Installation Mechanism
- Script or command to install templates
- Check for existing .claude/ folder
- Merge vs replace logic
- Backup existing files

### 2. Project-Specific Sections
- CLAUDE.md project instructions
- Memory files
- Work tracking folders
- Custom handlers

### 3. Core Template Files
- REGISTRY.md
- WORKFLOWS.md
- TOOLS.md
- CONVENTIONS.md
- PATTERNS.md
- BUILDING-BETTER.md
- MATRICES.md
- BEHAVIORS.md
- USER-GUIDE.md

### 4. Versioning Strategy
- Template version tracking
- Update mechanism
- Changelog for templates

### 5. Customization Points
- Project-specific handlers
- Custom conventions
- Additional matrices

## Discussion Topics
1. Installation approach (script, git submodule, npm package?)
2. Update strategy (how to merge updates with customizations)
3. Project detection (how to know what type of project)
4. Default configurations per project type
5. Distribution mechanism

## Next Steps
- [ ] Discuss optimal approach with user
- [ ] Design installation script
- [ ] Create template versioning system
- [ ] Document customization guide
- [ ] Test on multiple project types
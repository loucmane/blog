---
id: start-new-work
name: Start New Work
role: trigger
domain: development
stability: stable
triggers:
  - "I want to work on X"
  - "Let's build Y"
  - "start working on Z"
dependencies:
  - create-work-folder
  - standard-dev-workflow
tools:
  - TodoWrite
version: 1.0.0
---

#### Handler: start-new-work {#start-new-work}
**Triggers**: "I want to work on X", "Let's build Y", "start working on Z"
**Target Pattern**: Extract feature/component name after "on" or "build"
**Pre-conditions**: 
- Valid project context exists
- No active work folder for same feature
**Process**:
1. Extract feature name from input
2. Create work folder: `YYYYMMDD-{feature-name}-ACTIVE`
3. Initialize 7-file structure (ALL CAPS)
4. Update SESSION.md with new work
5. Create initial todos with TodoWrite
6. Route to Standard Development Workflow
**Success**: Work folder created, todos initialized
**Failure**: Ask for clarification on feature name
**Examples**:
- "work on authentication" → Creates 20250712-authentication-ACTIVE
- "Let's build a meta flow creator" → Creates 20250712-meta-flow-creator-ACTIVE
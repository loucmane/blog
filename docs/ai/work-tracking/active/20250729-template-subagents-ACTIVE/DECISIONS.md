# Decisions: Template Subagents

## Decision Log

### 2025-07-29
- **13:56** - Decided to create specialized subagents for template system management
- **14:35** - Finalized 6-agent architecture design
- **15:02** - Agents deemed production-ready with minor fixes

## Architecture Decisions

### 6-Agent Ecosystem
**Decision**: Create 6 specialized agents rather than fewer general-purpose ones
**Rationale**: Single responsibility principle - each agent has clear focus and minimal tool set

### Pipeline Architecture
**Decision**: Agents work in a pipeline but can also function independently
**Rationale**: Enables both simple and complex workflows without tight coupling

### Priority Implementation
**Decision**: Start with template-migrator as first agent
**Rationale**: Immediate need for migration from monolithic to folder structure

### Production Readiness
**Decision**: Deploy agents with minor path fixes only
**Rationale**: Review showed 8.5/10 quality - agents are well-made and will work as designed

## Implementation Decisions
*Specific technical choices for subagent configuration*

## Template Migration Workflow

### Safe Staging Approach
**Decision**: Create comprehensive migration workflow with staging directory
**Rationale**: Never modify live files - all work in staging until approved

### Template Scanner First
**Decision**: Add template-scanner agent as critical first step
**Rationale**: Other agents need system map to make intelligent decisions

### Pipeline Architecture
**Decision**: SCAN → MAP → EXTRACT → TRANSFORM → STAGE → VALIDATE → OPTIMIZE → TEST → REVIEW → ACTIVATE
**Rationale**: Each step preserves safety with full visibility

## Rationale
*Why each decision was made*
# Constraint-Based System Design - Session Memory

## Key Discovery
The core problem: Documentation exists but isn't used at decision points. Even with Flight Protocol, it's still voluntary compliance.

## Critical Insight (from subagent)
"The goal isn't perfect rule-following - it's making the right behavior the path of least resistance."

## Solution Architecture

### 1. Hard Constraints
- Block wrong tools entirely (e.g., no grep for code search)
- Make correct tool the only option

### 2. Just-in-Time Guidance
- Inject help at decision moment
- Don't rely on remembering to check

### 3. Behavioral Templates
- Pre-select tools in templates
- Remove decision points

### 4. Environmental Design
- Shape behavior through system
- Path of least resistance = correct path

## Implementation Priority
1. Tool Router in CLAUDE.md (force tool selection)
2. Action triggers ("I need to..." → correct tool)
3. Behavioral templates with pre-selected tools

## What We Changed Today
- Added Flight Protocol to CLAUDE.md
- Created Testing Workflows in WORKFLOWS.md
- Clarified Task tool is built-in (not MCP)
- Created Evidence-Based Analysis flow
- Documented constraint-based approach

## Next Session
Implement Tool Router and test with simulations
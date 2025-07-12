# Convention Checking Enforcement Pattern

## Problem Identified
The AI was not checking conventions before taking actions, leading to systematic violations like:
- Using double quotes in commit messages instead of single quotes
- Not checking git conventions before providing commit messages
- Making claims without evidence
- Using wrong tools without checking the tool router

## Solution Implemented

### 1. Created `create-commit-message` Handler
- **Location**: WORKFLOWS.md#handler-create-commit-message
- **Purpose**: Forces convention check BEFORE generating commit messages
- **Process**: 
  1. MANDATORY check CONVENTIONS.md#git-conventions FIRST
  2. Apply single quotes rule for gac alias
  3. Present properly formatted message

### 2. Created `check-conventions-first` Handler
- **Location**: CONVENTIONS.md#handler-check-conventions-first
- **Purpose**: Internal trigger before ANY action with conventions
- **Process**: Identify action type → Check relevant convention → Apply rules → Proceed only if compliant
- **Key**: This is an INTERNAL handler that should trigger automatically

### 3. Created `enforce-pre-flight` Handler
- **Location**: CONVENTIONS.md#handler-enforce-pre-flight
- **Purpose**: System-wide enforcement when user requests stricter checks
- **Triggers**: "enforce conventions", "make sure I check", "prevent mistakes"

## Implementation Pattern
When implementing similar enforcement:
1. Create specific handler for the action (like create-commit-message)
2. Add mandatory convention check as FIRST step
3. Create general enforcement handler for the category
4. Update HANDLERS.md registry with all new handlers
5. Test that old triggers now route to convention-aware handlers

## Key Learning
The protocol navigation system only works if handlers enforce convention checks as their FIRST step, not as an afterthought.
# Key Decisions

## Decision 1: No Hooks Approach
**Rationale**: User decided to delete all hooks and find a different solution. This simplifies the system and removes external dependencies.

## Decision 2: Apply "Disguised Prompt" Pattern
**Rationale**: This pattern successfully made commands execute. By transforming CLAUDE.md to follow this pattern, we might achieve automatic execution.

## Decision 3: Keep Template Loading Pattern
**Rationale**: Similar to how orchestrate-and-test.md loads from spec files, CLAUDE.md will load handlers from template files (WORKFLOWS.md, TOOLS.md, etc.) but embed the execution logic.

## Decision 4: Test-Driven Approach
**Rationale**: Create test cases first to validate whether the new pattern actually executes.

## Key Insight
The fundamental difference between commands and an execution engine:
- Commands: Explicit invocation → Execution
- Execution Engine: Every request → Automatic preprocessing

This might be an architectural limitation that can't be fully solved, but we can make CLAUDE.md more likely to be followed by using the working pattern.

## Decision 5: Natural Search Approach
**Rationale**: Instead of forcing behavior, make CLAUDE.md trigger natural search instincts. When I see a request, I should naturally wonder "where's the handler/pattern/workflow for this?" and actually search for it.

## Decision 6: Use Serena for Template Searches
**Rationale**: Serena's search_for_pattern is perfect for finding specific handlers, patterns, and conventions in template files. This saves context compared to loading entire sections.

## Decision 7: Matrix + Natural Curiosity
**Rationale**: Combine the successful matrix/registry approach from the checkpoint system with natural language that triggers search behavior.
---
id: keyword-to-handler-matrix
type: decision-matrix
category: mapping
usage: Maps keywords and phrases to specific handlers for quick lookup
version: 1.0.0
---

# Keyword → Handler Mapping

Quick reference for mapping user keywords to appropriate handlers.

## Input
Keywords or phrases from user request

## Output
Handler name and location

## Primary Keywords

### Development Keywords
| Keyword | Handler | Template |
|---------|---------|----------|
| implement | standard-dev-workflow | WORKFLOWS.md |
| build | standard-dev-workflow | WORKFLOWS.md |
| create | start-new-work | WORKFLOWS.md |
| feature | implement-feature | WORKFLOWS.md |
| component | create-component | PATTERNS.md |
| module | create-module | PATTERNS.md |
| function | implement-function | WORKFLOWS.md |
| class | implement-class | WORKFLOWS.md |
| interface | define-interface | PATTERNS.md |
| api | create-api-endpoint | WORKFLOWS.md |

### Debugging Keywords
| Keyword | Handler | Template |
|---------|---------|----------|
| fix | fix-bug | WORKFLOWS.md |
| debug | debug-issue | WORKFLOWS.md |
| error | investigate-error | PATTERNS.md |
| bug | fix-bug | WORKFLOWS.md |
| broken | debug-issue | WORKFLOWS.md |
| failing | test-failure | WORKFLOWS.md |
| issue | investigate-issue | PATTERNS.md |
| problem | fix-problem | WORKFLOWS.md |
| crash | debug-crash | PATTERNS.md |
| exception | handle-exception | PATTERNS.md |

### Search Keywords
| Keyword | Handler | Template |
|---------|---------|----------|
| find | search-code | TOOLS.md |
| search | search-code | TOOLS.md |
| locate | find-file | TOOLS.md |
| where | find-location | TOOLS.md |
| grep | grep-pattern | TOOLS.md |
| look | search-code | TOOLS.md |
| discover | find-references | TOOLS.md |
| identify | find-symbol | TOOLS.md |
| trace | trace-execution | PATTERNS.md |
| track | track-usage | PATTERNS.md |

### Git Keywords
| Keyword | Handler | Template |
|---------|---------|----------|
| commit | commit-changes | TOOLS.md |
| push | git-push | TOOLS.md |
| pull | git-pull | TOOLS.md |
| merge | merge-branch | WORKFLOWS.md |
| branch | create-branch | TOOLS.md |
| checkout | checkout-branch | TOOLS.md |
| rebase | git-rebase | WORKFLOWS.md |
| stash | git-stash | TOOLS.md |
| diff | show-diff | TOOLS.md |
| log | git-log | TOOLS.md |

### Testing Keywords
| Keyword | Handler | Template |
|---------|---------|----------|
| test | create-test-checkpoint | WORKFLOWS.md |
| check | validate-implementation | WORKFLOWS.md |
| verify | verify-behavior | PATTERNS.md |
| validate | validate-data | PATTERNS.md |
| assert | add-assertion | PATTERNS.md |
| mock | create-mock | PATTERNS.md |
| stub | create-stub | PATTERNS.md |
| spy | create-spy | PATTERNS.md |
| coverage | check-coverage | TOOLS.md |
| unit | unit-test | WORKFLOWS.md |

## Phrase Patterns

### Question Patterns
| Pattern | Handler | Template |
|---------|---------|----------|
| "how does X work" | explain-code | PATTERNS.md |
| "what is X" | explain-concept | PATTERNS.md |
| "why does X" | analyze-behavior | PATTERNS.md |
| "where is X" | find-location | TOOLS.md |
| "when does X" | trace-execution | PATTERNS.md |
| "who uses X" | find-references | TOOLS.md |
| "can you X" | evaluate-request | PATTERNS.md |
| "should I X" | provide-recommendation | PATTERNS.md |
| "what if X" | analyze-scenario | PATTERNS.md |

### Action Patterns
| Pattern | Handler | Template |
|---------|---------|----------|
| "add X to Y" | add-feature | WORKFLOWS.md |
| "remove X from Y" | remove-feature | WORKFLOWS.md |
| "update X in Y" | update-implementation | WORKFLOWS.md |
| "change X to Y" | refactor-code | WORKFLOWS.md |
| "move X to Y" | relocate-code | WORKFLOWS.md |
| "copy X to Y" | duplicate-code | PATTERNS.md |
| "rename X to Y" | rename-symbol | TOOLS.md |
| "replace X with Y" | replace-implementation | WORKFLOWS.md |
| "convert X to Y" | convert-format | PATTERNS.md |

## Composite Keywords

### Multi-word Triggers
- "start new work" → start-new-work
- "create work folder" → create-work-folder
- "save context" → save-context
- "run tests" → run-test-suite
- "code review" → code-review
- "pull request" → create-pr
- "hot fix" → create-hotfix
- "tech debt" → address-tech-debt
- "performance optimization" → optimize-performance
- "security audit" → security-check

## Context Modifiers

### Urgency Modifiers
- "urgent", "asap", "critical" → Prioritize and fast-track
- "when you can", "low priority" → Queue for later
- "blocker", "blocking" → Immediate attention

### Scope Modifiers
- "all", "every", "entire" → Comprehensive approach
- "just", "only", "specific" → Focused approach
- "related", "similar", "like" → Pattern matching

### Certainty Modifiers
- "maybe", "possibly", "might" → Exploratory approach
- "definitely", "must", "required" → Strict execution
- "should", "could", "would" → Recommended approach

## Fallback Strategies

1. **No keyword match**: Check phrase patterns
2. **No phrase match**: Extract verb and noun
3. **Still no match**: Check context modifiers
4. **Final fallback**: Ask for clarification

## Usage Tips

- Keywords are case-insensitive
- Partial matches considered
- Context overrides keywords
- Multiple keywords → most specific wins
- Unknown keywords → document for addition
---
id: request-to-handler-matrix
type: decision-matrix
category: routing
usage: Maps user request patterns to appropriate handlers
version: 1.0.0
---

# Request Type → Handler Matrix

Maps common request patterns to their corresponding handlers for quick routing decisions.

## Input
User request pattern or keywords

## Output
Handler name, location, and example usage

## Matrix

| Request Pattern | Handler | Location | Example |
|-----------------|---------|----------|---------|
| "implement X" | standard-dev-workflow | WORKFLOWS.md | "implement user auth" |
| "fix X" | fix-bug | WORKFLOWS.md | "fix login bug" |
| "test X" | create-test-checkpoint | WORKFLOWS.md | "test the auth flow" |
| "find X" | search-code | TOOLS.md | "find user model" |
| "search for X" | search-code | TOOLS.md | "search for login" |
| "debug X" | debug-issue | WORKFLOWS.md | "debug auth failure" |
| "commit X" | commit-changes | TOOLS.md | "commit my changes" |
| "start session" | session-start | CONVENTIONS.md | "start new session" |
| "create work folder" | start-new-work | WORKFLOWS.md | "create work tracking" |
| "analyze X" | evidence-check | PATTERNS.md | "analyze performance" |
| "how does X work" | explain-code | PATTERNS.md | "how does auth work" |
| "refactor X" | refactor-code | WORKFLOWS.md | "refactor auth module" |
| "review X" | code-review | WORKFLOWS.md | "review my changes" |
| "document X" | create-docs | CONVENTIONS.md | "document the API" |
| "optimize X" | optimize-code | WORKFLOWS.md | "optimize queries" |
| "secure X" | security-check | TOOLS.md | "secure the endpoint" |
| "deploy X" | deployment | WORKFLOWS.md | "deploy to staging" |
| "rollback X" | rollback | WORKFLOWS.md | "rollback deployment" |
| "compare X and Y" | compare-code | PATTERNS.md | "compare v1 and v2" |
| "profile X" | performance-profile | TOOLS.md | "profile the API" |
| "monitor X" | monitoring-setup | WORKFLOWS.md | "monitor errors" |
| "backup X" | backup-data | TOOLS.md | "backup database" |
| "restore X" | restore-backup | TOOLS.md | "restore from backup" |
| "migrate X" | database-migration | WORKFLOWS.md | "migrate schema" |

## Usage Guidelines

1. **Pattern Matching**: Use the most specific pattern that matches
2. **Fallback**: If no exact match, try broader patterns
3. **Verification**: Always verify handler exists before executing
4. **Context**: Consider surrounding context for ambiguous requests

## Special Cases

- Multiple patterns may apply - choose most specific
- Unknown patterns → check PATTERNS.md for meta-routing
- Ambiguous requests → ask for clarification
- Missing handlers → document gap for future addition
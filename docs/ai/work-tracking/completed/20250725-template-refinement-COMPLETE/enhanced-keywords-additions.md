# Enhanced Keywords for Handler Discovery

## Purpose
Add more keywords and natural language variations to handlers to improve discovery. These additions focus on what users actually say, not technical terms.

## Keyword Enhancement Strategy

### 1. Add User Language Variations
- Include informal phrases ("messed up" for bug)
- Add questions ("why doesn't X work?" for debug)
- Include frustration phrases ("X is broken" for fix)

### 2. Add Domain Synonyms
- Technical alternatives (component/module/widget)
- Action variations (create/make/build/add)
- Status variations (done/complete/finished)

### 3. Add Context Clues
- Problem indicators (slow, failing, error)
- Intent indicators (want to, need to, should)
- Urgency indicators (quick, fast, now)

## Enhanced Keywords by Handler

### Development Handlers

#### start-new-work
**Current**: [work, start, begin, new, feature, build, implement]
**Add**: [project, task, initiative, epic, story, ticket, fresh, kick off, initiate, undertake, embark]

#### create-component  
**Current**: [component, module, service, utility, class, function, hook, provider]
**Add**: [widget, element, part, piece, unit, block, section, helper, lib, library, package, plugin, extension, addon]

#### refactor-code
**Current**: [refactor, cleanup, improve, restructure, optimize, modernize]
**Add**: [reorganize, tidy, simplify, streamline, enhance, polish, revise, rework, redo, rewrite, clean]

### Problem Solving Handlers

#### fix-bug
**Current**: [fix, bug, issue, problem, error, broken, resolve]
**Add**: [repair, messed up, not working, failing, crashed, wrong, incorrect, defect, glitch, fault, flaw]

#### debug-issue
**Current**: [debug, trace, investigate, diagnose, troubleshoot]
**Add**: [why, root cause, figure out, understand, analyze, inspect, examine, explore, dig into, track down]

#### explain-code
**Current**: [explain, how, works, what, does, understand]
**Add**: [clarify, describe, walkthrough, breakdown, teach, show, elaborate, interpret, decode, demystify]

### Search Handlers

#### search-code
**Current**: [search, find, look, locate, where, code]
**Add**: [hunt, seek, discover, uncover, spot, track, identify, pinpoint, dig up, fish out]

#### find-symbol
**Current**: [symbol, class, function, method, definition, where]
**Add**: [declaration, implementation, source, origin, location, position, place, spot]

#### grep-pattern
**Current**: [grep, pattern, regex, text, search]
**Add**: [match, expression, string, content, occurrence, instance, appearance]

### Task Management

#### create-todos
**Current**: [plan, todos, tasks, breakdown, organize, steps]
**Add**: [outline, roadmap, checklist, agenda, schedule, list, items, activities, assignments]

#### update-todos
**Current**: [update, mark, done, complete, finish, progress]
**Add**: [check off, tick, accomplish, achieve, fulfill, close, wrap up, conclude]

#### check-progress
**Current**: [progress, status, where, left, remaining, done]
**Add**: [how far, percentage, completion, state, situation, position, standing]

### Git Operations

#### commit-changes
**Current**: [commit, save, gac, checkin]
**Add**: [store, record, snapshot, preserve, bank, stash, lock in, seal]

#### check-status
**Current**: [status, changes, diff, modified, staged]
**Add**: [what changed, differences, updates, alterations, revisions, edits]

### Testing

#### create-test-checkpoint
**Current**: [test, testing, coverage, validate, check, verify]
**Add**: [spec, suite, unit test, integration test, e2e, end-to-end, qa, quality]

#### validate-changes
**Current**: [validate, verify, confirm, check, ensure, working]
**Add**: [prove, certify, guarantee, assure, double-check, triple-check, test out]

### Documentation

#### create-docs
**Current**: [document, docs, documentation, write, readme]
**Add**: [manual, guide, tutorial, instructions, notes, wiki, knowledge base, reference]

#### code-review
**Current**: [review, check, examine, feedback, critique]
**Add**: [inspect, audit, assess, evaluate, appraise, scrutinize, analyze, pr review]

### Performance

#### optimize-code
**Current**: [optimize, performance, speed, improve, faster]
**Add**: [accelerate, boost, enhance, efficiency, quick, rapid, swift, lag, slow, bottleneck]

## Common Phrase Patterns

### Problem Phrases (route to debug/fix handlers)
- "X isn't working"
- "Y is broken"  
- "Z keeps failing"
- "Can't get X to work"
- "Having issues with Y"
- "X throws an error"

### Request Phrases (route to create/implement handlers)
- "I need X"
- "Can you make Y"
- "Help me build Z"
- "Set up X for me"
- "Get Y working"

### Question Phrases (route to explain/find handlers)
- "How does X work?"
- "What is Y doing?"
- "Where is Z defined?"
- "Why does X happen?"
- "When should I use Y?"

### Action Phrases (route to specific handlers)
- "Let me see X" → read-file
- "Show me Y" → read-file or find-symbol
- "Change X to Y" → edit-file
- "Get rid of Z" → delete-file
- "Start fresh" → start-new-work

## Implementation Notes

1. Add keywords incrementally to avoid breaking existing functionality
2. Test each addition with ULTRATHINK format
3. Keep keywords lowercase for consistency
4. Avoid overlapping keywords between handlers
5. Prioritize user language over technical jargon
# ULTRATHINK Format in Practice

## Before (Current Behavior)

**User**: "implement user authentication for the blog"

**Assistant**: Let me ultrathink about this... This requires creating a user authentication system for the blog. I'll need to implement login, registration, session management, and protect certain routes. I should use a secure approach with proper password hashing and JWT tokens...

[Proceeds directly to implementation without checking session/work folder/handler]

## After (With Format Change)

**User**: "implement user authentication for the blog"

**Assistant**: Let me ultrathink about this... [Session: MISSING-CREATING NOW | Work: MISSING-CREATING NOW | Handler: MISSING-SEARCHING NOW]

I need to establish proper context first. Let me:
1. Start a session for today's work
2. Create a work tracking folder 
3. Find the appropriate handler

[Creates session, work folder, loads implement-feature handler, THEN proceeds]

## Why This Works

The format forces three checks:
1. **Session**: Can't write "Session: X" without checking SESSION.md
2. **Work**: Can't write "Work: Y" without checking active folders
3. **Handler**: Can't write "Handler: Z" without searching REGISTRY

Seeing "MISSING" three times creates unbearable cognitive dissonance that naturally drives correction.

## Variations Based on Context

### Casual Question
**User**: "what's the weather like?"

**Assistant**: [No ultrathink needed - natural conversation mode]

### Code Investigation  
**User**: "why is the login failing?"

**Assistant**: Let me ultrathink about this... [Session: 20250723-blog | Work: auth-debugging | Handler: fix-problem]

[Proceeds with proper context already established]

### New Work
**User**: "let's work on adding comments to posts"

**Assistant**: Let me ultrathink about this... [Session: 20250723-blog | Work: MISSING-CREATING NOW | Handler: implement-feature]

Creating work folder: 20250723-comments-feature-ACTIVE/

[Only Work was missing, creates it and proceeds]

## Implementation Note

This requires changing just ONE line in CLAUDE.md - the format specification for ULTRATHINK. Everything else remains the same, but template usage becomes automatic through the format requirement.
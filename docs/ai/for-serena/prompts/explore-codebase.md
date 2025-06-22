# Explore Codebase Prompt

## Purpose
Use Serena to understand a new codebase or explore unfamiliar parts of an existing project.

## Prompt Template
```
Using Serena, help me understand [AREA/FEATURE] in this codebase:

1. Get high-level overview of [SCOPE]
2. Find main components/modules
3. Understand key relationships
4. Identify important patterns
5. Document findings in memory

Focus areas:
- [SPECIFIC_ASPECT_1]
- [SPECIFIC_ASPECT_2]
- [SPECIFIC_ASPECT_3]

Output: Clear explanation of architecture and patterns
```

## Example Usage
```
Using Serena, help me understand the authentication system in this codebase:

1. Get high-level overview of auth modules
2. Find main components/modules
3. Understand key relationships
4. Identify important patterns
5. Document findings in memory

Focus areas:
- Login/logout flow
- Token management
- Permission checking
- Session handling

Output: Clear explanation of architecture and patterns
```

## Key Serena Commands
```bash
# Overview
mcp__serena__get_symbols_overview --relative_path "src/auth"

# Find components
mcp__serena__find_symbol --name_path "auth" --substring_matching true

# Understand flow
mcp__serena__find_symbol --name_path "login|authenticate" --include_body true

# Trace relationships
mcp__serena__find_referencing_symbols --name_path "authenticate" --relative_path "auth/index.ts"

# Document findings
mcp__serena__write_memory --memory_name "auth_system_architecture" --content "findings..."
```

## Exploration Strategy
1. **Broad Overview** - Start with directory structure
2. **Key Components** - Find main classes/functions
3. **Relationships** - Trace dependencies
4. **Patterns** - Identify common approaches
5. **Documentation** - Create memory for future reference

## Success Indicators
- Clear mental model of the system
- Key components identified
- Relationships understood
- Patterns documented
- Memory created for team
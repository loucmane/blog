# Hook System Implementation Plan

## Overview
Enhance our pattern system with deterministic hooks that enforce conventions automatically.

## Phase 1: Critical Blocking Hooks

### 1. 6-File Structure Enforcement
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [{
          "type": "command",
          "command": "bash -c 'source ~/.claude/hooks/enforce-6-file-structure.sh'"
        }]
      }
    ]
  }
}
```

**enforce-6-file-structure.sh:**
```bash
#!/bin/bash
# Read the tool input
tool_input=$(cat)
file_path=$(echo "$tool_input" | jq -r '.file_path')

# Check if it's a work tracking file
if [[ "$file_path" =~ "work-tracking/active" ]]; then
  # Extract filename
  filename=$(basename "$file_path")
  
  # Check if it matches allowed files
  allowed_files="tracker.md findings.md implementation.md decisions.md memory-refs.md handoff.md"
  if ! echo "$allowed_files" | grep -q "$filename"; then
    echo '{"continue": false, "error": "Work folders must use 6-file structure only: tracker.md, findings.md, implementation.md, decisions.md, memory-refs.md, handoff.md"}'
    exit 2
  fi
fi

# Allow the operation
echo "$tool_input"
```

### 2. Append-Only Enforcement
```bash
#!/bin/bash
# Read the tool input
tool_input=$(cat)
tool=$(echo "$tool_input" | jq -r '.tool')
file_path=$(echo "$tool_input" | jq -r '.file_path')

# Check if editing append-only files
append_only_files="tracker.md findings.md SESSION.md"
filename=$(basename "$file_path")

if [[ "$tool" == "Edit" ]] && echo "$append_only_files" | grep -q "$filename"; then
  # Check if it's truly appending (would need more complex logic)
  echo '{"continue": true, "warning": "Remember: '$filename' is append-only. Only add to the end!"}'
fi

echo "$tool_input"
```

## Phase 2: Auto-Correction Hooks

### 3. Auto-Update Tracker
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{
          "type": "command",
          "command": "bash -c 'source ~/.claude/hooks/auto-update-tracker.sh'"
        }]
      }
    ]
  }
}
```

**auto-update-tracker.sh:**
```bash
#!/bin/bash
# Read the tool result
tool_result=$(cat)
file_path=$(echo "$tool_result" | jq -r '.file_path // empty')

# Check if in work tracking folder
if [[ "$file_path" =~ "work-tracking/active/([^/]+)/" ]]; then
  work_folder="${BASH_REMATCH[1]}"
  tracker_file="docs/ai/work-tracking/active/$work_folder/tracker.md"
  
  if [[ -f "$tracker_file" ]] && [[ ! "$file_path" =~ "tracker.md" ]]; then
    timestamp=$(date "+%Y-%m-%d %H:%M %Z")
    filename=$(basename "$file_path")
    echo "- $timestamp - Updated $filename" >> "$tracker_file"
  fi
fi

echo "$tool_result"
```

## Phase 3: Evidence Enforcement

### 4. Block Unsupported Claims
```bash
#!/bin/bash
tool_input=$(cat)
content=$(echo "$tool_input" | jq -r '.content // .new_string // empty')

# Check for claim patterns
if echo "$content" | grep -E "(the system|it uses|implements|is designed to)" > /dev/null; then
  # Check for evidence pattern
  if ! echo "$content" | grep -E "[a-zA-Z0-9_/.-]+\.(ts|js|tsx|jsx|md):[0-9]+" > /dev/null; then
    echo '{"continue": false, "error": "Claims require evidence! Include file:line references (e.g., src/app.ts:42)"}'
    exit 2
  fi
fi

echo "$tool_input"
```

## Phase 4: Logging and Audit

### 5. Command Logger
```bash
#!/bin/bash
# Log all commands with context
tool_input=$(cat)
timestamp=$(date "+%Y-%m-%d %H:%M:%S")
tool=$(echo "$tool_input" | jq -r '.tool // empty')
description=$(echo "$tool_input" | jq -r '.description // "No description"')

echo "[$timestamp] $tool - $description" >> ~/.claude/command-log.txt

echo "$tool_input"
```

## Implementation Priority

1. **Week 1**: Implement 6-file structure enforcement (most critical)
2. **Week 2**: Add append-only and evidence enforcement
3. **Week 3**: Auto-correction hooks (tracker updates)
4. **Week 4**: Logging and monitoring

## Testing Strategy

1. Create test scenarios that should be blocked
2. Verify hooks prevent violations
3. Test that valid operations still work
4. Monitor performance impact

## Configuration Location

Create `~/.claude/hooks.json`:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [{
          "type": "command",
          "command": "bash ~/.claude/hooks/enforce-6-file-structure.sh"
        }]
      },
      {
        "matcher": "Edit",
        "hooks": [{
          "type": "command",
          "command": "bash ~/.claude/hooks/check-evidence.sh"
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{
          "type": "command",
          "command": "bash ~/.claude/hooks/auto-update-tracker.sh"
        }]
      }
    ]
  }
}
```

## Benefits Over Pattern System Alone

1. **Guaranteed Enforcement** - No reliance on LLM interpretation
2. **User Control** - Can be customized without changing Claude
3. **Audit Trail** - Every action logged
4. **Performance** - Hooks are fast bash scripts
5. **Composable** - Multiple hooks can work together

## Next Steps

1. User creates ~/.claude/hooks/ directory
2. Add hook scripts one at a time
3. Test each hook thoroughly
4. Gradually increase enforcement
5. Monitor Claude's behavior changes

## Phase-Based Implementation Plan

### Overview
Current coverage: ~25% → Target: 100% in 4 phases

### Phase 1: Critical Workflow Protection (40% coverage)
- Task Management Hook
- Session Initialization Hook
- Testing Checkpoint Hook
- Memory Creation Hook

### Phase 2: Intelligent Routing (60% coverage)
- Pattern Router Hook
- Handler Dispatcher Hook
- Tool Selection Matrix Hook
- Cross-System Integration Hook

### Phase 3: Advanced Enforcement (85% coverage)
- Import Order Hook
- Component Standards Hook
- Communication Patterns Hook
- Orchestration Rules Hook

### Phase 4: Learning & Analytics (100% coverage)
- Pattern Learning Hook
- Violation Analytics Hook
- Suggestion Engine Hook
- Performance Monitor Hook

## Template File Hook Generator

### Components Created:
1. **template-parser.py** - Reads all template files and generates hooks
2. **rule_extractor.py** - Lightweight rule extraction for runtime
3. **rule-engine.sh** - Dynamic rule loading and checking
4. **00-dynamic-master.sh** - Master hook using dynamic rules

### How It Works:
1. Parser reads template files (WORKFLOWS.md, TOOLS.md, etc.)
2. Extracts rules and patterns
3. Generates appropriate hook scripts
4. Caches rules for performance
5. Master hook checks against live template content

### Usage:
```bash
# Generate all hooks from templates
cd ~/.claude/hooks
python3 generator/template-parser.py

# Install generated hooks
./generated/install_generated.sh

# Test dynamic system
./test-dynamic-hooks.sh
```

### Benefits:
- Single source of truth (template files)
- Auto-updates when templates change
- Complete coverage of all rules
- No manual sync needed
#!/bin/bash
# ai-session.sh - Enhanced AI Session Management

# Configuration
SESSION_DIR=".ai-sessions"
CURRENT_SESSION_FILE="$SESSION_DIR/current.json"
SESSION_LOG="SESSION.md"
CONTEXT_DIR="$SESSION_DIR/context"

# Initialize session system
init_session_system() {
    mkdir -p "$SESSION_DIR" "$CONTEXT_DIR"
    
    # Create git hooks
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Ensure AI session is properly documented before commit
if [ -f .ai-sessions/current.json ]; then
    if ! grep -q "Session Goals" SESSION.md; then
        echo "❌ Error: SESSION.md must be updated before committing during AI session"
        echo "Run: ai-session update"
        exit 1
    fi
fi
EOF
    chmod +x .git/hooks/pre-commit
}

# Start new session with enhanced context
start_session() {
    local task="${1:-}"
    local ai_assistant="${2:-claude}"
    
    # Capture pre-session state
    echo "📸 Capturing current codebase state..."
    capture_code_state
    
    # Analyze recent changes
    echo "🔍 Analyzing recent changes..."
    analyze_recent_changes
    
    # Create session record
    local session_id=$(generate_session_id)
    local session_data=$(cat << EOF
{
    "id": "$session_id",
    "startTime": "$(date -u +"%Y-%m-%d %H:%M:%S UTC")",
    "developer": "$(git config user.name)",
    "email": "$(git config user.email)", 
    "assistant": "$ai_assistant",
    "task": "$task",
    "initialContext": {
        "branch": "$(git branch --show-current)",
        "lastCommit": "$(git rev-parse HEAD)",
        "modifiedFiles": $(git diff --name-only | jq -R . | jq -s .),
        "workingDirectory": "$(pwd)"
    }
}
EOF
)
    
    echo "$session_data" > "$CURRENT_SESSION_FILE"
    
    # Generate optimized SESSION.md
    generate_session_md "$session_data"
    
    # Create AI-specific context file
    generate_ai_context "$ai_assistant"
    
    # Show session summary
    echo "✅ AI Session Started!"
    echo "📋 Task: $task"
    echo "🤖 Assistant: $ai_assistant"
    echo "📁 Context saved to: $CONTEXT_DIR/$session_id"
    echo ""
    echo "💡 Quick commands:"
    echo "  ai-status     - Check session progress"
    echo "  ai-update     - Update SESSION.md"
    echo "  ai-pause      - Pause session (preserves context)"
    echo "  ai-end        - End session with summary"
}

# Intelligent context capture
capture_code_state() {
    local snapshot_dir="$CONTEXT_DIR/snapshot-$(date +%s)"
    mkdir -p "$snapshot_dir"
    
    # Save current file contents (working files only)
    for file in $(git diff --name-only; git diff --cached --name-only); do
        if [ -f "$file" ]; then
            mkdir -p "$snapshot_dir/$(dirname "$file")"
            cp "$file" "$snapshot_dir/$file"
        fi
    done
    
    # Save test results
    if command -v npm &> /dev/null && [ -f "package.json" ]; then
        npm test -- --json > "$snapshot_dir/test-results.json" 2>&1 || true
    fi
    
    # Save build state
    if [ -f "tsconfig.json" ]; then
        npx tsc --noEmit --pretty false > "$snapshot_dir/typescript-errors.txt" 2>&1 || true
    fi
    
    # Create code map
    create_code_map > "$snapshot_dir/code-map.json"
}

# Generate AI-optimized context
generate_ai_context() {
    local ai_type="$1"
    local context_file="$CONTEXT_DIR/ai-context-$ai_type.md"
    
    case "$ai_type" in
        "claude")
            cat > "$context_file" << 'EOF'
## Claude-Optimized Context

### Current Task Structure
```yaml
task_breakdown:
  main_goal: "$(jq -r .task $CURRENT_SESSION_FILE)"
  current_focus: "Check SESSION.md Progress Log"
  completed_subtasks: []
  remaining_work: []
```

### Code Understanding
$(generate_code_summary)

### Key Files to Review
$(list_key_files)

### Recent Decisions Context
$(extract_recent_decisions)

When you start, please:
1. Acknowledge the current task
2. Review what was completed
3. Identify next steps
4. Ask clarifying questions if needed
EOF
            ;;
            
        "gpt4"|"gpt")
            cat > "$context_file" << 'EOF'
## GPT-4 Session Context

You're continuing a development session. Here's the current state:

**Previous Progress:**
$(tail -20 SESSION.md | grep -E "^- [0-9]{2}:[0-9]{2}" || echo "Starting fresh session")

**Active Files:**
$(git diff --name-only | head -10)

**Current Objective:**
$(jq -r .task $CURRENT_SESSION_FILE)

Please continue development, maintaining consistency with previous decisions.
EOF
            ;;
    esac
    
    echo "Generated: $context_file"
}

# Enhanced status with visual indicators  
show_status() {
    if [ ! -f "$CURRENT_SESSION_FILE" ]; then
        echo "❌ No active AI session"
        echo "Start one with: ai-start \"Your task description\""
        return 1
    fi
    
    local session_data=$(cat "$CURRENT_SESSION_FILE")
    local start_time=$(echo "$session_data" | jq -r .startTime)
    local duration=$(calculate_duration "$start_time")
    
    # Visual session summary
    cat << EOF
╔══════════════════════════════════════════════════════════════╗
║                    🤖 AI SESSION STATUS                      ║
╠══════════════════════════════════════════════════════════════╣
║ Task:      $(echo "$session_data" | jq -r .task | head -c 50)
║ Duration:  $duration
║ AI:        $(echo "$session_data" | jq -r .assistant)
║ Developer: $(echo "$session_data" | jq -r .developer)
╠══════════════════════════════════════════════════════════════╣
║ 📊 Progress Metrics                                          ║
║ ├─ Files Modified:  $(git diff --name-only | wc -l)
║ ├─ Lines Changed:   $(git diff --stat | tail -1 | awk '{print $4}')
║ ├─ Commits:         $(git rev-list --count $(echo "$session_data" | jq -r .initialContext.lastCommit)..HEAD)
║ └─ Test Status:     $(check_test_status)
╠══════════════════════════════════════════════════════════════╣
║ 📝 Recent Activity                                           ║
╠══════════════════════════════════════════════════════════════╣
$(tail -5 SESSION.md | grep "^- " | sed 's/^/║ /')
╚══════════════════════════════════════════════════════════════╝

💡 Commands: ai-update | ai-pause | ai-end | ai-context
EOF
}

# Auto-generate comprehensive handoff
end_session() {
    if [ ! -f "$CURRENT_SESSION_FILE" ]; then
        echo "❌ No active session to end"
        return 1
    fi
    
    local session_data=$(cat "$CURRENT_SESSION_FILE")
    local session_id=$(echo "$session_data" | jq -r .id)
    
    echo "📝 Generating session summary..."
    
    # Create comprehensive handoff document
    local handoff_file="$SESSION_DIR/handoff-$session_id.md"
    generate_handoff_document > "$handoff_file"
    
    # Update SESSION.md with final status
    update_session_md "final"
    
    # Create git commit with session summary
    if [ -n "$(git diff --cached --name-only)" ]; then
        git commit -m "[AI-SESSION] $(echo "$session_data" | jq -r .task)" \
                   -m "$(generate_commit_details)" \
                   -m "Co-authored-by: $(echo "$session_data" | jq -r .assistant) <ai@assistant>"
    fi
    
    # Archive session
    mv "$CURRENT_SESSION_FILE" "$SESSION_DIR/archived-$session_id.json"
    
    # Generate metrics
    generate_session_metrics "$session_id"
    
    echo "✅ Session ended successfully!"
    echo "📄 Handoff document: $handoff_file"
    echo "📊 Metrics saved to: $SESSION_DIR/metrics-$session_id.json"
}

# Helper functions
generate_code_summary() {
    echo "### Modified Files Overview"
    for file in $(git diff --name-only | head -5); do
        echo "- \`$file\`: $(analyze_file_changes "$file")"
    done
}

analyze_file_changes() {
    local file="$1"
    # Simple heuristic - could be enhanced with AST analysis
    local additions=$(git diff "$file" | grep "^+" | wc -l)
    local deletions=$(git diff "$file" | grep "^-" | wc -l)
    echo "$additions additions, $deletions deletions"
}

check_test_status() {
    if command -v npm &> /dev/null && [ -f "package.json" ]; then
        if npm test >/dev/null 2>&1; then
            echo "✅ Passing"
        else
            echo "❌ Failing"
        fi
    else
        echo "⚠️  No tests found"
    fi
}

# Main command dispatcher
case "${1:-help}" in
    "init")
        init_session_system
        ;;
    "start")
        start_session "$2" "$3"
        ;;
    "status")
        show_status
        ;;
    "update")
        update_session_md
        ;;
    "end")
        end_session
        ;;
    "pause")
        pause_session
        ;;
    "resume") 
        resume_session
        ;;
    "context")
        show_ai_context
        ;;
    *)
        echo "Usage: ai-session [init|start|status|update|end|pause|resume|context]"
        ;;
esac
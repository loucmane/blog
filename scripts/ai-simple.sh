#!/bin/bash
# Super simple AI session management

# Start a new session
ai_start() {
    echo -e "\n## Session Started - $(date '+%Y-%m-%d %H:%M')" >> SESSION.md
    echo "Task: $1" >> SESSION.md
    echo "✅ Session started! Task: $1"
}

# Log progress
ai_log() {
    echo "- $(date '+%H:%M'): $1" >> SESSION.md
    echo "📝 Logged: $1"
}

# Show current status
ai_status() {
    echo "=== Current Session ==="
    tail -10 SESSION.md
    echo ""
    echo "=== Git Status ==="
    git status --short
}

# End session
ai_end() {
    echo -e "\n### Session Ended - $(date '+%H:%M')" >> SESSION.md
    echo "✅ Session ended!"
    echo "Don't forget to commit your work!"
}

# Main command
case "$1" in
    start)
        ai_start "$2"
        ;;
    log)
        ai_log "$2"
        ;;
    status)
        ai_status
        ;;
    end)
        ai_end
        ;;
    *)
        echo "Usage: ./ai-simple.sh [start|log|status|end]"
        echo "  start 'task description' - Start new session"
        echo "  log 'what you did'       - Log progress"
        echo "  status                   - Show current status"
        echo "  end                      - End session"
        ;;
esac
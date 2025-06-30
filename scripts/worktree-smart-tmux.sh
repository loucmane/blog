#!/bin/bash
# Start all worktree dev servers using the smart dev script

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "tmux is not installed. Install with: sudo apt-get install tmux (or brew install tmux)"
    exit 1
fi

# Find all worktrees
WORKTREES=$(git worktree list | grep -E "\.worktrees/" | awk '{print $1}')

if [ -z "$WORKTREES" ]; then
    echo "No worktrees found in .worktrees/ directory"
    exit 1
fi

# Kill existing session if it exists
tmux kill-session -t worktrees 2>/dev/null

# Create windows for each worktree
i=0
for worktree in $WORKTREES; do
    WORKTREE_NAME=$(basename $worktree)
    
    if [ $i -eq 0 ]; then
        # Create new session with first worktree
        tmux new-session -d -s worktrees -n "$WORKTREE_NAME" \
            "cd $worktree && echo '🚀 Starting $WORKTREE_NAME with smart port assignment...' && if [ ! -d 'node_modules' ]; then echo 'Installing dependencies...'; pnpm install; fi && node /home/loucmane/dev/javascript/MomsBlog/blog/scripts/dev-orchestrator.js; bash"
    else
        # Add new windows for other worktrees
        tmux new-window -t worktrees:$i -n "$WORKTREE_NAME" \
            "cd $worktree && echo '🚀 Starting $WORKTREE_NAME with smart port assignment...' && if [ ! -d 'node_modules' ]; then echo 'Installing dependencies...'; pnpm install; fi && node /home/loucmane/dev/javascript/MomsBlog/blog/scripts/dev-orchestrator.js; bash"
    fi
    
    ((i++))
done

echo "✅ All worktree dev servers starting with smart port assignment!"
echo ""
echo "📋 Commands:"
echo "  tmux attach -t worktrees     # Attach to session"
echo "  Ctrl+b, n                    # Next window"
echo "  Ctrl+b, p                    # Previous window"
echo "  Ctrl+b, [0-9]                # Switch to window by number"
echo "  Ctrl+b, d                    # Detach from session"
echo ""
echo "🌐 Port assignments are automatic based on worktree names:"
echo "  *-1 → Web: 3001, Backend: 4001"
echo "  *-2 → Web: 3002, Backend: 4002"
echo "  *-3 → Web: 3003, Backend: 4003"
echo "  etc..."
echo ""
echo "This will work automatically for ANY future orchestrations!"
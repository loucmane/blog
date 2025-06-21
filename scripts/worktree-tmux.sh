#!/bin/bash
# Start all worktree dev servers in tmux sessions

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

# Create new tmux session
tmux new-session -d -s worktrees

# Create a window for each worktree
i=0
for worktree in $WORKTREES; do
    WORKTREE_NAME=$(basename $worktree)
    PORT=$((3001 + i))
    
    if [ $i -eq 0 ]; then
        # Rename first window
        tmux rename-window -t worktrees:0 "$WORKTREE_NAME"
        tmux send-keys -t worktrees:0 "cd $worktree && pnpm dev" C-m
    else
        # Create new windows
        tmux new-window -t worktrees -n "$WORKTREE_NAME"
        tmux send-keys -t worktrees:$i "cd $worktree && pnpm dev" C-m
    fi
    
    ((i++))
done

echo "All worktree dev servers started in tmux session 'worktrees'"
echo ""
echo "Commands:"
echo "  tmux attach -t worktrees     # Attach to session"
echo "  tmux ls                      # List sessions"
echo "  Ctrl+b, n                    # Next window"
echo "  Ctrl+b, p                    # Previous window"
echo "  Ctrl+b, [0-5]               # Switch to window by number"
echo "  Ctrl+b, d                    # Detach from session"
echo ""
echo "URLs:"
i=0
for worktree in $WORKTREES; do
    WORKTREE_NAME=$(basename $worktree)
    PORT=$((3001 + i))
    echo "  http://localhost:$PORT - $WORKTREE_NAME"
    ((i++))
done
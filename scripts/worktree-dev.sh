#!/bin/bash
# Start all worktree dev servers in parallel

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Find all worktrees
WORKTREES=$(git worktree list | grep -E "\.worktrees/" | awk '{print $1}')

if [ -z "$WORKTREES" ]; then
    echo -e "${RED}No worktrees found in .worktrees/ directory${NC}"
    echo "Run: /init-parallel feature-name=<name> number-of-parallel-worktrees=<number>"
    exit 1
fi

echo -e "${BLUE}Starting dev servers for all worktrees...${NC}\n"

# Start each worktree in a new terminal
i=1
for worktree in $WORKTREES; do
    WORKTREE_NAME=$(basename $worktree)
    PORT=$((3000 + i))
    
    echo -e "${GREEN}Starting $WORKTREE_NAME on port $PORT${NC}"
    
    # Different commands for different terminals
    if command -v gnome-terminal &> /dev/null; then
        # Linux with gnome-terminal
        gnome-terminal --tab --title="$WORKTREE_NAME" -- bash -c "cd $worktree && pnpm dev; exec bash"
    elif command -v xterm &> /dev/null; then
        # Linux with xterm
        xterm -T "$WORKTREE_NAME" -e "cd $worktree && pnpm dev; bash" &
    elif command -v osascript &> /dev/null; then
        # macOS
        osascript -e "tell application \"Terminal\" to do script \"cd $worktree && pnpm dev\""
    elif command -v wt.exe &> /dev/null; then
        # Windows Terminal
        wt.exe new-tab --title "$WORKTREE_NAME" --startingDirectory "$worktree" bash -c "pnpm dev"
    else
        echo -e "${YELLOW}Can't open new terminal. Run manually:${NC}"
        echo "cd $worktree && pnpm dev"
    fi
    
    ((i++))
done

echo -e "\n${BLUE}All worktrees started!${NC}"
echo -e "${YELLOW}URLs:${NC}"
i=1
for worktree in $WORKTREES; do
    WORKTREE_NAME=$(basename $worktree)
    PORT=$((3000 + i))
    echo "  http://localhost:$PORT - $WORKTREE_NAME"
    ((i++))
done
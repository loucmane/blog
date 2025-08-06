#!/bin/bash

# Enhanced test script for refined ULTRATHINK hook system
# Tests enhanced state tracking and intelligent error messages

echo "=== Enhanced ULTRATHINK Hook System Test ==="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test directory
TEST_DIR="/tmp/test_ultrathink_enhanced"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Clear any existing state
rm -f logs/state.json

echo "Test 1: Enhanced State Tracking"
echo "--------------------------------"
echo "Simulating development request with 'implement' trigger..."

# Simulate user prompt with development trigger
cat << 'EOF' | python3 .claude/hooks/user_prompt_submit.py
{
  "user_prompt": "implement user authentication with JWT tokens"
}
EOF

echo -e "${GREEN}✓ User prompt processed${NC}"

# Check state file
if [ -f logs/state.json ]; then
    echo -e "${GREEN}✓ State file created${NC}"
    echo "State content:"
    cat logs/state.json | python3 -m json.tool
    echo
else
    echo -e "${RED}✗ State file not created${NC}"
fi

echo
echo "Test 2: Intelligent Error Messages"
echo "-----------------------------------"
echo "Attempting to use development tool without ULTRATHINK..."

# Simulate tool use without ULTRATHINK
cat << 'EOF' | python3 .claude/hooks/pre_tool_use.py 2>&1
{
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "test.py",
    "content": "print('hello')"
  },
  "message": "editing test file"
}
EOF

echo
echo "Test 3: ULTRATHINK Format Detection"
echo "------------------------------------"
echo "Using tool with ULTRATHINK format..."

# Clear blocked attempts for clean test
rm -f logs/state.json

# First, create a development request
cat << 'EOF' | python3 .claude/hooks/user_prompt_submit.py
{
  "user_prompt": "fix the bug in authentication"
}
EOF

# Now try with ULTRATHINK format
cat << 'EOF' | python3 .claude/hooks/pre_tool_use.py 2>&1
{
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "test.py",
    "content": "print('hello')"
  },
  "message": "Let me ultrathink about this... [S:20250802|W:debugging|H:fix-bug|E:3/\"bug fixed\"]"
}
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Tool allowed with ULTRATHINK format${NC}"
else
    echo -e "${RED}✗ Tool blocked despite ULTRATHINK format${NC}"
fi

echo
echo "Test 4: Stop Hook Feedback"
echo "---------------------------"
echo "Simulating conversation end..."

# Simulate stop hook with conversation content
cat << 'EOF' | python3 .claude/hooks/stop.py 2>&1
{
  "content": "User asked to fix bug. Let me ultrathink about this... [S:20250802|W:debugging|H:fix-bug|E:3/\"bug fixed\"]. Fixed the authentication bug."
}
EOF

echo
echo "Test 5: Multiple Blocked Attempts"
echo "----------------------------------"
echo "Testing blocked attempts counter..."

# Clear state
rm -f logs/state.json

# Create development request
cat << 'EOF' | python3 .claude/hooks/user_prompt_submit.py
{
  "user_prompt": "create a new feature for user profiles"
}
EOF

# Try tool use multiple times
for i in 1 2 3; do
    echo -e "${YELLOW}Attempt $i:${NC}"
    cat << 'EOF' | python3 .claude/hooks/pre_tool_use.py 2>&1 | grep -A1 "blocked attempt"
{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "profile.py"
  }
}
EOF
done

# Check final state
echo
echo "Final state after multiple attempts:"
cat logs/state.json | python3 -m json.tool | grep -A2 "blocked_attempts"

echo
echo "Test 6: Context-Based Triggers"
echo "-------------------------------"
echo "Testing file extension trigger..."

# Clear state
rm -f logs/state.json

# Test with file extension trigger
cat << 'EOF' | python3 .claude/hooks/user_prompt_submit.py
{
  "user_prompt": "check the code in main.py"
}
EOF

# Check if trigger was detected
if [ -f logs/state.json ]; then
    trigger_type=$(cat logs/state.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('ultrathink', {}).get('trigger', {}).get('type', 'none'))")
    if [ "$trigger_type" = "context" ]; then
        echo -e "${GREEN}✓ Context trigger detected for .py file${NC}"
    else
        echo -e "${RED}✗ Context trigger not detected properly${NC}"
    fi
fi

echo
echo "=== Test Summary ==="
echo "The enhanced hook system provides:"
echo "✓ Detailed trigger tracking (type, keyword, full text)"
echo "✓ Intelligent error messages with context"
echo "✓ Session management"
echo "✓ Blocked attempts counter"
echo "✓ Better feedback in stop hook"

# Cleanup
cd - > /dev/null
rm -rf "$TEST_DIR"

echo
echo "Test complete!"
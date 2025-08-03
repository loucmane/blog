#!/bin/bash

# Test script for enhanced ULTRATHINK enforcement hooks

echo "================================"
echo "Enhanced Hook Enforcement Test"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Build handler cache
echo -e "${YELLOW}Test 1: Building handler cache...${NC}"
cd /home/loucmane/dev/javascript/MomsBlog/blog/.claude/hooks
uv run --script build_cache.py
echo ""

# Test 2: Test user prompt detection with handler suggestions
echo -e "${YELLOW}Test 2: Testing user prompt detection...${NC}"
echo '{"user_prompt": "implement user authentication feature"}' | uv run --script user_prompt_submit.py 2>&1
echo ""

echo '{"user_prompt": "fix the bug in login"}' | uv run --script user_prompt_submit.py 2>&1
echo ""

echo '{"user_prompt": "what is the weather like?"}' | uv run --script user_prompt_submit.py 2>&1
echo ""

# Test 3: Test pre-tool-use enforcement
echo -e "${YELLOW}Test 3: Testing pre-tool-use enforcement...${NC}"

# Test without ULTRATHINK
echo "Testing tool use without ULTRATHINK..."
echo '{"tool_name": "Read", "assistant_messages": [{"role": "assistant", "content": "I will read the file now"}]}' | uv run --script pre_tool_use.py 2>&1
RESULT=$?
if [ $RESULT -eq 2 ]; then
    echo -e "${GREEN}✓ Correctly blocked (exit code 2)${NC}"
else
    echo -e "${RED}✗ Should have been blocked${NC}"
fi
echo ""

# Test with ULTRATHINK
echo "Testing tool use with proper ULTRATHINK..."
echo '{"tool_name": "Read", "message": "Let me ultrathink about this... [S:20250802|W:implementation|H:read-file|E:3/check file]"}' | uv run --script pre_tool_use.py 2>&1
RESULT=$?
if [ $RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ Correctly allowed (exit code 0)${NC}"
else
    echo -e "${RED}✗ Should have been allowed${NC}"
fi
echo ""

# Test 4: Test assistant response validation
echo -e "${YELLOW}Test 4: Testing assistant response validation...${NC}"

# First set up state with development request
echo '{"user_prompt": "implement feature X"}' | uv run --script user_prompt_submit.py 2>&1 > /dev/null

# Test response without ULTRATHINK
echo '{"assistant_response": "I will implement feature X now"}' | uv run --script assistant_response.py 2>&1
echo ""

# Test response with ULTRATHINK
echo '{"assistant_response": "Let me ultrathink about this... [S:20250802|W:implementation|H:implement-feature|E:5/create component]"}' | uv run --script assistant_response.py 2>&1
echo ""

# Test response with invalid handler
echo '{"assistant_response": "Let me ultrathink about this... [S:20250802|W:implementation|H:invalid-handler-name|E:3/test]"}' | uv run --script assistant_response.py 2>&1
echo ""

# Test 5: Test stop hook analytics
echo -e "${YELLOW}Test 5: Testing stop hook analytics...${NC}"
echo '{"content": ""}' | uv run --script stop.py 2>&1
echo ""

# Check generated files
echo -e "${YELLOW}Generated files:${NC}"
[ -f logs/state.json ] && echo -e "${GREEN}✓ logs/state.json exists${NC}" || echo -e "${RED}✗ logs/state.json missing${NC}"
[ -f logs/handler_cache.json ] && echo -e "${GREEN}✓ logs/handler_cache.json exists${NC}" || echo -e "${RED}✗ logs/handler_cache.json missing${NC}"
[ -f logs/analytics.json ] && echo -e "${GREEN}✓ logs/analytics.json exists${NC}" || echo -e "${RED}✗ logs/analytics.json missing${NC}"

echo ""
echo "================================"
echo "Test Complete"
echo "================================"
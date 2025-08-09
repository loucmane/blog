#!/bin/bash

# ULTRATHINK Enforcement System Verification Script
# This script verifies that the enforcement system is properly installed and working

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BOLD}${BLUE}================================${NC}"
echo -e "${BOLD}${BLUE}ULTRATHINK Enforcement Verifier${NC}"
echo -e "${BOLD}${BLUE}================================${NC}\n"

# Function to check if file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description exists"
        return 0
    else
        echo -e "${RED}✗${NC} $description missing: $file"
        return 1
    fi
}

# Function to check if hook is configured
check_hook_config() {
    local hook_name=$1
    local settings_file="$PROJECT_DIR/.claude/settings.json"
    
    if grep -q "\"$hook_name\"" "$settings_file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $hook_name hook configured"
        return 0
    else
        echo -e "${RED}✗${NC} $hook_name hook not configured in settings.json"
        return 1
    fi
}

# Function to test hook execution
test_hook() {
    local hook_file=$1
    local test_input=$2
    local description=$3
    
    echo -e "\n${BLUE}Testing:${NC} $description"
    
    if [ -f "$hook_file" ]; then
        # Test if hook executes without error
        echo "$test_input" | python3 "$hook_file" > /dev/null 2>&1
        if [ $? -eq 0 ] || [ $? -eq 2 ]; then
            echo -e "${GREEN}✓${NC} Hook executes successfully"
            return 0
        else
            echo -e "${RED}✗${NC} Hook execution failed"
            return 1
        fi
    else
        echo -e "${RED}✗${NC} Hook file not found"
        return 1
    fi
}

# Track errors
ERRORS=0

echo -e "${BOLD}1. Checking Core Files${NC}"
echo "------------------------"

check_file "$PROJECT_DIR/.claude/hooks/user_prompt_submit.py" "User prompt hook" || ((ERRORS++))
check_file "$PROJECT_DIR/.claude/hooks/pre_tool_use.py" "Pre-tool-use hook" || ((ERRORS++))
check_file "$PROJECT_DIR/.claude/hooks/enhanced_enforcement.py" "Enhanced enforcement hook" || ((ERRORS++))
check_file "$PROJECT_DIR/.claude/hooks/test_enforcement.py" "Test suite" || ((ERRORS++))
check_file "$PROJECT_DIR/.claude/settings.json" "Settings configuration" || ((ERRORS++))

echo -e "\n${BOLD}2. Checking Module Files${NC}"
echo "------------------------"

check_file "$PROJECT_DIR/.claude/templates/engine/validation/validation-framework.md" "Validation framework" || ((ERRORS++))
check_file "$PROJECT_DIR/.claude/templates/engine/validation/integration-guide.md" "Integration guide" || ((ERRORS++))

echo -e "\n${BOLD}3. Checking Hook Configuration${NC}"
echo "-------------------------------"

check_hook_config "UserPromptSubmit" || ((ERRORS++))
check_hook_config "PreToolUse" || ((ERRORS++))
check_hook_config "Stop" || ((ERRORS++))

echo -e "\n${BOLD}4. Testing Hook Execution${NC}"
echo "-------------------------"

# Test user prompt hook
test_hook "$PROJECT_DIR/.claude/hooks/user_prompt_submit.py" \
    '{"user_prompt": "Fix the bug in auth.py"}' \
    "User prompt detection" || ((ERRORS++))

# Test pre-tool-use hook
test_hook "$PROJECT_DIR/.claude/hooks/pre_tool_use.py" \
    '{"tool_name": "Edit", "tool_input": {"file_path": "test.py"}}' \
    "Pre-tool-use blocking" || ((ERRORS++))

# Test enhanced enforcement
test_hook "$PROJECT_DIR/.claude/hooks/enhanced_enforcement.py" \
    '{"tool_name": "Write", "tool_input": {"content": "test"}}' \
    "Enhanced enforcement" || ((ERRORS++))

echo -e "\n${BOLD}5. Checking State Management${NC}"
echo "-----------------------------"

STATE_DIR="$PROJECT_DIR/logs"
if [ -d "$STATE_DIR" ]; then
    echo -e "${GREEN}✓${NC} Logs directory exists"
    
    # Check if state file can be created
    TEST_STATE='{"test": true}'
    echo "$TEST_STATE" > "$STATE_DIR/test_state.json" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} State files can be written"
        rm -f "$STATE_DIR/test_state.json"
    else
        echo -e "${RED}✗${NC} Cannot write state files"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} Logs directory doesn't exist, creating..."
    mkdir -p "$STATE_DIR"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Logs directory created"
    else
        echo -e "${RED}✗${NC} Failed to create logs directory"
        ((ERRORS++))
    fi
fi

echo -e "\n${BOLD}6. Running Test Suite${NC}"
echo "---------------------"

if [ -f "$PROJECT_DIR/.claude/hooks/test_enforcement.py" ]; then
    echo -e "${BLUE}Running comprehensive tests...${NC}\n"
    
    # Run the test suite
    python3 "$PROJECT_DIR/.claude/hooks/test_enforcement.py"
    TEST_RESULT=$?
    
    if [ $TEST_RESULT -eq 0 ]; then
        echo -e "\n${GREEN}✓${NC} All tests passed"
    else
        echo -e "\n${RED}✗${NC} Some tests failed"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} Test suite not found"
    ((ERRORS++))
fi

# Final summary
echo -e "\n${BOLD}${BLUE}================================${NC}"
echo -e "${BOLD}${BLUE}Verification Summary${NC}"
echo -e "${BOLD}${BLUE}================================${NC}\n"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ ENFORCEMENT SYSTEM READY${NC}"
    echo -e "${GREEN}All components are properly installed and configured.${NC}"
    echo -e "\n${BOLD}Next Steps:${NC}"
    echo "1. Test with a development request to see enforcement in action"
    echo "2. Monitor logs/enforcement_metrics.json for metrics"
    echo "3. Adjust enforcement level if needed in enhanced_enforcement.py"
    exit 0
else
    echo -e "${RED}${BOLD}✗ ENFORCEMENT SYSTEM HAS ISSUES${NC}"
    echo -e "${RED}Found $ERRORS error(s) that need to be fixed.${NC}"
    echo -e "\n${BOLD}Troubleshooting:${NC}"
    echo "1. Check file permissions: chmod +x .claude/hooks/*.py"
    echo "2. Verify Python 3 is installed: python3 --version"
    echo "3. Check settings.json syntax: python3 -m json.tool .claude/settings.json"
    echo "4. Review error messages above for specific issues"
    exit 1
fi
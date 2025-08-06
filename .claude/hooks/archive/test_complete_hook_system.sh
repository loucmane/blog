#!/bin/bash

# Comprehensive Hook System Integration Test
# Tests all hooks with various scenarios and validates behavior

set -e
cd "$(dirname "$0")/.."

echo "🧪 Starting Comprehensive Hook System Integration Tests"
echo "=================================================="

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test result function
test_result() {
    local test_name="$1"
    local expected_exit="$2"
    local actual_exit="$3"
    local description="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$expected_exit" -eq "$actual_exit" ]; then
        echo "✅ $test_name: $description"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "❌ $test_name: $description (expected $expected_exit, got $actual_exit)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo
echo "📝 Test 1: Handler Cache Functionality"
echo "------------------------------------"

# Test handler cache loading and searching
python3 -c "
import sys
sys.path.append('.claude/hooks/utils')
from handler_cache import HandlerCache

cache = HandlerCache('.')
if cache.load_cache():
    print('✅ Cache loaded successfully')
    matches = cache.find_handlers('implement user authentication', limit=3)
    if matches:
        print(f'✅ Found {len(matches)} handler suggestions')
        for name, score in matches:
            print(f'   - {name} (score: {score})')
    else:
        print('❌ No handler matches found')
else:
    print('❌ Failed to load cache')
"

echo
echo "📝 Test 2: User Prompt Hook - Development Triggers"
echo "------------------------------------------------"

# Test 2.1: Implementation trigger
echo '{"user_prompt": "implement user authentication"}' | python3 .claude/hooks/user_prompt_submit.py > /dev/null 2>&1
test_result "2.1" 0 $? "Implementation trigger detection"

# Test 2.2: Bug fix trigger  
echo '{"user_prompt": "fix the login bug"}' | python3 .claude/hooks/user_prompt_submit.py > /dev/null 2>&1
test_result "2.2" 0 $? "Bug fix trigger detection"

# Test 2.3: Search trigger
echo '{"user_prompt": "search for parseJSON"}' | python3 .claude/hooks/user_prompt_submit.py > /dev/null 2>&1
test_result "2.3" 0 $? "Search trigger detection"

# Test 2.4: Non-development request
echo '{"user_prompt": "how is the weather today?"}' | python3 .claude/hooks/user_prompt_submit.py > /dev/null 2>&1
test_result "2.4" 0 $? "Non-development request (should pass)"

echo
echo "📝 Test 3: Pre-Tool-Use Hook - Blocking Behavior"
echo "-----------------------------------------------"

# Test 3.1: Block development tool without ULTRATHINK
echo '{"tool_name": "Edit", "tool_input": {"file_path": "test.txt"}, "message": ""}' | python3 .claude/hooks/pre_tool_use.py > /dev/null 2>&1
test_result "3.1" 2 $? "Block development tool without ULTRATHINK"

# Test 3.2: Allow development tool with ULTRATHINK
echo '{"tool_name": "Edit", "tool_input": {"file_path": "test.txt"}, "message": "Let me ultrathink about this... [S:20250803|W:implementation|H:start-new-work|E:5/key:create]"}' | python3 .claude/hooks/pre_tool_use.py > /dev/null 2>&1
test_result "3.2" 0 $? "Allow development tool with ULTRATHINK"

# Test 3.3: Allow non-development tool always
echo '{"tool_name": "Read", "tool_input": {"file_path": "test.txt"}, "message": ""}' | python3 .claude/hooks/pre_tool_use.py > /dev/null 2>&1
test_result "3.3" 0 $? "Allow non-development tool"

echo
echo "📝 Test 4: Assistant Response Hook - Validation"
echo "----------------------------------------------"

# Test 4.1: Valid ULTRATHINK format
echo '{"assistant_response": "Let me ultrathink about this... [S:20250803|W:implementation|H:start-new-work|E:5/key:create]"}' | python3 .claude/hooks/assistant_response.py > /dev/null 2>&1
test_result "4.1" 0 $? "Valid ULTRATHINK format validation"

# Test 4.2: Invalid handler validation
echo '{"assistant_response": "Let me ultrathink about this... [S:20250803|W:implementation|H:nonexistent-handler|E:5/key:test]"}' | python3 .claude/hooks/assistant_response.py > /dev/null 2>&1
test_result "4.2" 0 $? "Invalid handler validation (warning only)"

echo
echo "📝 Test 5: Stop Hook - Session Analytics"
echo "---------------------------------------"

# Test 5.1: Successful ULTRATHINK compliance
echo '{"content": "Let me ultrathink about this... [S:20250803|W:implementation|H:start-new-work|E:5/key:create]"}' | python3 .claude/hooks/stop.py > /dev/null 2>&1
test_result "5.1" 0 $? "Successful ULTRATHINK compliance"

# Test 5.2: No ULTRATHINK when not required
echo '{"content": "Just a normal conversation"}' | python3 .claude/hooks/stop.py > /dev/null 2>&1
test_result "5.2" 0 $? "No ULTRATHINK when not required"

echo
echo "📝 Test 6: Integration Flow - Complete Workflow"
echo "----------------------------------------------"

# Reset state for integration test
echo '{}' > logs/state.json

# Step 1: Submit development request
echo '{"user_prompt": "implement user authentication"}' | python3 .claude/hooks/user_prompt_submit.py > /dev/null 2>&1
test_result "6.1" 0 $? "Submit development request"

# Step 2: Try to use tool without ULTRATHINK (should block)
echo '{"tool_name": "Edit", "tool_input": {"file_path": "test.txt"}, "message": ""}' | python3 .claude/hooks/pre_tool_use.py > /dev/null 2>&1
test_result "6.2" 2 $? "Block tool without ULTRATHINK"

# Step 3: Use tool with ULTRATHINK (should allow)
echo '{"tool_name": "Edit", "tool_input": {"file_path": "test.txt"}, "message": "Let me ultrathink about this... [S:20250803|W:implementation|H:start-new-work|E:5/key:create]"}' | python3 .claude/hooks/pre_tool_use.py > /dev/null 2>&1
test_result "6.3" 0 $? "Allow tool with ULTRATHINK"

# Step 4: Validate response
echo '{"assistant_response": "Let me ultrathink about this... [S:20250803|W:implementation|H:start-new-work|E:5/key:create]"}' | python3 .claude/hooks/assistant_response.py > /dev/null 2>&1
test_result "6.4" 0 $? "Validate assistant response"

# Step 5: Complete session
echo '{"content": "Let me ultrathink about this... [S:20250803|W:implementation|H:start-new-work|E:5/key:create]"}' | python3 .claude/hooks/stop.py > /dev/null 2>&1
test_result "6.5" 0 $? "Complete session successfully"

echo
echo "📝 Test 7: Error Handling & Edge Cases"
echo "-------------------------------------"

# Test 7.1: Invalid JSON input
echo 'invalid json' | python3 .claude/hooks/user_prompt_submit.py > /dev/null 2>&1
test_result "7.1" 0 $? "Handle invalid JSON gracefully"

# Test 7.2: Missing fields
echo '{}' | python3 .claude/hooks/user_prompt_submit.py > /dev/null 2>&1  
test_result "7.2" 0 $? "Handle missing fields gracefully"

# Test 7.3: Empty prompt
echo '{"user_prompt": ""}' | python3 .claude/hooks/user_prompt_submit.py > /dev/null 2>&1
test_result "7.3" 0 $? "Handle empty prompt gracefully"

echo
echo "📝 Test 8: Handler Suggestions Accuracy"
echo "--------------------------------------"

# Test specific triggers and expected handlers
test_suggestions() {
    local prompt="$1"
    local expected="$2"
    local description="$3"
    
    output=$(echo "{\"user_prompt\": \"$prompt\"}" | python3 .claude/hooks/user_prompt_submit.py 2>&1)
    if echo "$output" | grep -q "$expected"; then
        test_result "8.x" 0 0 "$description"
    else
        test_result "8.x" 0 1 "$description"
    fi
}

test_suggestions "implement user authentication" "start-new-work" "Implement suggests start-new-work"
test_suggestions "fix the login bug" "fix-bug" "Fix suggests fix-bug"
test_suggestions "search for parseJSON" "search-code" "Search suggests search-code"
test_suggestions "debug memory leak" "debug-issue" "Debug suggests debug-issue"

echo
echo "📊 Test Results Summary"
echo "======================"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS ✅"
echo "Failed: $FAILED_TESTS ❌"

if [ $FAILED_TESTS -eq 0 ]; then
    echo
    echo "🎉 All tests passed! Hook system is working correctly."
    exit 0
else
    echo
    echo "⚠️  Some tests failed. Please review the failures above."
    exit 1
fi
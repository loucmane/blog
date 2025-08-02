#!/bin/bash

echo "=== ULTRATHINK Hook Enforcement Test ==="
echo
echo "This script demonstrates how the hook system prevents development work without ULTRATHINK."
echo
echo "1. Testing user_prompt_submit.py with dev trigger:"
echo '{"message": "implement user authentication"}' | ./user_prompt_submit.py
echo "Exit code: $?"
echo
echo "2. Checking state file:"
cat ./logs/state.json 2>/dev/null || echo "No state file yet"
echo
echo "3. Testing pre_tool_use.py blocking Bash tool:"
echo '{"tool": "Bash", "message": "trying to use bash"}' | ./pre_tool_use.py
echo "Exit code: $?"
echo
echo "4. Testing pre_tool_use.py with ULTRATHINK format:"
echo '{"tool": "Bash", "message": "Let me ultrathink about this... [S:20250802|W:testing|H:test|E:1]"}' | ./pre_tool_use.py
echo "Exit code: $?"
echo
echo "5. Checking state after ULTRATHINK:"
cat ./logs/state.json 2>/dev/null || echo "No state file"
echo
echo "6. Testing stop.py cleanup:"
echo '{"message": "Let me ultrathink about this... [S:20250802|W:testing|H:test|E:1]"}' | ./stop.py
echo "Exit code: $?"
echo
echo "7. Final state (should be clean):"
cat ./logs/state.json 2>/dev/null || echo "No state file"
#!/bin/bash

# Claude Code Hook System Test Runner
# This script runs the comprehensive hook system tests

echo "🚀 Claude Code Hook System Test Runner"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if uv is available
if ! command -v uv &> /dev/null; then
    echo "❌ Error: 'uv' command not found. Please install uv first."
    echo "   Visit: https://github.com/astral-sh/uv"
    exit 1
fi

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: 'node' command not found. Please install Node.js first."
    exit 1
fi

# Set environment variable for hooks
export CLAUDE_PROJECT_DIR=$(pwd)

# Ensure logs directory exists
mkdir -p logs

# Clean up any existing test artifacts
echo "🧹 Cleaning up previous test artifacts..."
rm -f logs/state.json logs/analytics.json

# Run the test suite
echo "🧪 Running hook system tests..."
echo ""

node test_hook_system.js

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed!"
    echo ""
    echo "📊 Test Summary:"
    echo "  - UserPromptSubmit hook: ✓"
    echo "  - PreToolUse hook: ✓"
    echo "  - Stop hook: ✓"
    echo "  - Edge cases: ✓"
    echo "  - State persistence: ✓"
else
    echo ""
    echo "❌ Some tests failed. Please check the output above."
    exit 1
fi

echo ""
echo "💡 To test the hooks manually:"
echo "  1. Start a development task (triggers UserPromptSubmit)"
echo "  2. Try to edit a file without ULTRATHINK (triggers PreToolUse block)"
echo "  3. Complete the task (triggers Stop hook for analytics)"
echo ""
echo "📝 Hook logs are stored in:"
echo "  - logs/state.json - Current state and ULTRATHINK tracking"
echo "  - logs/analytics.json - Session analytics and compliance"
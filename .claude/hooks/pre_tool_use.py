#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "python-dotenv",
# ]
# ///

import json
import sys
import re
from pathlib import Path

def is_development_tool(tool_name):
    """
    Check if the tool is a development tool that requires ULTRATHINK.
    Returns True for development tools, False for allowed tools.
    """
    development_tools = {
        'Bash', 'Edit', 'Write', 'MultiEdit', 'Read', 'Grep', 'Glob'
    }
    
    return tool_name in development_tools

def has_ultrathink_format(message):
    """
    Check if a message contains the S:W:H:E ULTRATHINK format.
    Returns True if format is detected, False otherwise.
    """
    # Pattern for S:W:H:E format: [S:X|W:Y|H:Z|E:something]
    ultrathink_pattern = r'\[S:[^|\]]+\|W:[^|\]]+\|H:[^|\]]+\|E:[^\]]+\]'
    
    return bool(re.search(ultrathink_pattern, message))

def read_state():
    """
    Read current state from logs/state.json.
    Returns state dict with defaults if file doesn't exist or is invalid.
    """
    state_file = Path("logs/state.json")
    
    # Default state
    default_state = {
        "ultrathink_required": False,
        "ultrathink_completed": False
    }
    
    if not state_file.exists():
        return default_state
    
    try:
        with open(state_file, 'r') as f:
            state = json.load(f)
            
        # Ensure required keys exist
        if "ultrathink_required" not in state:
            state["ultrathink_required"] = False
        if "ultrathink_completed" not in state:
            state["ultrathink_completed"] = False
            
        return state
    except (json.JSONDecodeError, IOError):
        return default_state

def update_state(state):
    """
    Write state back to logs/state.json.
    """
    state_file = Path("logs/state.json")
    
    try:
        state_file.parent.mkdir(parents=True, exist_ok=True)
        with open(state_file, 'w') as f:
            json.dump(state, f, indent=2)
    except IOError:
        # If we can't write the state file, continue silently
        pass

def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)
        
        # Extract tool name and input
        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        
        # Get the full message for ULTRATHINK detection
        # The message might be in different places depending on the tool
        message = input_data.get('message', '')
        if not message:
            # Try to get from tool input for tools like Edit/Write
            message = tool_input.get('content', '')
        
        # Read current state
        state = read_state()
        
        # Check if ULTRATHINK format is present in this message
        if has_ultrathink_format(message):
            state["ultrathink_completed"] = True
            update_state(state)
        
        # Check if we need to block this tool
        if is_development_tool(tool_name):
            if state.get("ultrathink_required", False) and not state.get("ultrathink_completed", False):
                # Block the tool with error message
                error_msg = "❌ Development request requires ULTRATHINK format first. Use: Let me ultrathink about this... [S:X|W:Y|H:searching|E:pending]"
                print(error_msg, file=sys.stderr)
                sys.exit(2)
        
        # Tool is allowed, continue normally
        sys.exit(0)
        
    except json.JSONDecodeError:
        # Invalid JSON input, continue gracefully
        sys.exit(0)
    except Exception:
        # Any other error, continue gracefully
        sys.exit(0)

if __name__ == '__main__':
    main()
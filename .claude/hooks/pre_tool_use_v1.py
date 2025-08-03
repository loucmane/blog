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
    from datetime import datetime
    
    state_file = Path("logs/state.json")
    
    # Default state with enhanced structure
    today = datetime.now().strftime("%Y%m%d")
    default_state = {
        "session": {
            "id": today,
            "started_at": datetime.now().isoformat()
        },
        "ultrathink": {
            "required": False,
            "completed": False,
            "statements": [],
            "blocked_attempts": 0,
            "trigger": None
        },
        "context": {
            "work_folders": [],
            "recent_searches": [],
            "tools_used": []
        }
    }
    
    # Maintain backward compatibility
    default_state["ultrathink_required"] = False
    default_state["ultrathink_completed"] = False
    
    if not state_file.exists():
        return default_state
    
    try:
        with open(state_file, 'r') as f:
            state = json.load(f)
        
        # Migrate old state format to new format
        if "ultrathink" not in state:
            state["ultrathink"] = {
                "required": state.get("ultrathink_required", False),
                "completed": state.get("ultrathink_completed", False),
                "statements": [],
                "blocked_attempts": 0,
                "trigger": None
            }
        
        # Ensure backward compatibility keys exist
        state["ultrathink_required"] = state["ultrathink"].get("required", False)
        state["ultrathink_completed"] = state["ultrathink"].get("completed", False)
            
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

def generate_intelligent_error(state):
    """
    Generate a helpful error message with context and suggestions.
    """
    # Get session ID
    session_id = state.get("session", {}).get("id", "YYYYMMDD")
    
    # Get trigger information
    trigger = state.get("ultrathink", {}).get("trigger", {})
    trigger_type = trigger.get("type", "unknown") if trigger else "unknown"
    trigger_keyword = trigger.get("keyword", "development work") if trigger else "development work"
    full_text = trigger.get("full_text", "") if trigger else ""
    
    # Base error message
    error_msg = f"""❌ Development request requires ULTRATHINK format first.

Detected trigger: "{trigger_keyword}" (type: {trigger_type})"""
    
    # Add full request context if available
    if full_text:
        # Truncate if too long
        display_text = full_text[:150] + "..." if len(full_text) > 150 else full_text
        error_msg += f"""
Your request: "{display_text}"""
    
    # Add ready-to-use template
    error_msg += f"""

Ready-to-use template:
Let me ultrathink about this... [S:{session_id}|W:YOUR_WORK_CONTEXT|H:searching|E:pending]

Examples for common work contexts:
- Implementation: [S:{session_id}|W:implementation|H:searching|E:pending]
- Bug fixing: [S:{session_id}|W:debugging|H:searching|E:pending]
- Refactoring: [S:{session_id}|W:refactoring|H:searching|E:pending]
- Investigation: [S:{session_id}|W:investigating|H:searching|E:pending]

After outputting ULTRATHINK, search for the appropriate handler in REGISTRY.md."""
    
    # Track blocked attempts
    if "ultrathink" in state:
        state["ultrathink"]["blocked_attempts"] = state["ultrathink"].get("blocked_attempts", 0) + 1
    
    return error_msg

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
            state["ultrathink"]["completed"] = True
            update_state(state)
        
        # Check if we need to block this tool
        if is_development_tool(tool_name):
            if state.get("ultrathink_required", False) and not state.get("ultrathink_completed", False):
                # Generate intelligent error message
                error_msg = generate_intelligent_error(state)
                
                # Update state with blocked attempt count
                update_state(state)
                
                # Block the tool with error message
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
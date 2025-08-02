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

def has_ultrathink_format(content):
    """
    Check if content contains the S:W:H:E ULTRATHINK format.
    Returns True if format is detected, False otherwise.
    """
    # Pattern for S:W:H:E format: [S:X|W:Y|H:Z|E:something]
    ultrathink_pattern = r'\[S:[^|\]]+\|W:[^|\]]+\|H:[^|\]]+\|E:[^\]]+\]'
    
    return bool(re.search(ultrathink_pattern, content))

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

def clear_state_flags():
    """
    Clear all state flags (ultrathink_required and ultrathink_completed) from logs/state.json.
    This happens on successful completion to reset for next conversation.
    """
    state_file = Path("logs/state.json")
    
    try:
        # Reset to empty state for next conversation
        state_file.parent.mkdir(parents=True, exist_ok=True)
        with open(state_file, 'w') as f:
            json.dump({}, f, indent=2)
    except IOError:
        # If we can't write the state file, continue silently
        pass

def log_success():
    """
    Log successful ULTRATHINK format usage for debugging.
    """
    log_file = Path("logs/stop_hook.json")
    
    try:
        # Read existing logs or create new
        if log_file.exists():
            with open(log_file, 'r') as f:
                logs = json.load(f)
        else:
            logs = []
        
        # Add success entry
        from datetime import datetime
        logs.append({
            "timestamp": datetime.now().isoformat(),
            "status": "success",
            "message": "ULTRATHINK format properly used for development work"
        })
        
        # Keep only last 50 entries
        logs = logs[-50:]
        
        # Write back
        log_file.parent.mkdir(parents=True, exist_ok=True)
        with open(log_file, 'w') as f:
            json.dump(logs, f, indent=2)
    except (json.JSONDecodeError, IOError):
        # If logging fails, continue silently
        pass

def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)
        
        # Extract the full conversation content
        # This includes all messages in the conversation
        content = input_data.get('content', '')
        if not content:
            # Try alternative field names
            content = input_data.get('message', '')
            if not content:
                content = input_data.get('transcript', '')
        
        # Read current state
        state = read_state()
        
        # Check if ULTRATHINK was required for this conversation
        ultrathink_required = state.get("ultrathink_required", False)
        
        if ultrathink_required:
            # Validate that ULTRATHINK format was properly used
            if has_ultrathink_format(content):
                # Success: ULTRATHINK format was used
                log_success()
                clear_state_flags()
                print("✓ ULTRATHINK format properly used for development work", file=sys.stderr)
                sys.exit(0)
            else:
                # Warning: ULTRATHINK format was not used
                print("⚠️ ULTRATHINK format not properly used for development work", file=sys.stderr)
                clear_state_flags()  # Clear state even on failure to reset for next conversation
                sys.exit(1)
        else:
            # No ULTRATHINK was required, clear any existing state
            clear_state_flags()
            sys.exit(0)
        
    except json.JSONDecodeError:
        # Invalid JSON input, continue gracefully
        sys.exit(0)
    except Exception:
        # Any other error, continue gracefully
        sys.exit(0)

if __name__ == '__main__':
    main()
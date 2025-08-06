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

def clear_state_flags():
    """
    Clear all state flags (ultrathink_required and ultrathink_completed) from logs/state.json.
    This happens on successful completion to reset for next conversation.
    """
    state_file = Path("logs/state.json")
    
    try:
        # Read existing state to preserve non-conversation data
        if state_file.exists():
            with open(state_file, 'r') as f:
                state = json.load(f)
        else:
            state = {}
        
        # Clear conversation-specific flags
        if "ultrathink" in state:
            state["ultrathink"]["required"] = False
            state["ultrathink"]["completed"] = False
            state["ultrathink"]["trigger"] = None
            state["ultrathink"]["blocked_attempts"] = 0
            # Preserve statements for history
        
        # Clear backward compatibility flags
        state["ultrathink_required"] = False
        state["ultrathink_completed"] = False
        
        # Write back
        state_file.parent.mkdir(parents=True, exist_ok=True)
        with open(state_file, 'w') as f:
            json.dump(state, f, indent=2)
    except (json.JSONDecodeError, IOError):
        # If we can't process the state file, continue silently
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
            # Get additional context
            trigger = state.get("ultrathink", {}).get("trigger", {})
            blocked_attempts = state.get("ultrathink", {}).get("blocked_attempts", 0)
            
            # Validate that ULTRATHINK format was properly used
            if has_ultrathink_format(content):
                # Success: ULTRATHINK format was used
                log_success()
                
                # Provide success feedback with context
                success_msg = "✓ ULTRATHINK format properly used for development work"
                if trigger:
                    trigger_keyword = trigger.get("keyword", "unknown")
                    success_msg += f" (trigger: '{trigger_keyword}')"
                if blocked_attempts > 0:
                    success_msg += f" after {blocked_attempts} blocked attempt(s)"
                
                print(success_msg, file=sys.stderr)
                clear_state_flags()
                sys.exit(0)
            else:
                # Warning: ULTRATHINK format was not used
                warning_msg = "⚠️ ULTRATHINK format not properly used for development work"
                if trigger:
                    trigger_keyword = trigger.get("keyword", "unknown")
                    warning_msg += f" (trigger: '{trigger_keyword}')"
                if blocked_attempts > 0:
                    warning_msg += f" - {blocked_attempts} tool(s) were blocked"
                
                print(warning_msg, file=sys.stderr)
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
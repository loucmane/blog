#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "python-dotenv",
#     "pyyaml",
# ]
# ///

"""
Enhanced stop hook with analytics and reporting
"""

import json
import sys
import re
from pathlib import Path
from datetime import datetime

# Add utils to path for cache import
sys.path.append(str(Path(__file__).parent / 'utils'))

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
    Also updates session ID to current date if needed.
    """
    state_file = Path("logs/state.json")
    
    try:
        # Read existing state to preserve non-conversation data
        if state_file.exists():
            with open(state_file, 'r') as f:
                state = json.load(f)
        else:
            state = {}
        
        # Update session ID to current date
        today = datetime.now().strftime("%Y%m%d")
        if "session" not in state:
            state["session"] = {}
        
        # Always update session to today's date when clearing state
        state["session"]["id"] = today
        state["session"]["last_activity"] = datetime.now().isoformat()
        
        # Clear conversation-specific flags
        if "ultrathink" in state:
            state["ultrathink"]["required"] = False
            state["ultrathink"]["completed"] = False
            state["ultrathink"]["trigger"] = None
            state["ultrathink"]["blocked_attempts"] = 0
            # Clear statements since we're resetting for new session
            state["ultrathink"]["statements"] = []
        
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

def generate_analytics_report(state):
    """Generate analytics about the session"""
    analytics = {
        'session_id': state.get('session', {}).get('id', 'unknown'),
        'timestamp': datetime.now().isoformat(),
        'ultrathink_compliance': {
            'required': state.get('ultrathink', {}).get('required', False),
            'completed': state.get('ultrathink', {}).get('completed', False),
            'blocked_attempts': state.get('ultrathink', {}).get('blocked_attempts', 0),
            'statements': len(state.get('ultrathink', {}).get('statements', []))
        },
        'handler_suggestions': {
            'provided': len(state.get('ultrathink', {}).get('handler_suggestions', [])) > 0,
            'suggestions': state.get('ultrathink', {}).get('handler_suggestions', [])
        },
        'tools_used': {
            'total': len(state.get('context', {}).get('tools_used', [])),
            'blocked': sum(1 for tool in state.get('context', {}).get('tools_used', []) if tool.get('blocked', False))
        }
    }
    
    return analytics

def save_analytics(analytics):
    """Save analytics to file"""
    analytics_file = Path("logs/analytics.json")
    
    # Load existing analytics
    existing = []
    if analytics_file.exists():
        try:
            with open(analytics_file, 'r') as f:
                existing = json.load(f)
        except (json.JSONDecodeError, IOError):
            existing = []
    
    # Append new analytics
    existing.append(analytics)
    
    # Keep only last 100 entries
    if len(existing) > 100:
        existing = existing[-100:]
    
    # Save back
    try:
        analytics_file.parent.mkdir(parents=True, exist_ok=True)
        with open(analytics_file, 'w') as f:
            json.dump(existing, f, indent=2)
    except IOError:
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
        
        # Generate analytics
        analytics = generate_analytics_report(state)
        save_analytics(analytics)
        
        # Check if ULTRATHINK was required for this conversation
        ultrathink_required = state.get("ultrathink_required", False)
        
        if ultrathink_required:
            # Get additional context
            trigger = state.get("ultrathink", {}).get("trigger", {})
            blocked_attempts = state.get("ultrathink", {}).get("blocked_attempts", 0)
            
            # Validate that ULTRATHINK format was properly used
            if has_ultrathink_format(content):
                # Success: ULTRATHINK format was used
                success_msg = "✅ ULTRATHINK compliance achieved"
                statements = state.get('ultrathink', {}).get('statements', [])
                if statements:
                    latest = statements[-1]
                    success_msg += f"\n   Format: {latest.get('format', 'unknown')}"
                    components = latest.get('components', {})
                    handler = components.get('handler', '')
                    if handler and handler not in ['searching', 'VOID']:
                        success_msg += f"\n   Handler: {handler}"
                
                print(success_msg, file=sys.stderr)
                clear_state_flags()
                sys.exit(0)
            else:
                # Warning: ULTRATHINK format was not used
                warning_msg = f"⚠️  ULTRATHINK format not properly used for development work - {blocked_attempts} tool(s) were blocked"
                if trigger:
                    trigger_keyword = trigger.get("keyword", "unknown")
                    warning_msg += f"\n   Trigger detected: \"{trigger_keyword}\""
                
                # Show handler suggestions
                suggestions = state.get('ultrathink', {}).get('handler_suggestions', [])
                if suggestions:
                    warning_msg += "\n   Consider using one of these handlers:"
                    for sug in suggestions[:3]:
                        warning_msg += f"\n     - {sug['name']}"
                
                print(warning_msg, file=sys.stderr)
                clear_state_flags()  # Clear state even on failure to reset for next conversation
                sys.exit(2)  # Changed from 1 to 2 so AI can see the warning
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
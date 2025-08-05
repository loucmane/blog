#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "python-dotenv",
#     "pyyaml",
# ]
# ///

"""
Enhanced user prompt submission hook with template integration
"""

import json
import sys
import re
from pathlib import Path

# Add utils to path for cache import
sys.path.append(str(Path(__file__).parent / 'utils'))

def is_development_request(prompt):
    """
    Detect if a user prompt contains development-related triggers.
    Returns tuple: (is_dev_request, trigger_info)
    """
    # Layer 1: Explicit Development Triggers
    explicit_triggers = [
        # Commands
        r'\bimplement\b', r'\bbuild\b', r'\bfix\b', r'\btest\b', 
        r'\bdebug\b', r'\bwork on\b', r'\bcreate\b', r'\bupdate\b', 
        r'\brefactor\b', r'\boptimize\b',
        
        # Tools
        r'\bsearch\b', r'\bfind\b', r'\bedit\b', r'\bcommit\b', 
        r'\bgrep\b', r'\bread file\b',
        
        # Tasks
        r'\btask\b', r'\bcomponent\b', r'\bfeature\b', 
        r'\bfunction\b', r'\bmodule\b',
        
        # Documentation
        r'\bdocument\b', r'\bwrite README\b', r'\badd comments\b', 
        r'\bAPI docs\b'
    ]
    
    # Layer 2: Implicit Development Triggers
    implicit_triggers = [
        # Problems
        r'\bnot working\b', r'\bbroken\b', r'\bfailing\b', 
        r'\bissue\b', r'\berror\b', r'\bbug\b', r'\bwrong\b', r'\bstuck\b',
        
        # Analysis Questions
        r'\bhow does\b', r'\bwhat\'s in\b', r'\bwhere is\b', 
        r'\bwhy does\b', r'\bcan you check\b',
        
        # Code Analysis
        r'\bexplain this code\b', r'\bwhat does this do\b', 
        r'\banalyze\b', r'\breview\b',
        
        # Work Activities
        r'\bplan\b', r'\bdiscuss\b', r'\bdesign\b', 
        r'\bwalk through\b'
    ]
    
    # Layer 3: File/Code Context Triggers
    file_triggers = [
        # File extensions in context
        r'\.(js|jsx|ts|tsx|py|java|cpp|c|go|rs|rb|php|css|scss|html|md|json|xml|yaml|yml)\b',
        
        # File paths
        r'/src/', r'/docs/', r'/test/', r'/lib/', r'/components/',
        
        # Code in backticks
        r'`[^`]*`',
        
        # Stack traces or error patterns
        r'Error:', r'Exception:', r'TypeError:', r'ReferenceError:'
    ]
    
    # Convert prompt to lowercase for case-insensitive matching
    prompt_lower = prompt.lower()
    
    # Check each category and capture trigger info
    for pattern in explicit_triggers:
        match = re.search(pattern, prompt_lower, re.IGNORECASE)
        if match:
            return True, {
                'type': 'explicit',
                'keyword': match.group(0),
                'pattern': pattern,
                'confidence': 1.0
            }
    
    for pattern in implicit_triggers:
        match = re.search(pattern, prompt_lower, re.IGNORECASE)
        if match:
            return True, {
                'type': 'implicit',
                'keyword': match.group(0),
                'pattern': pattern,
                'confidence': 0.8
            }
    
    # Check file/code patterns in original case
    for pattern in file_triggers:
        match = re.search(pattern, prompt, re.IGNORECASE)
        if match:
            return True, {
                'type': 'context',
                'keyword': match.group(0),
                'pattern': pattern,
                'confidence': 0.7
            }
    
    return False, None

def find_matching_handlers(prompt):
    """Find handlers matching the user prompt"""
    try:
        from handler_cache import HandlerCache
        import os
        
        # Get project directory
        project_dir = os.environ.get('CLAUDE_PROJECT_DIR', str(Path.cwd()))
        
        cache = HandlerCache(project_dir)
        if not cache.load_cache():
            # Build cache if doesn't exist
            cache.build_cache()
        
        # Find top 5 matching handlers
        matches = cache.find_handlers(prompt, limit=5)
        return matches
    except Exception as e:
        print(f"Error finding handlers: {e}", file=sys.stderr)
        return []

def update_state_file(ultrathink_required, trigger_info=None, prompt=None, handler_matches=None):
    """
    Update the state.json file with enhanced state tracking.
    """
    from datetime import datetime
    
    state_file = Path("logs/state.json")
    
    # Read existing state or create new
    if state_file.exists():
        try:
            with open(state_file, 'r') as f:
                state = json.load(f)
        except (json.JSONDecodeError, IOError):
            state = {}
    else:
        state = {}
    
    # Initialize session if not present or if session is from previous day
    today = datetime.now().strftime("%Y%m%d")
    if "session" not in state or state["session"].get("id") != today:
        # New session needed - either no session or date changed
        if "session" in state and state["session"].get("id") != today:
            # Session date changed - clear all state for fresh start
            state = {
                "session": {
                    "id": today,
                    "started_at": datetime.now().isoformat()
                }
            }
        else:
            # No session - create new one
            state["session"] = {
                "id": today,
                "started_at": datetime.now().isoformat()
            }
    state["session"]["last_activity"] = datetime.now().isoformat()
    
    # Initialize ultrathink structure if not present
    if "ultrathink" not in state:
        state["ultrathink"] = {
            "required": False,
            "completed": False,
            "statements": [],
            "blocked_attempts": 0
        }
    
    # Update the ultrathink_required flag and trigger info
    state["ultrathink"]["required"] = ultrathink_required
    
    # If this is a development request, track the trigger details
    if ultrathink_required and trigger_info:
        state["ultrathink"]["trigger"] = {
            "type": trigger_info.get("type", "unknown"),
            "keyword": trigger_info.get("keyword", ""),
            "full_text": prompt[:500] if prompt else "",  # Limit to 500 chars
            "detected_at": datetime.now().isoformat(),
            "confidence": trigger_info.get("confidence", 1.0)
        }
        
        # Add handler suggestions if found
        if handler_matches:
            suggestions = []
            for name, score in handler_matches[:3]:  # Top 3
                if score > 2.0:
                    suggestions.append({
                        "name": name,
                        "score": float(score)
                    })
            state["ultrathink"]["handler_suggestions"] = suggestions
    
    # Initialize context tracking if not present
    if "context" not in state:
        state["context"] = {
            "work_folders": [],
            "recent_searches": [],
            "tools_used": []
        }
    
    # Write back to file
    try:
        state_file.parent.mkdir(parents=True, exist_ok=True)
        with open(state_file, 'w') as f:
            json.dump(state, f, indent=2)
    except IOError:
        # If we can't write the state file, continue silently
        pass

def format_handler_suggestions(matches):
    """Format handler matches for display"""
    if not matches:
        return ""
    
    suggestions = []
    for name, score in matches[:3]:  # Top 3
        if score > 2.0:  # Only show relevant matches
            suggestions.append(f"   Suggested handler: {name} (confidence: {score:.1f})")
    
    if suggestions:
        return "\n".join(suggestions)
    return ""

def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)
        
        # Extract the user prompt
        prompt = input_data.get('user_prompt', '')
        
        if not prompt:
            # No prompt to analyze, continue normally
            sys.exit(0)
        
        # Check if this is a development request (now returns tuple)
        is_dev_request, trigger_info = is_development_request(prompt)
        
        handler_matches = []
        if is_dev_request:
            # Find matching handlers
            handler_matches = find_matching_handlers(prompt)
        
        # Update state file with enhanced tracking
        update_state_file(is_dev_request, trigger_info, prompt, handler_matches)
        
        # Ensure backward compatibility flag is synced
        if is_dev_request:
            # Read and update state to ensure flags are synced
            state_file = Path("logs/state.json")
            if state_file.exists():
                try:
                    with open(state_file, 'r') as f:
                        state = json.load(f)
                    state["ultrathink_required"] = True  # Sync backward compatibility flag
                    with open(state_file, 'w') as f:
                        json.dump(state, f, indent=2)
                except (json.JSONDecodeError, IOError):
                    pass
        
        # For development requests, we just set the flag but don't block
        # The ULTRATHINK enforcement happens elsewhere in the system
        if is_dev_request:
            # Log enhanced info to stderr for debugging
            trigger_type = trigger_info.get('type', 'unknown')
            trigger_keyword = trigger_info.get('keyword', 'unknown')
            print(f"Development trigger detected: type={trigger_type}, keyword='{trigger_keyword}'", file=sys.stderr)
            
            # Show handler suggestions
            suggestions = format_handler_suggestions(handler_matches)
            if suggestions:
                print("Handler suggestions stored in state:", file=sys.stderr)
                print(suggestions, file=sys.stderr)
        
        # Always continue normally - this hook only sets state
        sys.exit(0)
        
    except json.JSONDecodeError:
        # Invalid JSON input, continue gracefully
        sys.exit(0)
    except Exception as e:
        # Any other error, log but continue gracefully
        print(f"Hook error: {e}", file=sys.stderr)
        sys.exit(0)

if __name__ == '__main__':
    main()
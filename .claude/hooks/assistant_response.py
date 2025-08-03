#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "python-dotenv",
#     "pyyaml",
# ]
# ///

"""
Assistant response validation hook for ULTRATHINK compliance
"""

import json
import sys
import re
from pathlib import Path

# Add utils to path for cache import
sys.path.append(str(Path(__file__).parent / 'utils'))

def check_ultrathink_format(response_text):
    """
    Check if assistant response contains proper ULTRATHINK format.
    Returns tuple: (has_ultrathink, parsed_components)
    """
    # Look for ULTRATHINK pattern
    pattern = r'Let me ultrathink about this\.\.\. \[S:([^|]+)\|W:([^|]+)\|H:([^|]+)\|E:([^\]]+)\]'
    match = re.search(pattern, response_text, re.IGNORECASE)
    
    if match:
        return True, {
            'session': match.group(1),
            'work': match.group(2), 
            'handler': match.group(3),
            'evidence': match.group(4),
            'full_match': match.group(0)
        }
    
    return False, None

def validate_handler(handler_name):
    """Validate if handler exists in REGISTRY"""
    try:
        from handler_cache import HandlerCache
        import os
        
        project_dir = os.environ.get('CLAUDE_PROJECT_DIR', str(Path.cwd()))
        cache = HandlerCache(project_dir)
        
        if not cache.load_cache():
            return False, None
        
        # Check if exact handler exists
        handler_info = cache.get_handler_info(handler_name)
        if handler_info:
            return True, handler_info
        
        # Find similar handlers
        similar = cache.find_handlers(handler_name, limit=3)
        return False, similar
        
    except Exception:
        return False, None

def validate_evidence(evidence_str, handler_info=None):
    """Validate evidence format and content"""
    issues = []
    
    # Check for common evidence patterns
    if evidence_str == "pending":
        # This is valid for initial searching state
        return []
    
    # Check for step count pattern (e.g., "5" or "5/key:value")
    step_pattern = r'^(\d+)(?:/(.+))?$'
    match = re.match(step_pattern, evidence_str)
    
    if match:
        step_count = int(match.group(1))
        key_value = match.group(2) if match.group(2) else None
        
        # Validate step count is reasonable
        if step_count == 0:
            issues.append("Evidence shows 0 steps - did you read the handler?")
        elif step_count > 20:
            issues.append(f"Evidence shows {step_count} steps - seems excessive")
        
        # Check for key:value format if present
        if key_value and ':' not in key_value:
            issues.append("Evidence key:value format incorrect (missing colon)")
    else:
        # Evidence doesn't match expected format
        issues.append(f"Evidence format unclear: '{evidence_str}'")
    
    return issues

def load_state():
    """Load the current hook state"""
    state_file = Path("logs/state.json")
    if state_file.exists():
        try:
            with open(state_file, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {}

def update_state_with_response(state, has_ultrathink, components=None, validation_issues=None):
    """Update state with response validation info"""
    from datetime import datetime
    
    if 'ultrathink' not in state:
        state['ultrathink'] = {}
    
    if has_ultrathink and components:
        # Mark as completed
        state['ultrathink']['completed'] = True
        
        # Store the statement
        if 'statements' not in state['ultrathink']:
            state['ultrathink']['statements'] = []
        
        state['ultrathink']['statements'].append({
            'timestamp': datetime.now().isoformat(),
            'format': components['full_match'],
            'components': {
                'session': components['session'],
                'work': components['work'],
                'handler': components['handler'],
                'evidence': components['evidence']
            },
            'validation_issues': validation_issues or []
        })
    
    # Save state
    state_file = Path("logs/state.json")
    try:
        with open(state_file, 'w') as f:
            json.dump(state, f, indent=2)
    except IOError:
        pass

def format_validation_feedback(components, handler_valid, handler_info, evidence_issues):
    """Format validation feedback for display"""
    lines = []
    
    # Handler validation
    handler_name = components['handler']
    if handler_name in ['searching', 'VOID']:
        lines.append(f"ℹ️  Handler search in progress: H:{handler_name}")
    elif handler_valid:
        lines.append(f"✅ Valid handler found: {handler_name}")
        if handler_info and 'path' in handler_info:
            lines.append(f"   Location: {handler_info['path']}")
    else:
        lines.append(f"⚠️  Handler '{handler_name}' not found in REGISTRY")
        if handler_info:  # handler_info contains similar handlers
            lines.append("   Did you mean:")
            for name, score in handler_info[:3]:
                lines.append(f"     - {name}")
    
    # Evidence validation
    if evidence_issues:
        lines.append("⚠️  Evidence issues:")
        for issue in evidence_issues:
            lines.append(f"   - {issue}")
    
    # Session validation
    session = components['session']
    if session == 'VOID':
        lines.append("ℹ️  Session: VOID (will auto-resolve)")
    
    # Work context validation
    work = components['work']
    if work == 'VOID':
        lines.append("ℹ️  Work context: VOID (will auto-resolve)")
    
    return "\n".join(lines) if lines else None

def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)
        
        # Extract assistant response
        response_text = input_data.get('assistant_response', '')
        
        if not response_text:
            # No response to validate
            sys.exit(0)
        
        # Load current state
        state = load_state()
        
        # Only validate if development request was detected
        if not state.get('ultrathink', {}).get('required', False):
            sys.exit(0)
        
        # Check for ULTRATHINK format
        has_ultrathink, components = check_ultrathink_format(response_text)
        
        if has_ultrathink:
            # Validate components
            handler_name = components['handler']
            handler_valid = False
            handler_info = None
            
            if handler_name not in ['searching', 'VOID']:
                handler_valid, handler_info = validate_handler(handler_name)
            
            # Validate evidence
            evidence_issues = validate_evidence(components['evidence'], handler_info if handler_valid else None)
            
            # Format feedback
            feedback = format_validation_feedback(components, handler_valid, handler_info, evidence_issues)
            
            if feedback:
                print(feedback, file=sys.stderr)
            
            # Update state
            validation_issues = []
            if not handler_valid and handler_name not in ['searching', 'VOID']:
                validation_issues.append(f"Invalid handler: {handler_name}")
            validation_issues.extend(evidence_issues)
            
            update_state_with_response(state, True, components, validation_issues)
        else:
            # No ULTRATHINK found when required
            print("⚠️  Development request detected but ULTRATHINK format not found in response", file=sys.stderr)
            print("   Expected: Let me ultrathink about this... [S:X|W:Y|H:Z|E:steps/\"criteria\"]", file=sys.stderr)
        
        # Always continue (non-blocking)
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
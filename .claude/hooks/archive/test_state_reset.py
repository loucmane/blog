#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = []
# ///

"""
Test script to verify state reset functionality
"""

import json
import sys
from pathlib import Path
from datetime import datetime

def test_state_reset():
    """Test that state clears properly after ULTRATHINK completion"""
    
    # Add hooks directory to path
    sys.path.append(str(Path(__file__).parent))
    
    # Import the functions we need to test
    from stop import clear_state_flags, read_state
    from user_prompt_submit import update_state_file
    
    print("🧪 Testing Hook State Reset Functionality")
    print("=" * 50)
    
    # Test 1: Clear existing old state
    print("\n1️⃣ Testing clear_state_flags() with old session...")
    
    # Create a mock old state
    old_state = {
        "session": {
            "id": "20250802",
            "started_at": "2025-08-02T20:42:42.389270",
            "last_activity": "2025-08-02T20:42:42.389275"
        },
        "ultrathink": {
            "required": True,
            "completed": True,
            "statements": [{"format": "[S:20250802|W:implementation|H:read-file|E:3/check file]"}],
            "blocked_attempts": 4,
            "trigger": {
                "type": "explicit",
                "keyword": "implement",
                "full_text": "implement a new feature for user authentication"
            }
        },
        "ultrathink_required": True,
        "ultrathink_completed": True
    }
    
    # Write old state
    state_file = Path("logs/state.json")
    state_file.parent.mkdir(parents=True, exist_ok=True)
    with open(state_file, 'w') as f:
        json.dump(old_state, f, indent=2)
    
    print(f"   ✓ Created test state with session ID: {old_state['session']['id']}")
    
    # Clear the state
    clear_state_flags()
    
    # Read back and verify
    with open(state_file, 'r') as f:
        new_state = json.load(f)
    
    today = datetime.now().strftime("%Y%m%d")
    
    print(f"   ✓ State cleared, new session ID: {new_state['session']['id']}")
    print(f"   ✓ Expected session ID: {today}")
    print(f"   ✓ ultrathink_required: {new_state.get('ultrathink_required', False)}")
    print(f"   ✓ ultrathink_completed: {new_state.get('ultrathink_completed', False)}")
    
    # Verify results
    assert new_state['session']['id'] == today, f"Session ID should be {today}, got {new_state['session']['id']}"
    assert new_state.get('ultrathink_required', True) == False, "ultrathink_required should be False"
    assert new_state.get('ultrathink_completed', True) == False, "ultrathink_completed should be False"
    assert new_state['ultrathink']['required'] == False, "ultrathink.required should be False"
    assert new_state['ultrathink']['completed'] == False, "ultrathink.completed should be False"
    assert new_state['ultrathink']['trigger'] is None, "ultrathink.trigger should be None"
    assert new_state['ultrathink']['statements'] == [], "ultrathink.statements should be empty"
    
    print("   ✅ clear_state_flags() working correctly!")
    
    # Test 2: Session date detection in user_prompt_submit
    print("\n2️⃣ Testing session date detection...")
    
    # Create state with old date
    old_date_state = {
        "session": {
            "id": "20250802",
            "started_at": "2025-08-02T20:42:42.389270"
        },
        "ultrathink": {
            "required": False,
            "completed": False
        }
    }
    
    with open(state_file, 'w') as f:
        json.dump(old_date_state, f, indent=2)
    
    print(f"   ✓ Created state with old session ID: 20250802")
    
    # Simulate a development request
    update_state_file(True, {"type": "explicit", "keyword": "test"}, "test development request")
    
    # Read back and verify session was updated
    with open(state_file, 'r') as f:
        updated_state = json.load(f)
    
    print(f"   ✓ After update, session ID: {updated_state['session']['id']}")
    assert updated_state['session']['id'] == today, f"Session ID should be updated to {today}"
    
    print("   ✅ Session date detection working correctly!")
    
    # Test 3: Complete workflow test
    print("\n3️⃣ Testing complete workflow...")
    
    # Step 1: Development request triggers state
    update_state_file(True, {"type": "explicit", "keyword": "implement"}, "implement feature")
    
    with open(state_file, 'r') as f:
        triggered_state = json.load(f)
    
    assert triggered_state['ultrathink']['required'] == True, "Should require ULTRATHINK"
    print("   ✓ Development trigger sets ultrathink_required=True")
    
    # Step 2: Successful completion clears state
    clear_state_flags()
    
    with open(state_file, 'r') as f:
        final_state = json.load(f)
    
    assert final_state['ultrathink']['required'] == False, "Should clear ULTRATHINK requirement"
    assert final_state['session']['id'] == today, "Should have current session ID"
    print("   ✓ Successful completion clears state properly")
    
    print("\n🎉 All tests passed! State reset functionality is working correctly.")
    
    return True

if __name__ == '__main__':
    try:
        test_state_reset()
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
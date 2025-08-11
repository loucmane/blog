#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = []
# ///

"""
Aggressive UserPromptSubmit Hook for ULTRATHINK Enforcement
Injects unmissable context to force compliance
"""

import json
import sys
from pathlib import Path
from datetime import datetime

def is_development_request(prompt: str) -> bool:
    """Detect if this is a development request requiring ULTRATHINK"""
    dev_triggers = [
        'implement', 'build', 'create', 'fix', 'debug', 'refactor',
        'work on', 'test', 'optimize', 'enhance', 'add feature',
        'modify', 'update code', 'change', 'improve'
    ]
    prompt_lower = prompt.lower()
    return any(trigger in prompt_lower for trigger in dev_triggers)

def inject_ultrathink_enforcement(prompt: str):
    """Inject aggressive ULTRATHINK enforcement context"""
    session_id = datetime.now().strftime("%Y%m%d")
    
    # Create unmissable visual barrier
    enforcement_msg = f"""
╔════════════════════════════════════════════════════════════════════════╗
║                   ⚠️  MANDATORY ULTRATHINK PROTOCOL ⚠️                   ║
╠════════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  YOU CANNOT PROCEED WITHOUT FOLLOWING ULTRATHINK FORMAT               ║
║                                                                        ║
║  REQUIRED SEQUENCE:                                                   ║
║  ────────────────                                                     ║
║  1. OUTPUT EXACTLY (no variations):                                   ║
║     "Let me ultrathink about this... [S:{session_id}|W:X|H:searching|E:pending]" ║
║                                                                        ║
║  2. USE THESE TOOLS IN ORDER:                                         ║
║     • Grep to search REGISTRY.md for appropriate handler              ║
║     • Read to load the selected handler                               ║
║                                                                        ║
║  3. UPDATE YOUR S:W:H:E:                                              ║
║     • H: Change from "searching" to actual handler name               ║
║     • E: Change from "pending" to actual evidence                     ║
║                                                                        ║
║  4. ONLY THEN can you use development tools (Edit, Write, Bash)       ║
║                                                                        ║
║  ⚡ ENFORCEMENT ACTIVE:                                                ║
║     • Development tools are BLOCKED until ULTRATHINK completes        ║
║     • Your tool usage is being tracked                                ║
║     • Proof of work files are required                                ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝

🚨 SYSTEM ENFORCEMENT: The above is MANDATORY, not optional.
   Hooks will BLOCK all development tools until completed.

─────────────────────────────────────────────────────────────────
USER'S ORIGINAL REQUEST:
"{prompt}"
─────────────────────────────────────────────────────────────────
"""
    
    # Print to stdout - this becomes part of what Claude sees
    print(enforcement_msg)
    
    # Also update state to mark that enforcement was triggered
    state_file = Path("logs/state.json")
    state = {}
    if state_file.exists():
        try:
            with open(state_file, 'r') as f:
                state = json.load(f)
        except:
            pass
    
    # Mark that ULTRATHINK is required
    state["ultrathink"] = {
        "required": True,
        "triggered_at": datetime.now().isoformat(),
        "phase": "not_started",
        "prompt": prompt[:200]  # Store first 200 chars
    }
    state["development_mode_triggered"] = True
    
    state_file.parent.mkdir(parents=True, exist_ok=True)
    with open(state_file, 'w') as f:
        json.dump(state, f, indent=2)

def main():
    """Main hook entry point"""
    try:
        # Read the JSON input
        input_data = json.load(sys.stdin)
        
        # Extract the user's prompt
        prompt = input_data.get('user_prompt', '')
        
        # Check if this is a development request
        if is_development_request(prompt):
            # Check if ULTRATHINK has already been completed this session
            state_file = Path("logs/state.json")
            if state_file.exists():
                with open(state_file, 'r') as f:
                    state = json.load(f)
                    
                # If ULTRATHINK was completed recently (within 30 mins), don't re-inject
                ultrathink = state.get("ultrathink", {})
                if ultrathink.get("completed"):
                    completed_at = ultrathink.get("completed_at", 0)
                    import time
                    if (time.time() - completed_at) < 1800:  # 30 minutes
                        # ULTRATHINK already done, just proceed
                        sys.exit(0)
            
            # Inject the aggressive enforcement message
            inject_ultrathink_enforcement(prompt)
        
        # Continue normally
        sys.exit(0)
        
    except json.JSONDecodeError:
        sys.exit(0)
    except Exception as e:
        # Log error but don't block
        print(f"Hook error: {e}", file=sys.stderr)
        sys.exit(0)

if __name__ == '__main__':
    main()
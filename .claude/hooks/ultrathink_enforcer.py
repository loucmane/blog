#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "python-dotenv",
# ]
# ///

"""
Enhanced ULTRATHINK Enforcement System V2
Fixes deadlock issue and implements behavior-based detection
"""

import json
import sys
import re
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, Set, Optional

class UltrathinkEnforcerV2:
    """
    Improved enforcement that tracks ULTRATHINK progression through behavior
    """
    
    # Tools allowed during ULTRATHINK execution
    ULTRATHINK_ALLOWED_TOOLS = {'Read', 'Glob', 'Grep', 'LS', 'WebFetch'}
    
    # Development tools that require ULTRATHINK completion
    DEVELOPMENT_TOOLS = {'Edit', 'Write', 'MultiEdit', 'Bash', 'Task'}
    
    def __init__(self):
        self.state_file = Path("logs/state.json")
        self.proof_dir = Path(".claude/state")
        self.proof_dir.mkdir(parents=True, exist_ok=True)
        
    def load_state(self) -> Dict:
        """Load current state"""
        if not self.state_file.exists():
            return {}
        try:
            with open(self.state_file, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    
    def save_state(self, state: Dict):
        """Save state back to file"""
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.state_file, 'w') as f:
            json.dump(state, f, indent=2)
    
    def is_development_request(self, state: Dict) -> bool:
        """Check if we're in development mode"""
        return (
            state.get("ultrathink", {}).get("required", False) or
            state.get("development_mode_triggered", False)
        )
    
    def track_ultrathink_behavior(self, tool_name: str, tool_input: Dict, state: Dict) -> Dict:
        """
        Track ULTRATHINK progression through tool usage behavior
        Returns updated state
        """
        ultrathink = state.get("ultrathink", {})
        
        # Initialize if needed
        if "phase" not in ultrathink:
            ultrathink["phase"] = "not_started"
            ultrathink["started_at"] = None
            ultrathink["evidence"] = []
        
        # Track different behaviors
        if tool_name == 'Grep':
            path = tool_input.get('path', '')
            pattern = tool_input.get('pattern', '')
            
            # Searching REGISTRY.md is a key ULTRATHINK behavior
            if 'REGISTRY.md' in path or 'registry' in pattern.lower():
                ultrathink["phase"] = "searching_handlers"
                ultrathink["evidence"].append({
                    "action": "registry_search",
                    "timestamp": time.time(),
                    "details": f"Searched for: {pattern}"
                })
                
                # Create proof of search
                proof_file = self.proof_dir / "ultrathink-search-proof.json"
                proof_data = {
                    "timestamp": time.time(),
                    "session_id": datetime.now().strftime("%Y%m%d"),
                    "action": "registry_search",
                    "pattern": pattern,
                    "tool": tool_name
                }
                with open(proof_file, 'w') as f:
                    json.dump(proof_data, f, indent=2)
        
        elif tool_name == 'Read':
            file_path = tool_input.get('file_path', '')
            
            # Reading a handler template is ULTRATHINK progression
            if '.claude/templates/' in file_path:
                handler_name = self.extract_handler_name(file_path)
                ultrathink["phase"] = "loading_handler"
                ultrathink["loaded_handler"] = handler_name
                ultrathink["evidence"].append({
                    "action": "handler_loaded",
                    "timestamp": time.time(),
                    "handler": handler_name,
                    "path": file_path
                })
                
                # Create proof of handler loading
                proof_file = self.proof_dir / f"{handler_name}-proof.json"
                proof_data = {
                    "timestamp": time.time(),
                    "session_id": datetime.now().strftime("%Y%m%d"),
                    "action": "handler_loaded",
                    "handler": handler_name,
                    "path": file_path,
                    "tool": tool_name
                }
                with open(proof_file, 'w') as f:
                    json.dump(proof_data, f, indent=2)
                
                # If they've searched AND loaded a handler, ULTRATHINK is effectively complete
                if any(e["action"] == "registry_search" for e in ultrathink["evidence"]):
                    ultrathink["phase"] = "completed"
                    ultrathink["completed"] = True
                    ultrathink["completed_at"] = time.time()
        
        # Update state
        state["ultrathink"] = ultrathink
        return state
    
    def extract_handler_name(self, file_path: str) -> str:
        """Extract handler name from file path"""
        path = Path(file_path)
        # Remove .claude/templates/ prefix and .md suffix
        relative = path.relative_to(Path('.claude/templates')) if '.claude/templates' in str(path) else path
        return str(relative).replace('.md', '').replace('/', '-')
    
    def verify_proof_of_work(self, handler_name: str) -> bool:
        """Verify that a handler proof exists and is recent"""
        proof_file = self.proof_dir / f"{handler_name}-proof.json"
        
        if not proof_file.exists():
            return False
        
        try:
            with open(proof_file, 'r') as f:
                proof = json.load(f)
            
            # Check if proof is recent (within last 5 minutes)
            if proof['timestamp'] < (time.time() - 300):
                return False
            
            return True
        except (json.JSONDecodeError, KeyError):
            return False
    
    def check_ultrathink_completion(self, state: Dict) -> bool:
        """
        Check if ULTRATHINK has been completed based on behavior
        """
        ultrathink = state.get("ultrathink", {})
        
        # Method 1: Explicit completion flag
        if ultrathink.get("completed", False):
            return True
        
        # Method 2: Check evidence trail
        evidence = ultrathink.get("evidence", [])
        has_search = any(e["action"] == "registry_search" for e in evidence)
        has_handler = any(e["action"] == "handler_loaded" for e in evidence)
        
        if has_search and has_handler:
            return True
        
        # Method 3: Check proof files
        search_proof = self.proof_dir / "ultrathink-search-proof.json"
        if search_proof.exists():
            # Check if any handler proof exists
            handler_proofs = list(self.proof_dir.glob("*-proof.json"))
            if len(handler_proofs) > 1:  # More than just search proof
                return True
        
        return False
    
    def handle_pre_tool_use(self, tool_name: str, tool_input: Dict) -> int:
        """
        Main enforcement logic for PreToolUse hook
        Returns exit code: 0=allow, 1=warn, 2=block
        """
        state = self.load_state()
        
        # Update state based on tool usage
        state = self.track_ultrathink_behavior(tool_name, tool_input, state)
        self.save_state(state)
        
        # If not in development mode, allow everything
        if not self.is_development_request(state):
            return 0
        
        # Check tool categories
        if tool_name in self.DEVELOPMENT_TOOLS:
            # These tools require ULTRATHINK completion
            if not self.check_ultrathink_completion(state):
                session_id = datetime.now().strftime("%Y%m%d")
                print(f"""
❌ **BLOCKED: {tool_name} requires ULTRATHINK protocol**

You must complete ULTRATHINK before using development tools.

**Required sequence:**
1. Start with: Let me ultrathink about this... [S:{session_id}|W:context|H:searching|E:pending]
2. Use Grep/Glob to search REGISTRY.md for handlers
3. Use Read to load the selected handler
4. Then you can use {tool_name}

**Current phase:** {state.get('ultrathink', {}).get('phase', 'not_started')}
**Evidence collected:** {len(state.get('ultrathink', {}).get('evidence', []))} actions

This is a hard block. Complete ULTRATHINK first.
""", file=sys.stderr)
                return 2  # Block
        
        elif tool_name in self.ULTRATHINK_ALLOWED_TOOLS:
            # These tools are allowed during ULTRATHINK
            # But let's provide guidance if they're not being used correctly
            if tool_name in ['Grep', 'Glob'] and 'registry' not in str(tool_input).lower():
                ultrathink_phase = state.get('ultrathink', {}).get('phase', 'not_started')
                if ultrathink_phase in ['not_started', 'searching_handlers']:
                    print(f"""
💡 **HINT: During ULTRATHINK, search tools should target REGISTRY.md**

You're using {tool_name} but not searching the registry.
Consider: Grep pattern="your-keyword" path=".claude/templates/REGISTRY.md"
""", file=sys.stderr)
                    # Don't block, just guide
                    return 0
        
        # Allow the tool
        return 0

def main():
    """Hook entry point for PreToolUse"""
    try:
        # Read JSON input
        input_data = json.load(sys.stdin)
        
        # Extract tool information
        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        
        # Initialize enforcer and check
        enforcer = UltrathinkEnforcerV2()
        exit_code = enforcer.handle_pre_tool_use(tool_name, tool_input)
        
        sys.exit(exit_code)
        
    except json.JSONDecodeError:
        sys.exit(0)
    except Exception as e:
        # Log but don't block on errors
        print(f"Enforcement error: {e}", file=sys.stderr)
        sys.exit(0)

if __name__ == '__main__':
    main()
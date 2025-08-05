#!/usr/bin/env python3
"""
Portable hook wrapper that auto-discovers project directory
and executes the actual hook with correct environment
"""

import os
import sys
import subprocess
from pathlib import Path

def find_project_root():
    """Find the project root by looking for .claude directory"""
    current = Path(__file__).resolve()
    
    # Start from the hook file's directory and go up
    for parent in current.parents:
        if (parent / '.claude').is_dir():
            return str(parent)
    
    # Fallback to current directory if .claude not found
    return str(Path.cwd())

def main():
    if len(sys.argv) < 2:
        print("Usage: hook_wrapper.py <hook_script_name>", file=sys.stderr)
        sys.exit(1)
    
    hook_name = sys.argv[1]
    project_root = find_project_root()
    
    # Set environment variable for the hook
    env = os.environ.copy()
    env['CLAUDE_PROJECT_DIR'] = project_root
    
    # Build path to actual hook script
    hook_script = Path(project_root) / '.claude' / 'hooks' / hook_name
    
    if not hook_script.exists():
        print(f"Hook script not found: {hook_script}", file=sys.stderr)
        sys.exit(1)
    
    # Execute the actual hook with the project directory set
    try:
        result = subprocess.run(
            [str(hook_script)],
            input=sys.stdin.read(),
            text=True,
            capture_output=True,
            env=env
        )
        
        # Forward outputs
        if result.stdout:
            print(result.stdout, end='')
        if result.stderr:
            print(result.stderr, file=sys.stderr, end='')
        
        sys.exit(result.returncode)
        
    except Exception as e:
        print(f"Error executing hook: {e}", file=sys.stderr)
        sys.exit(0)  # Fail gracefully

if __name__ == '__main__':
    main()
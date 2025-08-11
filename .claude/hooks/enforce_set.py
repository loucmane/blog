#!/usr/bin/env python3
"""
Set enforcement mode in .claude/settings.json to soft|stable|strict.
Usage: enforce_set.py <soft|stable|strict>
"""
import json
import sys
from pathlib import Path

VALID = {"soft","stable","strict"}

def main():
    if len(sys.argv) < 2 or sys.argv[1] not in VALID:
        print("Usage: enforce_set.py <soft|stable|strict>")
        sys.exit(1)
    level = sys.argv[1]
    settings_path = Path('.claude/settings.json')
    if not settings_path.exists():
        print(".claude/settings.json not found")
        sys.exit(1)
    try:
        data = json.loads(settings_path.read_text())
        meta = data.get('enforcement_metadata', {})
        meta['version'] = level
        data['enforcement_metadata'] = meta
        settings_path.write_text(json.dumps(data, indent=2))
        print(f"Enforcement level set to: {level}")
        sys.exit(0)
    except Exception as e:
        print(f"Error updating settings: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()

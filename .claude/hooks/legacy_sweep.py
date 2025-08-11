#!/usr/bin/env python3
"""
Sweep live guides for deprecated references and print a report.
Targets:
- REGISTRY.md, REGISTRY-REFINED.md
- enhanced_enforcement.py, pre_tool_use.py, enforcement_v2.py, test_enforcement_v2.py
- .claude/templates/ in live docs
Scopes:
- templates/engine/**, templates/behaviors/**, templates/patterns/**, templates/TOOLS.md, templates/WORKFLOWS.md, CLAUDE.md
Usage: python3 .claude/hooks/legacy_sweep.py
"""
import re
import sys
from pathlib import Path

LIVE_PATHS = [
    Path('templates/engine'),
    Path('templates/behaviors'),
    Path('templates/patterns'),
    Path('templates/TOOLS.md'),
    Path('templates/WORKFLOWS.md'),
    Path('CLAUDE.md')
]
PATTERNS = [
    r'REGISTRY(-REFINED)?\.md',
    r'enhanced_enforcement\.py',
    r'pre_tool_use\.py',
    r'enforcement_v2\.py',
    r'test_enforcement_v2\.py',
    r'\.claude/templates/'
]

def scan_file(p: Path):
    try:
        text = p.read_text(errors='ignore')
    except Exception:
        return []
    hits = []
    for pat in PATTERNS:
        for m in re.finditer(pat, text):
            hits.append((pat, m.start()))
    return hits


def main():
    total = 0
    for path in LIVE_PATHS:
        if path.is_dir():
            for f in path.rglob('*'):
                if f.is_file():
                    hits = scan_file(f)
                    for pat, _ in hits:
                        print(f"{f}: {pat}")
                        total += 1
        elif path.is_file():
            hits = scan_file(path)
            for pat, _ in hits:
                print(f"{path}: {pat}")
                total += 1
    if total == 0:
        print('No legacy references found in live guides.')
    else:
        print(f'Total legacy references found: {total}')

if __name__ == '__main__':
    main()

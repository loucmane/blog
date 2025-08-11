#!/usr/bin/env python3
"""
Generate a minimal registry index at templates/registry/index.json.
Scans templates/handlers/** and templates/engine/** for .md files.
Derives:
- id: path relative to templates/ with slashes replaced by '-' and without .md
- path: full path (relative project root)
- tags: based on path parts
- goodFirstHandler: True for a small curated set

Usage: python3 .claude/hooks/generate_registry_index.py [--dry-run]
"""
import json
import sys
from pathlib import Path

TEMPLATES_DIR = Path('templates')
OUTPUT_PATH = TEMPLATES_DIR / 'registry' / 'index.json'
GOOD_FIRST = {
    'handlers-triggers-session-end-session',
    'handlers-operators-workflow-resolve-handler-void',
    'engine-core-ultrathink-protocol'
}

SKIP_DIRS = {
    'registry'  # avoid indexing registry docs themselves
}

DRY_RUN = '--dry-run' in sys.argv[1:]

def path_to_id(p: Path) -> str:
    rel = p.relative_to(TEMPLATES_DIR)
    return str(rel).replace('.md','').replace('/', '-')

def tags_from_path(p: Path) -> list:
    parts = [part for part in p.parts if part not in ('templates',)]
    # drop filename extension
    parts[-1] = parts[-1].replace('.md','')
    return [s for s in parts if s]

def is_md(f: Path) -> bool:
    return f.suffix.lower() == '.md'

def should_skip(p: Path) -> bool:
    # skip registry directory content
    return any(part in SKIP_DIRS for part in p.parts)


def main():
    if not TEMPLATES_DIR.exists():
        print('templates/ not found')
        sys.exit(1)
    items = []
    for base in (TEMPLATES_DIR / 'handlers', TEMPLATES_DIR / 'engine'):
        if not base.exists():
            continue
        for f in base.rglob('*.md'):
            if should_skip(f):
                continue
            _id = path_to_id(f)
            item = {
                'id': _id,
                'path': str(f),
                'tags': tags_from_path(f),
                'goodFirstHandler': _id in GOOD_FIRST
            }
            items.append(item)
    # stable sort by id
    items.sort(key=lambda x: x['id'])
    if DRY_RUN:
        print(json.dumps(items, indent=2))
        return
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(items, indent=2))
    print(f'Wrote {len(items)} entries to {OUTPUT_PATH}')

if __name__ == '__main__':
    main()

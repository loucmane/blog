#!/usr/bin/env python3
"""
Generate workflow guards for all relevant templates.
- Scans templates/handlers/**.md and templates/conventions/**.md
- Derives keywords from filename (split on dashes), plus special cases for session handlers
- Writes templates/metadata/workflow-guards.json

Usage: python3 .claude/hooks/generate_workflow_guards.py [--dry-run]
"""
import json
import sys
from pathlib import Path
import re

TEMPLATES = Path('templates')
OUTPUT = Path('templates/metadata/workflow-guards.json')
DRY = '--dry-run' in sys.argv[1:]

SPECIAL_KEYWORDS = {
    'templates/handlers/triggers/session/start-session.md': [
        'start-session', 'start a session', 'new session', 'begin work'
    ],
    'templates/handlers/triggers/session/end-session.md': [
        'end-session', 'wrap up', 'finish session', 'end for today'
    ],
    'templates/conventions/git/commit-format.md': [
        'gac', 'commit message', 'commit-format'
    ]
}

SKIP_DIRS = {'registry'}


def collect_files():
    paths = []
    for base in (TEMPLATES / 'handlers', TEMPLATES / 'conventions'):
        if base.exists():
            for f in base.rglob('*.md'):
                # Skip registry docs under conventions if any
                if any(part in SKIP_DIRS for part in f.parts):
                    continue
                paths.append(f)
    return paths


def derive_keywords(path: Path):
    p = str(path).replace('\\', '/')
    if p in SPECIAL_KEYWORDS:
        return SPECIAL_KEYWORDS[p]
    base = path.stem  # filename without .md
    parts = re.split(r'[-_\s]+', base)
    parts = [w for w in parts if w and w.lower() not in {'md','readme'}]
    # Build simple keyword variants
    kws = set()
    if parts:
        kws.add(' '.join(parts))
        kws.add('-'.join(parts))
        # single terms (limit noisy ones)
        for w in parts:
            if len(w) >= 3:
                kws.add(w)
    return sorted(kws)


def main():
    files = collect_files()
    guards = []
    for f in files:
        rel = str(f).replace('\\', '/')
        kws = derive_keywords(f)
        if not kws:
            continue
        guards.append({
            'name': rel.split('/')[-1].replace('.md',''),
            'keywords': kws[:8],  # limit
            'requires': [rel]
        })
    # Merge with existing if present (dedupe by 'requires[0]')
    if OUTPUT.exists():
        try:
            existing = json.loads(OUTPUT.read_text())
        except Exception:
            existing = []
    else:
        existing = []
    by_req = { (g.get('requires') or [''])[0] : g for g in existing }
    for g in guards:
        req = (g.get('requires') or [''])[0]
        by_req[req] = g
    final = list(by_req.values())
    final.sort(key=lambda x: (x.get('requires') or [''])[0])
    if DRY:
        print(json.dumps(final, indent=2))
        return
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(final, indent=2))
    print(f'Wrote {len(final)} guards to {OUTPUT}')

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Show current enforcement status.
- Mode from .claude/settings.json (soft|stable|strict)
- Soft mode expiry (soft_until) from logs/state.json
- Recent counts from logs/enforcement_metrics.json (last 24h)
Usage: enforce_status.py
"""
import json
import sys
from pathlib import Path
from datetime import datetime, timedelta

def load_json(path: Path, default):
    try:
        if path.exists():
            return json.loads(path.read_text())
    except Exception:
        pass
    return default

def main():
    settings = load_json(Path('.claude/settings.json'), {})
    state = load_json(Path('logs/state.json'), {})
    metrics = load_json(Path('logs/enforcement_metrics.json'), [])

    mode = settings.get('enforcement_metadata', {}).get('version', 'stable')
    soft_until = state.get('soft_until')
    soft_remaining = None
    if soft_until:
        try:
            delta = float(soft_until) - datetime.now().timestamp()
            if delta > 0:
                soft_remaining = int(delta)
        except Exception:
            pass

    # Last 24h metrics
    cutoff = datetime.now() - timedelta(hours=24)
    def parse_ts(e):
        try:
            return datetime.fromisoformat(e.get('timestamp',''))
        except Exception:
            return None
    recent = [e for e in metrics if (parse_ts(e) and parse_ts(e) >= cutoff)]
    blocks = sum(1 for e in recent if e.get('event')=='block')
    escapes = sum(1 for e in recent if e.get('event')=='escape')
    softs = sum(1 for e in recent if e.get('event')=='soft-continue')

    print('Enforcement Status')
    print('-------------------')
    print(f'Mode: {mode}{f" (soft {soft_remaining}s left)" if soft_remaining else ""}')
    print(f'Recent (24h): blocks={blocks}, escapes={escapes}, soft-continues={softs}')

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Simple enforcement metrics report for the last 24 hours.
Reads logs/enforcement_metrics.json and prints summary KPIs.

Can be imported to generate a text report programmatically, or run as CLI.
CLI options:
  --out <path>        Write human-readable report to file
  --json-out <path>   Write JSON metrics to file
"""
import json
import sys
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime, timedelta

def load_recent_events(hours: int = 24) -> List[Dict[str, Any]]:
    metrics_path = Path('logs/enforcement_metrics.json')
    if not metrics_path.exists():
        return []
    try:
        events = json.loads(metrics_path.read_text())
    except Exception as e:
        return []

    cutoff = datetime.now() - timedelta(hours=24)
    def parse_ts(e):
        try:
            return datetime.fromisoformat(e.get('timestamp', ''))
        except Exception:
            return None
    recent = [e for e in events if (parse_ts(e) and parse_ts(e) >= cutoff)]
    return recent

def compute_metrics(recent: List[Dict[str, Any]]) -> Dict[str, Any]:
    total = len(recent)
    blocks = sum(1 for e in recent if e.get('event') == 'block')
    escapes = sum(1 for e in recent if e.get('event') == 'escape')
    soft = sum(1 for e in recent if e.get('event') == 'soft-continue')
    serena_used = sum(1 for e in recent if e.get('used_serena'))

    # Approx time-to-compliance: measure time between last block and next soft/escape/pass
    # We approximate by scanning sequences grouped by session
    from collections import defaultdict
    def parse_ts(e):
        try:
            return datetime.fromisoformat(e.get('timestamp', ''))
        except Exception:
            return None
    by_session = defaultdict(list)
    for e in recent:
        by_session[e.get('session_id','unknown')].append(e)
    ttc_samples = []
    near_miss = 0
    for sid, evs in by_session.items():
        evs_sorted = sorted(evs, key=lambda x: x.get('timestamp'))
        last_block_time = None
        for e in evs_sorted:
            if e.get('event') == 'block':
                last_block_time = parse_ts(e)
            elif e.get('event') in ('soft-continue','escape') and last_block_time:
                delta = parse_ts(e) - last_block_time
                if delta:
                    ttc_samples.append(delta.total_seconds())
                    if delta.total_seconds() <= 10:
                        near_miss += 1
                last_block_time = None
    avg_ttc = (sum(ttc_samples)/len(ttc_samples)) if ttc_samples else None

    return {
        'window_hours': 24,
        'total_events': total,
        'blocks': blocks,
        'escapes': escapes,
        'soft_continues': soft,
        'serena_usage_in_blocks': serena_used,
        'avg_time_to_compliance_seconds': avg_ttc,
        'near_miss_count': near_miss
    }

def format_text(metrics: Dict[str, Any]) -> str:
    lines = [
        'Enforcement Report (last 24h)',
        '------------------------------',
        f"Total events: {metrics.get('total_events', 0)}",
        f"Blocks: {metrics.get('blocks', 0)}",
        f"Escapes: {metrics.get('escapes', 0)}",
        f"Soft continues: {metrics.get('soft_continues', 0)}",
        f"Serena usage (in block events): {metrics.get('serena_usage_in_blocks', 0)}",
    ]
    avg = metrics.get('avg_time_to_compliance_seconds')
    if avg is not None:
        lines.append(f"Avg time to compliance (s): {avg:.1f}")
    nm = metrics.get('near_miss_count')
    if nm:
        lines.append(f"Near-miss blocks (<=10s to compliance): {nm}")
    return "\n".join(lines) + "\n"

def main():
    out_path = None
    json_out = None
    argv = sys.argv[1:]
    if '--out' in argv:
        idx = argv.index('--out')
        if idx + 1 < len(argv):
            out_path = argv[idx + 1]
    if '--json-out' in argv:
        idx = argv.index('--json-out')
        if idx + 1 < len(argv):
            json_out = argv[idx + 1]

    recent = load_recent_events(24)
    metrics = compute_metrics(recent)

    text = format_text(metrics)
    if out_path:
        Path(out_path).parent.mkdir(parents=True, exist_ok=True)
        Path(out_path).write_text(text)
    else:
        print(text, end='')

    if json_out:
        Path(json_out).parent.mkdir(parents=True, exist_ok=True)
        Path(json_out).write_text(json.dumps(metrics, indent=2))

if __name__ == '__main__':
    main()

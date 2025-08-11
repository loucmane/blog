#!/usr/bin/env python3
"""
Aggressive UserPromptSubmit Hook for ULTRATHINK Enforcement
Injects an unmissable protocol banner and marks state to require ULTRATHINK.
"""
import json
import sys
from pathlib import Path
from datetime import datetime
import re

def classify_prompt(prompt: str) -> str:
    """Return 'high', 'medium', or 'low' confidence for dev intent."""
    p = prompt.lower()
    high = ['implement','build','create','fix','debug','refactor','work on','add feature','modify','update code']
    medium = ['test','optimize','enhance','change','improve','design','plan','analyze','investigate']
    if any(t in p for t in high):
        return 'high'
    if any(t in p for t in medium):
        return 'medium'
    return 'low'

def inject_banner(prompt: str):
    session_id = datetime.now().strftime('%Y%m%d')
    banner = f"""
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
    print(banner)

    # Mark state
    state_file = Path('logs/state.json')
    state = {}
    if state_file.exists():
        try:
            state = json.loads(state_file.read_text())
        except Exception:
            state = {}
    # Extract optional session title hints
    def _kebab(s: str) -> str:
        s = s.lower()
        s = re.sub(r'[^\w\s-]', '', s)
        s = re.sub(r'\s+', '-', s).strip('-')
        return s[:60]
    exact_title = None
    # Patterns like: called 'Title here' | titled "Title" | name it X
    m = re.search(r"(?:called|titled|name (?:it|this)|title[:\s]+)(['\"]?)([^'\"\n]+)\1", prompt, re.IGNORECASE)
    if m:
        exact_title = _kebab(m.group(2))
    else:
        # Heuristic: remove common starter words
        p = prompt.strip()
        # Remove leading phrases
        p = re.sub(r"^(let's|lets|please|can we|start|begin|new|session)\s+", '', p, flags=re.IGNORECASE)
        # Take up to 8 words
        words = re.findall(r"[A-Za-z0-9]+", p)[:8]
        hint = _kebab(' '.join(words)) if words else None
        if hint:
            # Avoid generic
            if hint in ('start-session','new-session','start','session'):
                hint = 'general-development'
        suggested_title = hint or 'general-development'

    state['ultrathink'] = {
        'required': True,
        'triggered_at': datetime.now().isoformat(),
        'phase': 'not_started',
        'prompt': prompt[:200]
    }
    state['development_mode_triggered'] = True
    # Persist title hints under session node
    session_node = state.get('session', {})
    if exact_title:
        session_node['exact_title'] = exact_title
        print(f"Title: using exact title '{exact_title}'", file=sys.stderr)
    else:
        session_node['suggested_title'] = locals().get('suggested_title', 'general-development')
        print(f"Title hint: {session_node['suggested_title']}", file=sys.stderr)
    state['session'] = session_node
    state_file.parent.mkdir(parents=True, exist_ok=True)
    state_file.write_text(json.dumps(state, indent=2))

def main():
    try:
        data = json.load(sys.stdin)
        prompt = data.get('user_prompt', '')
        if not prompt:
            sys.exit(0)
        # One-time Serena activation hint per session
        try:
            state_file = Path('logs/state.json')
            state = json.loads(state_file.read_text()) if state_file.exists() else {}
            # Determine session id (fallback to date)
            from datetime import datetime as _dt
            sid = state.get('session', {}).get('id') or _dt.now().strftime('%Y%m%d')
            sessions = state.setdefault('sessions', {})
            node = sessions.setdefault(sid, {})

            if not node.get('serena_activation_hint_shown'):
                # Derive project name from package.json or repo folder name
                def _derive_project_name() -> str:
                    try:
                        pkg = Path('package.json')
                        if pkg.exists():
                            pj = json.loads(pkg.read_text())
                            name = pj.get('name')
                            if isinstance(name, str) and name.strip():
                                return name.strip()
                    except Exception:
                        pass
                    # Fallback to directory name
                    return Path.cwd().name
                project_name = _derive_project_name()
                # Print concise hint to stderr
                print(f"Hint: Activate Serena for this project → mcp__serena__activate_project project=\"{project_name}\"", file=sys.stderr)
                node['serena_activation_hint_shown'] = True
                sessions[sid] = node
                state['sessions'] = sessions
                state_file.parent.mkdir(parents=True, exist_ok=True)
                state_file.write_text(json.dumps(state, indent=2))
        except Exception:
            # Non-fatal
            pass
        conf = classify_prompt(prompt)
        # Preflight (daily): check key paths once/day
        try:
            from datetime import datetime as _dt
            stamp = _dt.now().strftime('%Y%m%d')
            pf_path = Path('logs/last_preflight.txt')
            last = pf_path.read_text().strip() if pf_path.exists() else ''
            if last != stamp:
                ok = []
                warn = []
                if Path('templates/registry').exists(): ok.append('registry')
                else: warn.append('registry')
                if Path('.claude/settings.json').exists(): ok.append('settings')
                else: warn.append('settings')
                print(f"Preflight: OK={ok} WARN={warn}", file=sys.stderr)
                pf_path.parent.mkdir(parents=True, exist_ok=True)
                pf_path.write_text(stamp)
        except Exception:
            pass

        # Conversational mode control: "set/switch/change mode to <soft|stable|strict>"
        try:
            m_mode = re.search(r"\b(?:set|switch|change)\s+(?:enforcement\s+)?(?:mode|level)\s+to\s+(soft|stable|strict)\b", prompt, re.IGNORECASE)
            if m_mode:
                new_level = m_mode.group(1).lower()
                settings_path = Path('.claude/settings.json')
                if settings_path.exists():
                    try:
                        data = json.loads(settings_path.read_text())
                    except Exception:
                        data = {}
                    meta = data.get('enforcement_metadata', {})
                    meta['version'] = new_level
                    data['enforcement_metadata'] = meta
                    settings_path.write_text(json.dumps(data, indent=2))
                    print(f"Mode changed to {new_level}.", file=sys.stderr)
                else:
                    print("Could not change mode: .claude/settings.json not found.", file=sys.stderr)
        except Exception:
            pass

        # GAC helper (per session, at most every 2h): prefer alias output and raw message only
        try:
            if re.search(r"\bgac\b", prompt, re.IGNORECASE):
                # per-session namespace
                state_path = Path('logs/state.json')
                st = {}
                if state_path.exists():
                    try:
                        st = json.loads(state_path.read_text())
                    except Exception:
                        st = {}
                from datetime import datetime as _dt
                import time as _t
                sid = st.get('session', {}).get('id') or _dt.now().strftime('%Y%m%d')
                sessions = st.setdefault('sessions', {})
                node = sessions.setdefault(sid, {})
                last = float(node.get('gac_last_reminder', 0) or 0)
                if (_t.time() - last) > 7200:  # 2 hours
                    print(
                        (
                            "GAC format: Read templates/conventions/git/commit-format.md.\n"
                            "Return ONLY the commit message using your alias, e.g.:\n"
                            "gac \"type(scope): description\n\n- bullet\n\noptional footer\"\n"
                            "Do NOT output git add/commit commands or code blocks; no preface text. Use single quotes inside."
                        ),
                        file=sys.stderr,
                    )
                    node['gac_last_reminder'] = _t.time()
                    st['sessions'][sid] = node
                    state_path.write_text(json.dumps(st, indent=2))
        except Exception:
            pass

        # Always set required flag, but only show heavy banner for high confidence
        if conf == 'high':
            inject_banner(prompt)
        else:
            # Minimal reminder (stderr) for medium; none for low
            if conf == 'medium':
                print("Reminder: Use ULTRATHINK for development activities (S:W:H:E).", file=sys.stderr)
            # Mark state as requiring ULTRATHINK
            state_file = Path('logs/state.json')
            try:
                state = json.loads(state_file.read_text()) if state_file.exists() else {}
            except Exception:
                state = {}
            state['ultrathink'] = state.get('ultrathink', {})
            state['ultrathink']['required'] = True
            state['development_mode_triggered'] = True
            state_file.parent.mkdir(parents=True, exist_ok=True)
            state_file.write_text(json.dumps(state, indent=2))
        sys.exit(0)
    except json.JSONDecodeError:
        sys.exit(0)
    except Exception as exc:
        print(f"Hook error: {exc}", file=sys.stderr)
        sys.exit(0)

if __name__ == '__main__':
    main()

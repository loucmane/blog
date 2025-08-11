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
    ULTRATHINK_ALLOWED_TOOLS = {'Read', 'Glob', 'Grep', 'LS', 'WebFetch', 'Bash'}
    
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

    def _get_session_id(self, state: Dict) -> str:
        """Determine current session id from state; fallback to today's date."""
        sid = (
            state.get('session', {}).get('id')
        )
        if not sid:
            sid = datetime.now().strftime('%Y%m%d')
        return sid

    def _get_session_node(self, state: Dict) -> Dict:
        """Return the per-session state node, creating structures if needed."""
        sid = self._get_session_id(state)
        sessions = state.setdefault('sessions', {})
        node = sessions.setdefault(sid, {})
        node.setdefault('ultrathink', {})
        return node
    
    def save_state(self, state: Dict):
        """Save state back to file"""
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.state_file, 'w') as f:
            json.dump(state, f, indent=2)

    def _log_event(self, kind: str, detail: Dict):
        """Append an enforcement event to metrics file."""
        try:
            metrics_path = Path('logs/enforcement_metrics.json')
            data = []
            if metrics_path.exists():
                try:
                    data = json.loads(metrics_path.read_text())
                except Exception:
                    data = []
            detail = {
                **detail,
                'event': kind,
                'timestamp': datetime.now().isoformat()
            }
            data.append(detail)
            data = data[-1000:]
            metrics_path.parent.mkdir(parents=True, exist_ok=True)
            metrics_path.write_text(json.dumps(data, indent=2))
        except Exception:
            pass

    def _load_learning_hints(self) -> Dict[str, str]:
        """Load keyword→handler mapping used to improve hints."""
        try:
            p = Path('logs/learning_hints.json')
            if p.exists():
                return json.loads(p.read_text())
        except Exception:
            pass
        return {}

    def _save_learning_hints(self, hints: Dict[str, str]):
        try:
            p = Path('logs/learning_hints.json')
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(json.dumps(hints, indent=2))
        except Exception:
            pass

    def _load_registry_index(self) -> Optional[list]:
        try:
            idx_path = Path('templates/registry/index.json')
            if idx_path.exists():
                return json.loads(idx_path.read_text())
        except Exception:
            return None
        return None

    def _suggest_from_registry(self, keyword: Optional[str], limit: int = 3) -> list:
        if not keyword:
            return []
        idx = self._load_registry_index()
        if not idx:
            return []
        kw = keyword.lower()
        scored = []
        for item in idx:
            path = item.get('path','')
            tags = item.get('tags', [])
            score = 0
            if kw in path.lower():
                score += 2
            score += sum(1 for t in tags if kw in str(t).lower())
            if score > 0:
                scored.append((score, path))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [p for _, p in scored[:limit]]

    def _load_workflow_guards(self) -> Optional[list]:
        try:
            p = Path('templates/metadata/workflow-guards.json')
            if p.exists():
                return json.loads(p.read_text())
        except Exception:
            return None
        return None

    def _extract_last_keyword(self, state: Dict) -> Optional[str]:
        try:
            last_search = next((e.get('details') for e in reversed(state.get('ultrathink', {}).get('evidence', [])) if e.get('action') == 'registry_search'), '')
            if last_search and 'Searched for:' in last_search:
                return last_search.split('Searched for:')[-1].strip()
        except Exception:
            return None
        return None

    def _enforce_workflow_guards(self, state: Dict, level: str) -> Optional[str]:
        """Return a hint message if guard is missing; return None if compliant. In strict mode, caller may block."""
        guards = self._load_workflow_guards()
        if not guards:
            return None
        kw = (self._extract_last_keyword(state) or '').lower()
        if not kw:
            return None
        # Which guards match this keyword
        matching = []
        for g in guards:
            try:
                kws = [s.lower() for s in g.get('keywords', [])]
                if any(k in kw for k in kws):
                    matching.append(g)
            except Exception:
                continue
        if not matching:
            return None
        # Check evidence for required reads
        loaded_paths = [e.get('path','') for e in state.get('ultrathink', {}).get('evidence', []) if e.get('action') == 'handler_loaded']
        missing = []
        for g in matching:
            for req in g.get('requires', []):
                if not any(req in p for p in loaded_paths):
                    missing.append(req)
        if not missing:
            return None
        # Build hint
        lines = ["\n💡 **Workflow guard:** Read required templates before coding:"]
        for req in missing:
            lines.append(f"  - {req}")
        lines.append("Suggested commands:")
        lines.append("  1) mcp__serena__activate_project project=\"blog\"")
        lines.append("  2) mcp__serena__find_file name_path=\"{req}\"")
        return "\n".join(lines) + "\n"
    
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
        
        # Initialize if needed (be robust to partial state)
        if "phase" not in ultrathink:
            ultrathink["phase"] = "not_started"
        if "started_at" not in ultrathink:
            ultrathink["started_at"] = None
        if "evidence" not in ultrathink or not isinstance(ultrathink.get("evidence"), list):
            ultrathink["evidence"] = []
        if "handlers_loaded" not in ultrathink or not isinstance(ultrathink.get("handlers_loaded"), list):
            ultrathink["handlers_loaded"] = []
        
        # Helper: Serena tool detection
        is_serena = tool_name.startswith('mcp__serena__')

        # Track different behaviors
        if tool_name in ('Grep', 'Glob') or (is_serena and ('search' in tool_name or 'find' in tool_name)):
            path = tool_input.get('path', '') or tool_input.get('glob', '') or tool_input.get('relative_path', '')
            pattern = tool_input.get('pattern', '') or tool_input.get('substring_pattern', '')

            # Searching templates/registry is a key ULTRATHINK behavior
            if 'templates/registry' in str(path) or 'registry' in str(pattern).lower():
                ultrathink["phase"] = "searching_handlers"
                if ultrathink.get("started_at") is None:
                    ultrathink["started_at"] = time.time()
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
        
        elif tool_name == 'Read' or (is_serena and ('read' in tool_name or 'get_symbols' in tool_name or 'find_file' in tool_name)):
            file_path = tool_input.get('file_path', '')
            
            # Reading a handler template is ULTRATHINK progression
            if any(seg in file_path for seg in (
                '.claude/templates/',
                'templates/handlers/',
                'templates/engine/'
            )):
                handler_name = self.extract_handler_name(file_path)
                ultrathink["phase"] = "loading_handler"
                ultrathink["loaded_handler"] = handler_name
                ultrathink["handlers_loaded"].append({
                    "name": handler_name,
                    "timestamp": time.time()
                })
                ultrathink["evidence"].append({
                    "action": "handler_loaded",
                    "timestamp": time.time(),
                    "handler": handler_name,
                    "path": file_path
                })

                # Learn: map last search keyword to loaded handler for future hints
                try:
                    last_search = next((e.get('details') for e in reversed(ultrathink.get('evidence', [])) if e.get('action') == 'registry_search'), '')
                    if last_search and 'Searched for:' in last_search:
                        keyword = last_search.split('Searched for:')[-1].strip().lower()
                        if keyword:
                            hints = self._load_learning_hints()
                            hints[keyword] = handler_name
                            self._save_learning_hints(hints)
                except Exception:
                    pass
                
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

                # Circular resolution detection: repeated resolve-handler-void loads
                if 'handlers-operators-workflow-resolve-handler-void' in handler_name:
                    recent = ultrathink.get("handlers_loaded", [])[-2:]
                    if any('handlers-operators-workflow-resolve-handler-void' in (h.get('name') or '') for h in recent[:-1]):
                        print("\n⚠ Potential circular VOID resolution detected (resolve-handler-void loaded repeatedly).", file=sys.stderr)
        
        # Update state (session node + compatibility mirror)
        self._get_session_node(state)["ultrathink"] = ultrathink
        state["ultrathink"] = ultrathink
        return state
    
    def extract_handler_name(self, file_path: str) -> str:
        """Extract handler name from file path"""
        path = Path(file_path)
        # Normalize to either templates or .claude/templates
        if '.claude/templates' in str(path):
            relative = path.relative_to(Path('.claude/templates'))
        elif 'templates' in str(path):
            relative = path.relative_to(Path('templates'))
        else:
            relative = path
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
    
    def _load_enforcement_level(self) -> str:
        """Read enforcement level from settings.json (soft|stable|strict)."""
        try:
            settings_path = Path('.claude/settings.json')
            if settings_path.exists():
                data = json.loads(settings_path.read_text())
                meta = data.get('enforcement_metadata', {})
                # Adaptive softening via state soft_until
                state = self.load_state()
                soft_until = state.get('soft_until')
                if soft_until and time.time() < float(soft_until):
                    return 'soft'
                return meta.get('version', 'stable')
        except Exception:
            pass
        return 'stable'

    def _escape_hatch_allows(self, ultrathink: Dict) -> bool:
        """Allow progress if search phase is taking too long or too many attempts."""
        try:
            if ultrathink.get('phase') != 'searching_handlers':
                return False
            attempts = sum(1 for e in ultrathink.get('evidence', []) if e.get('action') == 'registry_search')
            started_at = ultrathink.get('started_at') or 0
            too_many_attempts = attempts >= 3
            too_long = (time.time() - started_at) > 300 if started_at else False
            return too_many_attempts or too_long
        except Exception:
            return False

    def _is_read_only_bash(self, tool_input: Dict) -> bool:
        """Heuristic: allow common read-only bash during search (rg, ls, tree, sed -n, head, jq)."""
        cmd = str(tool_input.get('command') or tool_input.get('script') or tool_input)
        allowed = (' rg ', ' rg\t', ' rg\n', ' ls', ' tree', ' sed -n', ' head', ' jq ')
        forbidden = (' >', '>>', ' rm ', ' mv ', ' cp ', ' sed -i', ' chmod', ' chown', ' mkdir', ' rmdir')
        return any(x in cmd for x in allowed) and not any(x in cmd for x in forbidden)

    def _fallback_handler_suggestions(self, keyword: Optional[str] = None) -> str:
        """Build a short list of fallback handler suggestions from templates/registry and handlers."""
        suggestions = []
        try:
            # Prefer registry index files
            registry_dir = Path('templates/registry')
            if registry_dir.exists():
                for p in sorted(registry_dir.glob('**/*.md')):
                    name = str(p)
                    if keyword and keyword.lower() not in name.lower():
                        continue
                    if len(suggestions) < 5:
                        suggestions.append(name)
            # Add a few core handlers as general fallbacks
            core_candidates = [
                'templates/handlers/triggers/session/end-session.md',
                'templates/handlers/triggers/session/start-session.md',
                'templates/handlers/operators/workflow/resolve-handler-void.md',
                'templates/engine/core/ultrathink-protocol.md'
            ]
            for name in core_candidates:
                if len(suggestions) >= 5:
                    break
                if Path(name).exists() and (not keyword or keyword.lower() in name.lower()):
                    if name not in suggestions:
                        suggestions.append(name)
        except Exception:
            pass
        if not suggestions:
            return "(no suggestions found)"
        bullet_list = "\n".join(f"  - {s}" for s in suggestions[:5])
        return bullet_list

    def handle_pre_tool_use(self, tool_name: str, tool_input: Dict) -> int:
        """
        Main enforcement logic for PreToolUse hook
        Returns exit code: 0=allow, 1=warn, 2=block
        """
        state = self.load_state()
        level = self._load_enforcement_level()
        
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
                # Escape hatch in stable mode
                if level == 'stable' and self._escape_hatch_allows(state.get('ultrathink', {})):
                    print("\n⚠ Allowing development tool via escape hatch (search taking long / multiple attempts).", file=sys.stderr)
                    try:
                        self._log_event('escape', {
                            'session_id': self._get_session_id(state),
                            'tool_name': tool_name,
                            'phase': state.get('ultrathink', {}).get('phase')
                        })
                    except Exception:
                        pass
                    return 0
                if level == 'soft':
                    print("\n💡 ULTRATHINK not complete. Proceeding (soft mode).", file=sys.stderr)
                    try:
                        self._log_event('soft-continue', {
                            'session_id': self._get_session_id(state),
                            'tool_name': tool_name
                        })
                    except Exception:
                        pass
                    return 0
                # Workflow guards (soft hint in stable, block in strict)
                try:
                    guard_hint = self._enforce_workflow_guards(state, level)
                    if guard_hint:
                        print(guard_hint, file=sys.stderr)
                        if level == 'strict':
                            return 2
                except Exception:
                    pass

                # Record block event for adaptive softening
                try:
                    sid = self._get_session_id(state)
                    st = self._get_session_node(state).get('ultrathink', {})
                    st['blocked_attempts'] = int(st.get('blocked_attempts', 0)) + 1
                    st['last_block_time'] = time.time()
                    self._get_session_node(state)['ultrathink'] = st
                    state['ultrathink'] = st
                    self.save_state(state)
                    self._log_event('block', {
                        'session_id': sid,
                        'tool_name': tool_name,
                        'used_serena': tool_name.startswith('mcp__serena__'),
                        'phase': st.get('phase', 'unknown')
                    })
                except Exception:
                    pass
                session_id = datetime.now().strftime("%Y%m%d")
                # Progressive guidance and skeleton (with per-tool cooldown)
                st = state.get('ultrathink', {})
                attempts = int(st.get('blocked_attempts', 1))
                show_full = True
                try:
                    last_banner = st.get('last_banner', {})
                    import time as _t
                    if last_banner and last_banner.get('tool') == tool_name:
                        if (_t.time() - float(last_banner.get('time', 0))) < 180:
                            show_full = False
                    # update last banner
                    st['last_banner'] = {'tool': tool_name, 'time': _t.time()}
                    state['ultrathink'] = st
                    self.save_state(state)
                except Exception:
                    pass
                w_guess = 'implementation' if tool_name in ('Edit','Write','MultiEdit') else 'investigation'
                skeleton = f"Let me ultrathink about this... [S:{session_id}|W:{w_guess}|H:searching|E:pending]"

                if show_full:
                    msg = [
                        "❌ **BLOCKED: {tool} requires ULTRATHINK protocol**".format(tool=tool_name),
                        "",
                        "You must complete ULTRATHINK before using development tools.",
                        "",
                        "**Start with this:**",
                        skeleton,
                        ""
                    ]
                else:
                    msg = [
                        "❌ Blocked ({tool}). See above for full instructions.".format(tool=tool_name),
                        "**Start with:**",
                        skeleton
                    ]
                # Add Serena-first hint (short → rich)
                last_kw = None
                try:
                    last_search = next((e.get('details') for e in reversed(st.get('evidence', [])) if e.get('action') == 'registry_search'), '')
                    if last_search and 'Searched for:' in last_search:
                        last_kw = last_search.split('Searched for:')[-1].strip()
                except Exception:
                    pass
                if attempts == 1:
                    msg += [
                        "**Hint:** Use Serena to search templates/registry/",
                        "mcp__serena__search_for_pattern --substring_pattern \"{kw}\" --relative_path \"templates/registry\"".format(kw=last_kw or 'your-keyword')
                    ]
                elif attempts == 2:
                    msg += [
                        "**Suggested Serena command:**",
                        "mcp__serena__search_for_pattern --substring_pattern \"{kw}\" --relative_path \"templates/registry\"".format(kw=last_kw or 'end-session'),
                        "(Fallback) Grep: Grep pattern=\"{kw}\" path=\"templates/registry/index.md\"".format(kw=last_kw or 'end-session')
                    ]
                else:
                    # Use learned hints if available
                    learned = None
                    try:
                        hints = self._load_learning_hints()
                        if last_kw:
                            learned = hints.get((last_kw or '').lower())
                    except Exception:
                        pass
                    if learned:
                        msg += [
                            "**Previously used handler for '{kw}':** {h}".format(kw=last_kw, h=learned)
                        ]
                    # Registry index suggestions
                    try:
                        reg_suggestions = self._suggest_from_registry(last_kw, limit=3)
                        if reg_suggestions:
                            msg += ["**Registry suggestions:**"] + [f"- {p}" for p in reg_suggestions]
                    except Exception:
                        pass
                    msg += [
                        "**Fallback suggestions:** See templates/handlers/operators/workflow/resolve-handler-void.md",
                    ]

                # Quick status at block time
                try:
                    level_now = self._load_enforcement_level()
                    soft_until = state.get('soft_until')
                    remaining = None
                    if soft_until:
                        import time as _t
                        delta = float(soft_until) - _t.time()
                        if delta > 0:
                            remaining = int(delta)
                    msg += [
                        "",
                        "**Mode:** {lvl}{soft}".format(lvl=level_now, soft=(f" (soft {remaining}s left)" if remaining else "")),
                        "**Current phase:** {phase}".format(phase=st.get('phase','not_started')),
                        "**Evidence collected:** {n} actions".format(n=len(st.get('evidence', [])))
                    ]
                except Exception:
                    pass
                print("\n" + "\n".join(msg) + "\n", file=sys.stderr)
                return 2  # Block
        
        elif tool_name in self.ULTRATHINK_ALLOWED_TOOLS or tool_name.startswith('mcp__serena__'):
            # These tools are allowed during ULTRATHINK
            # But let's provide guidance if they're not being used correctly
            if (tool_name in ['Grep', 'Glob'] or tool_name.startswith('mcp__serena__')) and 'templates/registry' not in str(tool_input).lower():
                ultrathink_phase = state.get('ultrathink', {}).get('phase', 'not_started')
                if ultrathink_phase in ['not_started', 'searching_handlers']:
                    print(f"""
💡 **HINT: Prefer Serena MCP for searches (templates/registry/**)**

You're using {tool_name} without targeting the registry.
Try:
  1) mcp__serena__activate_project project="blog"
  2) mcp__serena__search_for_pattern substring_pattern="your-keyword" relative_path="templates/registry"
     (or Grep pattern="your-keyword" path="templates/registry/index.md")
""", file=sys.stderr)
                    # Don't block, just guide
                    return 0
            # Guard: Serena search using code-only restriction for docs
            if tool_name.startswith('mcp__serena__'):
                try:
                    if tool_input.get('restrict_search_to_code_files'):
                        print("\n💡 For registry docs, avoid restrict_search_to_code_files; use relative_path='templates/registry' instead.", file=sys.stderr)
                except Exception:
                    pass
                # Guard: Access to .claude/* is not available to Serena
                try:
                    pth = (tool_input.get('path') or tool_input.get('relative_path') or '')
                    if '.claude/' in str(pth):
                        print("\nℹ Serena cannot access .claude/. Use templates/ for search and reading.", file=sys.stderr)
                except Exception:
                    pass
            # If multiple searches and no handler loaded yet, suggest resolution handler
            if tool_name in ['Grep', 'Glob']:
                attempts = sum(1 for e in state.get('ultrathink', {}).get('evidence', []) if e.get('action') == 'registry_search')
                loaded = any(e.get('action') == 'handler_loaded' for e in state.get('ultrathink', {}).get('evidence', []))
                if attempts >= 2 and not loaded:
                    # Extract last search keyword if available
                    last_search = next((e.get('details') for e in reversed(state.get('ultrathink', {}).get('evidence', [])) if e.get('action') == 'registry_search'), '')
                    keyword = None
                    if last_search and 'Searched for:' in last_search:
                        try:
                            keyword = last_search.split('Searched for:')[-1].strip()
                        except Exception:
                            keyword = None
                    print("\n💡 Consider reading: templates/handlers/operators/workflow/resolve-handler-void.md", file=sys.stderr)
                    print("\n🔎 Fallback handler suggestions:\n" + self._fallback_handler_suggestions(keyword), file=sys.stderr)
                    # Mark suggestion in state
                    state['ultrathink']['fallback_suggested'] = True
                    self.save_state(state)
            # Allow read-only bash during search phase (with preview)
            if tool_name == 'Bash':
                ultrathink_phase = state.get('ultrathink', {}).get('phase', 'not_started')
                if ultrathink_phase in ['not_started', 'searching_handlers'] and self._is_read_only_bash(tool_input):
                    try:
                        cmd = str(tool_input.get('command') or tool_input.get('script') or tool_input)
                        print("\n💡 Allowing read-only Bash during ULTRATHINK (preview):\n  command: {}\n  reason: matches read-only whitelist".format(cmd), file=sys.stderr)
                    except Exception:
                        pass
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
# Hook Enforcement Test Suite

This suite describes manual/automated tests to validate the ULTRATHINK enforcement system with the updated template integration and helper scripts.

## 0) Preflight
- Ensure `.claude/settings.json` exists
- Ensure `templates/registry/` exists
- Run:
  ```bash
  python3 .claude/hooks/enforce_status.py
  ```
  Expect: Mode printed, soft remaining (if any), last-24h counts

## 1) Core Enforcement
1. Block without ULTRATHINK
   - Attempt an editing tool (simulate):
     ```bash
     echo '{"tool_name":"Edit","tool_input":{}}' | python3 .claude/hooks/enforcement.py
     ```
   - Expect: Block message with S:W:H:E skeleton and Serena-first hint

2. Search Allowed
   - Use Grep/Serena to search registry:
     ```bash
     echo '{"tool_name":"Grep","tool_input":{"pattern":"end-session","path":"templates/registry/index.md"}}' | python3 .claude/hooks/enforcement.py
     ```
   - Expect: Allowed; proof file created; phase: searching_handlers in `logs/state.json`

3. Load Handler
   - Simulate reading handler:
     ```bash
     echo '{"tool_name":"Read","tool_input":{"file_path":"templates/handlers/triggers/session/end-session.md"}}' | python3 .claude/hooks/enforcement.py
     ```
   - Expect: Allowed; ULTRATHINK marked completed; handler proof file created

4. Dev Tool Allowed After ULTRATHINK
   - Re-run Edit:
     ```bash
     echo '{"tool_name":"Edit","tool_input":{}}' | python3 .claude/hooks/enforcement.py
     ```
   - Expect: Allowed (exit code 0)

## 2) Progressive Guidance & Learning
1. Trigger block 3 times (Edit), with searches in between.
   - On third block, expect learned hint (keyword → handler) and registry index suggestions.

2. Per-tool cooldown
   - Block twice within 3 minutes; second time expect concise banner.

3. Read-only Bash preview
   - Simulate allowed read-only Bash:
     ```bash
     echo '{"tool_name":"Bash","tool_input":{"command":"rg handler templates/registry"}}' | python3 .claude/hooks/enforcement.py
     ```
   - Expect: stderr preview message; allowed.

## 3) Reporting & Analytics
1. Daily report
   - Run Stop hook with a transcript to trigger report writing:
     ```bash
     echo '{"content":"test transcript"}' | python3 .claude/hooks/session_analyzer.py
     ```
   - Check `logs/reports/YYYYMMDD.txt` and `.json`

2. Manual report generation
   ```bash
   python3 .claude/hooks/enforcement_report.py --out logs/reports/manual.txt --json-out logs/reports/manual.json
   ```
   - Expect: report files created; contains total events, blocks, escapes, soft continues, Serena usage, avg compliance, near-miss count

## 4) Helper Scripts
1. Mode toggle
   ```bash
   python3 .claude/hooks/enforce_set.py soft
   python3 .claude/hooks/enforce_status.py
   ```
   - Expect: Mode shows soft with remaining time if set

2. ULTRATHINK skeleton helper
   ```bash
   python3 .claude/hooks/ultrathink_skeleton.py --work debugging
   ```
   - Expect: S:W:H:E line printed

3. Registry index generator
   ```bash
   python3 .claude/hooks/generate_registry_index.py --dry-run | head
   ```
   - Expect: JSON preview; then run without --dry-run to save

4. Legacy sweep
   ```bash
   python3 .claude/hooks/legacy_sweep.py
   ```
   - Expect: Either No legacy references found or a list to fix

## 5) Template Integration Checks
- Validate live guides:
  - CLAUDE.md references `templates/registry` and `enforcement.py`
  - Engine docs: search steps use Serena with `templates/registry`
  - Behaviors/Patterns: no `REGISTRY.md` references in live docs

## 6) Optional Scenarios
- Soft mode via near-miss: trigger a block, then complete ULTRATHINK within 90s; expect auto-soft for 1h (status shows soft remaining).
- Escape hatch: simulate repeated searches or 5+ minutes in searching phase; dev tools allowed with warning.

## 7) Success Criteria
- All core tests pass (block → search → load → allow)
- Reports are generated automatically and manually
- Hints are Serena-first, registry-aware, and progressively helpful
- Helper scripts function as expected
- Live docs are aligned with the current system

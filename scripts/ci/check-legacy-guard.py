#!/usr/bin/env python3

import argparse
import json
import os
import re
import subprocess
from pathlib import Path


EXPECTED_DRIFT = {
    "templates/BEHAVIORS.md",
    "templates/CONVENTIONS.md",
    "templates/MATRICES.md",
    "templates/REGISTRY.md",
    "templates/TOOLS.md",
    "templates/behaviors/git/before-commit.md",
    "templates/behaviors/index.md",
    "templates/behaviors/session/session-end.md",
    "templates/conventions/git/commit-format.md",
    "templates/engine/enforcement/behavioral-hooks.md",
    "templates/engine/enforcement/cannot-proceed.md",
    "templates/handlers/operators/git/create-commit-message.md",
    "templates/matrices/mapping/trigger-to-action.md",
    "templates/shared/tools/tool-selection-matrix.md",
    "templates/tools/git/commands.md",
    "templates/workflows/session/lifecycle.md",
}


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    environment = dict(os.environ)
    environment["PYTHONDONTWRITEBYTECODE"] = "1"
    return subprocess.run(
        command,
        capture_output=True,
        check=False,
        env=environment,
        text=True,
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--include-untracked", action="store_true")
    args = parser.parse_args()

    validate_command = ["./scripts/codex-guard", "validate"]
    if args.include_untracked:
        validate_command.append("--include-untracked")
    completed_state_test = run(["python3", "tests/ci/test_codex_guard_completed_state.py"])
    validation = run(validate_command)
    drift = run(["./scripts/codex-guard", "drift-check", "--strict"])

    output = "\n".join([
        "$ python3 tests/ci/test_codex_guard_completed_state.py",
        completed_state_test.stdout,
        completed_state_test.stderr,
        "$ " + " ".join(validate_command),
        validation.stdout,
        validation.stderr,
        "$ ./scripts/codex-guard drift-check --strict",
        drift.stdout,
        drift.stderr,
    ])
    artifacts = Path("ci-artifacts")
    artifacts.mkdir(parents=True, exist_ok=True)
    (artifacts / "legacy-guard.log").write_text(output, encoding="utf-8")
    print(output)

    drift_paths = set(re.findall(
        r"^- \[canonical-doc\] \[blocking\] (.+?) — Canonical guidance document is missing$",
        drift.stdout,
        flags=re.MULTILINE,
    ))
    errors = []
    if completed_state_test.returncode != 0:
        errors.append(f"completed-state guard tests exited {completed_state_test.returncode}")
    if validation.returncode != 0:
        errors.append(f"codex-guard validate exited {validation.returncode}")
    if drift.returncode != 1:
        errors.append(f"expected legacy drift exit 1, received {drift.returncode}")
    if drift_paths != EXPECTED_DRIFT:
        errors.append(
            "legacy drift changed: "
            + json.dumps({
                "added": sorted(drift_paths - EXPECTED_DRIFT),
                "missing": sorted(EXPECTED_DRIFT - drift_paths),
            })
        )

    bridge = {
        "deadline": "Before Aegis strict-mode activation; Task 47 must hand off removal if still present",
        "errors": errors,
        "expectedFindings": sorted(EXPECTED_DRIFT),
        "owner": "Task 47",
        "status": "passed" if not errors else "failed",
    }
    (artifacts / "legacy-guard-baseline.json").write_text(
        json.dumps(bridge, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(bridge, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3

import argparse
import importlib.util
import json
from pathlib import Path


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base")
    parser.add_argument("--witness", action="store_true")
    args = parser.parse_args()

    root = Path.cwd()
    brief = load_module("aegis_brief_lib", root / ".claude/scripts/brief_lib.py")
    capsule_passed, capsule_problems = brief.check_capsule(root)
    report = {
        "capsule": {
            "passed": capsule_passed,
            "problems": capsule_problems,
        }
    }

    passed = capsule_passed
    if args.witness:
        witness = load_module("aegis_witness_lib", root / ".claude/scripts/witness_lib.py")
        witness_report = witness.run_witness(root, base=args.base, ci_mode=True)
        print(witness.render_report(witness_report), end="")
        report["witness"] = witness_report
        passed = passed and bool(witness_report.get("passed"))

    artifacts = root / "ci-artifacts"
    artifacts.mkdir(parents=True, exist_ok=True)
    (artifacts / "aegis-check.json").write_text(
        json.dumps(report, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(report["capsule"], indent=2, sort_keys=True))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())

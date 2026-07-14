#!/usr/bin/env python3

import argparse
import fnmatch
import importlib.util
import json
import re
import subprocess
from pathlib import Path, PurePosixPath


TEST_PATH_PATTERNS = ("tests/*", "test/*", "*_test.*", "*.test.*", "test_*")
SAFE_BASE_RE = re.compile(r"^(?!-)[A-Za-z0-9][A-Za-z0-9._/-]*$")
SHA_RE = re.compile(r"^[0-9a-f]{7,40}$")
REQUIRED_WITNESS_CHECKS = {
    "ci_greenness",
    "diff_accounting",
    "done_flip_containment",
    "scope_mapping",
    "verification_at_head",
}


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _matches_glob(path: str, pattern: str) -> bool:
    return fnmatch.fnmatch(path, pattern) or fnmatch.fnmatch(PurePosixPath(path).name, pattern)


def _is_test_path(path: str) -> bool:
    return any(_matches_glob(path, pattern) for pattern in TEST_PATH_PATTERNS) or "/tests/" in path


def _normalize_repository_path(value: object) -> str:
    if not isinstance(value, str) or not value:
        raise ValueError("path must be a nonempty string")
    if "\\" in value or any(ord(character) < 32 for character in value):
        raise ValueError(f"path contains unsupported characters: {value!r}")
    path = PurePosixPath(value)
    if path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        raise ValueError(f"path is not repository-relative: {value!r}")
    if path.as_posix() != value:
        raise ValueError(f"path is not canonical: {value!r}")
    return value


def _normalize_deleted_tests(value: object, *, require_nonempty: bool) -> list[str]:
    if not isinstance(value, list):
        raise ValueError("deleted-test inventory must be a list")
    normalized = [_normalize_repository_path(path) for path in value]
    if any(not _is_test_path(path) for path in normalized):
        raise ValueError("deleted-test inventory contains a non-test path")
    if len(set(normalized)) != len(normalized):
        raise ValueError("deleted-test inventory contains duplicates")
    if require_nonempty and not normalized:
        raise ValueError("deleted-test inventory must not be empty")
    return sorted(normalized)


def _validate_base(base: object) -> str:
    if not isinstance(base, str) or not SAFE_BASE_RE.fullmatch(base):
        raise ValueError("base ref is missing or unsafe")
    if ".." in base or "@{" in base:
        raise ValueError("base ref contains unsupported revision syntax")
    return base


def git_head(root: Path) -> str:
    result = subprocess.run(
        ["git", "rev-parse", "--verify", "HEAD"],
        cwd=root,
        capture_output=True,
        check=False,
        text=True,
    )
    head = result.stdout.strip().lower()
    if result.returncode != 0 or not re.fullmatch(r"[0-9a-f]{40}", head):
        raise RuntimeError("unable to resolve the exact Git HEAD")
    return head


def collect_deleted_test_paths(root: Path, base: str) -> list[str]:
    validated_base = _validate_base(base)
    result = subprocess.run(
        [
            "git",
            "diff",
            "--no-renames",
            "--diff-filter=D",
            "--name-only",
            "-z",
            f"{validated_base}...HEAD",
            "--",
        ],
        cwd=root,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError("unable to derive the exact deleted-file inventory")
    if result.stdout and not result.stdout.endswith(b"\0"):
        raise RuntimeError("Git returned a truncated deleted-file inventory")
    try:
        decoded = result.stdout.decode("utf-8")
    except UnicodeDecodeError as error:
        raise RuntimeError("deleted-file inventory is not valid UTF-8") from error

    deleted_tests = []
    for raw_path in decoded.split("\0")[:-1]:
        path = _normalize_repository_path(raw_path)
        if _is_test_path(path):
            deleted_tests.append(path)
    return _normalize_deleted_tests(deleted_tests, require_nonempty=False)


def _reported_head_matches(reported_head: object, actual_head: str) -> bool:
    return (
        isinstance(reported_head, str)
        and SHA_RE.fullmatch(reported_head.lower()) is not None
        and actual_head.startswith(reported_head.lower())
    )


def evaluate_witness_report(
    witness_report: object,
    *,
    expected_base: object,
    actual_head: object,
    actual_deleted_tests: object,
    inventory_error: str | None = None,
) -> dict[str, object]:
    policy: dict[str, object] = {
        "accepted": False,
        "attended_review_required": False,
        "deleted_tests": [],
        "status": "failed",
    }
    reasons: list[str] = []
    policy["reasons"] = reasons

    if not isinstance(witness_report, dict):
        reasons.append("witness_report_not_an_object")
        return policy
    if not isinstance(witness_report.get("schema_version"), str) or not witness_report.get(
        "schema_version"
    ):
        reasons.append("witness_schema_version_invalid")
    if not isinstance(witness_report.get("branch"), str) or not witness_report.get("branch"):
        reasons.append("witness_branch_invalid")
    if witness_report.get("mode") != "ci":
        reasons.append("witness_mode_not_ci")

    try:
        validated_base = _validate_base(expected_base)
    except ValueError:
        validated_base = ""
        reasons.append("expected_base_invalid")
    if validated_base and witness_report.get("base") != validated_base:
        reasons.append("witness_base_mismatch")

    if not isinstance(actual_head, str) or not re.fullmatch(r"[0-9a-f]{40}", actual_head.lower()):
        reasons.append("actual_head_invalid")
    elif not _reported_head_matches(witness_report.get("head_commit"), actual_head.lower()):
        reasons.append("witness_head_mismatch")

    if inventory_error:
        reasons.append("deleted_file_inventory_unavailable")
    try:
        actual_deleted = _normalize_deleted_tests(actual_deleted_tests, require_nonempty=False)
    except ValueError:
        actual_deleted = []
        reasons.append("actual_deleted_test_inventory_invalid")

    checks = witness_report.get("checks")
    if not isinstance(checks, dict) or not checks:
        reasons.append("witness_checks_invalid")
        return policy
    if not REQUIRED_WITNESS_CHECKS.issubset(checks):
        reasons.append("witness_required_checks_missing")

    invalid_checks = [
        name
        for name, check in checks.items()
        if not isinstance(name, str)
        or not isinstance(check, dict)
        or not isinstance(check.get("passed"), bool)
    ]
    if invalid_checks:
        reasons.append("witness_check_shape_invalid")
        return policy

    failed_checks = sorted(name for name, check in checks.items() if check.get("passed") is False)
    try:
        escalations = _normalize_deleted_tests(
            witness_report.get("escalations"),
            require_nonempty=witness_report.get("passed") is False,
        )
    except ValueError:
        escalations = []
        reasons.append("witness_escalations_invalid")

    if witness_report.get("passed") is True:
        if failed_checks:
            reasons.append("passing_witness_contains_failed_checks")
        if escalations:
            reasons.append("passing_witness_contains_escalations")
        if actual_deleted:
            reasons.append("passing_witness_missed_deleted_tests")
        if not reasons:
            policy.update({"accepted": True, "status": "passed"})
        return policy

    if witness_report.get("passed") is not False:
        reasons.append("witness_passed_flag_invalid")
        return policy
    if failed_checks != ["diff_accounting"]:
        reasons.append("witness_failure_not_deletion_only")

    diff_accounting = checks.get("diff_accounting")
    if not isinstance(diff_accounting, dict) or diff_accounting.get("passed") is not False:
        reasons.append("diff_accounting_failure_missing")
        return policy

    diff_count = diff_accounting.get("files_in_diff", diff_accounting.get("paths_in_diff"))
    if not isinstance(diff_count, int) or isinstance(diff_count, bool) or diff_count < 1:
        reasons.append("diff_file_count_invalid")

    try:
        reported_deleted = _normalize_deleted_tests(
            diff_accounting.get("deleted_tests_escalated"),
            require_nonempty=True,
        )
    except ValueError:
        reported_deleted = []
        reasons.append("diff_deleted_test_inventory_invalid")

    if "unaccounted" in diff_accounting:
        unaccounted = diff_accounting.get("unaccounted")
        if not isinstance(unaccounted, list) or unaccounted:
            reasons.append("diff_contains_unaccounted_paths")

    accounting = diff_accounting.get("accounting")
    if accounting is not None:
        if not isinstance(accounting, list) or not accounting or any(
            not isinstance(entry, dict) or entry.get("accounted") is not True
            for entry in accounting
        ):
            reasons.append("diff_accounting_entries_invalid")

    if reported_deleted != escalations:
        reasons.append("witness_escalation_set_mismatch")
    if reported_deleted != actual_deleted:
        reasons.append("git_deleted_test_set_mismatch")
    if witness_report.get("process_exit_code") not in (None, 1):
        reasons.append("witness_process_exit_code_invalid")
    if witness_report.get("exit_class") not in (None, "fail"):
        reasons.append("witness_exit_class_invalid")

    if not reasons:
        policy.update(
            {
                "accepted": True,
                "attended_review_required": True,
                "deleted_tests": reported_deleted,
                "status": "attended_review_required",
            }
        )
    return policy


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
        expected_base = args.base or witness_report.get("base")
        inventory_error = None
        actual_head = None
        actual_deleted_tests = None
        try:
            actual_head = git_head(root)
            actual_deleted_tests = collect_deleted_test_paths(root, expected_base)
        except (RuntimeError, ValueError) as error:
            inventory_error = str(error)
        witness_policy = evaluate_witness_report(
            witness_report,
            expected_base=expected_base,
            actual_head=actual_head,
            actual_deleted_tests=actual_deleted_tests,
            inventory_error=inventory_error,
        )
        report["witness_policy"] = witness_policy
        print(json.dumps(witness_policy, indent=2, sort_keys=True))
        passed = passed and bool(witness_policy.get("accepted"))

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

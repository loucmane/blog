from __future__ import annotations

import runpy
import subprocess
import tempfile
import unittest
from pathlib import Path


AEGIS_CHECK = runpy.run_path(
    "scripts/ci/check-aegis.py",
    run_name="aegis_witness_review_test",
)
COLLECT_DELETED_TEST_PATHS = AEGIS_CHECK["collect_deleted_test_paths"]
EVALUATE_WITNESS_REPORT = AEGIS_CHECK["evaluate_witness_report"]

BASE = "origin/main"
HEAD = "a" * 40
DELETED_TEST = "packages/web/tests/legacy.test.ts"
PR34_DELETED_TESTS = [
    "packages/backend/tests/featureController.test.js",
    "packages/ui/src/components/Button/Button.test.tsx",
    "packages/ui/src/components/ThemeSwitcher/ThemeSwitcher.test.tsx",
    "packages/ui/src/tokens/tokens.test.ts",
    "packages/web/tests/components/TestUIImports.tsx",
    "packages/web/tests/integration/ui-package-imports.test.ts",
    "packages/web/tests/verify-ui-imports.mjs",
]


def witness_report(*, deleted_tests: list[str] | None = None) -> dict[str, object]:
    deleted_tests = [] if deleted_tests is None else deleted_tests
    deletion_review = bool(deleted_tests)
    return {
        "base": BASE,
        "checks": {
            "ci_greenness": {"passed": True, "status": "delegated"},
            "diff_accounting": {
                "deleted_tests_escalated": deleted_tests,
                "files_in_diff": 2,
                "passed": not deletion_review,
                "status": "globs_not_derivable_in_ci",
            },
            "done_flip_containment": {"passed": True},
            "scope_mapping": {"passed": True, "task_id": "41"},
            "verification_at_head": {"passed": True, "status": "not_derivable_in_ci"},
        },
        "escalations": deleted_tests,
        "branch": "feat/task-41-modernize-tailwind-shadcn-workspaces",
        "head_commit": HEAD[:7],
        "mode": "ci",
        "passed": not deletion_review,
        "schema_version": "1",
    }


def evaluate(
    report: object,
    *,
    deleted_tests: object = None,
    base: object = BASE,
    head: object = HEAD,
    inventory_error: str | None = None,
) -> dict[str, object]:
    if deleted_tests is None:
        deleted_tests = []
    return EVALUATE_WITNESS_REPORT(
        report,
        expected_base=base,
        actual_head=head,
        actual_deleted_tests=deleted_tests,
        inventory_error=inventory_error,
    )


class WitnessReviewPolicyTests(unittest.TestCase):
    def test_accepts_an_ordinary_passing_ci_witness(self) -> None:
        result = evaluate(witness_report())

        self.assertTrue(result["accepted"])
        self.assertEqual(result["status"], "passed")
        self.assertFalse(result["attended_review_required"])

    def test_accepts_only_deletion_escalation_as_attended_review(self) -> None:
        result = evaluate(
            witness_report(deleted_tests=[DELETED_TEST]),
            deleted_tests=[DELETED_TEST],
        )

        self.assertTrue(result["accepted"])
        self.assertEqual(result["status"], "attended_review_required")
        self.assertTrue(result["attended_review_required"])
        self.assertEqual(result["deleted_tests"], [DELETED_TEST])

    def test_accepts_the_exact_pr34_deletion_regression_as_attended(self) -> None:
        report = witness_report(deleted_tests=PR34_DELETED_TESTS)
        report["checks"]["diff_accounting"]["files_in_diff"] = 143  # type: ignore[index]
        report["head_commit"] = "ecc9c31"

        result = evaluate(
            report,
            deleted_tests=PR34_DELETED_TESTS,
            head="ecc9c31" + "0" * 33,
        )

        self.assertTrue(result["accepted"])
        self.assertEqual(result["status"], "attended_review_required")
        self.assertEqual(result["deleted_tests"], sorted(PR34_DELETED_TESTS))

    def test_accepts_newer_accounting_shape_only_when_every_path_is_accounted(self) -> None:
        report = witness_report(deleted_tests=[DELETED_TEST])
        report["checks"]["diff_accounting"].update(  # type: ignore[index,union-attr]
            {
                "accounting": [
                    {"accounted": True, "path": DELETED_TEST},
                    {"accounted": True, "path": "packages/web/src/app/page.tsx"},
                ],
                "unaccounted": [],
            }
        )

        result = evaluate(report, deleted_tests=[DELETED_TEST])

        self.assertTrue(result["accepted"])

    def test_denies_non_ci_witness(self) -> None:
        report = witness_report(deleted_tests=[DELETED_TEST])
        report["mode"] = "local"

        result = evaluate(report, deleted_tests=[DELETED_TEST])

        self.assertFalse(result["accepted"])
        self.assertIn("witness_mode_not_ci", result["reasons"])

    def test_denies_any_additional_failed_check(self) -> None:
        report = witness_report(deleted_tests=[DELETED_TEST])
        report["checks"]["scope_mapping"]["passed"] = False  # type: ignore[index]

        result = evaluate(report, deleted_tests=[DELETED_TEST])

        self.assertFalse(result["accepted"])
        self.assertIn("witness_failure_not_deletion_only", result["reasons"])

    def test_denies_missing_core_checks_or_diff_count(self) -> None:
        missing_check = witness_report(deleted_tests=[DELETED_TEST])
        del missing_check["checks"]["verification_at_head"]  # type: ignore[index]
        missing_count = witness_report(deleted_tests=[DELETED_TEST])
        del missing_count["checks"]["diff_accounting"]["files_in_diff"]  # type: ignore[index]

        missing_check_result = evaluate(missing_check, deleted_tests=[DELETED_TEST])
        missing_count_result = evaluate(missing_count, deleted_tests=[DELETED_TEST])

        self.assertFalse(missing_check_result["accepted"])
        self.assertIn("witness_required_checks_missing", missing_check_result["reasons"])
        self.assertFalse(missing_count_result["accepted"])
        self.assertIn("diff_file_count_invalid", missing_count_result["reasons"])

    def test_denies_unaccounted_paths(self) -> None:
        report = witness_report(deleted_tests=[DELETED_TEST])
        report["checks"]["diff_accounting"]["unaccounted"] = ["packages/web/src/app/page.tsx"]  # type: ignore[index]

        result = evaluate(report, deleted_tests=[DELETED_TEST])

        self.assertFalse(result["accepted"])
        self.assertIn("diff_contains_unaccounted_paths", result["reasons"])

    def test_denies_an_unaccounted_newer_schema_entry(self) -> None:
        report = witness_report(deleted_tests=[DELETED_TEST])
        report["checks"]["diff_accounting"]["accounting"] = [  # type: ignore[index]
            {"accounted": False, "path": "packages/web/src/app/page.tsx"}
        ]

        result = evaluate(report, deleted_tests=[DELETED_TEST])

        self.assertFalse(result["accepted"])
        self.assertIn("diff_accounting_entries_invalid", result["reasons"])

    def test_denies_escalation_and_diff_set_disagreement(self) -> None:
        report = witness_report(deleted_tests=[DELETED_TEST])
        report["escalations"] = ["tests/other.test.ts"]

        result = evaluate(report, deleted_tests=[DELETED_TEST])

        self.assertFalse(result["accepted"])
        self.assertIn("witness_escalation_set_mismatch", result["reasons"])

    def test_denies_git_and_report_set_disagreement(self) -> None:
        result = evaluate(
            witness_report(deleted_tests=[DELETED_TEST]),
            deleted_tests=["tests/other.test.ts"],
        )

        self.assertFalse(result["accepted"])
        self.assertIn("git_deleted_test_set_mismatch", result["reasons"])

    def test_denies_duplicate_or_non_test_escalations(self) -> None:
        duplicate = witness_report(deleted_tests=[DELETED_TEST, DELETED_TEST])
        non_test = witness_report(deleted_tests=["packages/web/src/app/page.tsx"])

        duplicate_result = evaluate(duplicate, deleted_tests=[DELETED_TEST])
        non_test_result = evaluate(non_test, deleted_tests=["packages/web/src/app/page.tsx"])

        self.assertFalse(duplicate_result["accepted"])
        self.assertIn("witness_escalations_invalid", duplicate_result["reasons"])
        self.assertFalse(non_test_result["accepted"])
        self.assertIn("witness_escalations_invalid", non_test_result["reasons"])

    def test_denies_noncanonical_paths(self) -> None:
        report = witness_report(deleted_tests=["../tests/escape.test.ts"])

        result = evaluate(report, deleted_tests=["../tests/escape.test.ts"])

        self.assertFalse(result["accepted"])
        self.assertIn("witness_escalations_invalid", result["reasons"])

    def test_denies_missing_inventory_and_moved_head(self) -> None:
        report = witness_report(deleted_tests=[DELETED_TEST])

        missing_inventory = evaluate(
            report,
            deleted_tests=None,
            inventory_error="git diff failed",
        )
        moved_head = evaluate(report, deleted_tests=[DELETED_TEST], head="b" * 40)

        self.assertFalse(missing_inventory["accepted"])
        self.assertIn("deleted_file_inventory_unavailable", missing_inventory["reasons"])
        self.assertFalse(moved_head["accepted"])
        self.assertIn("witness_head_mismatch", moved_head["reasons"])

    def test_denies_base_mismatch_and_unsafe_revision_syntax(self) -> None:
        report = witness_report(deleted_tests=[DELETED_TEST])

        mismatch = evaluate(report, deleted_tests=[DELETED_TEST], base="origin/release")
        unsafe = evaluate(report, deleted_tests=[DELETED_TEST], base="--output=/tmp/result")

        self.assertFalse(mismatch["accepted"])
        self.assertIn("witness_base_mismatch", mismatch["reasons"])
        self.assertFalse(unsafe["accepted"])
        self.assertIn("expected_base_invalid", unsafe["reasons"])

    def test_denies_a_passing_report_that_hides_test_deletions(self) -> None:
        report = witness_report()

        result = evaluate(report, deleted_tests=[DELETED_TEST])

        self.assertFalse(result["accepted"])
        self.assertIn("passing_witness_missed_deleted_tests", result["reasons"])


class DeletedTestInventoryTests(unittest.TestCase):
    def run_git(self, root: Path, *arguments: str) -> str:
        result = subprocess.run(
            ["git", "-c", "commit.gpgsign=false", *arguments],
            cwd=root,
            capture_output=True,
            check=False,
            text=True,
        )
        if result.returncode != 0:
            self.fail(result.stderr or result.stdout)
        return result.stdout.strip()

    def test_collects_deleted_tests_from_the_exact_git_range(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.run_git(root, "init", "--initial-branch=main")
            self.run_git(root, "config", "user.name", "Task 69 Test")
            self.run_git(root, "config", "user.email", "task69@example.invalid")
            test_path = root / DELETED_TEST
            source_path = root / "packages/web/src/legacy.ts"
            test_path.parent.mkdir(parents=True)
            source_path.parent.mkdir(parents=True)
            test_path.write_text("test\n", encoding="utf-8")
            source_path.write_text("source\n", encoding="utf-8")
            self.run_git(root, "add", ".")
            self.run_git(root, "commit", "-m", "base")
            base_commit = self.run_git(root, "rev-parse", "HEAD")
            test_path.unlink()
            source_path.unlink()
            self.run_git(root, "add", "-u")
            self.run_git(root, "commit", "-m", "delete legacy files")

            result = COLLECT_DELETED_TEST_PATHS(root, base_commit)

            self.assertEqual(result, [DELETED_TEST])

    def test_rejects_unsafe_base_before_running_git_diff(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(ValueError):
                COLLECT_DELETED_TEST_PATHS(Path(directory), "--output=/tmp/result")


if __name__ == "__main__":
    unittest.main()

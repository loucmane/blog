from __future__ import annotations

import json
import runpy
import tempfile
import unittest
from pathlib import Path


GUARD = runpy.run_path("scripts/codex-guard", run_name="codex_guard_completed_state_test")


class CompletedWorkTrackingTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary_directory.name)
        self.active = self.root / "docs/ai/work-tracking/active"
        self.archive = self.root / "docs/ai/work-tracking/archive"
        self.state = self.root / ".aegis/state/current-work.json"
        self.active.mkdir(parents=True)
        self.archive.mkdir(parents=True)
        self.state.parent.mkdir(parents=True)

        self.originals = {
            "REPO_ROOT": GUARD["get_active_tracker_path"].__globals__["REPO_ROOT"],
            "WORK_TRACKING_PREFIX": GUARD["get_active_tracker_path"].__globals__["WORK_TRACKING_PREFIX"],
            "WORK_TRACKING_RELATIVE": GUARD["get_active_tracker_path"].__globals__["WORK_TRACKING_RELATIVE"],
            "WORK_TRACKING_ARCHIVE_BASE": GUARD["get_active_tracker_path"].__globals__["WORK_TRACKING_ARCHIVE_BASE"],
            "WORK_TRACKING_ARCHIVE_RELATIVE": GUARD["get_active_tracker_path"].__globals__["WORK_TRACKING_ARCHIVE_RELATIVE"],
            "CURRENT_WORK_STATE_PATH": GUARD["get_active_tracker_path"].__globals__["CURRENT_WORK_STATE_PATH"],
        }
        globals_ = GUARD["get_active_tracker_path"].__globals__
        globals_.update(
            {
                "REPO_ROOT": self.root,
                "WORK_TRACKING_PREFIX": self.active,
                "WORK_TRACKING_RELATIVE": Path("docs/ai/work-tracking/active"),
                "WORK_TRACKING_ARCHIVE_BASE": self.archive,
                "WORK_TRACKING_ARCHIVE_RELATIVE": Path("docs/ai/work-tracking/archive"),
                "CURRENT_WORK_STATE_PATH": self.state,
            }
        )

    def tearDown(self) -> None:
        GUARD["get_active_tracker_path"].__globals__.update(self.originals)
        self.temporary_directory.cleanup()

    def write_state(self, status: str, work_tracking: str) -> None:
        self.state.write_text(
            json.dumps({"status": status, "paths": {"work_tracking": work_tracking}}),
            encoding="utf-8",
        )

    def test_prefers_the_single_active_tracker(self) -> None:
        tracker = self.active / "20260710-task-48-ACTIVE/TRACKER.md"
        tracker.parent.mkdir()
        tracker.write_text("active", encoding="utf-8")

        self.assertEqual(GUARD["get_active_tracker_path"](), tracker)

    def test_uses_completed_aegis_archive_when_no_active_folder_exists(self) -> None:
        tracker = self.archive / "20260710-task-48-COMPLETED/TRACKER.md"
        tracker.parent.mkdir()
        tracker.write_text("completed", encoding="utf-8")
        self.write_state("completed", tracker.parent.relative_to(self.root).as_posix())

        self.assertEqual(GUARD["get_active_tracker_path"](), tracker)

    def test_rejects_completed_path_outside_the_archive(self) -> None:
        outside = self.root / "docs/elsewhere/task-48-COMPLETED"
        outside.mkdir(parents=True)
        (outside / "TRACKER.md").write_text("completed", encoding="utf-8")
        self.write_state("completed", outside.relative_to(self.root).as_posix())

        with self.assertRaises(SystemExit):
            GUARD["get_active_tracker_path"]()

    def test_requires_active_or_completed_work_tracking(self) -> None:
        self.write_state("in-progress", "docs/ai/work-tracking/archive/task-48-COMPLETED")

        with self.assertRaises(SystemExit):
            GUARD["get_active_tracker_path"]()


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "python-dotenv",
# ]
# ///

"""
Comprehensive Test Suite for ULTRATHINK Enforcement System
Tests all validation layers and enforcement mechanisms
"""

import json
import sys
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple

# Add current directory to path for imports
sys.path.append(str(Path(__file__).parent))

from enhanced_enforcement import UltrathinkEnforcer, ValidationResult

class TestColors:
    """ANSI color codes for test output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

class EnforcementTestSuite:
    """Comprehensive test suite for ULTRATHINK enforcement"""
    
    def __init__(self):
        self.enforcer = None
        self.temp_dir = None
        self.passed = 0
        self.failed = 0
        self.tests_run = []
        
    def setup(self):
        """Set up test environment"""
        # Create temporary directory for test state
        self.temp_dir = Path(tempfile.mkdtemp())
        
        # Create logs directory
        logs_dir = self.temp_dir / "logs"
        logs_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize enforcer with test directory
        self.enforcer = UltrathinkEnforcer()
        self.enforcer.state_file = logs_dir / "state.json"
        self.enforcer.validation_log = logs_dir / "validation.json"
        self.enforcer.enforcement_metrics = logs_dir / "enforcement_metrics.json"
        
    def teardown(self):
        """Clean up test environment"""
        if self.temp_dir and self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)
    
    def set_development_mode(self, enabled: bool):
        """Set development mode in state file"""
        state = {
            "ultrathink": {
                "required": enabled,
                "completed": False,
                "statements": [],
                "blocked_attempts": 0
            },
            "ultrathink_required": enabled,  # Backward compatibility
            "development_mode_triggered": enabled
        }
        
        with open(self.enforcer.state_file, 'w') as f:
            json.dump(state, f, indent=2)
    
    def assert_equal(self, actual, expected, message=""):
        """Assert equality with nice output"""
        if actual == expected:
            self.passed += 1
            print(f"  {TestColors.GREEN}✓{TestColors.RESET} {message}")
            return True
        else:
            self.failed += 1
            print(f"  {TestColors.RED}✗{TestColors.RESET} {message}")
            print(f"    Expected: {expected}")
            print(f"    Got: {actual}")
            return False
    
    def assert_true(self, condition, message=""):
        """Assert condition is true"""
        if condition:
            self.passed += 1
            print(f"  {TestColors.GREEN}✓{TestColors.RESET} {message}")
            return True
        else:
            self.failed += 1
            print(f"  {TestColors.RED}✗{TestColors.RESET} {message}")
            return False
    
    def assert_false(self, condition, message=""):
        """Assert condition is false"""
        return self.assert_true(not condition, message)
    
    def assert_contains(self, text, substring, message=""):
        """Assert text contains substring"""
        if substring in text:
            self.passed += 1
            print(f"  {TestColors.GREEN}✓{TestColors.RESET} {message}")
            return True
        else:
            self.failed += 1
            print(f"  {TestColors.RED}✗{TestColors.RESET} {message}")
            print(f"    Text does not contain: {substring}")
            return False
    
    # ============= TEST CASES =============
    
    def test_blocks_missing_ultrathink(self):
        """Test that responses without ULTRATHINK are blocked"""
        print(f"\n{TestColors.BLUE}Testing: Block Missing ULTRATHINK{TestColors.RESET}")
        
        self.set_development_mode(True)
        
        # Response without ULTRATHINK
        response = "Here's the code you requested:\n```python\nprint('hello')\n```"
        
        is_valid, results = self.enforcer.validate_response(response)
        
        self.assert_false(is_valid, "Response without ULTRATHINK should be invalid")
        self.assert_true(
            any(r.reason == "ULTRATHINK protocol statement missing" for r in results),
            "Should detect missing ULTRATHINK"
        )
        
        # Test block message generation
        blocked = self.enforcer.block_response(results)
        self.assert_contains(blocked, "BLOCKED", "Block message should contain BLOCKED")
        self.assert_contains(blocked, "ULTRATHINK Protocol Violation", "Should mention violation")
    
    def test_allows_valid_ultrathink(self):
        """Test that valid ULTRATHINK responses pass"""
        print(f"\n{TestColors.BLUE}Testing: Allow Valid ULTRATHINK{TestColors.RESET}")
        
        self.set_development_mode(True)
        
        # Valid response with ULTRATHINK
        response = """Let me ultrathink about this... [S:20250808|W:testing|H:test-runner|E:1/1"complete"]

        Executing test suite...
        
        Results: All tests passed."""
        
        is_valid, results = self.enforcer.validate_response(response)
        
        self.assert_true(is_valid, "Valid ULTRATHINK response should pass")
        self.assert_true(
            all(r.is_valid for r in results),
            "All validations should pass"
        )
    
    def test_validates_swhe_format(self):
        """Test S:W:H:E format validation"""
        print(f"\n{TestColors.BLUE}Testing: S:W:H:E Format Validation{TestColors.RESET}")
        
        self.set_development_mode(True)
        
        # Test invalid format
        response1 = "Let me ultrathink about this... [invalid format]"
        is_valid1, results1 = self.enforcer.validate_response(response1)
        
        self.assert_false(is_valid1, "Invalid S:W:H:E format should fail")
        self.assert_true(
            any("S:W:H:E format" in r.reason for r in results1),
            "Should detect invalid format"
        )
        
        # Test incomplete format
        response2 = "Let me ultrathink about this... [S:20250808|W:|H:test|E:done]"
        is_valid2, results2 = self.enforcer.validate_response(response2)
        
        self.assert_false(is_valid2, "Empty work context should fail")
        
        # Test invalid session format
        response3 = "Let me ultrathink about this... [S:invalid|W:test|H:test|E:done]"
        is_valid3, results3 = self.enforcer.validate_response(response3)
        
        self.assert_false(is_valid3, "Invalid session format should fail")
    
    def test_handler_validation(self):
        """Test handler progression validation"""
        print(f"\n{TestColors.BLUE}Testing: Handler Validation{TestColors.RESET}")
        
        self.set_development_mode(True)
        
        # Test 'searching' without evidence
        response1 = """Let me ultrathink about this... [S:20250808|W:test|H:searching|E:pending]
        
        Now let me work on this..."""
        
        is_valid1, results1 = self.enforcer.validate_response(response1)
        
        self.assert_false(is_valid1, "H:searching without registry search should fail")
        
        # Test 'searching' with evidence
        response2 = """Let me ultrathink about this... [S:20250808|W:test|H:searching|E:pending]
        
        Searching REGISTRY.md for appropriate handler...
        Found handlers: test-runner, test-validator
        
        Let me continue... [S:20250808|W:test|H:test-runner|E:tests/3"running"]"""
        
        is_valid2, results2 = self.enforcer.validate_response(response2)
        
        self.assert_true(is_valid2, "H:searching with registry search should pass")
        
        # Test VOID handler
        response3 = "Let me ultrathink about this... [S:20250808|W:test|H:VOID|E:done]"
        is_valid3, results3 = self.enforcer.validate_response(response3)
        
        self.assert_false(is_valid3, "VOID handler without target should fail")
    
    def test_evidence_validation(self):
        """Test evidence field validation"""
        print(f"\n{TestColors.BLUE}Testing: Evidence Field Validation{TestColors.RESET}")
        
        self.set_development_mode(True)
        
        # Test 'pending' with non-searching handler
        response1 = "Let me ultrathink about this... [S:20250808|W:test|H:test-runner|E:pending]"
        is_valid1, results1 = self.enforcer.validate_response(response1)
        
        self.assert_false(is_valid1, "'pending' should only be valid with H:searching")
        
        # Test valid evidence formats
        valid_evidence_responses = [
            "Let me ultrathink about this... [S:20250808|W:test|H:runner|E:3/3\"complete\"]",
            "Let me ultrathink about this... [S:20250808|W:test|H:runner|E:/path/to/file.py:L10-25]",
            "Let me ultrathink about this... [S:20250808|W:test|H:runner|E:created 5 files]",
        ]
        
        for response in valid_evidence_responses:
            is_valid, _ = self.enforcer.validate_response(response)
            self.assert_true(is_valid, f"Valid evidence format should pass: {response[:50]}...")
    
    def test_natural_conversation_bypass(self):
        """Test that natural conversation doesn't trigger enforcement"""
        print(f"\n{TestColors.BLUE}Testing: Natural Conversation Bypass{TestColors.RESET}")
        
        self.set_development_mode(False)  # Not in development mode
        
        # Natural conversation without ULTRATHINK
        response = "Hello! I'm happy to help you with that question about Python."
        
        is_valid, results = self.enforcer.validate_response(response)
        
        self.assert_true(is_valid, "Natural conversation should pass without ULTRATHINK")
        self.assert_true(
            any(r.reason == "Not in development mode" for r in results),
            "Should recognize non-development mode"
        )
    
    def test_enforcement_metrics(self):
        """Test that enforcement metrics are tracked correctly"""
        print(f"\n{TestColors.BLUE}Testing: Enforcement Metrics{TestColors.RESET}")
        
        self.set_development_mode(True)
        
        # Trigger some blocks and passes
        invalid_response = "Direct response without ULTRATHINK"
        valid_response = "Let me ultrathink about this... [S:20250808|W:test|H:test|E:done]"
        
        # Generate block
        is_valid1, results1 = self.enforcer.validate_response(invalid_response)
        if not is_valid1:
            self.enforcer.block_response(results1)
        
        # Generate pass
        is_valid2, results2 = self.enforcer.validate_response(valid_response)
        if is_valid2:
            self.enforcer.log_enforcement_event("pass", results2)
        
        # Check metrics file
        if self.enforcer.enforcement_metrics.exists():
            with open(self.enforcer.enforcement_metrics, 'r') as f:
                metrics = json.load(f)
            
            self.assert_true(metrics["total_blocks"] > 0, "Should track blocks")
            self.assert_true(metrics["total_passes"] > 0, "Should track passes")
            self.assert_true(len(metrics["events"]) > 0, "Should track events")
        else:
            self.assert_true(False, "Metrics file should exist")
    
    def test_session_id_format(self):
        """Test session ID validation in S:W:H:E"""
        print(f"\n{TestColors.BLUE}Testing: Session ID Format{TestColors.RESET}")
        
        self.set_development_mode(True)
        
        valid_sessions = ["20250808", "20241231", "20230101"]
        invalid_sessions = ["2025-08-08", "08082025", "today", "null"]
        
        for session in valid_sessions:
            response = f"Let me ultrathink about this... [S:{session}|W:test|H:test|E:done]"
            is_valid, _ = self.enforcer.validate_response(response)
            self.assert_true(is_valid, f"Valid session ID should pass: {session}")
        
        for session in invalid_sessions:
            response = f"Let me ultrathink about this... [S:{session}|W:test|H:test|E:done]"
            is_valid, _ = self.enforcer.validate_response(response)
            self.assert_false(is_valid, f"Invalid session ID should fail: {session}")
    
    def test_work_context_validation(self):
        """Test work context validation in S:W:H:E"""
        print(f"\n{TestColors.BLUE}Testing: Work Context Validation{TestColors.RESET}")
        
        self.set_development_mode(True)
        
        valid_contexts = ["implementation", "debugging", "refactoring", "investigation", "custom-work"]
        invalid_contexts = ["", "null", "undefined", "TODO"]
        
        for context in valid_contexts:
            response = f"Let me ultrathink about this... [S:20250808|W:{context}|H:test|E:done]"
            is_valid, _ = self.enforcer.validate_response(response)
            self.assert_true(is_valid, f"Valid work context should pass: {context}")
        
        for context in invalid_contexts:
            response = f"Let me ultrathink about this... [S:20250808|W:{context}|H:test|E:done]"
            is_valid, _ = self.enforcer.validate_response(response)
            self.assert_false(is_valid, f"Invalid work context should fail: '{context}'")
    
    def test_multiple_ultrathink_statements(self):
        """Test handling of multiple ULTRATHINK statements in one response"""
        print(f"\n{TestColors.BLUE}Testing: Multiple ULTRATHINK Statements{TestColors.RESET}")
        
        self.set_development_mode(True)
        
        response = """Let me ultrathink about this... [S:20250808|W:initial|H:searching|E:pending]
        
        Searching REGISTRY.md...
        Found handler: code-generator
        
        Let me continue... [S:20250808|W:initial|H:code-generator|E:1/3"generating"]
        
        Creating components...
        
        Let me finalize... [S:20250808|W:initial|H:code-generator|E:3/3"complete"]
        
        All done!"""
        
        is_valid, results = self.enforcer.validate_response(response)
        
        self.assert_true(is_valid, "Multiple valid ULTRATHINK statements should pass")
    
    # ============= INTEGRATION TESTS =============
    
    def test_full_development_flow(self):
        """Test complete development workflow with enforcement"""
        print(f"\n{TestColors.BLUE}Testing: Full Development Flow{TestColors.RESET}")
        
        # Step 1: Development mode triggered
        self.set_development_mode(True)
        
        # Step 2: First attempt without ULTRATHINK (should fail)
        attempt1 = "Let me help you with that bug fix..."
        is_valid1, _ = self.enforcer.validate_response(attempt1)
        self.assert_false(is_valid1, "First attempt without ULTRATHINK should fail")
        
        # Step 3: Second attempt with ULTRATHINK (should pass)
        attempt2 = """Let me ultrathink about this... [S:20250808|W:bugfix|H:searching|E:pending]
        
        Searching REGISTRY.md for debugging handlers...
        Found: debugger, error-analyzer
        
        Let me continue... [S:20250808|W:bugfix|H:debugger|E:analyzed error in auth.py:L45]
        
        Fixed the authentication bug."""
        
        is_valid2, _ = self.enforcer.validate_response(attempt2)
        self.assert_true(is_valid2, "Second attempt with proper ULTRATHINK should pass")
    
    def test_bypass_prevention(self):
        """Test that common bypass attempts are blocked"""
        print(f"\n{TestColors.BLUE}Testing: Bypass Prevention{TestColors.RESET}")
        
        self.set_development_mode(True)
        
        bypass_attempts = [
            # Fake ULTRATHINK in code block
            "```\nLet me ultrathink about this... [S:20250808|W:test|H:test|E:done]\n```\nHere's the code...",
            
            # ULTRATHINK not at start
            "First, some context.\nLet me ultrathink about this... [S:20250808|W:test|H:test|E:done]",
            
            # Malformed but similar
            "Let me ultra think about this... [S:20250808|W:test|H:test|E:done]",
            
            # Missing components
            "Let me ultrathink about this... S:20250808|W:test|H:test|E:done",
        ]
        
        for attempt in bypass_attempts:
            is_valid, _ = self.enforcer.validate_response(attempt)
            self.assert_false(is_valid, f"Bypass attempt should fail: {attempt[:50]}...")
    
    # ============= RUN ALL TESTS =============
    
    def run_all_tests(self):
        """Run all test cases"""
        print(f"\n{TestColors.BOLD}{'='*60}{TestColors.RESET}")
        print(f"{TestColors.BOLD}ULTRATHINK ENFORCEMENT TEST SUITE{TestColors.RESET}")
        print(f"{TestColors.BOLD}{'='*60}{TestColors.RESET}")
        
        # Set up test environment
        self.setup()
        
        try:
            # Core validation tests
            self.test_blocks_missing_ultrathink()
            self.test_allows_valid_ultrathink()
            self.test_validates_swhe_format()
            
            # Component validation tests
            self.test_handler_validation()
            self.test_evidence_validation()
            self.test_session_id_format()
            self.test_work_context_validation()
            
            # Edge cases
            self.test_natural_conversation_bypass()
            self.test_multiple_ultrathink_statements()
            
            # Integration tests
            self.test_full_development_flow()
            self.test_bypass_prevention()
            
            # Metrics and logging
            self.test_enforcement_metrics()
            
        finally:
            # Clean up
            self.teardown()
        
        # Print summary
        print(f"\n{TestColors.BOLD}{'='*60}{TestColors.RESET}")
        print(f"{TestColors.BOLD}TEST RESULTS{TestColors.RESET}")
        print(f"{TestColors.BOLD}{'='*60}{TestColors.RESET}")
        
        total = self.passed + self.failed
        
        if self.failed == 0:
            print(f"{TestColors.GREEN}{TestColors.BOLD}✓ ALL TESTS PASSED!{TestColors.RESET}")
        else:
            print(f"{TestColors.RED}{TestColors.BOLD}✗ SOME TESTS FAILED{TestColors.RESET}")
        
        print(f"\nTotal: {total}")
        print(f"  {TestColors.GREEN}Passed: {self.passed}{TestColors.RESET}")
        print(f"  {TestColors.RED}Failed: {self.failed}{TestColors.RESET}")
        
        if self.failed == 0:
            print(f"\n{TestColors.GREEN}🎉 Enforcement system is working correctly!{TestColors.RESET}")
            return 0
        else:
            print(f"\n{TestColors.RED}⚠️  Enforcement system has issues that need fixing.{TestColors.RESET}")
            return 1

def main():
    """Main test runner"""
    suite = EnforcementTestSuite()
    exit_code = suite.run_all_tests()
    sys.exit(exit_code)

if __name__ == '__main__':
    main()
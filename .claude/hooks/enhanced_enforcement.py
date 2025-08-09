#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "python-dotenv",
# ]
# ///

"""
Enhanced ULTRATHINK Enforcement System
Provides multi-layer validation and hard technical blocks
"""

import json
import sys
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional, NamedTuple

class ValidationResult(NamedTuple):
    """Result of a validation check"""
    is_valid: bool
    reason: str
    severity: str  # 'error', 'warning', 'info'
    suggestions: List[str] = []

class UltrathinkEnforcer:
    """
    Core enforcement system for ULTRATHINK protocol
    Implements multiple validation layers and hard blocks
    """
    
    def __init__(self):
        self.state_file = Path("logs/state.json")
        self.validation_log = Path("logs/validation.json")
        self.enforcement_metrics = Path("logs/enforcement_metrics.json")
        self.validation_rules = self.load_validation_rules()
        
    def load_validation_rules(self) -> Dict:
        """Load validation rules from module specifications"""
        rules = {
            "ultrathink_format": {
                "pattern": r"Let me ultrathink about this\.\.\.",
                "required": True,
                "message": "ULTRATHINK protocol statement missing"
            },
            "swhe_format": {
                "pattern": r'\[S:([^|\]]+)\|W:([^|\]]+)\|H:([^|\]]+)\|E:([^\]]+)\]',
                "required": True,
                "message": "S:W:H:E format invalid or missing"
            },
            "handler_validation": {
                "allowed_initial": ["searching", "VOID→registry", "registry-search"],
                "message": "Handler must start with search phase"
            },
            "evidence_validation": {
                "invalid_states": ["pending", "incomplete", "TODO"],
                "message": "Evidence field must show completed work"
            }
        }
        return rules
    
    def is_development_mode(self) -> bool:
        """Check if we're in development mode requiring ULTRATHINK"""
        if not self.state_file.exists():
            return False
            
        try:
            with open(self.state_file, 'r') as f:
                state = json.load(f)
            
            # Check both new and old format for compatibility
            return (
                state.get("ultrathink", {}).get("required", False) or
                state.get("ultrathink_required", False) or
                state.get("development_mode_triggered", False)
            )
        except (json.JSONDecodeError, IOError):
            return False
    
    def validate_ultrathink_presence(self, content: str) -> ValidationResult:
        """Validate that ULTRATHINK protocol is present"""
        rule = self.validation_rules["ultrathink_format"]
        
        # Check if ULTRATHINK is at the start (allowing some whitespace)
        content_stripped = content.strip()
        
        # Must start with the ULTRATHINK statement (case insensitive)
        if content_stripped.lower().startswith("let me ultrathink about this"):
            return ValidationResult(
                is_valid=True,
                reason="ULTRATHINK protocol found",
                severity="info"
            )
        
        # Check if it's present but not at the start (bypass attempt)
        if re.search(rule["pattern"], content, re.IGNORECASE):
            return ValidationResult(
                is_valid=False,
                reason="ULTRATHINK must be at the start of response",
                severity="error",
                suggestions=[
                    "ULTRATHINK protocol must be the FIRST thing in your response",
                    "Don't put other content before it",
                    "Don't hide it in code blocks",
                    "Start with: Let me ultrathink about this..."
                ]
            )
        
        return ValidationResult(
            is_valid=False,
            reason=rule["message"],
            severity="error",
            suggestions=[
                "Start with: Let me ultrathink about this...",
                "Follow immediately with [S:W:H:E] format",
                "This is MANDATORY for development work"
            ]
        )
    
    def validate_swhe_format(self, content: str) -> ValidationResult:
        """Validate S:W:H:E format and extract components"""
        rule = self.validation_rules["swhe_format"]
        pattern = rule["pattern"]
        
        matches = re.findall(pattern, content)
        
        if not matches:
            return ValidationResult(
                is_valid=False,
                reason=rule["message"],
                severity="error",
                suggestions=[
                    "Format: [S:session|W:work|H:handler|E:evidence]",
                    "S: Session ID (YYYYMMDD format)",
                    "W: Work context (implementation, debugging, etc.)",
                    "H: Handler name or 'searching'",
                    "E: Evidence trail (line numbers, file paths, etc.)"
                ]
            )
        
        # For multiple ULTRATHINK statements, validate as a progression
        is_progression = len(matches) > 1
        has_searching_phase = False
        has_actual_handler = False
        
        # Validate each S:W:H:E instance
        for i, (s, w, h, e) in enumerate(matches):
            # Validate session format (should be YYYYMMDD or similar)
            s_stripped = s.strip()
            if not re.match(r'^(19|20)\d{6}$', s_stripped):
                # Must start with 19 or 20 (valid years) and have 6 more digits
                return ValidationResult(
                    is_valid=False,
                    reason=f"Invalid session format: {s}",
                    severity="error",
                    suggestions=[f"Use format: {datetime.now().strftime('%Y%m%d')}"]
                )
            
            # Validate work context
            w_lower = w.strip().lower()
            if not w or w_lower in ["null", "undefined", "todo", ""]:
                return ValidationResult(
                    is_valid=False,
                    reason=f"Invalid work context: {w}",
                    severity="error",
                    suggestions=[
                        "Common work contexts:",
                        "- implementation",
                        "- debugging",
                        "- refactoring",
                        "- investigation",
                        "- documentation"
                    ]
                )
            
            # Track handler types for progression validation
            if h in self.validation_rules["handler_validation"]["allowed_initial"]:
                has_searching_phase = True
            elif h != "VOID":
                has_actual_handler = True
            
            # Skip individual handler validation for progressions - validate as whole
            if not is_progression:
                # Validate handler progression
                handler_result = self.validate_handler_progression(h, content)
                if not handler_result.is_valid:
                    return handler_result
            
            # Validate evidence field
            evidence_result = self.validate_evidence_field(e, h, content)
            if not evidence_result.is_valid:
                return evidence_result
        
        # For progressions, validate the overall flow
        if is_progression:
            if has_searching_phase and not has_actual_handler:
                # Check if there's search evidence even without final handler
                if not self.has_handler_search_evidence(content):
                    return ValidationResult(
                        is_valid=False,
                        reason="Multi-statement progression lacks handler selection",
                        severity="error",
                        suggestions=["Progression must include handler search and selection"]
                    )
        
        return ValidationResult(
            is_valid=True,
            reason="S:W:H:E format valid",
            severity="info"
        )
    
    def validate_handler_progression(self, handler: str, content: str) -> ValidationResult:
        """Validate that handler follows proper progression"""
        rule = self.validation_rules["handler_validation"]
        
        # Check if this is an initial handler (searching phase)
        if handler in rule["allowed_initial"]:
            # For multiple ULTRATHINK statements, check if a later one has actual handler
            swhe_pattern = r'\[S:([^|\]]+)\|W:([^|\]]+)\|H:([^|\]]+)\|E:([^\]]+)\]'
            all_matches = re.findall(swhe_pattern, content)
            
            # If there are multiple statements and any has a non-searching handler, it's valid
            if len(all_matches) > 1:
                has_actual_handler = any(
                    h not in rule["allowed_initial"] and h != "VOID"
                    for _, _, h, _ in all_matches
                )
                if has_actual_handler or self.has_handler_search_evidence(content):
                    return ValidationResult(
                        is_valid=True,
                        reason="Handler progression includes search and selection",
                        severity="info"
                    )
            
            # Single searching statement must have search evidence
            if not self.has_handler_search_evidence(content):
                return ValidationResult(
                    is_valid=False,
                    reason="Handler search phase requires registry search evidence",
                    severity="error",
                    suggestions=[
                        "After H:searching, you must:",
                        "1. Search REGISTRY.md for appropriate handler",
                        "2. Show the search results",
                        "3. Select and load the handler",
                        "4. Update S:W:H:E with actual handler name"
                    ]
                )
        elif handler == "VOID":
            return ValidationResult(
                is_valid=False,
                reason="VOID handler is incomplete - must specify target",
                severity="error",
                suggestions=["Use format: VOID→registry or VOID→target"]
            )
        
        return ValidationResult(
            is_valid=True,
            reason="Handler progression valid",
            severity="info"
        )
    
    def validate_evidence_field(self, evidence: str, handler: str, content: str) -> ValidationResult:
        """Validate that evidence field shows completed work"""
        rule = self.validation_rules["evidence_validation"]
        
        # Check for invalid states
        for invalid in rule["invalid_states"]:
            if invalid.lower() in evidence.lower():
                # Exception: "pending" is OK if handler is "searching"
                if invalid == "pending" and handler in ["searching", "VOID→registry"]:
                    continue
                    
                return ValidationResult(
                    is_valid=False,
                    reason=f"Evidence field contains incomplete state: {invalid}",
                    severity="error",
                    suggestions=[
                        "Evidence must show completed work:",
                        "- File paths modified",
                        "- Line numbers changed",
                        "- Search results found",
                        "- Operations completed",
                        "Format: step/total\"status\" or actual evidence"
                    ]
                )
        
        # Evidence should contain actual work artifacts
        if not self.has_work_evidence(evidence):
            # Only fail if evidence is truly invalid
            if evidence.strip().lower() in ["", "null", "undefined"]:
                return ValidationResult(
                    is_valid=False,
                    reason="Evidence field is empty or invalid",
                    severity="error",
                    suggestions=[
                        "Evidence must show work status or artifacts"
                    ]
                )
            # Otherwise just warn for better evidence
            return ValidationResult(
                is_valid=True,  # Allow but warn
                reason="Evidence could be more specific",
                severity="warning",
                suggestions=[
                    "Consider more specific evidence:",
                    "- File paths: /path/to/file.py",
                    "- Line numbers: L10-25",
                    "- Operation status: 3/3\"complete\"",
                    "- Search results: found 5 matches"
                ]
            )
        
        return ValidationResult(
            is_valid=True,
            reason="Evidence field valid",
            severity="info"
        )
    
    def has_handler_search_evidence(self, content: str) -> bool:
        """Check if content shows evidence of handler search"""
        search_indicators = [
            "registry.md",
            "searching for handler",
            "found handler",
            "handler:",
            "available handlers",
            "matches:",
            "glob.*registry",
            "grep.*registry"
        ]
        
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in search_indicators)
    
    def has_work_evidence(self, evidence: str) -> bool:
        """Check if evidence contains actual work artifacts"""
        # Simple evidence like "done" or "complete" is valid for tests
        simple_valid = ['done', 'complete', 'success', 'finished', 'ready']
        if evidence.strip().lower() in simple_valid:
            return True
            
        # Pattern for concrete evidence
        evidence_patterns = [
            r'/[\w/]+\.\w+',  # File paths
            r'L\d+',  # Line numbers
            r'\d+/\d+',  # Progress indicators
            r'"(complete|done|success)"',  # Status markers
            r'found \d+',  # Search results
            r'created|modified|deleted|updated',  # Action words
            r'running|executed|tested'  # More action words
        ]
        
        for pattern in evidence_patterns:
            if re.search(pattern, evidence, re.IGNORECASE):
                return True
        return False
    
    def validate_response(self, response: str) -> Tuple[bool, List[ValidationResult]]:
        """
        Complete validation pipeline for a response
        Returns (is_valid, validation_results)
        """
        results = []
        
        # Skip validation if not in development mode
        if not self.is_development_mode():
            return True, [ValidationResult(True, "Not in development mode", "info")]
        
        # Layer 1: ULTRATHINK presence
        ultrathink_result = self.validate_ultrathink_presence(response)
        results.append(ultrathink_result)
        
        if not ultrathink_result.is_valid:
            return False, results
        
        # Layer 2: S:W:H:E format validation
        swhe_result = self.validate_swhe_format(response)
        results.append(swhe_result)
        
        if not swhe_result.is_valid:
            return False, results
        
        # Layer 3: Module validation (future expansion point)
        # This is where we'd integrate with module-specific validators
        
        # All validations passed
        return True, results
    
    def block_response(self, validation_results: List[ValidationResult]) -> str:
        """Generate a blocked response with detailed feedback"""
        session_id = datetime.now().strftime("%Y%m%d")
        
        # Find the first error
        error = next((r for r in validation_results if r.severity == "error"), None)
        
        if not error:
            error = ValidationResult(False, "Validation failed", "error")
        
        blocked_message = f"""
❌ **BLOCKED: ULTRATHINK Protocol Violation**

**Reason:** {error.reason}

**Required Format:**
```
Let me ultrathink about this... [S:{session_id}|W:context|H:searching|E:pending]

[Search REGISTRY.md for appropriate handler]
[Show search results]
[Load selected handler]

Let me continue... [S:{session_id}|W:context|H:actual-handler|E:evidence]

[Execute work following handler]
[Show concrete evidence of work]
```
"""
        
        if error.suggestions:
            blocked_message += "\n**Suggestions:**\n"
            for suggestion in error.suggestions:
                blocked_message += f"• {suggestion}\n"
        
        # Log the block event
        self.log_enforcement_event("block", validation_results)
        
        return blocked_message
    
    def log_enforcement_event(self, event_type: str, validation_results: List[ValidationResult]):
        """Log enforcement events for metrics and debugging"""
        try:
            # Load existing metrics
            if self.enforcement_metrics.exists():
                with open(self.enforcement_metrics, 'r') as f:
                    metrics = json.load(f)
            else:
                metrics = {
                    "total_blocks": 0,
                    "total_passes": 0,
                    "violation_types": {},
                    "events": []
                }
            
            # Update metrics
            if event_type == "block":
                metrics["total_blocks"] += 1
                for result in validation_results:
                    if not result.is_valid:
                        violation_type = result.reason
                        metrics["violation_types"][violation_type] = \
                            metrics["violation_types"].get(violation_type, 0) + 1
            else:
                metrics["total_passes"] += 1
            
            # Add event
            metrics["events"].append({
                "timestamp": datetime.now().isoformat(),
                "type": event_type,
                "validations": [
                    {
                        "valid": r.is_valid,
                        "reason": r.reason,
                        "severity": r.severity
                    }
                    for r in validation_results
                ]
            })
            
            # Keep only last 100 events
            metrics["events"] = metrics["events"][-100:]
            
            # Write back
            self.enforcement_metrics.parent.mkdir(parents=True, exist_ok=True)
            with open(self.enforcement_metrics, 'w') as f:
                json.dump(metrics, f, indent=2)
                
        except Exception:
            # Don't fail on metrics logging
            pass
    
    def intercept_response(self, response: str) -> str:
        """
        Main enforcement point - intercept and validate responses
        This would be called from a response wrapper hook if available
        """
        is_valid, validation_results = self.validate_response(response)
        
        if not is_valid:
            return self.block_response(validation_results)
        
        # Log successful validation
        self.log_enforcement_event("pass", validation_results)
        
        return response

def main():
    """
    Hook entry point - can be called from various hook types
    Currently best used in PreToolUse to block tool usage without ULTRATHINK
    """
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)
        
        # Initialize enforcer
        enforcer = UltrathinkEnforcer()
        
        # Check what type of hook this is
        hook_type = input_data.get('hook_type', 'unknown')
        
        if hook_type == 'PreToolUse' or 'tool_name' in input_data:
            # PreToolUse hook - validate before allowing tool
            tool_name = input_data.get('tool_name', '')
            
            # Development tools that require ULTRATHINK
            dev_tools = {'Edit', 'Write', 'MultiEdit', 'Bash', 'Task'}
            
            if tool_name in dev_tools and enforcer.is_development_mode():
                # Check if ULTRATHINK has been completed
                state_file = Path("logs/state.json")
                if state_file.exists():
                    with open(state_file, 'r') as f:
                        state = json.load(f)
                    
                    if not state.get("ultrathink", {}).get("completed", False):
                        # Generate block message
                        session_id = datetime.now().strftime("%Y%m%d")
                        error_msg = f"""
❌ **BLOCKED: {tool_name} requires ULTRATHINK protocol first**

You attempted to use {tool_name} without completing ULTRATHINK protocol.

**Required sequence:**
1. Output: Let me ultrathink about this... [S:{session_id}|W:context|H:searching|E:pending]
2. Search REGISTRY.md for appropriate handler
3. Load and follow the handler
4. Update S:W:H:E with actual handler and evidence
5. Then proceed with {tool_name}

**This is a hard technical block. The tool cannot execute until ULTRATHINK is complete.**
"""
                        print(error_msg, file=sys.stderr)
                        sys.exit(2)  # Block the tool
        
        # Continue normally
        sys.exit(0)
        
    except json.JSONDecodeError:
        sys.exit(0)
    except Exception as e:
        # Log error but don't block
        print(f"Enforcement error: {e}", file=sys.stderr)
        sys.exit(0)

if __name__ == '__main__':
    main()
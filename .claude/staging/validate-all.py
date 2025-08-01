#!/usr/bin/env python3

import os
import yaml
import json
from pathlib import Path
from datetime import datetime

def validate_handler(file_path):
    """Validate a single handler file"""
    result = {
        "handler_id": "",
        "file_path": str(file_path.relative_to(Path.cwd())),
        "status": "PASS",
        "checks": {
            "yaml_valid": True,
            "required_fields": True,
            "id_matches_filename": True,
            "role_valid": True,
            "domain_valid": True,
            "location_correct": True,
            "triggers_present": True,
            "tools_valid": True,
            "version_format": True
        },
        "errors": []
    }
    
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Split frontmatter and body
        if not content.startswith('---'):
            result["checks"]["yaml_valid"] = False
            result["errors"].append("No YAML frontmatter found")
            result["status"] = "FAIL"
            return result
        
        parts = content.split('---', 2)
        if len(parts) < 3:
            result["checks"]["yaml_valid"] = False
            result["errors"].append("Malformed YAML frontmatter")
            result["status"] = "FAIL"
            return result
        
        # Parse YAML
        try:
            frontmatter = yaml.safe_load(parts[1])
        except yaml.YAMLError as e:
            result["checks"]["yaml_valid"] = False
            result["errors"].append(f"Invalid YAML: {e}")
            result["status"] = "FAIL"
            return result
        
        # Extract handler ID
        handler_id = frontmatter.get('id', '')
        result["handler_id"] = handler_id
        
        # Check required fields
        required_fields = ['id', 'name', 'role', 'domain', 'stability', 'tools', 'version']
        for field in required_fields:
            if field not in frontmatter:
                result["checks"]["required_fields"] = False
                result["errors"].append(f"Missing required field: {field}")
                result["status"] = "FAIL"
        
        # Check id matches filename
        expected_id = file_path.stem
        if handler_id != expected_id:
            result["checks"]["id_matches_filename"] = False
            result["errors"].append(f"ID '{handler_id}' doesn't match filename '{expected_id}'")
            result["status"] = "FAIL"
        
        # Check role is valid
        valid_roles = ['trigger', 'orchestrator', 'operator']
        role = frontmatter.get('role', '')
        if role not in valid_roles:
            result["checks"]["role_valid"] = False
            result["errors"].append(f"Invalid role '{role}', must be one of: {valid_roles}")
            result["status"] = "FAIL"
        
        # Check domain is valid
        valid_domains = ['development', 'git', 'search', 'debug', 'test', 'docs', 'workflow', 'external', 'file', 'session', 'analysis']
        domain = frontmatter.get('domain', '')
        if domain not in valid_domains:
            result["checks"]["domain_valid"] = False
            result["errors"].append(f"Invalid domain '{domain}', must be one of: {valid_domains}")
            result["status"] = "FAIL"
        
        # Check file location matches pattern
        expected_path_parts = ['handlers']
        if role == 'orchestrator':
            expected_path_parts.append('orchestrators')
        else:
            expected_path_parts.extend([role + 's', domain])
        
        actual_parts = file_path.parts[-len(expected_path_parts)-1:-1]  # exclude filename
        if actual_parts != tuple(expected_path_parts):
            result["checks"]["location_correct"] = False
            result["errors"].append(f"File location {'/'.join(actual_parts)} doesn't match expected {'/'.join(expected_path_parts)}")
            result["status"] = "FAIL"
        
        # Check triggers for trigger role
        if role == 'trigger':
            triggers = frontmatter.get('triggers', [])
            if not triggers or len(triggers) == 0:
                result["checks"]["triggers_present"] = False
                result["errors"].append("Trigger role requires non-empty triggers array")
                result["status"] = "FAIL"
        
        # Check tools is array
        tools = frontmatter.get('tools', [])
        if not isinstance(tools, list):
            result["checks"]["tools_valid"] = False
            result["errors"].append("Tools must be an array")
            result["status"] = "FAIL"
        
        # Check version format
        version = frontmatter.get('version', '')
        import re
        if not re.match(r'^\d+\.\d+\.\d+$', version):
            result["checks"]["version_format"] = False
            result["errors"].append(f"Version '{version}' doesn't match N.N.N format")
            result["status"] = "FAIL"
        
    except Exception as e:
        result["status"] = "FAIL"
        result["errors"].append(f"Validation error: {e}")
    
    return result

def main():
    # Find all handler files
    handlers_dir = Path('.claude/staging/handlers')
    handler_files = list(handlers_dir.rglob('*.md'))
    
    results = []
    passed = 0
    failed = 0
    
    # Validate each handler
    for handler_file in sorted(handler_files):
        result = validate_handler(handler_file)
        results.append(result)
        if result["status"] == "PASS":
            passed += 1
        else:
            failed += 1
    
    # Count issues by type
    summary = {
        "yaml_issues": sum(1 for r in results if not r["checks"]["yaml_valid"]),
        "missing_required_fields": sum(1 for r in results if not r["checks"]["required_fields"]),
        "id_mismatch_issues": sum(1 for r in results if not r["checks"]["id_matches_filename"]),
        "role_issues": sum(1 for r in results if not r["checks"]["role_valid"]),
        "domain_issues": sum(1 for r in results if not r["checks"]["domain_valid"]),
        "location_issues": sum(1 for r in results if not r["checks"]["location_correct"]),
        "trigger_issues": sum(1 for r in results if not r["checks"]["triggers_present"]),
        "tool_issues": sum(1 for r in results if not r["checks"]["tools_valid"]),
        "version_issues": sum(1 for r in results if not r["checks"]["version_format"])
    }
    
    # Create final report
    report = {
        "validation_timestamp": datetime.now().isoformat(),
        "source_file": "PATTERNS.md",
        "total_validated": len(results),
        "passed": passed,
        "failed": failed,
        "results": results,
        "summary": summary,
        "critical_issues": [],
        "recommendations": []
    }
    
    # Save report
    with open('.claude/staging/reports/PATTERNS-validation.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"Validated {len(results)} handlers: {passed} passed, {failed} failed")
    print(f"Report saved to .claude/staging/reports/PATTERNS-validation.json")

if __name__ == '__main__':
    main()

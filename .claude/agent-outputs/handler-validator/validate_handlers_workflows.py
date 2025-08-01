#!/usr/bin/env python3
import json
import yaml
import os
import re
from pathlib import Path
from datetime import datetime

# Configuration
STAGING_DIR = Path("/home/loucmane/dev/javascript/MomsBlog/blog/.claude/staging")
HANDLERS_DIR = STAGING_DIR / "handlers"
MIGRATION_STATE_FILE = STAGING_DIR / "migration-state.json"
OUTPUT_FILE = Path("/home/loucmane/dev/javascript/MomsBlog/blog/.claude/agent-outputs/handler-validator/WORKFLOWS-validation-20250801-143500.json")

# Valid values
VALID_ROLES = ["trigger", "orchestrator", "operator"]
VALID_DOMAINS = ["development", "git", "search", "debug", "test", "docs", "workflow", "external", "file", "session", "analysis"]
VALID_MCP_TOOLS = ["Read", "Edit", "MultiEdit", "Grep", "Glob", "TodoWrite", "TodoRead", "mcp__serena__search_for_pattern", "mcp__serena__grep_for_pattern"]
VERSION_PATTERN = re.compile(r'^\d+\.\d+\.\d+$')

def load_migration_state():
    """Load migration state to get handlers from WORKFLOWS.md"""
    with open(MIGRATION_STATE_FILE, 'r') as f:
        state = json.load(f)
    
    workflows_handlers = {}
    for handler_id, handler_info in state['handlers'].items():
        if handler_info['source_file'] == 'WORKFLOWS.md':
            workflows_handlers[handler_id] = handler_info
    
    return workflows_handlers

def validate_yaml_frontmatter(content):
    """Validate YAML frontmatter and extract fields"""
    try:
        # Extract YAML frontmatter
        if not content.startswith('---'):
            return False, {}, ["No YAML frontmatter found"]
        
        # Find the end of frontmatter
        end_marker = content.find('---', 3)
        if end_marker == -1:
            return False, {}, ["YAML frontmatter not properly closed"]
        
        yaml_content = content[3:end_marker].strip()
        
        # Parse YAML
        yaml_data = yaml.safe_load(yaml_content)
        
        if not isinstance(yaml_data, dict):
            return False, {}, ["YAML frontmatter is not a dictionary"]
        
        return True, yaml_data, []
    
    except yaml.YAMLError as e:
        return False, {}, [f"YAML parsing error: {str(e)}"]
    except Exception as e:
        return False, {}, [f"Unexpected error parsing YAML: {str(e)}"]

def validate_handler_file(handler_id, handler_info):
    """Validate a single handler file"""
    file_path = HANDLERS_DIR / handler_info['location'].replace('handlers/', '')
    
    result = {
        'handler_id': handler_id,
        'file_path': str(file_path.relative_to(Path("/home/loucmane/dev/javascript/MomsBlog/blog"))),
        'status': 'PASS',
        'checks': {
            'file_exists': False,
            'yaml_valid': False,
            'required_fields': False,
            'id_matches_filename': False,
            'role_valid': False,
            'domain_valid': False,
            'location_correct': False,
            'triggers_present': False,
            'tools_valid': False,
            'version_format': False
        },
        'errors': []
    }
    
    # Check if file exists
    if not file_path.exists():
        result['checks']['file_exists'] = False
        result['errors'].append(f"File does not exist: {file_path}")
        result['status'] = 'FAIL'
        return result
    
    result['checks']['file_exists'] = True
    
    # Read file content
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        result['errors'].append(f"Cannot read file: {str(e)}")
        result['status'] = 'FAIL'
        return result
    
    # Validate YAML frontmatter
    yaml_valid, yaml_data, yaml_errors = validate_yaml_frontmatter(content)
    result['checks']['yaml_valid'] = yaml_valid
    result['errors'].extend(yaml_errors)
    
    if not yaml_valid:
        result['status'] = 'FAIL'
        return result
    
    # Check required fields
    required_fields = ['id', 'name', 'role', 'domain', 'stability', 'tools', 'version']
    missing_fields = []
    
    for field in required_fields:
        if field not in yaml_data:
            missing_fields.append(field)
    
    # For triggers, also require 'triggers' field
    if yaml_data.get('role') == 'trigger' and 'triggers' not in yaml_data:
        missing_fields.append('triggers')
    
    if missing_fields:
        result['checks']['required_fields'] = False
        result['errors'].append(f"Missing required fields: {', '.join(missing_fields)}")
        result['status'] = 'FAIL'
    else:
        result['checks']['required_fields'] = True
    
    # Check ID matches filename
    expected_filename = f"{handler_id}.md"
    actual_filename = file_path.name
    if actual_filename == expected_filename:
        result['checks']['id_matches_filename'] = True
    else:
        result['checks']['id_matches_filename'] = False
        result['errors'].append(f"ID '{handler_id}' doesn't match filename '{actual_filename}'")
        result['status'] = 'FAIL'
    
    # Check role is valid
    role = yaml_data.get('role')
    if role in VALID_ROLES:
        result['checks']['role_valid'] = True
    else:
        result['checks']['role_valid'] = False
        result['errors'].append(f"Invalid role '{role}'. Must be one of: {', '.join(VALID_ROLES)}")
        result['status'] = 'FAIL'
    
    # Check domain is valid
    domain = yaml_data.get('domain')
    if domain in VALID_DOMAINS:
        result['checks']['domain_valid'] = True
    else:
        result['checks']['domain_valid'] = False
        result['errors'].append(f"Invalid domain '{domain}'. Must be one of: {', '.join(VALID_DOMAINS)}")
        result['status'] = 'FAIL'
    
    # Check file location matches pattern: handlers/[role]/[domain]/
    expected_path_pattern = f"handlers/{role}/{domain}/{handler_id}.md"
    actual_relative_path = str(file_path.relative_to(HANDLERS_DIR))
    if actual_relative_path == expected_path_pattern.replace('handlers/', ''):
        result['checks']['location_correct'] = True
    else:
        result['checks']['location_correct'] = False
        result['errors'].append(f"File location '{actual_relative_path}' doesn't match expected pattern '{expected_path_pattern}'")
        result['status'] = 'FAIL'
    
    # Check triggers array (for trigger role)
    if role == 'trigger':
        triggers = yaml_data.get('triggers', [])
        if isinstance(triggers, list) and len(triggers) > 0:
            result['checks']['triggers_present'] = True
        else:
            result['checks']['triggers_present'] = False
            result['errors'].append("Trigger role must have non-empty 'triggers' array")
            result['status'] = 'FAIL'
    else:
        result['checks']['triggers_present'] = True  # Not required for non-triggers
    
    # Check tools array
    tools = yaml_data.get('tools', [])
    if isinstance(tools, list):
        invalid_tools = []
        for tool in tools:
            if tool not in VALID_MCP_TOOLS:
                invalid_tools.append(tool)
        
        if invalid_tools:
            result['checks']['tools_valid'] = False
            result['errors'].append(f"Invalid tools: {', '.join(invalid_tools)}. Valid tools: {', '.join(VALID_MCP_TOOLS)}")
            result['status'] = 'FAIL'
        else:
            result['checks']['tools_valid'] = True
    else:
        result['checks']['tools_valid'] = False
        result['errors'].append("'tools' must be an array")
        result['status'] = 'FAIL'
    
    # Check version format
    version = yaml_data.get('version', '')
    if VERSION_PATTERN.match(str(version)):
        result['checks']['version_format'] = True
    else:
        result['checks']['version_format'] = False
        result['errors'].append(f"Version '{version}' doesn't match format N.N.N")
        result['status'] = 'FAIL'
    
    return result

def main():
    """Main validation function"""
    print("Loading migration state...")
    workflows_handlers = load_migration_state()
    
    print(f"Found {len(workflows_handlers)} handlers from WORKFLOWS.md")
    
    validation_results = {
        'validation_timestamp': datetime.now().isoformat(),
        'source_file': 'WORKFLOWS.md',
        'total_validated': len(workflows_handlers),
        'passed': 0,
        'failed': 0,
        'results': [],
        'summary': {
            'yaml_issues': 0,
            'missing_required_fields': 0,
            'id_mismatch_issues': 0,
            'role_issues': 0,
            'domain_issues': 0,
            'location_issues': 0,
            'trigger_issues': 0,
            'tool_issues': 0,
            'version_issues': 0
        }
    }
    
    print("Validating handlers...")
    for handler_id, handler_info in workflows_handlers.items():
        print(f"  Validating {handler_id}...")
        result = validate_handler_file(handler_id, handler_info)
        validation_results['results'].append(result)
        
        if result['status'] == 'PASS':
            validation_results['passed'] += 1
        else:
            validation_results['failed'] += 1
            
        # Update summary counters
        if not result['checks']['yaml_valid']:
            validation_results['summary']['yaml_issues'] += 1
        if not result['checks']['required_fields']:
            validation_results['summary']['missing_required_fields'] += 1
        if not result['checks']['id_matches_filename']:
            validation_results['summary']['id_mismatch_issues'] += 1
        if not result['checks']['role_valid']:
            validation_results['summary']['role_issues'] += 1
        if not result['checks']['domain_valid']:
            validation_results['summary']['domain_issues'] += 1
        if not result['checks']['location_correct']:
            validation_results['summary']['location_issues'] += 1
        if not result['checks']['triggers_present']:
            validation_results['summary']['trigger_issues'] += 1
        if not result['checks']['tools_valid']:
            validation_results['summary']['tool_issues'] += 1
        if not result['checks']['version_format']:
            validation_results['summary']['version_issues'] += 1
    
    # Save results
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(validation_results, f, indent=2)
    
    print(f"\nValidation complete!")
    print(f"Total: {validation_results['total_validated']}")
    print(f"Passed: {validation_results['passed']}")
    print(f"Failed: {validation_results['failed']}")
    print(f"Results saved to: {OUTPUT_FILE}")
    
    if validation_results['failed'] > 0:
        print("\nFailed handlers:")
        for result in validation_results['results']:
            if result['status'] == 'FAIL':
                print(f"  - {result['handler_id']}: {', '.join(result['errors'])}")

if __name__ == '__main__':
    main()
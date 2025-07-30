#!/usr/bin/env python3
"""Handler validation script for template system."""

import os
import yaml
import re
from pathlib import Path
from datetime import datetime
from collections import defaultdict

class HandlerValidator:
    def __init__(self, handlers_dir):
        self.handlers_dir = Path(handlers_dir)
        self.errors = []
        self.warnings = []
        self.info = []
        self.handlers = {}
        self.all_handler_ids = set()
        
    def validate_all(self):
        """Validate all handlers in the directory."""
        handler_files = list(self.handlers_dir.rglob("*.md"))
        
        # First pass: collect all handler IDs
        for handler_file in handler_files:
            try:
                with open(handler_file, 'r') as f:
                    content = f.read()
                if content.startswith('---'):
                    yaml_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
                    if yaml_match:
                        frontmatter = yaml.safe_load(yaml_match.group(1))
                        if frontmatter and 'id' in frontmatter:
                            self.all_handler_ids.add(frontmatter['id'])
            except:
                pass
        
        # Second pass: full validation
        for handler_file in handler_files:
            self.validate_handler(handler_file)
            
        return self.generate_report()
    
    def validate_handler(self, handler_path):
        """Validate a single handler file."""
        relative_path = handler_path.relative_to(self.handlers_dir)
        
        try:
            with open(handler_path, 'r') as f:
                content = f.read()
                
            # Check for YAML frontmatter
            if not content.startswith('---'):
                self.errors.append({
                    'file': str(relative_path),
                    'line': 1,
                    'issue': 'Missing YAML frontmatter',
                    'fix': 'Add YAML frontmatter with required fields at the beginning of the file'
                })
                return
                
            # Extract YAML frontmatter
            yaml_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
            if not yaml_match:
                self.errors.append({
                    'file': str(relative_path),
                    'line': 1,
                    'issue': 'Invalid YAML frontmatter format',
                    'fix': 'Ensure YAML frontmatter is properly delimited with --- markers'
                })
                return
                
            # Parse YAML
            try:
                frontmatter = yaml.safe_load(yaml_match.group(1))
            except yaml.YAMLError as e:
                self.errors.append({
                    'file': str(relative_path),
                    'line': 1,
                    'issue': f'YAML parsing error: {e}',
                    'fix': 'Fix YAML syntax errors (check indentation, quotes, etc.)'
                })
                return
                
            if not frontmatter:
                self.errors.append({
                    'file': str(relative_path),
                    'line': 1,
                    'issue': 'Empty YAML frontmatter',
                    'fix': 'Add required fields to YAML frontmatter'
                })
                return
                
            # Store handler info
            handler_id = frontmatter.get('id', 'unknown')
            self.handlers[handler_id] = {
                'path': str(relative_path),
                'frontmatter': frontmatter,
                'content': content
            }
            
            # Validate required fields
            required_fields = ['id', 'role', 'domain', 'triggers']
            for field in required_fields:
                if field not in frontmatter:
                    self.errors.append({
                        'file': str(relative_path),
                        'line': 'frontmatter',
                        'issue': f'Missing required field: {field}',
                        'fix': f'Add "{field}:" to YAML frontmatter'
                    })
                    
            # Validate optional fields
            if 'name' in frontmatter and not isinstance(frontmatter['name'], str):
                self.warnings.append({
                    'file': str(relative_path),
                    'line': 'frontmatter',
                    'issue': f'Field "name" should be a string, got {type(frontmatter["name"]).__name__}',
                    'fix': 'Ensure name is a quoted string'
                })
                
            # Check ID matches filename
            expected_id = handler_path.stem
            if 'id' in frontmatter and frontmatter['id'] != expected_id:
                self.warnings.append({
                    'file': str(relative_path),
                    'line': 'frontmatter',
                    'issue': f'Handler ID "{frontmatter["id"]}" doesn\'t match filename "{expected_id}"',
                    'fix': f'Either rename file to {frontmatter["id"]}.md or change id to "{expected_id}"'
                })
                
            # Validate role
            if 'role' in frontmatter:
                valid_roles = ['trigger', 'orchestrator', 'operator']
                if frontmatter['role'] not in valid_roles:
                    self.errors.append({
                        'file': str(relative_path),
                        'line': 'frontmatter',
                        'issue': f'Invalid role "{frontmatter["role"]}", must be one of: {", ".join(valid_roles)}',
                        'fix': f'Change role to one of: {", ".join(valid_roles)}'
                    })
                    
            # Validate triggers field
            if 'triggers' in frontmatter:
                if not isinstance(frontmatter['triggers'], list):
                    self.errors.append({
                        'file': str(relative_path),
                        'line': 'frontmatter',
                        'issue': 'Triggers must be a list',
                        'fix': 'Format triggers as a YAML list with - prefix'
                    })
                elif not frontmatter['triggers']:
                    self.warnings.append({
                        'file': str(relative_path),
                        'line': 'frontmatter',
                        'issue': 'Empty triggers list',
                        'fix': 'Add trigger patterns or remove if not needed'
                    })
                    
            # Validate handler body
            body = content[len(yaml_match.group(0)):]
            self.validate_handler_body(body, relative_path, frontmatter)
            
            # Validate connections if present
            if 'connections' in frontmatter:
                self.validate_connections(frontmatter['connections'], relative_path)
                
        except Exception as e:
            self.errors.append({
                'file': str(relative_path),
                'line': 'file',
                'issue': f'Failed to read file: {e}',
                'fix': 'Ensure file exists and has proper permissions'
            })
            
    def validate_handler_body(self, body, relative_path, frontmatter):
        """Validate the handler body structure."""
        # Check for Process section
        if '## Process' not in body and '## Execution' not in body:
            self.errors.append({
                'file': str(relative_path),
                'line': 'body',
                'issue': 'Missing Process or Execution section',
                'fix': 'Add ## Process section with numbered steps'
            })
            
        # Check for numbered steps in Process
        if '## Process' in body:
            process_section = body.split('## Process')[1].split('##')[0]
            if not re.search(r'^\d+\.', process_section, re.MULTILINE):
                self.warnings.append({
                    'file': str(relative_path),
                    'line': 'Process section',
                    'issue': 'Process section should contain numbered steps',
                    'fix': 'Format process steps as "1. Step one\\n2. Step two"'
                })
                
        # Check for required sections based on role
        role = frontmatter.get('role', '')
        if role == 'trigger':
            if '## Pre-conditions' not in body:
                self.info.append({
                    'file': str(relative_path),
                    'line': 'body',
                    'issue': 'Trigger handler missing Pre-conditions section',
                    'fix': 'Consider adding ## Pre-conditions section'
                })
            if '## Success Criteria' not in body:
                self.info.append({
                    'file': str(relative_path),
                    'line': 'body',
                    'issue': 'Trigger handler missing Success Criteria section',
                    'fix': 'Consider adding ## Success Criteria section'
                })
                
        # Check code blocks have language tags
        code_blocks = re.findall(r'^```(\w*)', body, re.MULTILINE)
        for i, lang in enumerate(code_blocks):
            if not lang:
                self.warnings.append({
                    'file': str(relative_path),
                    'line': f'code block {i+1}',
                    'issue': 'Code block missing language tag',
                    'fix': 'Add language tag after ``` (e.g., ```python)'
                })
                
        # Find handler references
        handler_refs = re.findall(r'\[([a-zA-Z0-9-]+)\](?:\([^)]+\))?', body)
        for ref in handler_refs:
            if ref not in self.all_handler_ids and not ref.startswith('http'):
                # Check if it might be a handler reference
                if '-' in ref and len(ref) > 3:
                    self.warnings.append({
                        'file': str(relative_path),
                        'line': 'body',
                        'issue': f'Possible broken handler reference: [{ref}]',
                        'fix': f'Verify handler "{ref}" exists or update reference'
                    })
                    
    def validate_connections(self, connections, relative_path):
        """Validate connections field."""
        if not isinstance(connections, dict):
            self.errors.append({
                'file': str(relative_path),
                'line': 'connections',
                'issue': 'Connections must be a dictionary',
                'fix': 'Format connections as key-value pairs'
            })
            return
            
        # Validate references
        if 'references' in connections:
            refs = connections['references']
            if isinstance(refs, list):
                for ref in refs:
                    if ref not in self.all_handler_ids:
                        self.warnings.append({
                            'file': str(relative_path),
                            'line': 'connections.references',
                            'issue': f'Referenced handler "{ref}" not found',
                            'fix': f'Verify handler "{ref}" exists or remove reference'
                        })
                        
    def generate_report(self):
        """Generate validation report."""
        total_handlers = len(self.handlers)
        total_errors = len(self.errors)
        total_warnings = len(self.warnings)
        total_info = len(self.info)
        
        report = f"""## Handler Validation Report

### Summary
- Total handlers validated: {total_handlers}
- Errors found: {total_errors}
- Warnings found: {total_warnings}
- Info messages: {total_info}

### Critical Errors
"""
        
        if self.errors:
            for error in self.errors:
                report += f"\n- **{error['file']}:{error['line']}** - {error['issue']}\n"
                report += f"  - Fix: {error['fix']}\n"
        else:
            report += "\nNo critical errors found! ✓\n"
            
        report += "\n### Warnings\n"
        
        if self.warnings:
            for warning in self.warnings:
                report += f"\n- **{warning['file']}:{warning['line']}** - {warning['issue']}\n"
                report += f"  - Recommendation: {warning['fix']}\n"
        else:
            report += "\nNo warnings found! ✓\n"
            
        report += "\n### Info/Suggestions\n"
        
        if self.info:
            for info in self.info:
                report += f"\n- **{info['file']}:{info['line']}** - {info['issue']}\n"
                report += f"  - Suggestion: {info['fix']}\n"
        else:
            report += "\nNo additional suggestions.\n"
            
        # Add validation details
        report += "\n### Validation Details\n"
        
        # Group handlers by domain
        by_domain = defaultdict(list)
        for handler_id, handler_info in self.handlers.items():
            domain = handler_info['frontmatter'].get('domain', 'unknown')
            by_domain[domain].append(handler_id)
            
        for domain, handler_ids in sorted(by_domain.items()):
            report += f"\n#### {domain.title()} Domain ({len(handler_ids)} handlers)\n"
            for handler_id in sorted(handler_ids):
                handler = self.handlers[handler_id]
                role = handler['frontmatter'].get('role', 'unknown')
                report += f"- `{handler_id}` ({role}) - {handler['path']}\n"
                
        # Find orphaned handlers
        report += "\n### Dependency Analysis\n"
        
        referenced_handlers = set()
        for handler_id, handler_info in self.handlers.items():
            content = handler_info['content']
            refs = re.findall(r'\[([a-zA-Z0-9-]+)\]', content)
            referenced_handlers.update(refs)
            
        orphaned = set(self.handlers.keys()) - referenced_handlers
        if orphaned:
            report += "\n#### Potentially Orphaned Handlers\n"
            for handler_id in sorted(orphaned):
                report += f"- `{handler_id}` - Not referenced by other handlers\n"
        else:
            report += "\nNo orphaned handlers found.\n"
            
        # Recommended actions
        report += "\n### Recommended Actions\n"
        
        if self.errors:
            report += "\n1. **Fix Critical Errors** (Priority: HIGH)\n"
            for i, error in enumerate(self.errors[:5], 1):
                report += f"   {i}. Fix {error['file']}: {error['issue']}\n"
                
        if self.warnings:
            report += "\n2. **Address Warnings** (Priority: MEDIUM)\n"
            for i, warning in enumerate(self.warnings[:5], 1):
                report += f"   {i}. Update {warning['file']}: {warning['issue']}\n"
                
        if not self.errors and not self.warnings:
            report += "\n1. All handlers are valid! ✓\n"
            report += "2. Consider adding more examples to handlers for better documentation\n"
            report += "3. Review orphaned handlers to ensure they're needed\n"
            
        return report

# Run validation
if __name__ == "__main__":
    handlers_dir = "/home/loucmane/dev/javascript/MomsBlog/blog/.claude/staging/handlers"
    validator = HandlerValidator(handlers_dir)
    report = validator.validate_all()
    
    # Save report
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    output_file = f"/home/loucmane/dev/javascript/MomsBlog/blog/.claude/agent-outputs/handler-validator/validation-report-all-handlers-{timestamp}.md"
    
    with open(output_file, 'w') as f:
        f.write(report)
        
    print(f"Validation complete! Report saved to:\n{output_file}")
    print("\n" + report)
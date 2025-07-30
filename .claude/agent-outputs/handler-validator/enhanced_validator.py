#!/usr/bin/env python3
"""Enhanced handler validation with cross-reference checking."""

import os
import yaml
import re
from pathlib import Path
from datetime import datetime
from collections import defaultdict

class EnhancedHandlerValidator:
    def __init__(self, handlers_dir, templates_dir, project_root):
        self.handlers_dir = Path(handlers_dir)
        self.templates_dir = Path(templates_dir)
        self.project_root = Path(project_root)
        self.errors = []
        self.warnings = []
        self.info = []
        self.handlers = {}
        self.all_handler_ids = set()
        self.registry_references = {}
        
    def validate_all(self):
        """Validate all handlers with enhanced checks."""
        # Load registry references
        self.load_registry_references()
        
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
            
        # Third pass: cross-reference validation
        self.validate_cross_references()
        
        return self.generate_report()
    
    def load_registry_references(self):
        """Load handler references from REGISTRY.md."""
        registry_path = self.templates_dir / "REGISTRY.md"
        if registry_path.exists():
            with open(registry_path, 'r') as f:
                content = f.read()
                
            # Find handler references in registry
            handler_refs = re.findall(r'#### Handler: `([^`]+)`.*?Location: ([^\n]+)', content, re.DOTALL)
            for handler_id, location in handler_refs:
                self.registry_references[handler_id] = location
                
    def validate_handler(self, handler_path):
        """Enhanced validation of a single handler."""
        relative_path = handler_path.relative_to(self.handlers_dir)
        
        try:
            with open(handler_path, 'r') as f:
                content = f.read()
                
            # Basic validation (same as before)
            if not content.startswith('---'):
                self.errors.append({
                    'file': str(relative_path),
                    'line': 1,
                    'issue': 'Missing YAML frontmatter',
                    'fix': 'Add YAML frontmatter with required fields'
                })
                return
                
            yaml_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
            if not yaml_match:
                self.errors.append({
                    'file': str(relative_path),
                    'line': 1,
                    'issue': 'Invalid YAML frontmatter format',
                    'fix': 'Ensure proper --- delimiters'
                })
                return
                
            try:
                frontmatter = yaml.safe_load(yaml_match.group(1))
            except yaml.YAMLError as e:
                self.errors.append({
                    'file': str(relative_path),
                    'line': 1,
                    'issue': f'YAML parsing error: {e}',
                    'fix': 'Fix YAML syntax'
                })
                return
                
            handler_id = frontmatter.get('id', 'unknown')
            self.handlers[handler_id] = {
                'path': str(relative_path),
                'frontmatter': frontmatter,
                'content': content,
                'body': content[len(yaml_match.group(0)):]
            }
            
            # Enhanced validations
            self.validate_frontmatter_enhanced(frontmatter, relative_path)
            self.validate_body_enhanced(content[len(yaml_match.group(0)):], relative_path, frontmatter)
            self.validate_tools_exist(frontmatter.get('tools', []), relative_path)
            self.validate_examples(content[len(yaml_match.group(0)):], relative_path)
            
        except Exception as e:
            self.errors.append({
                'file': str(relative_path),
                'line': 'file',
                'issue': f'Failed to read: {e}',
                'fix': 'Check file permissions'
            })
            
    def validate_frontmatter_enhanced(self, frontmatter, relative_path):
        """Enhanced frontmatter validation."""
        # Check required fields
        required_fields = ['id', 'role', 'domain', 'triggers']
        for field in required_fields:
            if field not in frontmatter:
                self.errors.append({
                    'file': str(relative_path),
                    'line': 'frontmatter',
                    'issue': f'Missing required field: {field}',
                    'fix': f'Add "{field}:" field'
                })
                
        # Validate stability field
        if 'stability' in frontmatter:
            valid_stability = ['stable', 'beta', 'experimental', 'deprecated']
            if frontmatter['stability'] not in valid_stability:
                self.warnings.append({
                    'file': str(relative_path),
                    'line': 'frontmatter',
                    'issue': f'Invalid stability: {frontmatter["stability"]}',
                    'fix': f'Use one of: {", ".join(valid_stability)}'
                })
                
        # Check tools field format
        if 'tools' in frontmatter and not isinstance(frontmatter['tools'], list):
            self.errors.append({
                'file': str(relative_path),
                'line': 'frontmatter',
                'issue': 'Tools must be a list',
                'fix': 'Format as YAML list'
            })
            
    def validate_body_enhanced(self, body, relative_path, frontmatter):
        """Enhanced body validation."""
        # Check for title matching handler name
        if frontmatter.get('name'):
            expected_title = f"# {frontmatter['name']} Handler"
            if expected_title not in body:
                self.warnings.append({
                    'file': str(relative_path),
                    'line': 'body',
                    'issue': f'Title doesn\'t match handler name',
                    'fix': f'Use "{expected_title}" as title'
                })
                
        # Check for Target Pattern section
        if '**Target Pattern**' not in body:
            self.info.append({
                'file': str(relative_path),
                'line': 'body',
                'issue': 'Missing Target Pattern description',
                'fix': 'Add **Target Pattern**: description'
            })
            
        # Validate section structure
        sections = re.findall(r'^## (.+)$', body, re.MULTILINE)
        expected_sections = {
            'trigger': ['Pre-conditions', 'Process', 'Success Criteria', 'Failure Modes', 'Examples'],
            'orchestrator': ['Overview', 'Process', 'Coordination', 'Success Criteria'],
            'operator': ['Operation', 'Process', 'Success Criteria', 'Error Handling']
        }
        
        role = frontmatter.get('role', '')
        if role in expected_sections:
            missing_sections = set(expected_sections[role]) - set(sections)
            for section in missing_sections:
                self.info.append({
                    'file': str(relative_path),
                    'line': 'body',
                    'issue': f'Missing recommended section: {section}',
                    'fix': f'Add ## {section} section'
                })
                
    def validate_tools_exist(self, tools, relative_path):
        """Validate that referenced tools exist."""
        known_tools = [
            'Read', 'Write', 'Edit', 'MultiEdit', 'Bash', 'Grep', 'Glob', 'LS',
            'WebSearch', 'WebFetch', 'TodoWrite', 'Task', 'ExitPlanMode'
        ]
        
        mcp_pattern = re.compile(r'^mcp__[a-zA-Z0-9_]+__[a-zA-Z0-9_]+$')
        
        for tool in tools:
            if tool not in known_tools and not mcp_pattern.match(tool):
                self.warnings.append({
                    'file': str(relative_path),
                    'line': 'tools',
                    'issue': f'Unknown tool: {tool}',
                    'fix': 'Verify tool name is correct'
                })
                
    def validate_examples(self, body, relative_path):
        """Validate examples section."""
        if '## Examples' in body:
            examples_section = body.split('## Examples')[1].split('##')[0]
            example_lines = [line for line in examples_section.split('\n') if line.strip().startswith('-')]
            
            if len(example_lines) < 2:
                self.info.append({
                    'file': str(relative_path),
                    'line': 'Examples',
                    'issue': 'Only one example provided',
                    'fix': 'Add more examples for clarity'
                })
                
            # Check example format
            for line in example_lines:
                if '→' not in line:
                    self.warnings.append({
                        'file': str(relative_path),
                        'line': 'Examples',
                        'issue': 'Example missing arrow format',
                        'fix': 'Use format: "input" → result'
                    })
                    break
                    
    def validate_cross_references(self):
        """Validate cross-references between handlers and registry."""
        # Check registry references
        for handler_id, handler_info in self.handlers.items():
            if handler_id in self.registry_references:
                registry_location = self.registry_references[handler_id]
                # Check if registry points to correct location
                if 'TOOLS.md' in registry_location and handler_info['frontmatter'].get('role') == 'trigger':
                    # This is expected for tool handlers
                    pass
                else:
                    # Check path consistency
                    pass
            else:
                self.warnings.append({
                    'file': handler_info['path'],
                    'line': 'registry',
                    'issue': f'Handler {handler_id} not found in REGISTRY.md',
                    'fix': 'Add handler to REGISTRY.md'
                })
                
        # Check for circular dependencies
        self.check_circular_dependencies()
        
    def check_circular_dependencies(self):
        """Check for circular handler dependencies."""
        dependencies = {}
        
        for handler_id, handler_info in self.handlers.items():
            deps = handler_info['frontmatter'].get('dependencies', [])
            if deps:
                dependencies[handler_id] = deps
                
        # Simple cycle detection
        def has_cycle(node, visited, rec_stack):
            visited.add(node)
            rec_stack.add(node)
            
            for dep in dependencies.get(node, []):
                if dep not in visited:
                    if has_cycle(dep, visited, rec_stack):
                        return True
                elif dep in rec_stack:
                    return True
                    
            rec_stack.remove(node)
            return False
            
        visited = set()
        for handler_id in dependencies:
            if handler_id not in visited:
                if has_cycle(handler_id, visited, set()):
                    self.errors.append({
                        'file': self.handlers[handler_id]['path'],
                        'line': 'dependencies',
                        'issue': f'Circular dependency detected for {handler_id}',
                        'fix': 'Review and break circular dependency chain'
                    })
                    
    def generate_report(self):
        """Generate enhanced validation report."""
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
            for error in sorted(self.errors, key=lambda x: x['file']):
                report += f"\n- **{error['file']}:{error['line']}** - {error['issue']}\n"
                report += f"  - Fix: {error['fix']}\n"
        else:
            report += "\nNo critical errors found! ✓\n"
            
        report += "\n### Warnings\n"
        
        if self.warnings:
            for warning in sorted(self.warnings, key=lambda x: x['file']):
                report += f"\n- **{warning['file']}:{warning['line']}** - {warning['issue']}\n"
                report += f"  - Recommendation: {warning['fix']}\n"
        else:
            report += "\nNo warnings found! ✓\n"
            
        report += "\n### Info/Suggestions\n"
        
        if self.info:
            # Group by type
            by_type = defaultdict(list)
            for info in self.info:
                issue_type = info['issue'].split(':')[0]
                by_type[issue_type].append(info)
                
            for issue_type, items in sorted(by_type.items()):
                report += f"\n#### {issue_type}\n"
                for item in items[:5]:  # Limit to 5 per type
                    report += f"- {item['file']} - {item['issue']}\n"
        else:
            report += "\nNo additional suggestions.\n"
            
        # Handler statistics
        report += "\n### Handler Statistics\n"
        
        by_role = defaultdict(int)
        by_domain = defaultdict(int)
        
        for handler_id, handler_info in self.handlers.items():
            role = handler_info['frontmatter'].get('role', 'unknown')
            domain = handler_info['frontmatter'].get('domain', 'unknown')
            by_role[role] += 1
            by_domain[domain] += 1
            
        report += "\n#### By Role\n"
        for role, count in sorted(by_role.items()):
            report += f"- {role}: {count} handlers\n"
            
        report += "\n#### By Domain\n"
        for domain, count in sorted(by_domain.items()):
            report += f"- {domain}: {count} handlers\n"
            
        # Validation completeness
        report += "\n### Validation Completeness\n"
        
        complete_handlers = []
        incomplete_handlers = []
        
        for handler_id, handler_info in self.handlers.items():
            fm = handler_info['frontmatter']
            body = handler_info['body']
            
            # Check completeness
            has_all_fields = all(field in fm for field in ['id', 'name', 'role', 'domain', 'triggers'])
            has_process = '## Process' in body or '## Execution' in body
            has_examples = '## Examples' in body
            has_criteria = '## Success Criteria' in body
            
            if has_all_fields and has_process and has_examples and has_criteria:
                complete_handlers.append(handler_id)
            else:
                incomplete_handlers.append(handler_id)
                
        report += f"\n- Complete handlers: {len(complete_handlers)}/{total_handlers}\n"
        report += f"- Incomplete handlers: {len(incomplete_handlers)}/{total_handlers}\n"
        
        if incomplete_handlers:
            report += "\n#### Incomplete Handlers\n"
            for handler_id in sorted(incomplete_handlers)[:10]:
                report += f"- `{handler_id}` ({self.handlers[handler_id]['path']})\n"
                
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
                
        if incomplete_handlers:
            report += f"\n3. **Complete Handler Documentation** (Priority: LOW)\n"
            report += f"   - Add missing sections to {len(incomplete_handlers)} handlers\n"
            report += f"   - Focus on Examples and Success Criteria sections\n"
            
        if not self.errors and not self.warnings:
            report += "\n1. All handlers pass validation! ✓\n"
            report += "2. Consider adding connections metadata to handlers\n"
            report += "3. Review handlers not in REGISTRY.md\n"
            report += "4. Add more diverse examples to handlers\n"
            
        return report

# Run enhanced validation
if __name__ == "__main__":
    handlers_dir = "/home/loucmane/dev/javascript/MomsBlog/blog/.claude/staging/handlers"
    templates_dir = "/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates"
    project_root = "/home/loucmane/dev/javascript/MomsBlog/blog"
    
    validator = EnhancedHandlerValidator(handlers_dir, templates_dir, project_root)
    report = validator.validate_all()
    
    # Save report
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    output_file = f"/home/loucmane/dev/javascript/MomsBlog/blog/.claude/agent-outputs/handler-validator/validation-report-enhanced-{timestamp}.md"
    
    with open(output_file, 'w') as f:
        f.write(report)
        
    print(f"Enhanced validation complete! Report saved to:\n{output_file}")
    print("\n" + "="*80 + "\n")
    print(report)
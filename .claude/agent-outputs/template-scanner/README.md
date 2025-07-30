# Template Scanner Output

**Scan Date**: 2025-07-30 12:39:02
**Scanner**: template-scanner agent v1.0.0

## Files Generated

1. **scan-results-20250730-123902.json**
   - Complete dependency data in machine-readable format
   - Handler mappings and references
   - Issue tracking data
   - Statistical analysis

2. **analysis-report-20250730-123902.md**
   - Human-readable analysis report
   - System overview and statistics
   - Key findings and recommendations
   - Health score: 78/100

3. **execution-flows-20250730-123902.md**
   - Visual execution flow diagrams
   - Handler chains and dependencies
   - Decision points and routing logic
   - Entry point mappings

4. **dependency-graph-20250730-123902.md**
   - Complete dependency visualizations
   - Cross-file reference analysis
   - Orphaned handler identification
   - Missing handler tracking

5. **issues-log-20250730-123902.md**
   - Prioritized issue list
   - Missing handlers (6 high-priority)
   - Broken references
   - Improvement opportunities

## Key Findings

### System Statistics
- Total template files: 14
- Total handlers: 69 (63 existing + 6 to add)
- Total patterns: 13
- Total behavioral hooks: 9
- Total templates: 6

### Critical Issues Found
1. **Missing Handlers**: fix-bug, debug-issue, explain-code, code-review, optimize-code, create-docs
2. **Orphaned Handlers**: checkpoint-session, measure-complexity, format-code
3. **Broken References**: Several template/handler confusions
4. **Ambiguous Triggers**: "update X" and "create X" map to multiple handlers

### System Strengths
- Strong ULTRATHINK foundation
- Clear separation of concerns
- Comprehensive trigger coverage
- Good VOID resolution system

### Recommendations
1. Implement missing high-priority handlers
2. Fix broken references in MATRICES.md
3. Add triggers to orphaned handlers
4. Implement disambiguation patterns for overlapping triggers

## Using This Data

### For System Improvement
- Use `issues-log-*.md` to prioritize fixes
- Reference `dependency-graph-*.md` to understand impacts
- Check `scan-results-*.json` for programmatic access

### For Documentation
- Update REGISTRY.md based on findings
- Fix references identified in analysis
- Add missing handlers as identified

### For Validation
- Re-run scan after making changes
- Compare health scores over time
- Track issue resolution progress

---

Template scan complete. Results saved to `.claude/agent-outputs/template-scanner/`
# Documentation Evolution Quick Start Guide

## 🚀 For Phase Leaders

### Your Phase Checklist

#### Phase 1 Leader (Convention Discovery)
```bash
# Day 1: Initial Setup
/infinite-documentation mode=convention output_dir=/docs/evolution/orchestration/phase1-conventions count=1 dry_run=true
# Review output structure, then run for real

# Day 2: Full Discovery  
/infinite-documentation mode=convention output_dir=/docs/evolution/orchestration/phase1-conventions count=5 scope=packages/web analyze_patterns=true

# Day 3: Confidence & Proposals
/infinite-documentation mode=convention output_dir=/docs/evolution/orchestration/phase1-conventions generate_proposals=true confidence_threshold=70
```

**Key Deliverables**:
- [ ] Pattern catalog with confidence scores
- [ ] Convention proposals (prioritized)
- [ ] Context package for Phase 2

#### Phase 2 Leader (Bridge Standards)
```bash
# Day 4-5: Gap Analysis
/infinite-documentation mode=bridge output_dir=/docs/evolution/orchestration/phase2-bridge count=5 context=/docs/evolution/orchestration/phase1-conventions/discovered analyze_gaps=true

# Day 6: Create Examples
/infinite-documentation mode=bridge output_dir=/docs/evolution/orchestration/phase2-bridge generate_examples=true categories=components,themes,performance

# Day 7: Migration Planning
/infinite-documentation mode=bridge output_dir=/docs/evolution/orchestration/phase2-bridge create_migrations=true risk_assessment=true
```

**Key Deliverables**:
- [ ] Gap analysis with reasoning
- [ ] 50+ canonical examples
- [ ] Migration roadmap

#### Phase 3 Leader (Task Guides)
```bash
# Day 8-11: Core Guides
/infinite-documentation mode=task output_dir=/docs/evolution/orchestration/phase3-tasks count=10 integrate_taskmaster=true context=/docs/evolution/orchestration/phase2-bridge/canonical-examples

# Day 12-14: Enhancement
/infinite-documentation mode=task output_dir=/docs/evolution/orchestration/phase3-tasks add_interactive=true add_troubleshooting=true
```

**Key Deliverables**:
- [ ] 20+ task-based guides
- [ ] TaskMaster templates
- [ ] Interactive elements

#### Phase 4 Leader (Network Building)
```bash
# Day 15-18: Build Network
/infinite-documentation mode=network output_dir=/docs/evolution/orchestration/phase4-network analyze_all=true build_links=true

# Day 19-20: Enable Discovery
/infinite-documentation mode=network output_dir=/docs/evolution/orchestration/phase4-network create_search=true visualize=true
```

**Key Deliverables**:
- [ ] Complete link network
- [ ] Search index
- [ ] Documentation graph

## 📋 Daily Standup Template

```markdown
## Documentation Evolution Standup - [DATE]

### Yesterday
- Completed: [specific achievements]
- Discovered: [patterns/insights]
- Documented: [files created/updated]

### Today  
- Focus: [primary goal]
- Target: [specific deliverables]
- Need: [help/resources required]

### Blockers
- [Any impediments]
- [Required decisions]

### Context to Share
- [Discoveries for other phases]
- [Patterns worth noting]
```

## 🔧 Common Commands

### Check Progress
```bash
# See all evolution outputs
ls -la /docs/evolution/orchestration/

# Check specific phase progress
find /docs/evolution/orchestration/phase1-conventions -name "*.md" | wc -l

# View latest discoveries
cat /docs/evolution/orchestration/phase1-conventions/summary-report.md
```

### Run Analyses
```bash
# Preview mode (always start here)
/infinite-documentation mode=[your-mode] output_dir=[your-dir] count=1 dry_run=true

# Production run
/infinite-documentation mode=[your-mode] output_dir=[your-dir] count=5

# With specific scope
/infinite-documentation mode=[your-mode] output_dir=[your-dir] count=5 scope=packages/web/components
```

### Context Sharing
```bash
# Export context for next phase
/infinite-documentation mode=[your-mode] output_dir=[your-dir] export_context=true

# Import context from previous phase  
/infinite-documentation mode=[your-mode] output_dir=[your-dir] context=/path/to/previous/phase
```

## 🎯 Success Metrics Dashboard

### Coverage Tracking
```yaml
baseline:
  files_documented: 2
  total_files: 43
  percentage: 4.65%

targets:
  week_1: 20%
  week_2: 50%
  week_3: 80%
  
track_with: |
  find packages/web -name "*.tsx" -o -name "*.ts" | wc -l
  find docs -name "*.md" | grep -E "(component|api|guide)" | wc -l
```

### Quality Metrics
```yaml
discoverability:
  baseline: 65
  target: 90
  measure: "Average links per doc, search hits"

connectivity:  
  baseline: 35
  target: 85
  measure: "Link density, orphan count"

clarity:
  baseline: 78
  target: 90
  measure: "Readability score, example count"
```

## 🚨 Common Issues & Solutions

### Issue: Command Not Found
```bash
# Solution: Check command location
cat .claude/commands/infinite-documentation.md

# Ensure you're in project root
pwd  # Should show: /home/loucmane/dev/javascript/MomsBlog/blog
```

### Issue: Context Not Loading
```bash
# Solution: Verify context path
ls -la /docs/evolution/orchestration/phase1-conventions/discovered/

# Use absolute paths
context=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution/orchestration/phase1-conventions
```

### Issue: Large Output Files
```bash
# Solution: Use count parameter
/infinite-documentation mode=convention count=1  # Start small
/infinite-documentation mode=convention count=3  # Increase gradually
```

## 📞 Escalation Path

1. **Technical Issues**: DevOps team lead
2. **Content Questions**: Phase 1 leader (conventions expert)
3. **Strategic Decisions**: Project architect
4. **Resource Needs**: Project manager

## 🎉 Celebrating Success

### Daily Wins
- First pattern discovered → Team notification
- Phase completed → Slack announcement  
- Major milestone → Team lunch

### Weekly Victories  
- Coverage target hit → Progress chart update
- Quality improvement → Highlight in standup
- Innovation discovered → Share with wider team

## 🔄 Continuous Improvement

After each phase:
1. Capture lessons learned
2. Update this guide
3. Improve commands
4. Share knowledge

Remember: The goal is not just documentation, but a living system that evolves with the codebase!

---

*Keep this guide handy and update it with your discoveries. Your improvements help the next team!*
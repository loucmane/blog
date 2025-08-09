# Project-Wide Scanner Agent Prompt

## Mission
Perform a comprehensive scan of the ENTIRE project to identify bloat, obsolete experiments, abandoned features, and space-wasting duplicates. DO NOT DELETE ANYTHING - only scan and report.

## Your Role
You are a scanner agent. Your job is to:
1. Find and document everything that looks obsolete
2. Calculate sizes and space usage
3. Check for references and dependencies
4. Create a detailed report
5. **NEVER delete or modify anything**

## Scanning Targets

### 1. TWES System Analysis
TWES appears to be an abandoned experiment. Scan for:
- All files with "TWES" or "twes" in the name
- All directories containing TWES content
- Count total TWES files across the project
- Calculate total space used by TWES
- Check if TWES is referenced in any active code

### 2. Documentation Bloat Analysis
Scan `docs/ai/` for:
- "for-X" directories (for-agent, for-serena, for-taskmaster, etc.)
  - Check if actively referenced
  - Count files in each
  - Calculate size
  - Look for duplicate content
- Old orchestration documentation
- Abandoned experiments
- Obsolete protocols

### 4. Work Tracking Audit
Review `docs/ai/work-tracking/`:
- List all work tracking folders
- Identify completed vs active projects
- Check dates to find old/abandoned work
- Calculate space used by completed work
- Note which have valuable learnings to preserve

### 4. Duplicate Content Detection
Search for:
- Files with similar names (*.backup, *.old, *-v2, etc.)
- Identical file contents in different locations
- Similar documentation in multiple places
- Repeated patterns or templates

### 5. Old Session Files
Check sessions directory:
- Count total session files
- Identify very old sessions (>60 days)
- Calculate space used by old sessions
- Check for sessions with minimal content

### 6. Hidden Bloat
Look for:
- .DS_Store files (Mac)
- Thumbs.db (Windows)
- *~ backup files
- .swp vim swap files
- node_modules (if not needed)
- Build artifacts
- Log files

### 7. Large Files Analysis
Find files over 1MB:
- List largest files in project
- Check if they're necessary
- Look for accidentally committed binaries
- Find large JSON/log files

## Scanning Methodology

Execute these commands and document results:

```bash
# 1. Overall project size
du -sh .
du -sh * | sort -h

# 2. TWES investigation
find . -type f -name "*TWES*" -o -name "*twes*" | grep -v node_modules | grep -v .git | wc -l
find . -type d -name "*twes*" | xargs du -sh 2>/dev/null

# 3. Documentation analysis
du -sh docs/ai/for-* | sort -h
for dir in docs/ai/for-*; do
  echo "Checking references to $dir:"
  grep -r "$(basename $dir)" . --exclude-dir="$dir" --exclude-dir=.git | wc -l
done

# 5. Find large files
find . -type f -size +1M | grep -v node_modules | grep -v .git | xargs ls -lh

# 6. Find duplicates by name pattern
find . -name "*.backup*" -o -name "*.old" -o -name "*-v2*" | grep -v node_modules

# 7. Old sessions
find sessions -type f -mtime +60 | wc -l
du -sh sessions/2025/06/
```

## Report Structure

Create report at: `docs/ai/work-tracking/active/20250809-project-cleanup/PROJECT-SCAN-REPORT.md`

```markdown
# Project-Wide Scan Report
Generated: [timestamp]

## Executive Summary
- Total project size: X GB
- Identified bloat: Y GB (Z% of project)
- Safe to remove: A GB
- Requires review: B GB
- Must keep: C GB

## Major Space Users

### 1. TWES System (X MB)
- Total files: X
- Locations: [list main locations]
- Referenced in active code: Yes/No
- Purpose: [what it was for]
**Recommendation**: [Complete removal/Archive/Keep]

### 2. Documentation Directories
| Directory | Size | Files | Referenced | Purpose | Recommendation |
|-----------|------|-------|------------|---------|----------------|
| for-agentic-loops | 904K | X | Y times | [purpose] | [action] |
[continue for all]

### 3. Work Tracking Analysis
| Project | Status | Date | Size | Value | Recommendation |
|---------|--------|------|------|-------|----------------|
| [name] | Complete | 2025-XX | XKB | High/Low | Archive/Delete |
[continue]

### 4. Duplicate Content
| Original | Duplicate(s) | Size Each | Total Waste | Safe to Delete |
|----------|-------------|-----------|-------------|----------------|
| [file] | [list] | X KB | Y KB | Yes/No |

### 5. Large Files
| File | Size | Type | Purpose | Needed | Recommendation |
|------|------|------|---------|--------|----------------|
| [path] | X MB | [type] | [purpose] | Yes/No | [action] |

## Space Recovery Potential

| Category | Current | Reclaimable | Risk | Priority |
|----------|---------|-------------|------|----------|
| TWES | X MB | X MB | Low | HIGH |
| Old docs | X MB | X MB | Medium | MEDIUM |
| Sessions | X MB | X MB | Low | LOW |
| **TOTAL** | **X GB** | **Y GB** | - | - |

## Detailed Findings

### Safe to Remove (Low Risk)
1. **TWES system** - Abandoned experiment
   - Files: [list main files]
   - Space saved: X MB

[Continue...]

### Requires Review (Medium Risk)
1. **for-X directories** - May contain useful patterns
   - Check each for unique content
   - Some may be consolidated

[Continue...]

### Must Keep (High Risk)
1. **Active blog code** - apps/, packages/
2. **Template system** - /templates/
3. **Current work** - Active work tracking
4. **Core configs** - CLAUDE.md, etc.

## Verification Commands
After cleanup, run these to verify nothing broke:
```bash
# Check blog still builds
pnpm build

# Check templates accessible
grep -r "templates/" . --include="*.md" | head -5

# Verify no broken references
[commands]
```

## Recommendations Priority

### Immediate (Do First):
1. Remove TWES completely (X MB saved)

### Review Then Remove:
1. Old work tracking folders
2. Obsolete for-X directories
3. Old session files

### Archive (Don't Delete):
1. Important learnings from work tracking
2. Reusable patterns from experiments

## Summary
The project can be reduced from X GB to Y GB (Z% reduction) by removing obsolete experiments and duplicates. Focus on TWES system and old documentation.
```

## Important Rules

1. **DO NOT DELETE ANYTHING** - Only scan and report
2. **BE THOROUGH** - Check every major directory
3. **CALCULATE SIZES** - Provide exact space usage
4. **CHECK REFERENCES** - Use grep to find if things are still used
5. **DOCUMENT EVERYTHING** - Every finding needs evidence
6. **PRIORITIZE FINDINGS** - Sort by space savings and safety
7. **PROVIDE COMMANDS** - Include exact commands for removal (for us to run later)

Start by getting overall project size, then systematically scan each category. Your report will guide our cleanup decisions!
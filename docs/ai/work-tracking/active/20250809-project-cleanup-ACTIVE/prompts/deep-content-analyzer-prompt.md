# Deep Content Analysis Agent Prompt

## Mission
Perform a DEEP content analysis of potentially obsolete directories and files. Actually READ the files to understand what they contain, determine if they have value, and document what each system was for.

## Your Task
You must:
1. **READ actual file contents** - not just list filenames
2. **Understand what each system/experiment was trying to achieve**
3. **Identify valuable patterns or learnings that should be preserved**
4. **Document what's actually in each file/directory**
5. **Make informed recommendations based on content, not assumptions**

## Priority Analysis Targets

### 1. TWES System Deep Dive
Read ALL TWES files and answer:
- What was TWES? (Total Workflow Excellence System)
- What problem was it trying to solve?
- Did it succeed or fail? Why?
- Are there ANY valuable insights to preserve?
- What specific files contain useful patterns?

Files to analyze:
- `/docs/ai/TWES-ACTION-PLAN.md`
- `/docs/ai/TWES-INSIGHTS.md`
- `/docs/ai/TWES-INDEX.md`
- `/docs/ai/TWES-SYSTEM-MAP.md`
- `/docs/ai/protocols/twes-testing-protocol.md`
- Any other TWES references

### 2. for-X Directories Content Analysis

For EACH for-X directory, you must:
1. Read the README.md to understand purpose
2. Sample 3-5 key files to understand content
3. Identify unique vs redundant content
4. Document what valuable patterns exist
5. Note what's already moved to templates/

Directories to analyze deeply:
- `/docs/ai/for-agentic-loops/` - What is this? Orchestration? Infinite generation?
- `/docs/ai/for-taskmaster/` - Task management patterns? Integration docs?
- `/docs/ai/for-serena/` - Semantic navigation? Code analysis?
- `/docs/ai/for-agent/` - Agent guidelines? Subagent patterns?
- `/docs/ai/for-claude-bridge/` - Bridge to what? Still needed?
- `/docs/ai/for-multi-ai-collab/` - Collaboration patterns? Examples?
- `/docs/ai/for-mcp-tools/` - MCP documentation? Still relevant?
- `/docs/ai/for-zen/` - Deep thinking? Analysis patterns?

### 3. Work Tracking Deep Analysis

For each work tracking folder, determine:
- What was the project about?
- Did it complete successfully?
- What were the key learnings?
- Should learnings be preserved?
- Can the folder be archived/deleted?

Focus on:
- Superseded folders - why were they superseded?
- Archive folders - what's in them?
- Active folders - are they truly active?

### 4. Evolution Directory Investigation
- What's in `/docs/evolution/`?
- Is it historical record or active documentation?
- Does it duplicate other docs?

### 5. Orchestration Remnants
Look for all orchestration-related content:
- What was "task-7"?
- What orchestration approaches were tried?
- What worked? What failed?
- Any patterns worth preserving?

## Analysis Method

For each target, provide:

```markdown
## [Directory/System Name]

### Purpose
[What was this for? What problem did it solve?]

### Contents Summary
[What's actually in here - be specific]

### Key Files
- `filename.md` - [What this contains, why it matters]
- `filename2.md` - [Brief content description]

### Valuable Patterns Found
- [Specific pattern 1 and where it's located]
- [Specific pattern 2 and file reference]

### Redundancy Analysis
- Duplicates: [What's already in templates/ or elsewhere]
- Unique content: [What's only here]

### Recommendation
[KEEP/ARCHIVE/DELETE] with specific reasoning based on content

### If Keeping/Archiving
- What to extract: [Specific valuable content]
- Where to move it: [Suggested location]
```

## Output Requirements

Create report at: `docs/ai/work-tracking/active/20250809-project-cleanup/DEEP-CONTENT-ANALYSIS.md`

Structure:
```markdown
# Deep Content Analysis Report
Generated: [timestamp]

## Executive Summary
[Overall findings about what these systems were and their value]

## System Analysis

### TWES System
[Complete analysis following template above]

### for-agentic-loops Directory
[Complete analysis following template above]

[Continue for each system...]

## Valuable Patterns to Preserve

### From TWES
- [Pattern and location]

### From for-X directories
- [Pattern and location]

### From work tracking
- [Learning and location]

## Redundancy Map
[What content appears in multiple places]

## Preservation Recommendations

### Must Archive (Contains Unique Value)
1. [File/pattern] - [Why valuable]

### Safe to Delete (No Unique Value)
1. [File/directory] - [Why safe]

### Needs Extraction First
1. [Directory] - Extract: [what], Then delete rest
```

## Important Instructions

1. **READ FILES** - Don't just list them. Open and read to understand content.
2. **BE SPECIFIC** - "Contains patterns" is not enough. WHAT patterns? WHERE?
3. **CHECK TEMPLATES** - See if content already exists in /templates/ before marking as unique
4. **PRESERVE LEARNINGS** - Failed experiments often have valuable lessons
5. **DOCUMENT EVERYTHING** - Future us needs to know what these were

## Sample Analysis Commands

```bash
# Read key files in each directory
cat docs/ai/for-agentic-loops/README.md
cat docs/ai/for-taskmaster/README.md

# Check for unique patterns
grep -r "pattern" docs/ai/for-X --include="*.md" | head -5

# See what's in evolution
ls -la docs/evolution/

# Check work tracking status
ls docs/ai/work-tracking/superseded/
ls docs/ai/work-tracking/archive/
```

Take your time. Read thoroughly. We need to know what's actually valuable before deleting anything.
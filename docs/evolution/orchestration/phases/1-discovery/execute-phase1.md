# Execute Phase 1: Convention Discovery

## Prerequisites Check
- ✅ Context package created: `context-package.json`
- ✅ Output directories ready: `outputs/1-discovery/`
- ✅ Metrics tracking initialized
- ✅ Dashboard configured

## Execution Command

Run this command to start Phase 1:

```bash
/infinite-documentation mode=convention output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution/orchestration/outputs/1-discovery count=1
```

## What Will Happen

1. **Scan Codebase**
   - Analyze files in: `packages/web/src`, `packages/ui/src`, `packages/shared/src`, `packages/backend/src`
   - Look for patterns in: components, styles, configs, tests

2. **Discover Conventions**
   - File naming patterns
   - Component structure patterns
   - Import/export conventions
   - Testing strategies

3. **Calculate Confidence**
   - Frequency analysis (40% weight)
   - Consistency scoring (30% weight)
   - Recency factor (20% weight)
   - Authoritative sources (10% weight)

4. **Generate Outputs**
   - `discovered-conventions.json` - All found conventions with confidence scores
   - `pattern-analysis.json` - Detailed pattern breakdown
   - `discovery-metrics.json` - Execution metrics
   - `discovery-context.json` - Context for next phase

## Expected Results

### discovered-conventions.json
```json
{
  "conventions": [
    {
      "name": "Component File Naming",
      "category": "file-structure",
      "pattern": "PascalCase.tsx",
      "confidence": 95,
      "occurrences": 42,
      "examples": ["Button.tsx", "Header.tsx"],
      "violations": ["header-old.jsx"]
    }
  ]
}
```

### pattern-analysis.json
```json
{
  "fileStructure": {
    "components": "feature-based",
    "tests": "co-located",
    "styles": "module-css"
  },
  "namingPatterns": {
    "components": "PascalCase",
    "hooks": "useCamelCase",
    "utils": "camelCase"
  }
}
```

## Next Steps

After Phase 1 completes:
1. Review outputs in `outputs/1-discovery/`
2. Check dashboard for metrics
3. Proceed to Phase 2: Knowledge Synthesis

## Manual Verification

```bash
# Check outputs
ls -la docs/evolution/orchestration/outputs/1-discovery/

# View conventions
cat docs/evolution/orchestration/outputs/1-discovery/discovered-conventions.json | jq '.conventions[] | select(.confidence > 80)'

# Check metrics
cat docs/evolution/orchestration/metrics/tracking-system.json | jq '.phaseMetrics."1-discovery"'
```
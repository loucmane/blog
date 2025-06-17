# Documentation Evolution Orchestration Guide

## 🎯 Overview

The Documentation Evolution system uses a 5-phase orchestrated approach to continuously improve documentation quality. This guide explains how to coordinate and execute the evolution process.

## 🏗️ Infrastructure Overview

```
orchestration/
├── context/                 # Shared context and state
│   ├── context-manifest.json      # Master phase tracking
│   ├── transitions/               # Phase handoff tracking
│   └── accumulation/              # Knowledge accumulation
├── phases/                  # Phase-specific configurations
│   ├── 1-discovery/              # Convention discovery
│   ├── 2-synthesis/              # Knowledge synthesis
│   ├── 3-documentation/          # Document generation
│   ├── 4-validation/             # Quality validation
│   └── 5-integration/            # Integration & deployment
├── outputs/                 # Phase execution outputs
├── metrics/                 # Performance and quality metrics
└── dashboard/              # Coordination dashboard
```

## 📋 Phase Execution Flow

### Phase 1: Convention Discovery
**Purpose**: Analyze codebase to discover patterns and conventions

**Execute**:
```bash
/infinite-documentation mode=convention output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution/orchestration/outputs/1-discovery count=1
```

**Outputs**:
- `discovered-conventions.json` - Conventions with confidence scores
- `pattern-analysis.json` - Detailed pattern breakdown
- `discovery-context.json` - Context for next phase

### Phase 2: Knowledge Synthesis
**Purpose**: Synthesize discoveries into actionable knowledge

**Execute**:
```bash
/infinite-documentation mode=synthesis output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution/orchestration/outputs/2-synthesis count=1
```

**Inputs**: Phase 1 outputs
**Outputs**:
- `synthesized-knowledge.json` - Organized knowledge base
- `relationship-map.json` - Component relationships
- `synthesis-context.json` - Enhanced context

### Phase 3: Document Generation
**Purpose**: Generate comprehensive documentation

**Execute**:
```bash
/infinite-documentation mode=documentation output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution/orchestration/outputs/3-documentation count=1
```

**Inputs**: Phase 2 outputs
**Outputs**:
- `generated-docs/` - New documentation files
- `doc-structure.json` - Documentation organization
- `documentation-context.json` - Generation metadata

### Phase 4: Quality Validation
**Purpose**: Validate and improve documentation quality

**Execute**:
```bash
/infinite-documentation mode=validation output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution/orchestration/outputs/4-validation count=1
```

**Inputs**: Phase 3 outputs
**Outputs**:
- `validation-report.json` - Quality assessment
- `correction-suggestions.json` - Improvement suggestions
- `validation-context.json` - Validation metadata

### Phase 5: Integration & Deployment
**Purpose**: Integrate validated docs into project

**Execute**:
```bash
/infinite-documentation mode=integration output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution/orchestration/outputs/5-integration count=1
```

**Inputs**: Phase 4 outputs
**Outputs**:
- `integration-manifest.json` - Integration summary
- `deployment-log.json` - Deployment details
- Updated project documentation

## 🚀 Quick Start Commands

### Run All Phases (Orchestrated)
```bash
/infinite-documentation mode=orchestrated output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution count=1
```

### Run All Phases (Parallel)
```bash
/infinite-documentation mode=all output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution count=3
```

### Dry Run (Preview Only)
```bash
/infinite-documentation mode=orchestrated output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution count=1 dry_run=true
```

## 📊 Monitoring Progress

### Check Current Status
```bash
# View phase status
cat docs/evolution/orchestration/context/context-manifest.json | jq '.phases'

# Check metrics
cat docs/evolution/orchestration/metrics/tracking-system.json | jq '.globalMetrics'

# View dashboard
cat docs/evolution/orchestration/dashboard/README.md
```

### Track Context Flow
```bash
# View transitions
cat docs/evolution/orchestration/context/transitions/phase-transitions.json

# Check knowledge accumulation
cat docs/evolution/orchestration/context/accumulation/knowledge-base.json | jq '.metadata'
```

## 🔄 Context Sharing Protocol

Each phase:
1. **Reads** context from previous phases
2. **Processes** information according to its objectives
3. **Writes** enhanced context for next phases
4. **Updates** metrics and dashboard

### Context Flow Example
```
Discovery → conventions.json → Synthesis
         → patterns.json    ↗
                           ↓
Documentation ← knowledge.json ← 
             ← relationships.json
```

## 🎯 Quality Gates

Each phase must meet quality criteria before proceeding:

- **Phase 1**: `conventionsFound > 0`
- **Phase 2**: `synthesisComplete == true`
- **Phase 3**: `documentsGenerated > 0`
- **Phase 4**: `qualityScore >= 0.8`
- **Phase 5**: `integrationComplete == true`

## 🛠️ Troubleshooting

### Phase Failure
```bash
# Check specific phase status
cat docs/evolution/orchestration/context/context-manifest.json | jq '.phases."1-discovery"'

# View error logs
cat docs/evolution/orchestration/outputs/1-discovery/error.log
```

### Reset Phase
```bash
# Reset specific phase
echo '{"status": "pending", "metrics": {}}' | jq -s '.[0] * .[1]' docs/evolution/orchestration/context/context-manifest.json - > temp.json && mv temp.json docs/evolution/orchestration/context/context-manifest.json
```

## 📈 Success Metrics

- **Coverage**: % of codebase with documentation
- **Quality**: Average quality score across all docs
- **Consistency**: Convention adherence rate
- **Connectivity**: % of orphaned documents

## 🔗 Related Documentation

- [Evolution How-To](../../ai/for-agentic-loops/documentation-evolution-howto.md)
- [Implementation Plan](../../ai/for-agentic-loops/documentation-evolution-implementation-plan.md)
- [Phase 1 Execution Guide](phases/1-discovery/execute-phase1.md)
- [Dashboard](dashboard/README.md)
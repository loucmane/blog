# Template Refinement Implementation Plan

## Overview
Refine and improve the Claude template system based on discoveries from ULTRATHINK testing and anchor audit.

## Goals
1. Broaden overly-specific handlers (like create-component)
2. Add truly missing handlers where gaps exist
3. Remove/consolidate redundant handlers
4. Ensure REGISTRY accurately reflects reality
5. Improve handler discoverability and usability

## Implementation Steps

### Phase 1: Handler Analysis
- [ ] Review all strikethrough handlers in REGISTRY
- [ ] Categorize: Remove vs Add vs Consolidate
- [ ] Document rationale for each decision

### Phase 2: Broaden create-component
- [ ] Design new broader handler (create-artifact? create-module?)
- [ ] Update handler to cover all code creation scenarios
- [ ] Update examples to show breadth

### Phase 3: Add Missing Git Handlers
- [ ] Determine if create-pull-request is needed
- [ ] Consider tag-release handler value
- [ ] Ensure gac convention is properly documented

### Phase 4: Handler Consolidation
- [ ] Remove truly redundant handlers
- [ ] Update references throughout templates
- [ ] Ensure no broken links remain

### Phase 5: Testing & Validation
- [ ] Test ULTRATHINK format with refined handlers
- [ ] Verify all anchors work correctly
- [ ] Update REGISTRY statistics

## Success Criteria
- No more strikethrough entries in REGISTRY
- All handlers have clear, distinct purposes
- Improved discoverability through better naming
- ULTRATHINK format finds handlers reliably
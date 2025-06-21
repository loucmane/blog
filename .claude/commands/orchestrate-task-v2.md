**ORCHESTRATE TASK V2 - WITH DIRECT WORKTREE DEPLOYMENT**

Deploy a sophisticated multi-agent orchestration system that can write implementations directly to git worktrees for immediate testing.

**CRITICAL: This command uses the Task tool extensively to deploy multiple agents**
- Master Orchestrator deploys 5 Specialist Orchestrators using Task tool
- Each Specialist deploys 3-4 Sub-Agents using Task tool
- Total: ~25 agents working in a coordinated hierarchy

**Variables:**
- task_id: $ARGUMENTS
- specialists: $ARGUMENTS (default: "all")
- depth: $ARGUMENTS (default: 3)
- synthesis_strategy: $ARGUMENTS (default: "best-of-breed")
- deployment_mode: $ARGUMENTS (optional: "central" | "worktree", default: "central")
- worktree_prefix: $ARGUMENTS (required if deployment_mode="worktree")
- target_path: $ARGUMENTS (default: "packages/web/src/components")

**PHASE 0: DEPLOYMENT MODE DETECTION**

Parse deployment_mode:
- If "central" (default): Use original behavior (.taskmaster/infinite/orchestrated/)
- If "worktree": Deploy directly to worktrees

If deployment_mode="worktree":
1. Verify worktrees exist:
```bash
WORKTREE_COUNT=$(git worktree list | grep -c "${worktree_prefix}")
if [ $WORKTREE_COUNT -eq 0 ]; then
  echo "ERROR: No worktrees found with prefix '${worktree_prefix}'"
  echo "Run first: /init-parallel feature-name=${worktree_prefix} number-of-parallel-worktrees=6"
  exit 1
fi
```

2. Map specialists to worktrees:
```yaml
deployment_map:
  worktree_1: performance      # Best performance implementation
  worktree_2: architecture     # Best architecture implementation
  worktree_3: ux_dx           # Best UX/DX implementation
  worktree_4: accessibility   # Best accessibility implementation
  worktree_5: innovation      # Best innovation implementation
  worktree_6: synthesis       # Final synthesized version
```

**PHASE 1: MASTER ORCHESTRATOR INITIALIZATION**

You are the Master Orchestrator for TaskMaster Infinite Orchestrated System V2.

**1.1 Parse Arguments**
Extract all variables including deployment_mode and worktree_prefix.

**1.2 Task Analysis**
[Same as original - analyze task, load TWES, etc.]

**1.3 Deployment Strategy**

If deployment_mode="worktree":
```yaml
orchestration_plan:
  deployment_mode: worktree
  worktree_mapping:
    performance:
      worktree: ".worktrees/${worktree_prefix}-1"
      path: "${target_path}"
      port: 3001
    architecture:
      worktree: ".worktrees/${worktree_prefix}-2"
      path: "${target_path}"
      port: 3002
    ux_dx:
      worktree: ".worktrees/${worktree_prefix}-3"
      path: "${target_path}"
      port: 3003
    accessibility:
      worktree: ".worktrees/${worktree_prefix}-4"
      path: "${target_path}"
      port: 3004
    innovation:
      worktree: ".worktrees/${worktree_prefix}-5"
      path: "${target_path}"
      port: 3005
    synthesis:
      worktree: ".worktrees/${worktree_prefix}-6"
      path: "${target_path}"
      port: 3006
```

**PHASE 2: SPECIALIST ORCHESTRATOR DEPLOYMENT**

**2.1 Deploy Performance Specialist Orchestrator**

TASK: Performance Specialist Orchestrator for Task [ID] with Worktree Deployment

You are the Performance Specialist Orchestrator. 

Your deployment target:
- Mode: ${deployment_mode}
- If worktree mode:
  - Target: .worktrees/${worktree_prefix}-1/${target_path}
  - Port: 3001
  - You will select your BEST implementation to deploy here

Your mission:
1. Deploy ${depth} sub-agents for different performance optimizations
2. Each sub-agent writes to a temporary location first:
   - .taskmaster/infinite/orchestrated/task-${task_id}/specialists/performance/{agent-name}/
3. After all complete, evaluate and select the BEST one
4. If deployment_mode="worktree":
   - Copy ONLY the best implementation to the worktree
   - Ensure all imports are correct for the target location
   - Add a comment header: /* Performance-Optimized Implementation */

Deploy sub-agents:
- Bundle Optimizer (focus: minimal bundle size)
- Runtime Optimizer (focus: execution speed)
- Memory Optimizer (focus: memory efficiency)

**IMPORTANT FOR WORKTREE MODE**:
- Only ONE implementation goes to the worktree (the best one)
- Must be a complete, working implementation
- Must integrate with existing project structure
- Include all necessary imports and exports

[Similar updates for all other specialists...]

**PHASE 3: EVALUATION WITH WORKTREE AWARENESS**

The Evaluation Orchestrator now considers deployment targets:

If deployment_mode="worktree":
1. Each specialist has already deployed their best to their worktree
2. Create evaluation report showing:
   - Which implementation each specialist chose for their worktree
   - Why it was selected as the best
   - What trade-offs were made

**PHASE 4: SYNTHESIS WITH DIRECT DEPLOYMENT**

TASK: Synthesis Orchestrator for Task [ID] with Worktree Deployment

If deployment_mode="worktree":
- Your target: .worktrees/${worktree_prefix}-6/${target_path}
- Port: 3006

Your mission:
1. Read the best implementations from ALL worktrees:
   - .worktrees/${worktree_prefix}-1/${target_path} (Performance best)
   - .worktrees/${worktree_prefix}-2/${target_path} (Architecture best)
   - .worktrees/${worktree_prefix}-3/${target_path} (UX/DX best)
   - .worktrees/${worktree_prefix}-4/${target_path} (Accessibility best)
   - .worktrees/${worktree_prefix}-5/${target_path} (Innovation best)

2. Synthesize the best combined implementation

3. Deploy directly to worktree 6

4. Add synthesis metadata comment:
```typescript
/**
 * Synthesized Implementation - Best of All Worlds
 * 
 * Combines:
 * - Performance: Bundle optimization from worktree-1
 * - Architecture: Pattern implementation from worktree-2
 * - UX/DX: API design from worktree-3
 * - Accessibility: ARIA implementation from worktree-4
 * - Innovation: Modern features from worktree-5
 * 
 * Synthesis Strategy: ${synthesis_strategy}
 */
```

**PHASE 5: FINAL REPORTING**

Generate comprehensive report:

```markdown
# Orchestration Complete - Task ${task_id}

## Deployment Mode: ${deployment_mode}

### Worktree Deployments:
- Port 3001 (.worktrees/${worktree_prefix}-1): Performance Champion - ${perf_implementation}
- Port 3002 (.worktrees/${worktree_prefix}-2): Architecture Champion - ${arch_implementation}
- Port 3003 (.worktrees/${worktree_prefix}-3): UX/DX Champion - ${ux_implementation}
- Port 3004 (.worktrees/${worktree_prefix}-4): Accessibility Champion - ${a11y_implementation}
- Port 3005 (.worktrees/${worktree_prefix}-5): Innovation Champion - ${innovation_implementation}
- Port 3006 (.worktrees/${worktree_prefix}-6): Synthesized Best - Combination of all

### Quick Start:
\`\`\`bash
# All implementations are already in place!
# Start all dev servers:
pnpm worktree:dev:tmux

# Or start individually:
cd .worktrees/${worktree_prefix}-1 && pnpm dev  # Performance version
cd .worktrees/${worktree_prefix}-2 && pnpm dev  # Architecture version
# etc...
\`\`\`

### What to Test:
1. Compare performance metrics between ports 3001-3005
2. Check if synthesis (3006) truly combines the best features
3. Test accessibility on port 3004 vs synthesis on 3006
4. Verify all implementations work correctly
```

**PHASE 6: TEST AUTOMATION**

If deployment_mode="worktree", automatically create test pages:

```bash
for i in {1..6}; do
  cat > .worktrees/${worktree_prefix}-${i}/packages/web/src/app/test-orchestrated/page.tsx << 'EOF'
export default function TestOrchestrated() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">Orchestrated Implementation Test</h1>
      <p className="text-lg text-gray-600 mb-8">
        Testing Task ${task_id} - Worktree ${i}
      </p>
      {/* Your components will render here */}
    </div>
  )
}
EOF
done
```

**USAGE EXAMPLES:**

**Traditional central mode (original behavior):**
```bash
/orchestrate-task-v2 task_id=7 specialists=all depth=3
```

**New worktree deployment mode:**
```bash
# First create worktrees
/init-parallel feature-name=task-7-test number-of-parallel-worktrees=6

# Then orchestrate directly into them!
/orchestrate-task-v2 task_id=7 specialists=all depth=3 deployment_mode=worktree worktree_prefix=task-7-test

# Start all servers immediately - no copying needed!
pnpm worktree:dev:tmux
```

**Partial specialist deployment:**
```bash
# Only 3 worktrees for 3 specialists
/init-parallel feature-name=quick-test number-of-parallel-worktrees=3

# Deploy only specific specialists
/orchestrate-task-v2 task_id=7 specialists=performance,architecture,ux_dx depth=2 \
  deployment_mode=worktree worktree_prefix=quick-test
```

**BENEFITS OF V2:**

1. **Zero Copy Steps**: Implementations go directly to worktrees
2. **Immediate Testing**: As soon as orchestration completes, servers can start
3. **Clean Separation**: Each worktree gets exactly one "best" implementation
4. **Synthesis Aware**: Worktree 6 reads from other worktrees to synthesize
5. **Test Pages Included**: Automatic test page generation

**ERROR HANDLING:**

If worktrees don't exist:
```
ERROR: No worktrees found with prefix 'task-7-test'
Please run: /init-parallel feature-name=task-7-test number-of-parallel-worktrees=6
```

If wrong number of worktrees:
```
ERROR: Found 3 worktrees but 6 specialists requested (including synthesis)
Either create more worktrees or use fewer specialists
```

**ORCHESTRATION COMPLETE**

The V2 system now supports direct worktree deployment, eliminating manual copy steps and enabling immediate testing of all implementations!
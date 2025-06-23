# Fix Orchestrate-and-Test Command Plan

## Problem Identified
The `/orchestrate-and-test` command doesn't execute because it's structured like a bash script instead of following the pattern of working commands like `/infinite` and `/infinite-documentation`.

## Key Differences

### Working Commands Pattern (infinite.md, infinite-documentation.md):
- Start with conceptual phases ("Think deeply about...")
- Describe WHAT to do, not HOW
- Say "Deploy agents using Task tool" without showing bash code
- Let Claude figure out implementation details
- Focus on outcomes and objectives

### Failing Command Pattern (orchestrate-and-test.md):
- Starts with "EXECUTION STARTS NOW - Run these bash commands"
- Shows actual bash code blocks
- Mixes bash scripts with agent deployment
- Tries to be both documentation AND executable script
- Too prescriptive about implementation

## Migration Strategy

### 1. Remove Bash Code Blocks
- Keep the bash logic but describe it conceptually
- Instead of showing bash scripts, describe what needs to happen
- Example: "Check git status and warn if uncommitted changes" instead of showing the actual git command

### 2. Convert to Descriptive Phases
- Change "Run this bash code" to "Prepare the environment by..."
- Focus on objectives: "Create orchestration output directory with proper structure"
- Let Claude implement the details

### 3. Simplify Agent Deployment Instructions
- Remove the complex prompt formatting
- Just say "Deploy Pre-Analysis Agent using Task tool to generate contracts"
- Describe what each agent should accomplish, not exact prompts

### 4. Keep All Features
- Real-time Monitoring: "Log all agent deployments with timestamps to orchestration.log"
- Progressive Summarization: "Deploy summarization agents to create 500-word summaries"
- Contract Generation: "Generate implementation contracts before any coding"
- All other Phase 1 improvements stay

## What to Keep
- All the phases and logic
- The agent descriptions and purposes
- The output directory structure
- The monitoring capabilities
- The error handling concepts

## What to Change
- Remove bash code blocks
- Convert to descriptive instructions
- Simplify agent deployment sections
- Focus on outcomes over implementation
- Make it read like infinite.md pattern

## Next Session Tasks
1. Read this plan
2. Open orchestrate-and-test.md
3. Systematically convert each section following this pattern
4. Test the converted command
5. Document results
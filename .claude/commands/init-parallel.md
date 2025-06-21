# Initialize parallel git worktree directories

## Variables
FEATURE_NAME: $ARGUMENTS
NUMBER_OF_PARALLEL_WORKTREES: $ARGUMENTS

## Execute these commands
> Execute the loop in parallel with the Batch and Task tool

- create a new dir `.worktrees/`
- for i in NUMBER_OF_PARALLEL_WORKTREES
  - RUN `git worktree add -b ${FEATURE_NAME}-${i} ./.worktrees/${FEATURE_NAME}-${i}`
  - RUN `cd ./.worktrees/${FEATURE_NAME}-${i}`, `pnpm install`
  - UPDATE `./.worktrees/${FEATURE_NAME}-${i}/packages/web/.env.local`: 
    - Create if doesn't exist
    - Add `PORT=300${i}` (3001, 3002, 3003, etc.)
  - UPDATE `./.worktrees/${FEATURE_NAME}-${i}/packages/web/package.json` scripts:
    - `"dev": "next dev -p 300${i}",`
  - RUN `cat ./.worktrees/${FEATURE_NAME}-${i}/packages/web/package.json | grep "dev"` to verify the port is set correctly
  - RUN `cd .worktrees/${FEATURE_NAME}-${i}`, `git ls-files | head -20` to validate
- RUN `git worktree list` to verify all trees were created properly
- PRINT summary:
  ```
  Created ${NUMBER_OF_PARALLEL_WORKTREES} worktrees:
  - Branch names: ${FEATURE_NAME}-1 through ${FEATURE_NAME}-${NUMBER_OF_PARALLEL_WORKTREES}
  - Directories: .worktrees/${FEATURE_NAME}-1 through .worktrees/${FEATURE_NAME}-${NUMBER_OF_PARALLEL_WORKTREES}
  - Dev ports: 3001 through 300${NUMBER_OF_PARALLEL_WORKTREES}
  
  To start a worktree dev server:
  cd .worktrees/${FEATURE_NAME}-1 && pnpm dev
  ```
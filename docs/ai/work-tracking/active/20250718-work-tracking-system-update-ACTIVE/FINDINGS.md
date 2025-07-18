# Findings

## Key Discoveries

### Role Confusion in Original System
- **Finding**: implementation.md was doing double duty (plan + results)
- **Impact**: Unclear what was planned vs what was done
- **Solution**: Separate IMPLEMENTATION (plan) from CHANGELOG (results)

### Need for Code Tracking
- **Finding**: No dedicated place to track code attempts
- **Evidence**: Lost track of what failed/succeeded
- **Solution**: Added code/ subfolder for iterations

### ALL CAPS Improves Visibility
- **Finding**: Core files get lost among subfolders
- **Evidence**: Hard to distinguish important files
- **Solution**: ALL CAPS for 7 core files

### 7 Files Not Too Many
- **Finding**: Each file has clear, single purpose
- **Evidence**: No overlap or confusion
- **Impact**: Better organization despite more files

## Patterns
- Work naturally flows: Plan → Track → Build → Learn
- Checkboxes better than narrative for task tracking
- Code attempts need version tracking
- Clear separation prevents confusion
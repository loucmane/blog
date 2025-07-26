# PATTERNS.md Work Context Update

## Update execute-ultrathink Handler

In the W determination section, expand the logic:

```markdown
3. Determine W (Work context):
   - Analyze request type and domain
   - Check active work folders
   - Apply W context rules:
     - Direct folder match → W = folder-name
     - Layer 2.5 Work Activities:
       * Planning keywords → W = "planning"
       * Documentation keywords → W = "documenting"
       * Discussion keywords → W = "discussing"
       * Review keywords → W = "reviewing"
       * Analysis keywords → W = "investigating"
     - Search/investigation → W = "investigating"
     - Bug/problem solving → W = "debugging"
     - Implementation/coding → W = "implementing"
     - No match → W = VOID→workflows
```

## Add Work Context Examples

```markdown
**Examples**:
- "Let's discuss the architecture" → [S:20250726|W:discussing|H:work-activity]
- "Plan the authentication feature" → [S:20250726|W:planning|H:work-activity]
- "Document the API endpoints" → [S:20250726|W:documenting|H:create-docs]
- "Review our progress" → [S:20250726|W:reviewing|H:check-progress]
- "Walk through the implementation" → [S:20250726|W:reviewing|H:explain-code]
```

This creates clear mappings from user language to appropriate W contexts!
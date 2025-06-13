# Zen MCP Server Toolkit Guide

## Overview

The Zen MCP (Model Context Protocol) Server is an advanced AI development platform that enables collaborative intelligence across multiple AI models. It orchestrates different AI models like Claude, Gemini, O3, and others to work together seamlessly.

## Core Features

- **Multi-model collaboration**: Seamlessly combine insights from different AI models
- **Automatic model selection**: Intelligently chooses the best model for each task
- **Extended context and reasoning**: Support for up to 32,768 tokens (max mode)
- **Dynamic AI-to-AI conversations**: Models can communicate and build on each other's ideas
- **Local and cloud model support**: Flexible deployment options

## Available Tools

### 1. `mcp__zen__chat` - Collaborative Development Thinking
**Purpose**: Brainstorming, second opinions, development discussions
**Default Mode**: Medium (8,192 tokens)

**Use Cases**:
- Bouncing ideas between models
- Validating design approaches
- Getting multiple perspectives on architecture
- General development discussions

**Parameters**:
- `prompt`: Your question or discussion topic
- `model`: Choose specific model or use 'auto'
- `thinking_mode`: minimal, low, medium, high, max
- `temperature`: 0-1 (default 0.5)
- `continuation_id`: For multi-turn conversations
- `use_websearch`: Enable web search
- `files`: Reference files for context

### 2. `mcp__zen__thinkdeep` - Extended Reasoning
**Purpose**: Complex problem-solving and deep analysis
**Default Mode**: High (16,384 tokens)

**Use Cases**:
- Architecture decisions
- Complex debugging scenarios
- Performance optimization challenges
- Security analysis

**Key Features**:
- Challenges assumptions
- Identifies edge cases
- Provides alternative perspectives
- Can perform web searches for validation

### 3. `mcp__zen__codereview` - Professional Code Analysis
**Purpose**: Comprehensive code evaluation
**Default Mode**: Medium (8,192 tokens)

**Review Types**:
- `full`: Complete analysis
- `security`: Security-focused
- `performance`: Performance optimization
- `quick`: Rapid review

**Severity Levels**:
- Critical → High → Medium → Low

### 4. `mcp__zen__precommit` - Git Change Validation
**Purpose**: Comprehensive pre-commit review
**Default Mode**: Medium (8,192 tokens)

**Features**:
- Multi-repository support
- Requirement validation
- Security vulnerability detection
- Incomplete change identification
- Compares changes against original requirements

### 5. `mcp__zen__debug` - Expert Debugging
**Purpose**: Root cause analysis
**Default Mode**: Medium (8,192 tokens)

**Capabilities**:
- Multiple debugging hypotheses
- Stack trace and log analysis
- Structured problem-solving
- Web search for error patterns

### 6. `mcp__zen__analyze` - Smart File Exploration
**Purpose**: Code understanding and architecture review
**Default Mode**: Medium (8,192 tokens)

**Analysis Types**:
- `architecture`: System design review
- `performance`: Performance bottlenecks
- `security`: Security vulnerabilities
- `quality`: Code quality assessment
- `general`: Overall analysis

### 7. `mcp__zen__get_version` - Configuration Info
**Purpose**: Get server version and configuration details

## Thinking Modes Explained

| Mode | Token Limit | Use Case |
|------|------------|----------|
| `minimal` | 512 | Quick queries, simple questions |
| `low` | 2,048 | Standard code reviews, basic analysis |
| `medium` | 8,192 | Most development tasks (default) |
| `high` | 16,384 | Complex problems, deep analysis |
| `max` | 32,768 | Extremely complex challenges |

## Multi-AI Collaboration Features

### How It Works

1. **Automatic Model Selection**: When using `model: "auto"`, Zen intelligently selects the best model based on:
   - Task complexity
   - Required capabilities
   - Context size
   - Specific strengths

2. **Model Options**:
   - `flash`: Ultra-fast (1M context) - Quick analysis
   - `pro`: Deep reasoning + thinking mode (1M context)
   - `o3`: Strong reasoning (200K context)
   - `o3-mini`: Fast O3 variant (200K context)
   - `gemini-2.5-flash-preview-05-20`: Latest flash model
   - `gemini-2.5-pro-preview-06-05`: Latest pro model

3. **Collaborative Workflows**: Models can:
   - Build on each other's insights
   - Challenge and validate ideas
   - Provide complementary perspectives
   - Create comprehensive solutions

## Best Practices

### 1. Choose the Right Tool
- **Quick questions**: Use `chat` with low/medium thinking
- **Complex problems**: Use `thinkdeep` with high/max thinking
- **Code quality**: Use `codereview` or `precommit`
- **Stuck on bugs**: Use `debug` with all relevant files

### 2. Effective Prompting
```markdown
# Good prompt structure:
1. Clear problem statement
2. Relevant context
3. Specific constraints
4. Expected outcome
```

### 3. Multi-Turn Conversations
```javascript
// First call
const response1 = await zen.thinkdeep({
  prompt: "Design a scalable architecture for...",
  model: "pro",
  thinking_mode: "high"
});

// Follow-up using continuation_id
const response2 = await zen.thinkdeep({
  prompt: "What about security considerations?",
  continuation_id: response1.continuation_id
});
```

### 4. File Context
```javascript
// Include relevant files for better analysis
await zen.codereview({
  files: [
    "/src/components/HomePage.tsx",
    "/src/hooks/useAuth.ts",
    "/src/api/endpoints.ts"
  ],
  prompt: "Review authentication flow",
  model: "auto"
});
```

## Advanced Usage

### Collaborative Problem Solving
```javascript
// Let Zen orchestrate multiple models
await zen.thinkdeep({
  prompt: "I need a comprehensive solution for [complex problem]. Please orchestrate multiple AI perspectives including systematic analysis (Gemini-style), critical evaluation (Claude-style), and concrete implementation (O3-style).",
  model: "auto",
  thinking_mode: "max",
  use_websearch: true
});
```

### Web Search Integration
```javascript
// Enable web search for current information
await zen.chat({
  prompt: "What are the latest best practices for React Server Components?",
  use_websearch: true,
  model: "pro"
});
```

### Performance Optimization
```javascript
// Analyze performance with specific focus
await zen.analyze({
  files: ["/src/pages/HomePage.tsx"],
  analysis_type: "performance",
  prompt: "Identify rendering bottlenecks",
  thinking_mode: "high"
});
```

## Common Patterns

### 1. Architecture Decision
```javascript
await zen.thinkdeep({
  prompt: "Should I use Astro or Next.js for this project? [provide requirements]",
  thinking_mode: "high",
  use_websearch: true
});
```

### 2. Debug Complex Issue
```javascript
await zen.debug({
  prompt: "Application crashes on mobile but works on desktop",
  error_context: "[paste stack trace]",
  files: ["relevant", "file", "paths"],
  thinking_mode: "high"
});
```

### 3. Pre-commit Validation
```javascript
await zen.precommit({
  path: "/project/root",
  prompt: "Original requirement: Add user authentication",
  model: "auto"
});
```

## Tips for Maximum Effectiveness

1. **Start with `auto` model**: Let Zen choose the best model
2. **Use appropriate thinking modes**: Don't use `max` for simple queries
3. **Provide context**: Include relevant files and clear problem descriptions
4. **Leverage continuations**: Build complex solutions iteratively
5. **Enable web search**: For current best practices and documentation
6. **Trust the orchestration**: Zen will coordinate models effectively

## Error Handling

Common issues and solutions:

1. **"No provider found for model: auto"**
   - Ensure you've configured API keys for at least one model
   - Check your MCP settings

2. **Token limit exceeded**
   - Reduce thinking_mode
   - Split into multiple queries
   - Be more specific in your prompt

3. **Continuation expired**
   - Continuations last 1 hour
   - Start a new conversation if expired

## Conclusion

The Zen MCP Server provides powerful collaborative AI capabilities. By understanding each tool's strengths and using appropriate thinking modes, you can leverage multiple AI models to solve complex problems more effectively than any single model alone.
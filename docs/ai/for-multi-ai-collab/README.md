# Multi-AI Collaboration Documentation

## Overview
Multi-AI Collaboration unleashes the power of diverse AI perspectives. Like a great team, different AI models bring different strengths—combine them for superior results.

## Quick Start
```
Ask Gemini for [REVIEW/ANALYSIS/BRAINSTORM]:

Context: [SITUATION]
Goal: [DESIRED OUTCOME]
Focus: [SPECIFIC AREAS]

[CONTENT TO ANALYZE]
```

## Directory Contents

### 📝 prompts/
Ready-to-use collaboration patterns:
- `code-review.md` - Getting expert second opinions
- `deep-analysis.md` - Complex problem analysis

### 💡 examples/
Real collaboration stories:
- `twes-validation.md` - How Gemini improved our documentation system

### 📋 guidelines/
Collaboration mastery:
- `collaboration-patterns.md` - Effective multi-AI workflows

### 📚 reference/
Technical capabilities (coming soon)

## Available Gemini Tools

### 🔍 ask_gemini
General questions and exploration
```bash
mcp__multi-ai-collab__ask_gemini \
  --prompt "Explain the trade-offs between CSR and SSR"
```

### 🏗️ gemini_code_review
Focused code analysis
```bash
mcp__multi-ai-collab__gemini_code_review \
  --code "$(cat component.tsx)" \
  --focus "security"
```

### 🧠 gemini_think_deep
Extended reasoning for complex problems
```bash
mcp__multi-ai-collab__gemini_think_deep \
  --topic "Scaling from 10K to 1M users" \
  --context "Current: Next.js on Vercel"
```

### 💡 gemini_brainstorm
Creative solution generation
```bash
mcp__multi-ai-collab__gemini_brainstorm \
  --challenge "Improve donation conversion" \
  --constraints "Mobile-first, 2G networks"
```

### 🐛 gemini_debug
Debugging assistance
```bash
mcp__multi-ai-collab__gemini_debug \
  --error "Memory leak in useEffect" \
  --code "$(cat problematic-hook.ts)"
```

### 🏛️ gemini_architecture
System design consultation
```bash
mcp__multi-ai-collab__gemini_architecture \
  --requirements "Real-time collaboration" \
  --constraints "5-person team, limited DevOps"
```

## When Multi-AI Collaboration Shines ✨

### Perfect For:
1. **Code Reviews**
   - Security vulnerabilities
   - Performance optimization
   - Best practices validation
   - Architecture decisions

2. **Deep Analysis**
   - Complex trade-offs
   - Strategic planning
   - Technical debt prioritization
   - Scaling strategies

3. **Creative Problem Solving**
   - Brainstorming solutions
   - Exploring alternatives
   - Challenging assumptions
   - Finding blind spots

4. **Validation & Testing**
   - Implementation verification
   - Edge case discovery
   - Approach comparison
   - Quality assurance

### Use Single AI When:
- Simple implementation tasks
- Codebase-specific knowledge needed
- Time-critical operations
- Straightforward questions

## Core Collaboration Patterns

### 🏗️ Builder-Reviewer
```
1. Claude builds feature
2. Gemini reviews for issues
3. Claude implements fixes
4. Gemini validates
```

### 🔍 Explorer-Analyst
```
1. Claude finds patterns
2. Gemini analyzes impact
3. Strategic decision made
4. Implementation planned
```

### 🧪 Researcher-Implementer
```
1. Gemini researches best practices
2. Claude adapts for your context
3. Gemini validates approach
4. Iterate to perfection
```

### 💡 Brainstorm-Filter
```
1. Both generate ideas
2. Evaluate together
3. Combine best elements
4. Implement winner
```

## Power Techniques

### For Code Quality
```
Claude: "I implemented [FEATURE]"
Gemini: "Review for:
  - Security gaps
  - Performance issues
  - Better patterns
  - Edge cases"
```

### For Architecture
```
Present to Gemini:
- Current: [WHAT EXISTS]
- Goal: [WHAT WE WANT]
- Constraints: [LIMITATIONS]
- Question: "Best path forward?"
```

### For Problem Solving
```
Claude: "Here's the issue..."
Gemini: "Let me analyze root causes"
Claude: "Based on that, I could..."
Gemini: "Consider also..."
→ Synthesize best solution
```

## Collaboration Tips

### 1. Context is King
```
❌ "Review this code"
✅ "Review this payment handler used by field 
    workers on 2G networks in 15 countries"
```

### 2. Be Specific
```
❌ "Is this good?"
✅ "Check for SQL injection vulnerabilities"
```

### 3. Iterate
```
Review → Implement → Validate → Refine
(Not just Review → Done)
```

### 4. Leverage Strengths
- **Claude**: Implementation, codebase knowledge
- **Gemini**: Best practices, fresh perspective

## Common Workflows

### Security Audit
```python
# Claude implements
def process_payment(card_data):
    # ... implementation ...

# Gemini reviews
"Security issues found:
1. No input validation
2. Card data in logs
3. Missing rate limiting"

# Claude fixes based on feedback
```

### Performance Analysis
```
Claude: "Page loads in 4s"
Gemini: "Analysis shows:
  - 60% from unoptimized images
  - 30% from render-blocking JS
  - 10% from web fonts
  Prioritize image optimization"
```

### Architecture Decision
```
Options presented to Gemini:
A. Microservices
B. Modular monolith
C. Serverless

Gemini: "Given your team size and 
constraints, modular monolith because..."
```

## Integration Examples

### With TaskMaster
```
1. TaskMaster: Current sprint tasks
2. Gemini: Review complexity and suggest order
3. Claude: Implement in suggested order
4. Gemini: Validate each completion
```

### With Agent
```
1. Agent: Find all error handling
2. Gemini: Identify patterns and gaps
3. Claude: Standardize based on best pattern
4. Gemini: Confirm improvement
```

## Remember
Multi-AI Collaboration is like having a talented colleague who:
- Sees things you might miss
- Knows different patterns
- Challenges your thinking
- Validates your work

Use it to build better, more secure, more thoughtful solutions. The best code comes from multiple perspectives!
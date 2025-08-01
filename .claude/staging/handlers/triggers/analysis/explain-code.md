---
id: explain-code
name: Explain Code
role: trigger
domain: analysis
stability: stable
triggers:
  - "how does X work?"
  - "explain this function"
  - "what does Y do?"
  - "explain the Z code"
dependencies: []
tools:
  - Read
  - Grep
version: 1.0.0
---

#### Handler: explain-code {#explain-code}
**Triggers**: "how does X work?", "explain this function", "what does Y do?", "explain the Z code"
**Target Pattern**: Code element to explain (file, function, class, module)
**Pre-conditions**: 
- Code element exists
- Can access source code
**Process**:
1. Find the code element using Serena
2. Read full context (imports, dependencies)
3. Analyze code structure and flow
4. Provide clear explanation with:
   - Purpose and responsibility
   - How it works step-by-step
   - Key dependencies and interactions
   - Example usage if helpful
5. Reference specific lines with file:line format
**Success**: Clear understanding achieved
**Failure**: Explanation without code evidence
**Examples**:
- "how does auth work?" → Explain auth system
- "explain useEffect hook" → Component lifecycle explanation
- "what does this function do?" → Detailed breakdown
---
id: create-docs
name: Create Documentation
role: trigger
domain: docs
stability: stable
triggers:
  - "document X"
  - "write docs for Y"
  - "create documentation"
  - "add README"
dependencies: []
tools:
  - Write
  - Edit
version: 1.0.0
---

#### Handler: create-docs {#create-docs}
**Triggers**: "document X", "write docs for Y", "create documentation", "add README"
**Target Pattern**: Code or feature to document
**Pre-conditions**: 
- Code exists and is stable
- Understand the audience (users, developers, etc.)
**Process**:
1. Determine documentation type:
   - API documentation
   - User guide
   - Developer guide
   - README file
   - Inline comments
2. Analyze what needs documenting:
   - Public APIs
   - Configuration options
   - Usage examples
   - Architecture overview
3. Follow project documentation patterns
4. Include:
   - Clear descriptions
   - Code examples
   - Common use cases
   - Troubleshooting tips
5. Place in appropriate location
**Success**: Clear, helpful documentation created
**Failure**: Documentation without examples
**Examples**:
- "document the API" → API reference docs
- "write README for auth" → Module documentation
- "create user guide" → End-user documentation
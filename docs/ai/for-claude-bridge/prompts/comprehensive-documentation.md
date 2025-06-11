# Claude Code Bridge: Comprehensive Documentation Creation

## Use Case
When you need to create extensive documentation that requires research, synthesis, and structured content generation.

## Example Prompt Template

```
Using Claude Code Bridge, create comprehensive documentation for [TOPIC]. The document should:

1. Research current best practices and industry standards
2. Synthesize information into a well-structured document
3. Include practical examples and implementation guidelines
4. Follow our documentation standards in /docs/ai/shared-context/standards/

Structure:
- Executive summary
- Core concepts
- Implementation guide with examples
- Best practices
- Common pitfalls
- Testing strategies
- References

Output to: [FILE_PATH]
```

## Real Example

```
Using Claude Code Bridge, create comprehensive documentation for implementing a donation tracking system. The document should:

1. Research current best practices for nonprofit donation management
2. Include GDPR and data privacy considerations
3. Cover both technical implementation and UX patterns
4. Align with our warm minimalism design philosophy

Structure:
- Overview of donation tracking requirements
- Technical architecture (database schema, API design)
- Frontend implementation patterns
- Privacy and compliance considerations
- Analytics and reporting guidelines
- Testing strategies for payment flows

Output to: /docs/patterns/donation-tracking-system.md
```

## When This Excels
- Creating 500+ line documents with multiple sections
- Tasks requiring web research and synthesis
- Documentation mixing technical specs with creative content
- Generating comprehensive boilerplate or templates

## Tips
- Be specific about structure - Claude Code Bridge follows outlines well
- Reference existing standards to ensure consistency
- Specify output format (Markdown, TypeScript, etc.)
- Include examples of desired tone and style
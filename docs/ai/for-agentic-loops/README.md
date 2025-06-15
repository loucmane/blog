# Agentic Loops Documentation

## Overview

Agentic loops enable autonomous, iterative generation of code, documentation, and other artifacts based on specifications. This system leverages parallel AI agents to create multiple variations while maintaining quality and uniqueness.

## Directory Structure

```
for-agentic-loops/
├── README.md          # This file
├── specs/            # Specification templates for different generation tasks
├── examples/         # Example usage and generated outputs
├── guidelines/       # Best practices and safety guidelines
├── prompts/         # Reusable prompts for agentic tasks
└── reference/       # Command reference and technical details
```

## Quick Start

1. **Create a specification** in `specs/`
2. **Use the `/infinite` command** with your spec
3. **Monitor generation** in your specified output directory

## Available Specifications

- Component generators
- Test data generators
- Documentation generators
- Migration scripts
- More coming soon...

## Usage Example

```bash
# Generate 5 blog component variations
/infinite docs/ai/for-agentic-loops/specs/component-generator.md packages/web/src/components/generated 5

# Generate infinite test data until context limit
/infinite docs/ai/for-agentic-loops/specs/test-data-generator.md tests/fixtures infinite
```

## Safety Guidelines

- Always run in development environment first
- Review generated code before production use
- Set reasonable iteration limits
- Monitor API usage costs

## Integration with TWES

This tool integrates with the Total Workflow Excellence System (TWES) to provide:
- Automated pattern discovery
- Component generation following established patterns
- Documentation that aligns with project standards
- Test generation based on existing test patterns

See [guidelines/best-practices.md](guidelines/best-practices.md) for detailed usage recommendations.
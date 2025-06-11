# Shared Context Documentation

## Overview
This directory contains shared documentation that applies across all tools and workflows. Following DRY (Don't Repeat Yourself) principles, this content is referenced by tool-specific documentation rather than duplicated.

## Directory Structure
- **themes/**: Design philosophy, warm minimalism, UI/UX guidelines
- **standards/**: Coding conventions, performance benchmarks, quality standards
- **philosophies/**: Project values, development principles, decision frameworks
- **patterns/**: Common design patterns, architectural patterns, workflow patterns

## Key Documents
- `themes/warm-minimalism.md`: Core design philosophy
- `themes/four-themes.md`: Light, dark, contrast, and gentle theme specifications
- `standards/performance.md`: Core Web Vitals and performance targets
- `standards/accessibility.md`: WCAG AA compliance requirements
- `philosophies/content-sensitivity.md`: Trauma-informed content framework
- `patterns/monorepo-structure.md`: Package organization and boundaries

## Usage
These documents are referenced by tool-specific documentation using relative paths or includes. When updating shared context:
1. Consider impact on all referencing documents
2. Update version/freshness indicators
3. Test that references still work correctly
4. Document breaking changes

## Inheritance System
Tool-specific docs inherit from shared context through:
- Direct file references
- Include statements
- Symbolic links (where appropriate)
- Context bundling scripts

## Maintenance
Shared context is the foundation of TWES. Keep it:
- Current and accurate
- Well-organized
- Version controlled
- Regularly reviewed
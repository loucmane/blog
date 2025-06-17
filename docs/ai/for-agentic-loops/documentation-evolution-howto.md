# How to Use Documentation Evolution

A simple guide to automatically improve your documentation using AI-powered evolution.

## Command Location
The infinite-documentation command is located at:
```
.claude/commands/infinite-documentation.md
```

## Quick Start (Run Everything)

In a new Claude session, run this single command:

```
/infinite-documentation mode=all output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution count=3
```

That's it! This will generate 3 iterations of improved documentation for:
- 🌉 **Bridge Standards** - Connects your standards to actual code
- 🔍 **Convention Discovery** - Finds and documents hidden patterns
- 🕸️ **Documentation Network** - Builds connections between docs

## What Gets Generated?

```
docs/evolution/
├── bridges/performance/
│   ├── v1/                    # First iteration
│   │   ├── bridge.md         # Main guide
│   │   ├── examples/         # Working code
│   │   ├── tests/           # Validation
│   │   └── metrics/         # Performance data
│   ├── v2/                    # Second iteration (improved)
│   └── v3/                    # Third iteration (even better)
├── conventions/discovered/
│   ├── v1/
│   ├── v2/
│   └── v3/
└── network/maps/
    ├── v1/
    ├── v2/
    └── v3/
```

## Other Commands

### Run Just One Type
```
/infinite-documentation mode=bridge output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution count=5
```

### Keep Evolving Forever
```
/infinite-documentation mode=all output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution count=infinite
```

### Use Custom Spec
```
/infinite-documentation mode=single spec_file=/path/to/my-spec.md output_dir=/docs/custom count=3
```

## What Happens?

1. **Claude reads your codebase** to understand current state
2. **15 AI agents work in parallel** (5 per documentation type)
3. **Each iteration gets better** by learning from the previous
4. **Real code examples** are generated and tested
5. **Connections between docs** are mapped and optimized

## Tips

- Start with `count=3` to see how it works
- Check `v1/` first to understand the baseline
- Compare `v3/` to see the improvements
- Use generated tests to validate your code
- Follow the migration guides to update existing code

## Requirements

- Must be run in a Claude session (not regular terminal)
- Needs access to your project files
- Works best with existing documentation to improve

That's all! The command handles all the complexity for you.
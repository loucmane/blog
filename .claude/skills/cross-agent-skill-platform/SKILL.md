---
name: cross-agent-skill-platform
description: Maintain and validate this repository's project-owned cross-agent skill platform. Use when adding, importing, reviewing, routing, linking, or testing skills under .claude/skills and .agents/skills, or when producing schema-valid advisory skill-review evidence.
---

# Cross-Agent Skill Platform

Keep Claude and Codex on one canonical project skill implementation while preserving deterministic validation and advisory review boundaries.

## Workflow

1. Read `config/agent-skills/catalog.yaml`, `config/agent-skills/review-map.yaml`, and `config/agent-skills/upstream.lock.json`.
2. Create or update the canonical skill under `.claude/skills/<skill-id>/` with the system skill creator.
3. Keep `.agents/skills/<skill-id>` as a relative symlink to the canonical directory. Never copy or fork the skill body for Codex.
4. Register the skill, provenance, routes, deterministic checks, and advisory mode in the project configs.
5. Run `pnpm ci:agent-skills` and the system `quick_validate.py` against each changed skill.
6. Write generated review results beneath `reports/agent-skills/`, validate them with `scripts/agent-skills/validate-review-result.mjs`, and ingest them only through `scripts/agent-skills/ingest-result.mjs` or the project-local Aegis CLI.

## Guardrails

- Treat `.claude/skills/` as canonical and `.agents/skills/` as links only.
- Keep every symlink relative and inside the repository.
- Keep catalog and review-map files in JSON-compatible YAML until a reviewed parser dependency is justified.
- Pin imported upstream skills by immutable revision and SHA-256 digest; project-authored skills do not need an upstream lock entry.
- Keep subjective findings non-blocking and advisory. Deterministic schema, link, script, test, build, typecheck, lint, security, and critical browser checks may block.
- Never write `.aegis/` state directly. Use the project-local Aegis CLI for evidence ingestion.
- Never commit generated files beneath `reports/agent-skills/`.

## Commands

```bash
pnpm ci:agent-skills
python3 /home/loucmane/.codex/skills/.system/skill-creator/scripts/quick_validate.py .claude/skills/<skill-id>
node scripts/agent-skills/validate-review-result.mjs reports/agent-skills/<result>.json
node scripts/agent-skills/ingest-result.mjs reports/agent-skills/<result>.json --dry-run
```

If validation reports subjective concerns, preserve them in the result artifact and continue unless a separate owner-approved policy promotes that finding class to enforcement.

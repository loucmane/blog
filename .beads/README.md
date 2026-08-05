# Blog Beads Store

This directory identifies the Blog rig's Beads database. Beads is the sole
active task authority for this repository. Historical `.taskmaster/` and legacy
Aegis workflow data remain preserved but are not active task state.

Project agents coordinate work through the project-local
`gas-city-coordinator` skill. Gas City owns delegated execution; the
project-local agent retains intent, sequencing, task selection, and acceptance.

## Required Routing

Use the native Gas City client, isolated city home, and explicit Blog rig for
every Beads operation:

```bash
env -u BEADS_DIR -u BEADS_DB -u BEADS_DOLT_SERVER_PORT \
  GC_HOME=/home/loucmane/gascity/home \
  /home/loucmane/gascity/bin/gc bd list --rig blog
```

Never trust inherited `BEADS_*` values and never use a cross-rig bare `bd`
command. Consult `gc-city`, `gc-rigs`, `gc-agents`, `gc-work`, and
`gc-dispatch` before lifecycle or delegation operations.

Every work bead receives a worklog. Merge, publishing, destructive cleanup,
credential actions, and authority changes retain their existing operator
confirmation boundaries.

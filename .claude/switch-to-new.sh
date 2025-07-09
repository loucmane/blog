#!/bin/bash
# Switch to NEW template system

if [ -f "CLAUDE-OLD.md" ]; then
  echo "Switching to NEW template system..."
  mv CLAUDE.md CLAUDE-OLD.md
  mv CLAUDE-NEW.md CLAUDE.md
  echo "✅ Now using NEW system (modular templates)"
  echo "Run .claude/switch-to-old.sh to switch back"
else
  echo "Already using NEW system"
fi
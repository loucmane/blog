#!/bin/bash
# Switch to OLD monolithic system

if [ -f "CLAUDE-NEW.md" ]; then
  echo "Switching to OLD monolithic system..."
  mv CLAUDE.md CLAUDE-NEW.md
  mv CLAUDE-OLD.md CLAUDE.md
  echo "✅ Now using OLD system (monolithic CLAUDE.md)"
  echo "Run .claude/switch-to-new.sh to switch back"
else
  echo "Already using OLD system"
fi
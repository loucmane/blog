#!/bin/bash
# Check which template system is currently active

echo "Template System Status:"
echo "======================"

if [ -f "CLAUDE-OLD.md" ]; then
  echo "✅ Currently using: NEW template system"
  echo ""
  echo "Active files:"
  echo "  - CLAUDE.md → Template navigation hub"
  echo "  - .claude/templates/WORKFLOWS.md → Development workflows"
  echo "  - .claude/templates/TOOLS.md → MCP tool configs"
  echo "  - .claude/templates/CONVENTIONS.md → Code standards"
  echo "  - .claude/templates/PROJECT-BLOG.md → Project specifics"
  echo "  - .claude/templates/BUILDING-BETTER.md → Improvement guide"
  echo ""
  echo "Inactive:"
  echo "  - CLAUDE-OLD.md → Monolithic system (41KB)"
elif [ -f "CLAUDE-NEW.md" ]; then
  echo "✅ Currently using: OLD monolithic system"
  echo ""
  echo "Active files:"
  echo "  - CLAUDE.md → Monolithic system (41KB)"
  echo ""
  echo "Inactive:"
  echo "  - CLAUDE-NEW.md → Template hub"
  echo "  - Template files in .claude/templates/"
else
  echo "⚠️  Unexpected state - check your files"
fi

echo ""
echo "Available commands:"
echo "  .claude/switch-to-old.sh - Use monolithic system"
echo "  .claude/switch-to-new.sh - Use template system"
# Template System Transition - Implementation Plan

## Overview
Transition from monolithic CLAUDE.md to new modular template system with easy rollback capability. Focus on real-world testing to discover friction points.

## Approach
1. Preserve current system completely
2. Deploy new system alongside old
3. Create instant switching mechanism
4. Test in real usage scenarios

## Detailed Steps

### 1. Backup Current System
```bash
# Create archive structure with timestamp
mkdir -p .claude/archive/2025-01-09-template-transition/

# Backup current files
cp CLAUDE.md .claude/archive/2025-01-09-template-transition/CLAUDE-original.md
cp 'CLAUDE copy.md' .claude/archive/2025-01-09-template-transition/

# Document the backup
echo "# Template System Transition Backup
Date: $(date)
Original CLAUDE.md size: $(wc -c < CLAUDE.md) bytes
Reason: Testing new modular template system
Rollback: Use .claude/switch-to-old.sh or copy from here
" > .claude/archive/2025-01-09-template-transition/README.md
```

### 2. Deploy New Templates
```bash
# Copy all templates to root (6 files)
cp docs/ai/claude-template-system/templates/CLAUDE-NEW.md ./
cp docs/ai/claude-template-system/templates/WORKFLOWS.md ./
cp docs/ai/claude-template-system/templates/TOOLS.md ./
cp docs/ai/claude-template-system/templates/CONVENTIONS.md ./
cp docs/ai/claude-template-system/templates/PROJECT-BLOG.md ./
cp docs/ai/claude-template-system/templates/BUILDING-BETTER.md ./

# Rename for activation
mv CLAUDE.md CLAUDE-OLD.md
mv CLAUDE-NEW.md CLAUDE.md
```

### 3. Create Switch Scripts
```bash
# Script to switch to OLD system
cat > .claude/switch-to-old.sh << 'EOF'
#!/bin/bash
if [ -f "CLAUDE-NEW.md" ]; then
  echo "Switching to OLD monolithic system..."
  mv CLAUDE.md CLAUDE-NEW.md
  mv CLAUDE-OLD.md CLAUDE.md
  echo "✅ Now using OLD system (monolithic CLAUDE.md)"
  echo "Run .claude/switch-to-new.sh to switch back"
else
  echo "Already using OLD system"
fi
EOF

# Script to switch to NEW system
cat > .claude/switch-to-new.sh << 'EOF'
#!/bin/bash
if [ -f "CLAUDE-OLD.md" ]; then
  echo "Switching to NEW template system..."
  mv CLAUDE.md CLAUDE-OLD.md
  mv CLAUDE-NEW.md CLAUDE.md
  echo "✅ Now using NEW system (modular templates)"
  echo "Run .claude/switch-to-old.sh to switch back"
else
  echo "Already using NEW system"
fi
EOF

chmod +x .claude/switch-to-*.sh
```

### 4. Create Quick Status Check
```bash
cat > .claude/check-system.sh << 'EOF'
#!/bin/bash
echo "Template System Status:"
if [ -f "CLAUDE-OLD.md" ]; then
  echo "✅ Currently using: NEW template system"
  echo "   - CLAUDE.md → Template navigation hub"
  echo "   - CLAUDE-OLD.md → Monolithic system (inactive)"
elif [ -f "CLAUDE-NEW.md" ]; then
  echo "✅ Currently using: OLD monolithic system"
  echo "   - CLAUDE.md → Monolithic system"
  echo "   - CLAUDE-NEW.md → Template hub (inactive)"
else
  echo "⚠️  Unexpected state - check your files"
fi
echo ""
echo "Available commands:"
echo "  .claude/switch-to-old.sh - Use monolithic system"
echo "  .claude/switch-to-new.sh - Use template system"
EOF
chmod +x .claude/check-system.sh
```

## Technical Considerations
- Git will track the rename as a major change
- Both systems remain in working tree
- No data loss possible
- Instant switching preserves workflow

## Success Metrics
- Switching takes <2 seconds
- No manual file editing required
- Clear indication of active system
- Testing can begin immediately

## Integration Points
- **CLAUDE.md**: Always the active file
- **Switch scripts**: In .claude/ for easy access
- **Documentation**: This work folder tracks everything

## Timeline Estimate
- Backup: 5 minutes
- Deployment: 5 minutes
- Script creation: 10 minutes
- Testing setup: 10 minutes
- Total: 30 minutes
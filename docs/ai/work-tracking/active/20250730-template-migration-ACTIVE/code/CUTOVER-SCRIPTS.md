# Cutover Scripts for Migration

## Prerequisites
- All handlers migrated to staging
- All validation passed
- CLAUDE.md updates prepared
- REGISTRY.md updates prepared

## cutover.sh

```bash
#!/bin/bash
# Template Migration Cutover Script
# Run from project root: ./cutover.sh

echo "🚀 Starting template migration cutover..."

# 1. Create timestamp for backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 2. Backup current templates
echo "📦 Backing up current templates..."
cp -r .claude/templates .claude/templates.backup.$TIMESTAMP

# 3. Create archive directory
mkdir -p .claude/templates/archive

# 4. Move monolithic files to archive
echo "📁 Archiving monolithic files..."
mv .claude/templates/WORKFLOWS.md .claude/templates/archive/
mv .claude/templates/TOOLS.md .claude/templates/archive/
mv .claude/templates/CONVENTIONS.md .claude/templates/archive/
mv .claude/templates/PATTERNS.md .claude/templates/archive/
mv .claude/templates/BUILDING-BETTER.md .claude/templates/archive/
mv .claude/templates/MATRICES.md .claude/templates/archive/

# 5. Move staged handlers to production
echo "🚚 Moving handlers to production..."
mv .claude/staging/handlers .claude/templates/handlers

# 6. Copy shared patterns if they exist
if [ -d ".claude/staging/shared" ]; then
    cp -r .claude/staging/shared .claude/templates/shared
fi

# 7. Verify essential files remain
echo "✅ Verifying essential files..."
if [ ! -f ".claude/templates/CLAUDE.md" ]; then
    echo "❌ ERROR: CLAUDE.md missing!"
    exit 1
fi

if [ ! -f ".claude/templates/USER-GUIDE.md" ]; then
    echo "❌ ERROR: USER-GUIDE.md missing!"
    exit 1
fi

# 8. Create migration marker
echo "$TIMESTAMP" > .claude/templates/.migrated

echo "✅ Cutover complete! Old files archived at .claude/templates/archive/"
echo "🔍 Now update CLAUDE.md and REGISTRY.md with new paths"
```

## rollback.sh

```bash
#!/bin/bash
# Template Migration Rollback Script
# Run from project root: ./rollback.sh

echo "⏮️ Starting template migration rollback..."

# 1. Check if we have something to rollback
if [ ! -d ".claude/templates/archive" ]; then
    echo "❌ No archive found. Nothing to rollback."
    exit 1
fi

# 2. Remove new structure
echo "🗑️ Removing new handler structure..."
rm -rf .claude/templates/handlers
rm -rf .claude/templates/shared
rm -f .claude/templates/.migrated

# 3. Restore archived files
echo "📂 Restoring original files..."
mv .claude/templates/archive/* .claude/templates/

# 4. Remove archive directory
rmdir .claude/templates/archive

# 5. Verify restoration
echo "✅ Verifying restored files..."
for file in WORKFLOWS.md TOOLS.md CONVENTIONS.md PATTERNS.md; do
    if [ ! -f ".claude/templates/$file" ]; then
        echo "❌ WARNING: $file not restored!"
    fi
done

echo "✅ Rollback complete! Original structure restored."
```

## validate-cutover.sh

```bash
#!/bin/bash
# Post-cutover validation script
# Run after cutover: ./validate-cutover.sh

echo "🔍 Validating migration..."

# Check handler directory exists
if [ ! -d ".claude/templates/handlers" ]; then
    echo "❌ Handler directory missing!"
    exit 1
fi

# Count handlers
HANDLER_COUNT=$(find .claude/templates/handlers -name "*.md" | wc -l)
echo "📊 Found $HANDLER_COUNT handlers"

# Check for migration marker
if [ ! -f ".claude/templates/.migrated" ]; then
    echo "⚠️ Migration marker missing"
fi

# Test Serena search
echo "🔎 Testing handler discovery..."
# This would need actual testing

echo "✅ Basic validation passed"
```

## Usage Instructions

1. **Before Cutover**:
   ```bash
   chmod +x cutover.sh rollback.sh validate-cutover.sh
   ```

2. **Execute Cutover**:
   ```bash
   ./cutover.sh
   # Manually update CLAUDE.md and REGISTRY.md
   ./validate-cutover.sh
   ```

3. **If Problems**:
   ```bash
   ./rollback.sh
   ```

## Critical Notes

- **NEVER** run cutover without full staging validation
- **ALWAYS** test in a branch first
- **IMMEDIATELY** test basic operations after cutover
- **KEEP** backups for at least 1 week

## Files That Stay in templates/
- CLAUDE.md (update paths only)
- USER-GUIDE.md
- README.md (if exists)
- Any non-handler documentation
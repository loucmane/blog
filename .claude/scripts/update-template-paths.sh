#!/bin/bash
# Update all template path references from .claude/templates to templates

echo "Updating template path references..."

# Find all markdown files in templates directory
find /home/loucmane/dev/javascript/MomsBlog/blog/templates -name "*.md" -type f | while read file; do
    # Replace .claude/templates/ with templates/
    sed -i 's|\.claude/templates/|templates/|g' "$file"
    echo "Updated: $file"
done

# Count how many references were updated
echo ""
echo "Checking for remaining .claude/templates references..."
remaining=$(grep -r "\.claude/templates" /home/loucmane/dev/javascript/MomsBlog/blog/templates --include="*.md" | wc -l)

if [ "$remaining" -eq 0 ]; then
    echo "✅ All template references updated successfully!"
else
    echo "⚠️  Still $remaining references remaining"
fi
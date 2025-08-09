#!/usr/bin/env python3
"""
Fix session file names by extracting meaningful titles from content.
"""

import os
import re
import shutil
from pathlib import Path
import hashlib

def extract_title_from_session(file_path):
    """Extract a meaningful title from session content."""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Try to extract task from frontmatter or content
    patterns = [
        r'\*\*Task\*\*:\s*(.+?)(?:\n|$)',  # **Task**: ...
        r'Primary:\s*(.+?)(?:\n|$)',  # Primary: ...
        r'### Session Goals\n-\s*\[.\]\s*(?:Primary:\s*)?(.+?)(?:\n|$)',  # Session goal
        r'## Main Achievement:\s*(.+?)(?:\n|$)',  # Main achievement
        r'### Main Focus:\s*(.+?)(?:\n|$)',  # Main focus
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content, re.MULTILINE)
        if match:
            title = match.group(1).strip()
            # Clean up the title
            title = re.sub(r'^~~(.+?)~~$', r'\1', title)  # Remove strikethrough
            title = re.sub(r'\[x\]\s*', '', title)  # Remove checkbox marks
            title = re.sub(r'^\w+:\s*', '', title)  # Remove prefixes like "Primary: "
            title = title.replace('*', '').strip()  # Remove asterisks
            
            # Truncate and clean for filename
            title = title[:60]  # Max 60 chars
            title = re.sub(r'[^\w\s-]', '', title)  # Remove special chars
            title = re.sub(r'\s+', '-', title)  # Replace spaces with dashes
            title = title.lower().strip('-')
            
            if title and title != 'untitled':
                return title
    
    # Fallback: try to get session end status
    status_match = re.search(r'\*\*SESSION COMPLETED\*\*.*?:\s*(.+?)(?:\n|$)', content)
    if status_match:
        title = status_match.group(1).strip()
        title = re.sub(r'[^\w\s-]', '', title)[:60]
        title = re.sub(r'\s+', '-', title).lower().strip('-')
        if title:
            return title
    
    return None

def fix_session_files(sessions_dir):
    """Fix all untitled session files."""
    sessions_dir = Path(sessions_dir)
    untitled_files = list(sessions_dir.glob("**/????-??-??-???-untitled.md"))
    
    print(f"Found {len(untitled_files)} untitled session files")
    
    renamed_count = 0
    skipped_count = 0
    errors = []
    
    for file_path in untitled_files:
        try:
            # Extract title from content
            new_title = extract_title_from_session(file_path)
            
            if not new_title:
                print(f"  ⚠️  Could not extract title from {file_path.name}")
                skipped_count += 1
                continue
            
            # Build new filename
            parts = file_path.stem.split('-')
            date_seq = '-'.join(parts[:4])  # YYYY-MM-DD-NNN
            new_name = f"{date_seq}-{new_title}.md"
            new_path = file_path.parent / new_name
            
            # Check if target exists
            if new_path.exists():
                print(f"  ⚠️  Target already exists: {new_name}")
                skipped_count += 1
                continue
            
            # Rename the file
            shutil.move(str(file_path), str(new_path))
            print(f"  ✅ Renamed: {file_path.name} → {new_name}")
            
            # Update the title in frontmatter
            with open(new_path, 'r') as f:
                lines = f.readlines()
            
            # Update title line in frontmatter
            for i, line in enumerate(lines):
                if line.startswith('title:'):
                    # Capitalize words for display title
                    display_title = ' '.join(word.capitalize() for word in new_title.split('-'))
                    lines[i] = f'title: {display_title}\n'
                    break
            
            with open(new_path, 'w') as f:
                f.writelines(lines)
            
            renamed_count += 1
            
        except Exception as e:
            print(f"  ❌ Error processing {file_path.name}: {e}")
            errors.append((file_path.name, str(e)))
    
    # Update symlink if needed
    current_link = sessions_dir / 'current'
    if current_link.is_symlink():
        link_target = current_link.readlink()
        if 'untitled' in str(link_target):
            # Find the renamed file
            old_name = link_target.name
            date_part = '-'.join(old_name.split('-')[:4])
            parent_dir = link_target.parent
            
            # Find new file with same date prefix
            new_files = list(parent_dir.glob(f"{date_part}-*.md"))
            new_files = [f for f in new_files if 'untitled' not in f.name]
            
            if new_files:
                # Update symlink
                current_link.unlink()
                relative_path = os.path.relpath(new_files[0], sessions_dir)
                current_link.symlink_to(relative_path)
                print(f"\n✅ Updated 'current' symlink to: {relative_path}")
    
    print(f"\n📊 Summary:")
    print(f"  - Renamed: {renamed_count} files")
    print(f"  - Skipped: {skipped_count} files")
    print(f"  - Errors: {len(errors)} files")
    
    if errors:
        print("\n❌ Errors encountered:")
        for filename, error in errors:
            print(f"  - {filename}: {error}")
    
    return renamed_count, skipped_count, len(errors)

if __name__ == "__main__":
    sessions_dir = "/home/loucmane/dev/javascript/MomsBlog/blog/sessions"
    renamed, skipped, errors = fix_session_files(sessions_dir)
    
    if renamed > 0:
        print(f"\n✨ Successfully fixed {renamed} session file names!")
    else:
        print("\n⚠️  No files were renamed. You may need to manually review the sessions.")
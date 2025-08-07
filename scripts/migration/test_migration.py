#!/usr/bin/env python3
"""
Test script for SESSION.md migration
Run this after migration to verify everything worked correctly
"""

import hashlib
import json
from pathlib import Path
from rich.console import Console
from rich.table import Table

console = Console()

def calculate_checksum(filepath: Path) -> str:
    """Calculate SHA256 checksum"""
    sha256 = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            sha256.update(chunk)
    return sha256.hexdigest()

def test_migration():
    """Run comprehensive tests on migration results"""
    console.print("\n[bold cyan]Migration Test Suite[/bold cyan]")
    console.print("=" * 50)
    
    # Script is in scripts/migration/, blog root is two levels up
    blog_root = Path(__file__).parent.parent.parent
    
    tests = []
    
    # Test 1: Backup exists and is valid
    backup_path = blog_root / "SESSION.md.backup"
    if backup_path.exists():
        size = backup_path.stat().st_size / 1024
        if size > 200:  # Should be ~209KB
            tests.append(("[green]✓[/green]", "Backup exists", f"{size:.1f}KB"))
        else:
            tests.append(("[red]✗[/red]", "Backup size", f"Too small: {size:.1f}KB"))
    else:
        tests.append(("[red]✗[/red]", "Backup exists", "Not found"))
    
    # Test 2: Sessions folder structure
    sessions_dir = blog_root / "sessions"
    if sessions_dir.exists():
        year_dirs = list(sessions_dir.glob("20*/"))
        if year_dirs:
            tests.append(("[green]✓[/green]", "Year folders", f"Found {len(year_dirs)}"))
        else:
            tests.append(("[red]✗[/red]", "Year folders", "None found"))
            
        # Check month folders
        month_dirs = list(sessions_dir.glob("20*/**/"))
        expected_months = ["06", "07", "08"]
        found_months = [d.name for d in month_dirs]
        if all(m in found_months for m in expected_months):
            tests.append(("[green]✓[/green]", "Month folders", f"All expected found"))
        else:
            tests.append(("[yellow]⚠[/yellow]", "Month folders", f"Found: {found_months}"))
    else:
        tests.append(("[red]✗[/red]", "Sessions folder", "Not found"))
    
    # Test 3: Session files
    session_files = list(sessions_dir.glob("**/*.md")) if sessions_dir.exists() else []
    if len(session_files) >= 38:  # Should have at least 38 sessions
        tests.append(("[green]✓[/green]", "Session files", f"Found {len(session_files)}"))
    else:
        tests.append(("[yellow]⚠[/yellow]", "Session files", f"Only {len(session_files)} found"))
    
    # Test 4: Date corrections applied
    corrected_dates = ["2025-07-06", "2025-07-05", "2025-07-03"]
    wrong_dates = ["2025-01-06", "2025-01-05", "2025-01-03"]
    
    corrected_found = []
    wrong_found = []
    
    for f in session_files:
        if any(date in f.name for date in corrected_dates):
            corrected_found.append(f.name)
        if any(date in f.name for date in wrong_dates):
            wrong_found.append(f.name)
    
    if corrected_found and not wrong_found:
        tests.append(("[green]✓[/green]", "Date corrections", "Applied correctly"))
    else:
        tests.append(("[red]✗[/red]", "Date corrections", f"Issues found"))
    
    # Test 5: File naming convention
    import re
    pattern = re.compile(r'^\d{4}-\d{2}-\d{2}-\d{3}-[\w-]+\.md$')
    invalid_names = []
    for f in session_files:
        if not pattern.match(f.name):
            invalid_names.append(f.name)
    
    if not invalid_names:
        tests.append(("[green]✓[/green]", "File naming", "All valid"))
    else:
        tests.append(("[yellow]⚠[/yellow]", "File naming", f"{len(invalid_names)} invalid"))
    
    # Test 6: Symlink
    symlink = sessions_dir / "current" if sessions_dir.exists() else None
    if symlink and symlink.exists() and symlink.is_symlink():
        target = symlink.readlink()
        tests.append(("[green]✓[/green]", "Current symlink", f"→ {target}"))
    else:
        tests.append(("[yellow]⚠[/yellow]", "Current symlink", "Not found"))
    
    # Test 7: Metadata headers
    if session_files:
        sample_file = session_files[0]
        with open(sample_file, 'r') as f:
            content = f.read()
            if content.startswith('---\n') and 'session_id:' in content:
                tests.append(("[green]✓[/green]", "Metadata headers", "Present"))
            else:
                tests.append(("[red]✗[/red]", "Metadata headers", "Missing or invalid"))
    
    # Test 8: Manifest file
    manifest_path = blog_root / ".migration-manifest.json"
    if manifest_path.exists():
        try:
            with open(manifest_path, 'r') as f:
                manifest = json.load(f)
                if 'backup' in manifest and 'migration' in manifest:
                    tests.append(("[green]✓[/green]", "Manifest file", "Valid"))
                else:
                    tests.append(("[yellow]⚠[/yellow]", "Manifest file", "Incomplete"))
        except:
            tests.append(("[red]✗[/red]", "Manifest file", "Invalid JSON"))
    else:
        tests.append(("[yellow]⚠[/yellow]", "Manifest file", "Not found"))
    
    # Test 9: New index file
    new_index = Path("SESSION_NEW.md")
    if new_index.exists():
        size = new_index.stat().st_size
        if size < 2048:  # Should be <1KB
            tests.append(("[green]✓[/green]", "New index", f"{size} bytes"))
        else:
            tests.append(("[yellow]⚠[/yellow]", "New index", f"Too large: {size} bytes"))
    else:
        tests.append(("[yellow]⚠[/yellow]", "New index", "Not found"))
    
    # Test 10: Data integrity
    if backup_path.exists() and session_files:
        # Compare total lines
        with open(backup_path, 'r') as f:
            original_lines = len(f.readlines())
        
        migrated_lines = 0
        for f in session_files:
            with open(f, 'r') as file:
                # Skip metadata lines
                lines = file.readlines()
                if '---\n' in lines:
                    start = lines.index('---\n', 1) + 1
                    migrated_lines += len(lines[start:])
        
        diff = abs(original_lines - migrated_lines)
        if diff < 100:  # Allow small variance
            tests.append(("[green]✓[/green]", "Line preservation", f"Diff: {diff} lines"))
        else:
            tests.append(("[yellow]⚠[/yellow]", "Line preservation", f"Diff: {diff} lines"))
    
    # Display results
    table = Table(title="Test Results")
    table.add_column("Status", style="cyan")
    table.add_column("Test", style="white")
    table.add_column("Details", style="gray50")
    
    for status, test, details in tests:
        table.add_row(status, test, details)
    
    console.print(table)
    
    # Summary
    passed = sum(1 for t in tests if "[green]" in t[0])
    warnings = sum(1 for t in tests if "[yellow]" in t[0])
    failed = sum(1 for t in tests if "[red]" in t[0])
    
    console.print(f"\n[bold]Summary:[/bold]")
    console.print(f"  [green]Passed: {passed}[/green]")
    console.print(f"  [yellow]Warnings: {warnings}[/yellow]")
    console.print(f"  [red]Failed: {failed}[/red]")
    
    if failed == 0:
        console.print("\n[bold green]✅ Migration appears successful![/bold green]")
    elif failed <= 2:
        console.print("\n[bold yellow]⚠️  Migration mostly successful, review warnings[/bold yellow]")
    else:
        console.print("\n[bold red]❌ Migration has issues, review carefully[/bold red]")

if __name__ == "__main__":
    test_migration()
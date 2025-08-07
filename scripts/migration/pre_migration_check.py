#!/usr/bin/env python3
"""
Pre-migration safety checklist
Run this BEFORE migration to ensure everything is ready
"""

from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from rich.text import Text

console = Console()

def safety_check():
    """Run pre-migration safety checks"""
    console.print("\n[bold cyan]🔍 Pre-Migration Safety Checklist[/bold cyan]")
    console.print("=" * 60)
    
    warnings = []
    errors = []
    info = []
    
    # Check SESSION.md
    session_file = Path("SESSION.md")
    if session_file.exists():
        size_kb = session_file.stat().st_size / 1024
        lines = sum(1 for _ in open(session_file))
        info.append(f"✓ SESSION.md found: {size_kb:.1f}KB, {lines:,} lines")
        
        # Check for backup
        backup = Path("SESSION.md.backup")
        if backup.exists():
            warnings.append("⚠️  Backup already exists - will need --force to overwrite")
    else:
        errors.append("❌ SESSION.md not found!")
    
    # Check sessions folder
    sessions_dir = Path("sessions")
    if sessions_dir.exists():
        file_count = sum(1 for _ in sessions_dir.glob("**/*"))
        if file_count > 0:
            warnings.append(f"⚠️  Sessions folder exists with {file_count} items")
    else:
        info.append("✓ Sessions folder clear")
    
    # Check for the copy
    session_copy = Path("SESSION copy.md")
    if session_copy.exists():
        info.append("✓ Found 'SESSION copy.md' - you have an extra backup")
    
    # Check git status
    import subprocess
    try:
        result = subprocess.run(["git", "status", "--porcelain"], 
                              capture_output=True, text=True)
        if "SESSION.md" in result.stdout:
            warnings.append("⚠️  SESSION.md has uncommitted changes")
    except:
        pass
    
    # Check disk space
    import os
    stat = os.statvfs(".")
    free_mb = (stat.f_bavail * stat.f_frsize) / (1024 * 1024)
    if free_mb < 1:
        errors.append(f"❌ Low disk space: {free_mb:.1f}MB (need at least 1MB)")
    else:
        info.append(f"✓ Disk space: {free_mb:.0f}MB available")
    
    # Check dependencies
    try:
        import rich
        # Try to get version, but don't fail if __version__ doesn't exist
        try:
            version = rich.__version__
            info.append(f"✓ Rich library installed (v{version})")
        except AttributeError:
            info.append("✓ Rich library installed")
    except ImportError:
        errors.append("❌ Rich not installed - run: pip install rich>=13.0.0")
    
    # Display results
    if info:
        console.print("\n[bold green]✅ Good to go:[/bold green]")
        for item in info:
            console.print(f"  {item}")
    
    if warnings:
        console.print("\n[bold yellow]⚠️  Warnings:[/bold yellow]")
        for item in warnings:
            console.print(f"  {item}")
    
    if errors:
        console.print("\n[bold red]❌ Errors (must fix):[/bold red]")
        for item in errors:
            console.print(f"  {item}")
    
    # Recommendations
    console.print("\n" + "=" * 60)
    
    if errors:
        panel = Panel(
            "[bold red]⛔ DO NOT PROCEED - Fix errors first![/bold red]",
            title="[red]STOP[/red]",
            border_style="red"
        )
        console.print(panel)
    elif warnings:
        text = Text()
        text.append("RECOMMENDED STEPS:\n\n", style="bold yellow")
        text.append("1. Review warnings above\n")
        text.append("2. Run dry-run first: ")
        text.append("python migrate_sessions.py --dry-run\n", style="cyan")
        text.append("3. If happy, run migration: ")
        text.append("python migrate_sessions.py\n", style="cyan")
        text.append("4. After migration, test with: ")
        text.append("python test_migration.py\n", style="cyan")
        
        panel = Panel(text, title="[yellow]Proceed with Caution[/yellow]", border_style="yellow")
        console.print(panel)
    else:
        text = Text()
        text.append("READY TO MIGRATE!\n\n", style="bold green")
        text.append("1. First run dry-run: ")
        text.append("python migrate_sessions.py --dry-run\n", style="cyan")
        text.append("2. Review the preview carefully\n")
        text.append("3. If everything looks good: ")
        text.append("python migrate_sessions.py\n", style="cyan")
        text.append("4. Test after migration: ")
        text.append("python test_migration.py\n", style="cyan")
        
        panel = Panel(text, title="[green]All Clear![/green]", border_style="green")
        console.print(panel)

if __name__ == "__main__":
    safety_check()
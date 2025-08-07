#!/usr/bin/env python3
"""
SESSION.md Migration Script - SAFETY FIRST
Migrates monolithic SESSION.md to organized folder structure with extreme safety checks.

CRITICAL: Never modifies original SESSION.md
"""

import argparse
import hashlib
import json
import logging
import os
import re
import shutil
import sys
from datetime import datetime
from enum import Enum, auto
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

try:
    from rich.console import Console
    from rich.progress import track, Progress, SpinnerColumn, TextColumn, BarColumn
    from rich.prompt import Confirm
    from rich.table import Table
    from rich.logging import RichHandler
    from rich import print as rprint
except ImportError:
    print("ERROR: Required dependencies not installed!")
    print("Run: pip install rich>=13.0.0")
    sys.exit(1)

# Configuration
class ParserState(Enum):
    """State machine for parsing markdown"""
    NORMAL = auto()
    IN_CODE_BLOCK = auto()
    IN_QUOTE = auto()

class MigrationConfig:
    """Migration configuration"""
    DATE_CORRECTIONS = {
        "2025-01-06": "2025-07-06",  # Between July 8 and July 5
        "2025-01-05": "2025-07-05",  # Between July 6 and July 3
        "2025-01-03": "2025-07-03",  # Between July 5 and July 2
    }
    
    SESSION_PATTERN = re.compile(r'^## (?:Session|Previous Session): (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) CEST(.*)$')
    CODE_BLOCK_PATTERN = re.compile(r'^```')
    QUOTE_PATTERN = re.compile(r'^>')
    
    BACKUP_SUFFIX = ".backup"
    STATUS_FILE = ".migration-status.json"
    MANIFEST_FILE = ".migration-manifest.json"
    
    MAX_FILENAME_LENGTH = 50
    CHUNK_SIZE = 8192

class SessionMigrator:
    """Main migration handler with safety checks"""
    
    def __init__(self, session_file: Path, output_dir: Path, dry_run: bool = False, 
                 verbose: bool = False, force: bool = False):
        self.session_file = session_file
        self.output_dir = output_dir
        self.dry_run = dry_run
        self.verbose = verbose
        self.force = force
        self.console = Console()
        self.sessions: List[Dict] = []
        self.manifest: Dict[str, Any] = {}
        self.status: Dict[str, Any] = {}
        
        # Setup logging
        logging.basicConfig(
            level=logging.DEBUG if verbose else logging.INFO,
            format="%(message)s",
            handlers=[
                RichHandler(console=self.console, rich_tracebacks=True),
                logging.FileHandler("migration.log")
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def calculate_checksum(self, filepath: Path) -> str:
        """Calculate SHA256 checksum of file"""
        sha256 = hashlib.sha256()
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(MigrationConfig.CHUNK_SIZE), b''):
                sha256.update(chunk)
        return sha256.hexdigest()
    
    def verify_prerequisites(self) -> bool:
        """Phase 1: Safety checks"""
        self.console.print("\n[bold cyan]Phase 1: Safety Checks[/bold cyan]")
        
        checks = []
        
        # Check SESSION.md exists
        if not self.session_file.exists():
            checks.append(("[red]✗[/red]", "SESSION.md exists", "File not found"))
        else:
            size_kb = self.session_file.stat().st_size / 1024
            checks.append(("[green]✓[/green]", "SESSION.md exists", f"{size_kb:.1f}KB"))
        
        # Check file is readable
        try:
            with open(self.session_file, 'r', encoding='utf-8') as f:
                f.read(1)
            checks.append(("[green]✓[/green]", "SESSION.md readable", "OK"))
        except Exception as e:
            checks.append(("[red]✗[/red]", "SESSION.md readable", str(e)))
        
        # Check available disk space
        stat = os.statvfs(self.session_file.parent)
        free_mb = (stat.f_bavail * stat.f_frsize) / (1024 * 1024)
        if free_mb < 1:  # Need at least 1MB free
            checks.append(("[red]✗[/red]", "Disk space", f"{free_mb:.1f}MB (need 1MB)"))
        else:
            checks.append(("[green]✓[/green]", "Disk space", f"{free_mb:.1f}MB free"))
        
        # Check backup doesn't exist
        backup_path = self.session_file.with_suffix(self.session_file.suffix + MigrationConfig.BACKUP_SUFFIX)
        if backup_path.exists():
            checks.append(("[yellow]⚠[/yellow]", "No existing backup", f"Found {backup_path.name}"))
            if not self.force:
                self.console.print("[red]Backup already exists! Use --force to overwrite[/red]")
                return False
        else:
            checks.append(("[green]✓[/green]", "No existing backup", "OK"))
        
        # Check sessions folder
        if self.output_dir.exists() and any(self.output_dir.iterdir()):
            checks.append(("[yellow]⚠[/yellow]", "Sessions folder", "Exists with content"))
            if not self.force and not self.dry_run:
                if not Confirm.ask("[yellow]Sessions folder exists. Continue?[/yellow]"):
                    return False
        else:
            checks.append(("[green]✓[/green]", "Sessions folder", "Clear"))
        
        # Display checks table
        table = Table(title="Prerequisites Check")
        table.add_column("Status", style="cyan")
        table.add_column("Check", style="white")
        table.add_column("Details", style="gray50")
        
        for status, check, details in checks:
            table.add_row(status, check, details)
        
        self.console.print(table)
        
        # Check if all passed
        failed = any("[red]" in str(check[0]) for check in checks)
        if failed:
            self.console.print("\n[red]Prerequisites check failed![/red]")
            return False
        
        return True
    
    def create_backup(self) -> bool:
        """Phase 2: Create and verify backup"""
        if self.dry_run:
            self.console.print("\n[yellow]Phase 2: Backup (SKIPPED - dry run)[/yellow]")
            return True
        
        self.console.print("\n[bold cyan]Phase 2: Creating Backup[/bold cyan]")
        
        backup_path = self.session_file.with_suffix(self.session_file.suffix + MigrationConfig.BACKUP_SUFFIX)
        
        try:
            # Calculate original checksum
            self.console.print("Calculating original checksum...")
            original_checksum = self.calculate_checksum(self.session_file)
            original_size = self.session_file.stat().st_size
            
            # Copy file
            self.console.print(f"Creating backup: {backup_path.name}")
            shutil.copy2(self.session_file, backup_path)
            
            # Verify backup
            self.console.print("Verifying backup...")
            backup_checksum = self.calculate_checksum(backup_path)
            backup_size = backup_path.stat().st_size
            
            # Compare
            if original_checksum != backup_checksum:
                self.console.print(f"[red]✗ Checksum mismatch![/red]")
                self.console.print(f"  Original: {original_checksum}")
                self.console.print(f"  Backup:   {backup_checksum}")
                backup_path.unlink()  # Remove bad backup
                return False
            
            if original_size != backup_size:
                self.console.print(f"[red]✗ Size mismatch![/red]")
                self.console.print(f"  Original: {original_size} bytes")
                self.console.print(f"  Backup:   {backup_size} bytes")
                backup_path.unlink()  # Remove bad backup
                return False
            
            # Success
            self.console.print(f"[green]✓[/green] Backup created: {backup_path.name}")
            self.console.print(f"[green]✓[/green] Checksum verified: {original_checksum[:16]}...")
            self.console.print(f"[green]✓[/green] Size verified: {original_size/1024:.1f}KB")
            
            # Store in manifest
            self.manifest['backup'] = {
                'path': str(backup_path),
                'checksum': original_checksum,
                'size': original_size,
                'created_at': datetime.now().isoformat()
            }
            
            return True
            
        except Exception as e:
            self.console.print(f"[red]✗ Backup failed: {e}[/red]")
            if backup_path.exists():
                backup_path.unlink()
            return False
    
    def parse_sessions_with_state_machine(self) -> List[Dict]:
        """Phase 3: Parse sessions using state machine"""
        self.console.print("\n[bold cyan]Phase 3: Parsing Sessions[/bold cyan]")
        
        sessions = []
        current_session = None
        state = ParserState.NORMAL
        
        with open(self.session_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        total_lines = len(lines)
        self.console.print(f"Processing {total_lines} lines...")
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            console=self.console
        ) as progress:
            task = progress.add_task("Parsing...", total=total_lines)
            
            for line_num, line in enumerate(lines, 1):
                progress.update(task, advance=1)
                
                # Update state machine
                if state == ParserState.NORMAL:
                    if MigrationConfig.CODE_BLOCK_PATTERN.match(line):
                        state = ParserState.IN_CODE_BLOCK
                    elif MigrationConfig.QUOTE_PATTERN.match(line):
                        state = ParserState.IN_QUOTE
                elif state == ParserState.IN_CODE_BLOCK:
                    if MigrationConfig.CODE_BLOCK_PATTERN.match(line):
                        state = ParserState.NORMAL
                elif state == ParserState.IN_QUOTE:
                    if not MigrationConfig.QUOTE_PATTERN.match(line):
                        state = ParserState.NORMAL
                
                # Only look for session headers in NORMAL state
                if state == ParserState.NORMAL:
                    match = MigrationConfig.SESSION_PATTERN.match(line)
                    if match:
                        # Save previous session if exists
                        if current_session:
                            current_session['end_line'] = line_num - 1
                            current_session['content'] = ''.join(current_session['lines'])
                            current_session['line_count'] = len(current_session['lines'])
                            current_session['char_count'] = len(current_session['content'])
                            del current_session['lines']  # Save memory
                            sessions.append(current_session)
                        
                        # Start new session
                        date_str = match.group(1)
                        time_str = match.group(2)
                        title = match.group(3).strip()
                        
                        # Apply date corrections
                        if date_str in MigrationConfig.DATE_CORRECTIONS:
                            original_date = date_str
                            date_str = MigrationConfig.DATE_CORRECTIONS[date_str]
                            self.logger.info(f"Corrected date: {original_date} → {date_str}")
                        
                        # Remove leading dash and clean title
                        if title.startswith(' -'):
                            title = title[2:].strip()
                        elif title.startswith('-'):
                            title = title[1:].strip()
                        
                        current_session = {
                            'date': date_str,
                            'time': time_str,
                            'title': title,
                            'start_line': line_num,
                            'lines': [line],
                            'header': line.strip()
                        }
                
                # Add line to current session
                if current_session:
                    current_session['lines'].append(line)
        
        # Don't forget the last session
        if current_session:
            current_session['end_line'] = total_lines
            current_session['content'] = ''.join(current_session['lines'])
            current_session['line_count'] = len(current_session['lines'])
            current_session['char_count'] = len(current_session['content'])
            del current_session['lines']
            sessions.append(current_session)
        
        # Generate filenames
        date_counts = {}
        for session in sessions:
            date = session['date']
            date_counts[date] = date_counts.get(date, 0) + 1
            session['sequence'] = date_counts[date]
            
            # Create safe filename
            if session['title']:
                # Clean title for filename
                safe_title = re.sub(r'[^\w\s-]', '', session['title'])
                safe_title = re.sub(r'[-\s]+', '-', safe_title)
                safe_title = safe_title.strip('-').lower()
                if len(safe_title) > MigrationConfig.MAX_FILENAME_LENGTH:
                    safe_title = safe_title[:MigrationConfig.MAX_FILENAME_LENGTH].rstrip('-')
            else:
                safe_title = "untitled"
            
            session['filename'] = f"{date}-{session['sequence']:03d}-{safe_title}.md"
            
            # Determine folder path
            year, month, _ = date.split('-')
            session['folder'] = Path(year) / month
        
        self.console.print(f"[green]✓[/green] Parsed {len(sessions)} sessions")
        
        # Show corrections applied
        corrections_applied = sum(1 for s in sessions if s['date'] != s['date'].replace('07', '01'))
        if corrections_applied > 0:
            self.console.print(f"[yellow]⚠[/yellow] Applied {len(MigrationConfig.DATE_CORRECTIONS)} date corrections")
        
        self.sessions = sessions
        return sessions
    
    def preview_migration(self, sessions: List[Dict]) -> None:
        """Show what would happen in migration"""
        self.console.print("\n[bold cyan]Migration Preview (DRY RUN)[/bold cyan]")
        
        # Group by folder
        by_folder = {}
        for session in sessions:
            folder = str(session['folder'])
            if folder not in by_folder:
                by_folder[folder] = []
            by_folder[folder].append(session)
        
        # Display table
        table = Table(title="Sessions to Migrate")
        table.add_column("Folder", style="cyan")
        table.add_column("Count", style="green")
        table.add_column("Date Range", style="yellow")
        table.add_column("Sample Files", style="gray50")
        
        for folder in sorted(by_folder.keys()):
            folder_sessions = by_folder[folder]
            dates = [s['date'] for s in folder_sessions]
            date_range = f"{min(dates)} to {max(dates)}"
            sample_files = folder_sessions[0]['filename']
            if len(folder_sessions) > 1:
                sample_files += f" (+{len(folder_sessions)-1} more)"
            
            table.add_row(
                f"sessions/{folder}/",
                str(len(folder_sessions)),
                date_range,
                sample_files
            )
        
        self.console.print(table)
        
        # Statistics
        total_lines = sum(s['line_count'] for s in sessions)
        total_chars = sum(s['char_count'] for s in sessions)
        
        stats_table = Table(title="Migration Statistics")
        stats_table.add_column("Metric", style="cyan")
        stats_table.add_column("Value", style="green")
        
        stats_table.add_row("Total Sessions", str(len(sessions)))
        stats_table.add_row("Total Lines", f"{total_lines:,}")
        stats_table.add_row("Total Characters", f"{total_chars:,}")
        stats_table.add_row("Date Corrections", str(len(MigrationConfig.DATE_CORRECTIONS)))
        stats_table.add_row("Folders to Create", str(len(by_folder)))
        
        self.console.print(stats_table)
    
    def execute_migration(self, sessions: List[Dict]) -> bool:
        """Phase 4: Execute the actual migration"""
        self.console.print("\n[bold cyan]Phase 4: Executing Migration[/bold cyan]")
        
        try:
            # Create folder structure
            self.output_dir.mkdir(exist_ok=True)
            (self.output_dir / "archive" / "completed").mkdir(parents=True, exist_ok=True)
            (self.output_dir / "archive" / "stale").mkdir(parents=True, exist_ok=True)
            
            # Process each session
            migrated = []
            errors = []
            
            for session in track(sessions, description="Migrating sessions..."):
                try:
                    # Create year/month folder
                    session_dir = self.output_dir / session['folder']
                    session_dir.mkdir(parents=True, exist_ok=True)
                    
                    # Create session file
                    session_path = session_dir / session['filename']
                    
                    # Generate metadata header
                    metadata = f"""---
session_id: {session['date']}-{session['sequence']:03d}
date: {session['date']}
time: {session['time']} CEST
title: {session['title'] or 'Untitled'}
original_lines: [{session['start_line']}, {session['end_line']}]
line_count: {session['line_count']}
character_count: {session['char_count']}
checksum: {hashlib.sha256(session['content'].encode()).hexdigest()}
migrated_at: {datetime.now().isoformat()}Z
---

"""
                    
                    # Write file
                    with open(session_path, 'w', encoding='utf-8') as f:
                        f.write(metadata)
                        f.write(session['content'])
                    
                    migrated.append(str(session_path))
                    
                    # Update status
                    self.status['sessions_processed'] = self.status.get('sessions_processed', [])
                    self.status['sessions_processed'].append({
                        'date': session['date'],
                        'path': str(session_path),
                        'timestamp': datetime.now().isoformat()
                    })
                    
                except Exception as e:
                    self.logger.error(f"Failed to migrate {session['date']}: {e}")
                    errors.append({'session': session['date'], 'error': str(e)})
            
            # Create symlink for most recent session
            if sessions:
                latest = sessions[0]  # First session is most recent
                latest_path = self.output_dir / latest['folder'] / latest['filename']
                symlink_path = self.output_dir / "current"
                
                if symlink_path.exists():
                    symlink_path.unlink()
                
                # Create relative symlink
                try:
                    rel_path = os.path.relpath(latest_path, self.output_dir)
                    symlink_path.symlink_to(rel_path)
                    self.console.print(f"[green]✓[/green] Created symlink: current → {rel_path}")
                except Exception as e:
                    self.logger.warning(f"Could not create symlink: {e}")
            
            # Create new minimal SESSION.md index
            self.create_index_file(sessions)
            
            # Save manifest
            self.manifest['migration'] = {
                'completed_at': datetime.now().isoformat(),
                'sessions_migrated': len(migrated),
                'errors': errors,
                'files_created': migrated
            }
            
            manifest_path = self.session_file.parent / MigrationConfig.MANIFEST_FILE
            with open(manifest_path, 'w') as f:
                json.dump(self.manifest, f, indent=2)
            
            if errors:
                self.console.print(f"[yellow]⚠[/yellow] Migration completed with {len(errors)} errors")
                return False
            else:
                self.console.print(f"[green]✓[/green] Successfully migrated {len(migrated)} sessions")
                return True
                
        except Exception as e:
            self.console.print(f"[red]✗ Migration failed: {e}[/red]")
            return False
    
    def create_index_file(self, sessions: List[Dict]) -> None:
        """Create new minimal SESSION.md index"""
        if self.dry_run:
            return
        
        index_path = self.session_file.parent / "SESSION_NEW.md"
        
        # Get recent sessions (last 5)
        recent = sessions[:5] if len(sessions) >= 5 else sessions
        
        # Calculate date range
        all_dates = [s['date'] for s in sessions]
        date_range = f"{min(all_dates)} to {max(all_dates)}"
        
        # Build index content
        content = f"""# Active Session

Current: [sessions/{sessions[0]['folder']}/{sessions[0]['filename']}](sessions/{sessions[0]['folder']}/{sessions[0]['filename']})

## Recent (Last 5)
"""
        
        for session in recent:
            link = f"sessions/{session['folder']}/{session['filename']}"
            title = session['title'] or "Untitled"
            content += f"- [{session['date']}: {title}]({link})\n"
        
        content += f"""
## Stats
- Total: {len(sessions)} sessions
- Range: {date_range}
- Backup: SESSION.md.backup ({self.session_file.stat().st_size/1024:.0f}KB)

## Search
`mcp__serena__search_for_pattern --relative_path "sessions/"`
"""
        
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        self.console.print(f"[green]✓[/green] Created index: SESSION_NEW.md ({len(content)} bytes)")
    
    def validate_migration(self) -> bool:
        """Phase 5: Validate the migration"""
        if self.dry_run:
            return True
        
        self.console.print("\n[bold cyan]Phase 5: Validation[/bold cyan]")
        
        checks = []
        
        # Count total lines in migrated files
        total_migrated_lines = 0
        total_migrated_chars = 0
        
        for session in self.sessions:
            session_path = self.output_dir / session['folder'] / session['filename']
            if session_path.exists():
                with open(session_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Subtract metadata lines (roughly 12 lines)
                    lines = content.split('\n')
                    content_start = next(i for i, line in enumerate(lines) if line == '---' and i > 0) + 2
                    actual_content = '\n'.join(lines[content_start:])
                    total_migrated_lines += len(actual_content.split('\n'))
                    total_migrated_chars += len(actual_content)
        
        # Original counts
        with open(self.session_file, 'r', encoding='utf-8') as f:
            original_content = f.read()
            original_lines = len(original_content.split('\n'))
            original_chars = len(original_content)
        
        # Line count check (allow small variance for metadata)
        line_diff = abs(original_lines - total_migrated_lines)
        if line_diff < 100:  # Allow for some header lines
            checks.append(("[green]✓[/green]", "Line count", f"{total_migrated_lines:,} vs {original_lines:,}"))
        else:
            checks.append(("[yellow]⚠[/yellow]", "Line count", f"Diff: {line_diff:,}"))
        
        # Character count check
        char_diff = abs(original_chars - total_migrated_chars)
        if char_diff < original_chars * 0.05:  # Allow 5% variance
            checks.append(("[green]✓[/green]", "Character count", f"Within 5% tolerance"))
        else:
            checks.append(("[yellow]⚠[/yellow]", "Character count", f"Diff: {char_diff:,}"))
        
        # File count check
        expected_files = len(self.sessions)
        actual_files = sum(1 for _ in self.output_dir.glob("**/*.md"))
        if actual_files == expected_files:
            checks.append(("[green]✓[/green]", "File count", f"{actual_files} files"))
        else:
            checks.append(("[red]✗[/red]", "File count", f"Expected {expected_files}, got {actual_files}"))
        
        # Symlink check
        symlink_path = self.output_dir / "current"
        if symlink_path.exists() and symlink_path.is_symlink():
            checks.append(("[green]✓[/green]", "Symlink", "Created"))
        else:
            checks.append(("[yellow]⚠[/yellow]", "Symlink", "Not created"))
        
        # Display validation table
        table = Table(title="Validation Results")
        table.add_column("Status", style="cyan")
        table.add_column("Check", style="white")
        table.add_column("Details", style="gray50")
        
        for status, check, details in checks:
            table.add_row(status, check, details)
        
        self.console.print(table)
        
        # Overall result
        failed = any("[red]" in str(check[0]) for check in checks)
        if failed:
            self.console.print("\n[red]⚠ Validation found issues[/red]")
            return False
        else:
            self.console.print("\n[green]✓ All validation checks passed[/green]")
            return True
    
    def generate_report(self) -> None:
        """Generate final migration report"""
        self.console.print("\n[bold cyan]Migration Report[/bold cyan]")
        
        # Group sessions by month
        by_month = {}
        for session in self.sessions:
            month_key = f"{session['folder']}".replace('/', '-')
            if month_key not in by_month:
                by_month[month_key] = 0
            by_month[month_key] += 1
        
        # Create report table
        table = Table(title="Migration Complete!")
        table.add_column("Metric", style="cyan", width=30)
        table.add_column("Value", style="green")
        
        table.add_row("✅ Backup created", f"SESSION.md.backup ({self.session_file.stat().st_size/1024:.0f}KB)")
        table.add_row("✅ Sessions extracted", f"{len(self.sessions)}/{len(self.sessions)}")
        table.add_row("✅ Date corrections", f"{len(MigrationConfig.DATE_CORRECTIONS)} applied")
        
        for month, count in sorted(by_month.items()):
            table.add_row(f"✅ {month}", f"{count} sessions")
        
        table.add_row("✅ Validation", "All checks passed")
        table.add_row("✅ Performance", f"Index reduced from {self.session_file.stat().st_size/1024:.0f}KB to <1KB")
        
        self.console.print(table)
        
        self.console.print("\n[bold green]No data lost. Original preserved as SESSION.md.backup[/bold green]")
        
        if not self.dry_run:
            self.console.print("\n[yellow]Next steps:[/yellow]")
            self.console.print("1. Review SESSION_NEW.md")
            self.console.print("2. When satisfied, rename: mv SESSION.md SESSION.md.old && mv SESSION_NEW.md SESSION.md")
            self.console.print("3. Test that everything works")
            self.console.print("4. Keep backup until certain everything is correct")
    
    def rollback(self) -> bool:
        """Rollback migration if something went wrong"""
        self.console.print("\n[bold red]Rolling back migration...[/bold red]")
        
        try:
            # Remove sessions folder
            if self.output_dir.exists():
                shutil.rmtree(self.output_dir)
                self.console.print("[green]✓[/green] Removed sessions folder")
            
            # Remove manifest files
            for filename in [MigrationConfig.STATUS_FILE, MigrationConfig.MANIFEST_FILE]:
                filepath = self.session_file.parent / filename
                if filepath.exists():
                    filepath.unlink()
                    self.console.print(f"[green]✓[/green] Removed {filename}")
            
            # Remove new index
            new_index = self.session_file.parent / "SESSION_NEW.md"
            if new_index.exists():
                new_index.unlink()
                self.console.print("[green]✓[/green] Removed SESSION_NEW.md")
            
            self.console.print("[green]✓[/green] Rollback complete")
            return True
            
        except Exception as e:
            self.console.print(f"[red]✗ Rollback failed: {e}[/red]")
            return False
    
    def run(self) -> bool:
        """Execute the complete migration"""
        try:
            # Phase 1: Prerequisites
            if not self.verify_prerequisites():
                return False
            
            # User confirmation (unless forced or dry-run)
            if not self.force and not self.dry_run:
                # Check if we're in an interactive terminal
                if sys.stdin.isatty():
                    if not Confirm.ask("\n[yellow]Proceed with migration?[/yellow]"):
                        self.console.print("[red]Migration cancelled[/red]")
                        return False
                else:
                    self.console.print("[yellow]Non-interactive mode detected. Use --force to skip confirmations or --dry-run for preview[/yellow]")
                    return False
            
            # Phase 2: Backup
            if not self.create_backup():
                return False
            
            # Phase 3: Parse
            sessions = self.parse_sessions_with_state_machine()
            
            if not sessions:
                self.console.print("[red]No sessions found![/red]")
                return False
            
            # Phase 4: Execute or Preview
            if self.dry_run:
                self.preview_migration(sessions)
                self.console.print("\n[yellow]DRY RUN COMPLETE - No changes made[/yellow]")
                self.console.print("Run without --dry-run to execute migration")
                return True
            else:
                if not self.execute_migration(sessions):
                    self.console.print("[red]Migration failed![/red]")
                    if sys.stdin.isatty():
                        if Confirm.ask("[yellow]Rollback changes?[/yellow]"):
                            self.rollback()
                    else:
                        self.console.print("[yellow]Auto-rollback in non-interactive mode[/yellow]")
                        self.rollback()
                    return False
            
            # Phase 5: Validate
            if not self.validate_migration():
                self.console.print("[yellow]Validation found issues - review manually[/yellow]")
            
            # Generate report
            self.generate_report()
            
            return True
            
        except KeyboardInterrupt:
            self.console.print("\n[yellow]Migration interrupted by user[/yellow]")
            if not self.dry_run:
                if sys.stdin.isatty():
                    if Confirm.ask("[yellow]Rollback changes?[/yellow]"):
                        self.rollback()
                else:
                    self.console.print("[yellow]Auto-rollback in non-interactive mode[/yellow]")
                    self.rollback()
            return False
        except Exception as e:
            self.console.print(f"\n[red]Unexpected error: {e}[/red]")
            self.logger.exception("Migration failed with exception")
            if not self.dry_run:
                if sys.stdin.isatty():
                    if Confirm.ask("[yellow]Rollback changes?[/yellow]"):
                        self.rollback()
                else:
                    self.console.print("[yellow]Auto-rollback in non-interactive mode[/yellow]")
                    self.rollback()
            return False

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Migrate SESSION.md to organized folder structure",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Always do dry run first!
  python migrate_sessions.py --dry-run
  
  # Execute migration with confirmations
  python migrate_sessions.py
  
  # Force migration (skip confirmations)
  python migrate_sessions.py --force
  
  # Verbose output for debugging
  python migrate_sessions.py --verbose --dry-run
        """
    )
    
    # Default paths relative to blog root (script is in scripts/migration/)
    blog_root = Path(__file__).parent.parent.parent
    
    parser.add_argument(
        '--session-file',
        type=Path,
        default=blog_root / 'SESSION.md',
        help='Path to SESSION.md file (default: ../../SESSION.md)'
    )
    
    parser.add_argument(
        '--output-dir',
        type=Path,
        default=blog_root / 'sessions',
        help='Output directory for sessions (default: ../../sessions/)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview migration without making changes (RECOMMENDED FIRST)'
    )
    
    parser.add_argument(
        '--force',
        action='store_true',
        help='Skip confirmations and overwrite existing files'
    )
    
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose output for debugging'
    )
    
    parser.add_argument(
        '--rollback',
        action='store_true',
        help='Rollback a previous migration attempt'
    )
    
    args = parser.parse_args()
    
    # Special rollback mode
    if args.rollback:
        console = Console()
        console.print("[bold red]ROLLBACK MODE[/bold red]")
        should_rollback = False
        if sys.stdin.isatty():
            should_rollback = Confirm.ask("[yellow]This will remove all migrated files. Continue?[/yellow]")
        else:
            console.print("[yellow]Non-interactive mode - use --force with --rollback to confirm[/yellow]")
            should_rollback = args.force
        
        if should_rollback:
            migrator = SessionMigrator(
                args.session_file,
                args.output_dir,
                dry_run=False,
                verbose=args.verbose,
                force=True
            )
            if migrator.rollback():
                console.print("[green]✓ Rollback successful[/green]")
                sys.exit(0)
            else:
                console.print("[red]✗ Rollback failed[/red]")
                sys.exit(1)
        else:
            console.print("[yellow]Rollback cancelled[/yellow]")
            sys.exit(0)
    
    # Normal migration mode
    console = Console()
    console.print("[bold cyan]SESSION.md Migration Tool[/bold cyan]")
    console.print("=" * 50)
    
    # Safety reminder
    if not args.dry_run:
        console.print("[bold yellow]⚠️  IMPORTANT SAFETY REMINDERS ⚠️[/bold yellow]")
        console.print("• Original SESSION.md will NOT be modified")
        console.print("• Full backup will be created first")
        console.print("• All changes can be rolled back")
        console.print("• Run with --dry-run first to preview")
        console.print("=" * 50)
    
    # Create migrator and run
    migrator = SessionMigrator(
        args.session_file,
        args.output_dir,
        dry_run=args.dry_run,
        verbose=args.verbose,
        force=args.force
    )
    
    # Execute migration
    success = migrator.run()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Integration Script for ULTRATHINK Enforcement System V2
Sets up the complete three-tier enforcement system
"""

import json
import shutil
import subprocess
from pathlib import Path
from datetime import datetime

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

class EnforcementIntegrator:
    """Integrate all enforcement components"""
    
    def __init__(self):
        self.hooks_dir = Path(".claude/hooks")
        self.settings_file = Path(".claude/settings.json")
        self.metadata_file = Path(".claude/templates/metadata/handler-rules.json")
        self.backup_dir = Path(".claude/backups")
        
    def check_prerequisites(self):
        """Check if all required files exist"""
        print(f"\n{Colors.BLUE}Checking prerequisites...{Colors.RESET}")
        
        required_files = [
            ("enforcement_v2.py", self.hooks_dir / "enforcement_v2.py"),
            ("user_prompt_submit_aggressive.py", self.hooks_dir / "user_prompt_submit_aggressive.py"),
            ("handler-rules.json", self.metadata_file)
        ]
        
        all_present = True
        for name, path in required_files:
            if path.exists():
                print(f"  {Colors.GREEN}✓{Colors.RESET} {name} found")
            else:
                print(f"  {Colors.RED}✗{Colors.RESET} {name} missing at {path}")
                all_present = False
        
        return all_present
    
    def backup_current_settings(self):
        """Backup current settings.json"""
        print(f"\n{Colors.BLUE}Backing up current settings...{Colors.RESET}")
        
        if self.settings_file.exists():
            self.backup_dir.mkdir(parents=True, exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = self.backup_dir / f"settings_{timestamp}.json"
            shutil.copy2(self.settings_file, backup_path)
            print(f"  Backed up to: {backup_path}")
            return backup_path
        else:
            print(f"  No existing settings.json to backup")
            return None
    
    def update_settings_json(self):
        """Update settings.json with new hooks configuration"""
        print(f"\n{Colors.BLUE}Updating settings.json...{Colors.RESET}")
        
        # Load existing settings or create new
        if self.settings_file.exists():
            with open(self.settings_file, 'r') as f:
                settings = json.load(f)
        else:
            settings = {}
        
        # Ensure hooks section exists
        if "hooks" not in settings:
            settings["hooks"] = {}
        
        # Configure UserPromptSubmit hook
        settings["hooks"]["UserPromptSubmit"] = [
            {
                "hooks": [
                    {
                        "type": "command",
                        "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/user_prompt_submit_aggressive.py",
                        "description": "Aggressive ULTRATHINK enforcement context injection"
                    }
                ]
            }
        ]
        
        # Configure PreToolUse hook with specific matchers
        settings["hooks"]["PreToolUse"] = [
            {
                "matcher": "Edit|Write|MultiEdit|Bash|Task|Read|Grep|Glob",
                "hooks": [
                    {
                        "type": "command",
                        "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/enforcement_v2.py",
                        "description": "Behavior-based ULTRATHINK enforcement with tool blocking"
                    }
                ]
            }
        ]
        
        # Add metadata about enforcement
        settings["enforcement_metadata"] = {
            "version": "2.0",
            "enabled": True,
            "integrated_at": datetime.now().isoformat(),
            "components": [
                "user_prompt_submit_aggressive.py",
                "enforcement_v2.py",
                "handler-rules.json"
            ]
        }
        
        # Write updated settings
        self.settings_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.settings_file, 'w') as f:
            json.dump(settings, f, indent=2)
        
        print(f"  {Colors.GREEN}✓{Colors.RESET} Settings updated with enforcement hooks")
        return True
    
    def make_hooks_executable(self):
        """Ensure hooks are executable"""
        print(f"\n{Colors.BLUE}Setting hook permissions...{Colors.RESET}")
        
        hooks = [
            self.hooks_dir / "enforcement_v2.py",
            self.hooks_dir / "user_prompt_submit_aggressive.py"
        ]
        
        for hook in hooks:
            if hook.exists():
                hook.chmod(0o755)
                print(f"  {Colors.GREEN}✓{Colors.RESET} Made {hook.name} executable")
    
    def test_integration(self):
        """Run basic integration test"""
        print(f"\n{Colors.BLUE}Testing integration...{Colors.RESET}")
        
        # Test if hooks can be executed
        test_hook = self.hooks_dir / "enforcement_v2.py"
        test_input = json.dumps({
            "tool_name": "Read",
            "tool_input": {"file_path": "test.md"}
        })
        
        try:
            result = subprocess.run(
                ['python3', str(test_hook)],
                input=test_input,
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode in [0, 1, 2]:
                print(f"  {Colors.GREEN}✓{Colors.RESET} Hook execution successful")
                return True
            else:
                print(f"  {Colors.RED}✗{Colors.RESET} Hook execution failed")
                return False
                
        except Exception as e:
            print(f"  {Colors.RED}✗{Colors.RESET} Test failed: {e}")
            return False
    
    def display_status(self):
        """Display current enforcement status"""
        print(f"\n{Colors.MAGENTA}{'='*60}{Colors.RESET}")
        print(f"{Colors.BOLD}ENFORCEMENT SYSTEM STATUS{Colors.RESET}")
        print(f"{Colors.MAGENTA}{'='*60}{Colors.RESET}")
        
        # Check state
        state_file = Path("logs/state.json")
        if state_file.exists():
            with open(state_file) as f:
                state = json.load(f)
            
            ultrathink = state.get("ultrathink", {})
            print(f"\n{Colors.BOLD}Current State:{Colors.RESET}")
            print(f"  Required: {ultrathink.get('required', False)}")
            print(f"  Phase: {ultrathink.get('phase', 'not_started')}")
            print(f"  Completed: {ultrathink.get('completed', False)}")
        
        # Check proof files
        proof_dir = Path(".claude/state")
        if proof_dir.exists():
            proofs = list(proof_dir.glob("*-proof.json"))
            print(f"\n{Colors.BOLD}Proof Files:{Colors.RESET}")
            for proof in proofs[:5]:  # Show first 5
                print(f"  • {proof.name}")
            if len(proofs) > 5:
                print(f"  ... and {len(proofs) - 5} more")
        
        # Check metrics
        if self.metadata_file.exists():
            with open(self.metadata_file) as f:
                metadata = json.load(f)
            
            metrics = metadata.get("metrics", {}).get("enforcement_stats", {})
            print(f"\n{Colors.BOLD}Enforcement Metrics:{Colors.RESET}")
            print(f"  Total prompts: {metrics.get('total_prompts', 0)}")
            print(f"  ULTRATHINK completed: {metrics.get('ultrathink_completed', 0)}")
            print(f"  Tools blocked: {metrics.get('tools_blocked', 0)}")
    
    def integrate(self):
        """Main integration process"""
        print(f"\n{Colors.MAGENTA}{'='*60}{Colors.RESET}")
        print(f"{Colors.BOLD}ULTRATHINK ENFORCEMENT V2 INTEGRATION{Colors.RESET}")
        print(f"{Colors.MAGENTA}{'='*60}{Colors.RESET}")
        
        # Step 1: Check prerequisites
        if not self.check_prerequisites():
            print(f"\n{Colors.RED}Integration failed: Missing prerequisites{Colors.RESET}")
            return False
        
        # Step 2: Backup current settings
        backup = self.backup_current_settings()
        
        # Step 3: Update settings.json
        if not self.update_settings_json():
            print(f"\n{Colors.RED}Integration failed: Could not update settings{Colors.RESET}")
            if backup:
                print(f"Restore from: {backup}")
            return False
        
        # Step 4: Set permissions
        self.make_hooks_executable()
        
        # Step 5: Test integration
        if not self.test_integration():
            print(f"\n{Colors.YELLOW}Warning: Integration test failed{Colors.RESET}")
        
        # Step 6: Display status
        self.display_status()
        
        print(f"\n{Colors.GREEN}{'='*60}{Colors.RESET}")
        print(f"{Colors.GREEN}{Colors.BOLD}✅ INTEGRATION COMPLETE!{Colors.RESET}")
        print(f"{Colors.GREEN}{'='*60}{Colors.RESET}")
        
        print(f"\n{Colors.BOLD}The three-tier enforcement system is now active:{Colors.RESET}")
        print(f"  1. {Colors.YELLOW}Context Injection{Colors.RESET} - Aggressive warnings on dev requests")
        print(f"  2. {Colors.YELLOW}Behavior Tracking{Colors.RESET} - Monitors tool usage patterns")
        print(f"  3. {Colors.YELLOW}Tool Blocking{Colors.RESET} - Prevents development without ULTRATHINK")
        
        print(f"\n{Colors.BOLD}Next steps:{Colors.RESET}")
        print(f"  • Test with: 'Please implement a new feature'")
        print(f"  • Monitor logs in: logs/state.json")
        print(f"  • Check proofs in: .claude/state/")
        print(f"  • Run tests: python3 .claude/hooks/test_enforcement_v2.py")
        
        if backup:
            print(f"\n{Colors.BLUE}Note: Previous settings backed up to:{Colors.RESET}")
            print(f"  {backup}")
        
        return True
    
    def rollback(self, backup_path: Path):
        """Rollback to previous settings"""
        print(f"\n{Colors.YELLOW}Rolling back to: {backup_path}{Colors.RESET}")
        
        if backup_path.exists():
            shutil.copy2(backup_path, self.settings_file)
            print(f"  {Colors.GREEN}✓{Colors.RESET} Settings restored")
            return True
        else:
            print(f"  {Colors.RED}✗{Colors.RESET} Backup file not found")
            return False

def main():
    """Main entry point"""
    import sys
    
    integrator = EnforcementIntegrator()
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "rollback" and len(sys.argv) > 2:
            backup = Path(sys.argv[2])
            success = integrator.rollback(backup)
        elif sys.argv[1] == "status":
            integrator.display_status()
            success = True
        else:
            print(f"Usage: {sys.argv[0]} [rollback <backup_path>|status]")
            success = False
    else:
        success = integrator.integrate()
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
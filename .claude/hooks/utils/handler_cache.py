#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "pyyaml",
# ]
# ///

import json
import yaml
import re
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime

class HandlerCache:
    def __init__(self, project_dir: str):
        self.project_dir = Path(project_dir)
        self.cache_file = self.project_dir / ".claude" / "hooks" / "logs" / "handler_cache.json"
        self.registry_file = self.project_dir / ".claude" / "templates" / "REGISTRY.md"
        self.handlers_dir = self.project_dir / ".claude" / "templates" / "handlers"
        self.cache = {}
        self.last_update = None
        
    def build_cache(self) -> Dict:
        """Parse all handlers and build searchable cache"""
        cache = {
            "handlers": {},
            "triggers": {},
            "keywords": {},
            "categories": {},
            "last_updated": datetime.now().isoformat()
        }
        
        # Parse REGISTRY.md for handler list
        if self.registry_file.exists():
            registry_content = self.registry_file.read_text()
            
            # Find all handler sections with proper escaping
            handler_pattern = r'#### Handler: `([^`]+)` \{#[^}]+\}(.*?)(?=####|$)'
            
            for handler_match in re.finditer(handler_pattern, registry_content, re.DOTALL):
                handler_name = handler_match.group(1)
                section_text = handler_match.group(2)
                
                # Extract location/path
                path_match = re.search(r'- \*\*Location\*\*: (.+)$', section_text, re.MULTILINE)
                if path_match:
                    handler_path = path_match.group(1).strip()
                    handler_file = self.project_dir / ".claude" / "templates" / handler_path
                    
                    # Extract triggers
                    triggers = []
                    trigger_match = re.search(r'- \*\*Triggers\*\*: "([^"]+)"', section_text)
                    if trigger_match:
                        # Split by quotes and commas
                        trigger_text = trigger_match.group(1)
                        triggers = [t.strip() for t in re.split(r'",\s*"', trigger_text)]
                    
                    # Extract keywords
                    keywords = []
                    keyword_match = re.search(r'- \*\*Keywords\*\*: \[([^\]]+)\]', section_text)
                    if keyword_match:
                        keywords = [k.strip() for k in keyword_match.group(1).split(',')]
                    
                    # Parse handler file for additional metadata
                    handler_data = {
                        "name": handler_name,
                        "path": handler_path,
                        "triggers": triggers,
                        "keywords": keywords
                    }
                    
                    if handler_file.exists():
                        file_data = self._parse_handler_file(handler_file)
                        if file_data:
                            handler_data.update(file_data)
                    
                    cache["handlers"][handler_name] = handler_data
                    
                    # Index by triggers
                    for trigger in triggers:
                        if trigger not in cache["triggers"]:
                            cache["triggers"][trigger] = []
                        cache["triggers"][trigger].append(handler_name)
                    
                    # Index by keywords
                    for keyword in keywords:
                        if keyword not in cache["keywords"]:
                            cache["keywords"][keyword] = []
                        cache["keywords"][keyword].append(handler_name)
        
        self.cache = cache
        self._save_cache()
        return cache
    
    def _parse_handler_file(self, handler_file: Path) -> Optional[Dict]:
        """Extract metadata from handler file"""
        try:
            content = handler_file.read_text()
            
            # Look for YAML frontmatter
            if content.startswith('---'):
                yaml_end = content.find('---', 3)
                if yaml_end > 0:
                    yaml_content = content[3:yaml_end]
                    metadata = yaml.safe_load(yaml_content)
                    
                    # Add file path and parse category from path
                    metadata["file_path"] = str(handler_file.relative_to(self.project_dir))
                    path_parts = handler_file.parts
                    if "handlers" in path_parts:
                        idx = path_parts.index("handlers")
                        if len(path_parts) > idx + 1:
                            metadata["category"] = path_parts[idx + 1]
                    
                    return metadata
            
        except Exception as e:
            print(f"Error parsing {handler_file}: {e}")
        
        return None
    
    def find_handlers(self, query: str, limit: int = 5) -> List[Tuple[str, float]]:
        """Find handlers matching query with confidence scores"""
        if not self.cache:
            self.load_cache()
        
        results = []
        query_lower = query.lower()
        query_words = set(query_lower.split())
        
        for handler_name, handler_data in self.cache.get("handlers", {}).items():
            score = 0.0
            
            # Exact trigger matches (highest weight)
            for trigger in handler_data.get("triggers", []):
                trigger_lower = trigger.lower()
                if query_lower in trigger_lower:
                    score += 10.0
                if trigger_lower in query_lower:
                    score += 8.0
            
            # Keyword matches
            handler_keywords = set(k.lower() for k in handler_data.get("keywords", []))
            keyword_overlap = len(query_words & handler_keywords)
            score += keyword_overlap * 3.0
            
            # Name similarity
            if query_lower in handler_name.lower():
                score += 5.0
            
            # Description matches
            description = handler_data.get("description", "").lower()
            if query_lower in description:
                score += 2.0
            
            if score > 0:
                results.append((handler_name, score))
        
        # Sort by score and return top results
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:limit]
    
    def get_handler_info(self, handler_name: str) -> Optional[Dict]:
        """Get detailed information about a specific handler"""
        if not self.cache:
            self.load_cache()
        
        return self.cache.get("handlers", {}).get(handler_name)
    
    def load_cache(self) -> bool:
        """Load cache from file"""
        if self.cache_file.exists():
            try:
                with open(self.cache_file, 'r') as f:
                    self.cache = json.load(f)
                    return True
            except Exception:
                pass
        return False
    
    def _save_cache(self):
        """Save cache to file"""
        self.cache_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.cache_file, 'w') as f:
            json.dump(self.cache, f, indent=2)
    
    def needs_update(self) -> bool:
        """Check if cache needs updating"""
        if not self.cache_file.exists():
            return True
        
        cache_mtime = self.cache_file.stat().st_mtime
        registry_mtime = self.registry_file.stat().st_mtime if self.registry_file.exists() else 0
        
        return registry_mtime > cache_mtime
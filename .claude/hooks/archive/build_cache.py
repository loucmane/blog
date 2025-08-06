#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "pyyaml",
# ]
# ///

"""Build handler cache for template integration"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from utils.handler_cache import HandlerCache

def main():
    # Get the actual project directory (parent of .claude/hooks)
    script_dir = Path(__file__).parent
    project_dir = script_dir.parent.parent
    print(f"Building handler cache for: {project_dir}")
    
    cache = HandlerCache(str(project_dir))
    result = cache.build_cache()
    
    print(f"\nCache built successfully!")
    print(f"- Handlers: {len(result.get('handlers', {}))}")
    print(f"- Triggers: {len(result.get('triggers', {}))}")
    print(f"- Keywords: {len(result.get('keywords', {}))}")
    print(f"- Cache saved to: {cache.cache_file}")
    
    # Test some queries
    print("\nTesting handler matching:")
    test_queries = ["implement feature", "fix bug", "debug issue"]
    
    for query in test_queries:
        matches = cache.find_handlers(query, limit=3)
        print(f"\n'{query}':")
        for name, score in matches:
            print(f"  {name}: {score:.1f}")

if __name__ == '__main__':
    main()
#!/usr/bin/env python3
"""
Print a ready-to-use ULTRATHINK S:W:H:E skeleton.
Usage: ultrathink_skeleton.py [--work implementation|debugging|refactoring|testing]
"""
import sys
from datetime import datetime

def main():
    w = 'implementation'
    argv = sys.argv[1:]
    if '--work' in argv:
        i = argv.index('--work')
        if i+1 < len(argv):
            w = argv[i+1]
    s = datetime.now().strftime('%Y%m%d')
    print(f"Let me ultrathink about this... [S:{s}|W:{w}|H:searching|E:pending]")

if __name__ == '__main__':
    main()

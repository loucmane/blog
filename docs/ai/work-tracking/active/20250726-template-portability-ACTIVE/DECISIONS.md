# Design Decisions

## Why Minimal Changes
- **Principle**: Maximum impact with minimum complexity
- **Precedent**: Previously solved S:W:H with just 8 word changes
- **Result**: 2 lines, 13 words for comprehensive improvement

## Why Both Rules
- **Work Folder Rule**: Guarantees coverage in active work
- **Trigger Expansion**: Catches work before entering folders
- **Synergy**: Overlapping coverage with no gaps

## Why Not Complex Detection
- **Rejected**: Adding Layer 2.5 or new detection modes
- **Reason**: Complexity breeds edge cases
- **Chosen**: Simple rules that compose well

## Context Over Modes
- **Rejected**: "Work Mode" vs "Casual Mode" thinking
- **Chosen**: Context-aware system using directory as truth
- **Benefit**: No mode switching, just natural context flow

## Implementation Choices
- **CLAUDE.md Only**: All changes in one file for simplicity
- **No Template Updates**: Avoided cascading changes
- **Backward Compatible**: Existing workflows continue to work
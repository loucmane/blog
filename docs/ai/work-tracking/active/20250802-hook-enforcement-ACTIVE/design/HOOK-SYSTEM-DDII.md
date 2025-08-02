# Hook System Enhancement Design Document

## Document Info
- **Type**: Detailed Design for Implementation and Integration (DDII)
- **Status**: Draft
- **Created**: 2025-08-02
- **Author**: Claude with user collaboration

## Executive Summary

This DDII outlines comprehensive enhancements to the ULTRATHINK hook enforcement system. The current system successfully prevents development work without proper protocol compliance but lacks advanced features like quality validation, metrics tracking, and helpful guidance. This design proposes 12 major improvements prioritized by impact and implementation complexity.

## Problem Statement

### Current State
- Basic 3-hook system enforces ULTRATHINK protocol
- Binary blocking (work/don't work) with minimal context
- No validation of S:W:H:E quality
- Limited error messages
- No metrics or learning capability
- Manual session management

### Desired State
- Intelligent enforcement with quality validation
- Rich error messages with guidance
- Comprehensive metrics and analytics
- Automated session management
- Multi-phase development support
- Developer-friendly dashboard

## Design Goals

1. **Zero Friction Compliance** - Make correct behavior easier than violations
2. **Helpful Not Hostile** - Guide rather than just block
3. **Data-Driven Improvement** - Learn from usage patterns
4. **Quality Over Quantity** - Validate correctness not just presence
5. **Progressive Enhancement** - Work well at basic level, excel with full features

## Technical Architecture

### Hook System Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ UserPromptSubmit│────►│    State Store   │◄────│   PreToolUse    │
└─────────────────┘     │ (logs/state.json)│     └─────────────────┘
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │   Metrics Store  │
                        │(logs/metrics.json)│
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │    Dashboard     │
                        │(logs/dashboard.html)│
                        └──────────────────┘
```

### State Management Schema

```json
{
  "session": {
    "id": "20250802",
    "started_at": "2025-08-02T14:30:00Z",
    "last_activity": "2025-08-02T16:45:00Z"
  },
  "ultrathink": {
    "required": true,
    "completed": false,
    "trigger": {
      "type": "explicit",
      "keyword": "implement",
      "full_text": "implement user authentication",
      "detected_at": "2025-08-02T16:45:00Z"
    },
    "statements": [
      {
        "S": "20250802",
        "W": "hook-refinement",
        "H": "create-docs",
        "E": "4/\"documentation created\"",
        "timestamp": "2025-08-02T16:46:00Z",
        "valid": true
      }
    ],
    "blocked_attempts": 3
  },
  "handler_cache": {
    "last_updated": "2025-08-02T14:00:00Z",
    "handlers": {
      "create-docs": {
        "location": "handlers/triggers/docs/create-docs.md",
        "keywords": ["document", "docs", "documentation"],
        "last_used": "2025-08-02T16:46:00Z"
      }
    }
  },
  "context": {
    "work_folders": ["20250802-hook-enforcement-ACTIVE"],
    "recent_searches": ["create.*doc", "documentation.*design"],
    "tools_used": ["mcp__serena__search_for_pattern", "TodoWrite"]
  }
}
```

## Detailed Enhancement Specifications

### 1. Enhanced State Tracking

**Purpose**: Provide rich context for debugging and analytics

**Implementation**:
```python
def track_development_trigger(prompt, trigger_info):
    state = read_state()
    state['ultrathink']['trigger'] = {
        'type': trigger_info['type'],  # explicit, implicit, context
        'keyword': trigger_info['keyword'],
        'full_text': prompt,
        'detected_at': datetime.now().isoformat(),
        'confidence': trigger_info.get('confidence', 1.0)
    }
    state['ultrathink']['required'] = True
    update_state(state)
```

**Benefits**:
- Understand which triggers are most common
- Debug false positives/negatives
- Provide context-aware error messages

### 2. S:W:H:E Quality Validation

**Purpose**: Ensure protocol compliance is meaningful, not just formatted

**Components**:
- **S Validation**: Check SESSION.md exists and matches date
- **W Validation**: Verify work folder exists or is valid activity
- **H Validation**: Confirm handler exists in REGISTRY.md
- **E Validation**: Ensure evidence format matches handler requirements

**Implementation**:
```python
def validate_swhe(s, w, h, e):
    errors = []
    
    # Validate Session
    if not validate_session(s):
        errors.append(f"Session {s} not found in SESSION.md")
    
    # Validate Work Context
    if not validate_work_context(w):
        errors.append(f"Work context '{w}' is not a valid folder or activity")
    
    # Validate Handler
    if h != "searching" and not handler_exists(h):
        errors.append(f"Handler '{h}' not found in REGISTRY.md")
        
    # Validate Evidence
    if not validate_evidence_format(e, h):
        errors.append(f"Evidence format '{e}' invalid for handler {h}")
    
    return len(errors) == 0, errors
```

### 3. Session Management Hook

**Purpose**: Automate session initialization and maintenance

**Hook**: `session_start.py`

**Features**:
- Auto-create SESSION.md if missing
- Update session ID daily
- Check for stale work folders
- Pre-populate S value for the day

**Implementation**:
```python
def main():
    today = datetime.now().strftime("%Y%m%d")
    session_file = Path("SESSION.md")
    
    # Create or update session
    if not session_file.exists() or not contains_today_session(session_file):
        create_session_entry(today)
    
    # Update state with session info
    state = read_state()
    state['session'] = {
        'id': today,
        'started_at': datetime.now().isoformat()
    }
    
    # Check for stale work folders
    stale_folders = find_stale_work_folders()
    if stale_folders:
        state['warnings'] = {
            'stale_folders': stale_folders,
            'message': f"Found {len(stale_folders)} work folders older than 30 days"
        }
    
    update_state(state)
```

### 4. Intelligent Error Messages

**Purpose**: Turn blocks into learning opportunities

**Features**:
- Show which specific trigger was detected
- Provide pre-filled ULTRATHINK template
- Suggest relevant handlers based on request
- Include quick-reference examples

**Implementation**:
```python
def generate_helpful_error(state):
    trigger = state['ultrathink']['trigger']
    session = state['session']['id']
    
    # Get handler suggestions
    suggestions = find_similar_handlers(trigger['keyword'])
    
    error_msg = f"""
❌ Development request requires ULTRATHINK format first.

Detected trigger: "{trigger['keyword']}" in your request
Full request: "{trigger['full_text']}"

Ready-to-use template:
Let me ultrathink about this... [S:{session}|W:YOUR_WORK_CONTEXT|H:searching|E:pending]

Suggested handlers for "{trigger['keyword']}":
{format_handler_suggestions(suggestions[:3])}

Example for your request:
Let me ultrathink about this... [S:{session}|W:implementation|H:{suggestions[0]['name']}|E:pending]
"""
    return error_msg
```

### 5. Handler Caching System

**Purpose**: Enable real-time validation of H values

**Features**:
- Cache all handlers from REGISTRY.md
- Refresh cache periodically (every hour)
- Validate H values instantly
- Track handler usage frequency

**Implementation**:
```python
def refresh_handler_cache():
    handlers = {}
    registry_content = read_file(".claude/templates/REGISTRY.md")
    
    # Parse all handler entries
    handler_pattern = r'#### Handler: `([^`]+)`.*?Keywords.*?\[(.*?)\]'
    matches = re.findall(handler_pattern, registry_content, re.DOTALL)
    
    for name, keywords in matches:
        handlers[name] = {
            'keywords': parse_keywords(keywords),
            'last_used': None,
            'use_count': 0
        }
    
    # Update cache
    state = read_state()
    state['handler_cache'] = {
        'last_updated': datetime.now().isoformat(),
        'handlers': handlers
    }
    update_state(state)
```

### 6. Metrics Tracking

**Purpose**: Provide insights for system improvement

**Metrics to Track**:
- Success rate (first-time compliance)
- Most common triggers
- Most used handlers
- Average time to compliance
- Blocked attempt patterns

**Implementation**:
```python
def update_metrics(event_type, details):
    metrics_file = Path("logs/metrics.json")
    metrics = read_json(metrics_file, default={
        'events': [],
        'summary': {
            'total_requests': 0,
            'successful_first_time': 0,
            'average_attempts': 0,
            'common_triggers': {},
            'handler_usage': {}
        }
    })
    
    # Record event
    metrics['events'].append({
        'timestamp': datetime.now().isoformat(),
        'type': event_type,
        'details': details
    })
    
    # Update summary statistics
    update_summary_stats(metrics['summary'], event_type, details)
    
    # Keep only last 1000 events
    metrics['events'] = metrics['events'][-1000:]
    
    write_json(metrics_file, metrics)
```

### 7. Template Integration

**Purpose**: Suggest handlers when blocking

**Features**:
- Search REGISTRY.md for relevant handlers
- Show top 3 matches with descriptions
- Include handler process snippets
- Link to full handler documentation

**Implementation**:
```python
def suggest_handlers(request_text):
    # Extract keywords from request
    keywords = extract_keywords(request_text)
    
    # Search handler cache
    scores = {}
    for handler_name, handler_info in get_handler_cache().items():
        score = calculate_relevance_score(keywords, handler_info['keywords'])
        if score > 0:
            scores[handler_name] = score
    
    # Get top 3
    top_handlers = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:3]
    
    # Format suggestions
    suggestions = []
    for handler_name, score in top_handlers:
        handler_info = load_handler_snippet(handler_name)
        suggestions.append({
            'name': handler_name,
            'score': score,
            'description': handler_info['description'],
            'process_preview': handler_info['process'][:100] + "..."
        })
    
    return suggestions
```

### 8. Context Accumulation

**Purpose**: Verify handler was actually searched before use

**Features**:
- Track all search operations
- Monitor handler-related file reads
- Validate comprehension before allowing use
- Prevent "fake" handler claims

**Implementation**:
```python
def track_context_gathering(tool_name, tool_input):
    if tool_name in ['mcp__serena__search_for_pattern', 'Grep']:
        pattern = tool_input.get('pattern', '')
        if 'handler' in pattern or 'REGISTRY' in str(tool_input):
            state = read_state()
            state['context']['recent_searches'].append({
                'pattern': pattern,
                'timestamp': datetime.now().isoformat(),
                'tool': tool_name
            })
            update_state(state)
```

### 9. Multi-Phase ULTRATHINK

**Purpose**: Support complex development with multiple phases

**Features**:
- Stack of ULTRATHINK statements
- Each phase properly documented
- Maintain audit trail
- Support handler chains

**Implementation**:
```python
def add_ultrathink_statement(swhe_text):
    state = read_state()
    s, w, h, e = parse_swhe(swhe_text)
    
    statement = {
        'S': s, 'W': w, 'H': h, 'E': e,
        'timestamp': datetime.now().isoformat(),
        'phase': len(state['ultrathink']['statements']) + 1,
        'valid': validate_swhe(s, w, h, e)[0]
    }
    
    state['ultrathink']['statements'].append(statement)
    state['ultrathink']['completed'] = True
    update_state(state)
```

### 10. Soft Enforcement Mode

**Purpose**: Handle ambiguous cases intelligently

**Confidence Levels**:
- **High (>0.8)**: Hard block
- **Medium (0.5-0.8)**: Warning but allow
- **Low (<0.5)**: Log but don't interfere

**Implementation**:
```python
def calculate_trigger_confidence(prompt):
    explicit_score = check_explicit_triggers(prompt)
    if explicit_score > 0:
        return 1.0  # Explicit triggers always high confidence
    
    implicit_score = check_implicit_triggers(prompt)
    context_score = check_context_triggers(prompt)
    
    # Weighted combination
    confidence = (implicit_score * 0.7) + (context_score * 0.3)
    
    return min(confidence, 1.0)
```

### 11. Handler Chain Tracking

**Purpose**: Document workflow progression

**Features**:
- Track handler sequences
- Record handler dependencies
- Validate workflow completion
- Generate workflow documentation

**Implementation**:
```python
def track_handler_chain(current_handler, triggered_by=None):
    state = read_state()
    
    if 'handler_chain' not in state:
        state['handler_chain'] = []
    
    chain_entry = {
        'handler': current_handler,
        'triggered_by': triggered_by,
        'timestamp': datetime.now().isoformat(),
        'completed': False
    }
    
    state['handler_chain'].append(chain_entry)
    update_state(state)
```

### 12. Developer Dashboard

**Purpose**: Visual insights into hook system performance

**Features**:
- Current enforcement status
- Recent ULTRATHINK history
- Metrics visualization
- Configuration options
- Quick diagnostics

**Implementation**:
```html
<!DOCTYPE html>
<html>
<head>
    <title>ULTRATHINK Hook Dashboard</title>
    <style>
        body { font-family: monospace; background: #1e1e1e; color: #d4d4d4; }
        .metric { background: #2d2d2d; padding: 10px; margin: 10px; border-radius: 5px; }
        .success { color: #4fc14f; }
        .warning { color: #ce9178; }
        .error { color: #f48771; }
    </style>
</head>
<body>
    <h1>ULTRATHINK Enforcement Dashboard</h1>
    
    <div class="metric">
        <h2>Current Status</h2>
        <div id="current-status"></div>
    </div>
    
    <div class="metric">
        <h2>Recent Activity</h2>
        <div id="recent-activity"></div>
    </div>
    
    <div class="metric">
        <h2>Performance Metrics</h2>
        <canvas id="metrics-chart"></canvas>
    </div>
    
    <script>
        // Auto-refresh every 5 seconds
        setInterval(refreshDashboard, 5000);
        
        function refreshDashboard() {
            fetch('state.json')
                .then(r => r.json())
                .then(updateDisplay);
        }
    </script>
</body>
</html>
```

## Implementation Plan

### Phase 1: Core Enhancements (Week 1)
1. Enhanced state tracking (#1)
2. S:W:H:E quality validation (#2)
3. Session management hook (#3)
4. Intelligent error messages (#4)

### Phase 2: Intelligence Layer (Week 2)
5. Handler caching system (#5)
6. Template integration (#7)
7. Context accumulation (#8)

### Phase 3: Advanced Features (Week 3)
8. Metrics tracking (#6)
9. Multi-phase ULTRATHINK (#9)
10. Soft enforcement mode (#10)

### Phase 4: Polish & Visualization (Week 4)
11. Handler chain tracking (#11)
12. Developer dashboard (#12)
13. Testing and refinement

## Success Metrics

1. **Zero Manual Reminders** - Primary goal maintained
2. **First-Time Compliance Rate > 80%** - Users succeed on first attempt
3. **Average Time to Compliance < 30s** - Quick recovery from blocks
4. **Handler Discovery Success > 90%** - Suggestions match user intent
5. **False Positive Rate < 5%** - Minimal incorrect blocks

## Risk Mitigation

### Performance Impact
- **Risk**: Hooks slow down operations
- **Mitigation**: Async operations, caching, efficient algorithms

### Over-Engineering
- **Risk**: System becomes too complex
- **Mitigation**: Phased implementation, user feedback loops

### Breaking Changes
- **Risk**: Updates break existing workflows
- **Mitigation**: Backward compatibility, gradual rollout

## Testing Strategy

### Unit Tests
- Each enhancement tested independently
- Mock state and file operations
- Validate edge cases

### Integration Tests
- Full hook flow testing
- State persistence validation
- Error recovery scenarios

### User Acceptance
- Deploy to subset of users first
- Gather feedback on UX improvements
- Iterate based on real usage

## Conclusion

This design transforms the hook system from a simple enforcer to an intelligent assistant that guides users toward compliance while learning from their patterns. By implementing these enhancements in phases, we can maintain the current zero-reminder success while adding powerful new capabilities that make the system more helpful and insightful.

The key innovation is shifting from "blocking bad behavior" to "enabling good behavior" through intelligent suggestions, quality validation, and comprehensive tracking. This creates a positive feedback loop where compliance becomes the path of least resistance.
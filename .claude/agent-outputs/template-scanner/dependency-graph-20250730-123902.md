# Template System Dependency Graph

**Generated**: 2025-07-30 12:39:02
**Purpose**: Visual representation of handler dependencies and relationships

## Master Dependency Graph

```mermaid
graph TB
    subgraph "Entry Layer"
        USER[User Request]
        ULTRATHINK[ULTRATHINK System]
    end
    
    subgraph "Resolution Layer"
        VOID_S[resolve-session-void<br/>CONVENTIONS.md]
        VOID_W[resolve-work-void<br/>WORKFLOWS.md]
        VOID_H[resolve-handler-void<br/>REGISTRY.md]
    end
    
    subgraph "Pattern Layer"
        P_WORK[work-activity]
        P_FILE[file-operation]
        P_TOOL[tool-selection]
        P_EVIDENCE[evidence-check]
        P_TIME[time-capture]
        P_AMBIG[ambiguous-request]
    end
    
    subgraph "Handler Layer - Development"
        H_START[start-new-work]
        H_CONTINUE[continue-work]
        H_STANDARD[standard-dev-workflow]
        H_COMPONENT[create-component]
        H_REFACTOR[refactor-code]
        H_WORKFOLDER[create-work-folder]
    end
    
    subgraph "Handler Layer - Tools"
        H_SEARCH[search-code]
        H_FIND[find-symbol]
        H_EDIT[edit-file]
        H_COMMIT[commit-changes]
        H_READ[read-file]
    end
    
    subgraph "Handler Layer - Conventions"
        H_SESSION[session-start]
        H_VERIFY[verify-claim]
        H_NAMING[check-naming]
        H_STYLE[check-style]
        H_PREFLIGHT[check-conventions-first]
    end
    
    subgraph "Tool Layer"
        T_SERENA[Serena MCP]
        T_EDIT[Edit/MultiEdit]
        T_WRITE[Write]
        T_GREP[Grep]
        T_BASH[Bash]
        T_TODO[TodoWrite]
        T_TASK[Task Agent]
    end
    
    %% Entry connections
    USER --> ULTRATHINK
    ULTRATHINK --> VOID_S
    ULTRATHINK --> VOID_W
    ULTRATHINK --> VOID_H
    
    %% Resolution connections
    VOID_S -.-> H_SESSION
    VOID_W -.-> H_START
    VOID_H -.-> P_AMBIG
    
    %% Pattern to handler connections
    P_WORK --> H_START
    P_WORK --> H_CONTINUE
    P_FILE --> H_EDIT
    P_TOOL --> H_SEARCH
    P_EVIDENCE --> H_VERIFY
    P_TIME --> T_BASH
    
    %% Handler dependencies
    H_START --> H_WORKFOLDER
    H_START --> T_TODO
    H_START --> H_STANDARD
    H_WORKFOLDER --> T_WRITE
    H_STANDARD --> H_SEARCH
    H_STANDARD --> H_EDIT
    H_STANDARD --> H_COMMIT
    
    %% Tool connections
    H_SEARCH --> T_SERENA
    H_SEARCH --> T_GREP
    H_SEARCH --> T_TASK
    H_EDIT --> T_EDIT
    H_EDIT --> H_READ
    H_READ --> T_SERENA
    H_COMMIT --> T_BASH
    H_COMMIT --> H_VERIFY
    
    %% Convention checks
    H_EDIT --> H_PREFLIGHT
    H_PREFLIGHT --> H_NAMING
    H_PREFLIGHT --> H_STYLE
    
    %% Styling
    classDef entry fill:#e1f5fe,stroke:#01579b,stroke-width:3px
    classDef resolution fill:#fff3e0,stroke:#e65100,stroke-width:3px
    classDef pattern fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef handler fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef tool fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef missing fill:#ffccbc,stroke:#d32f2f,stroke-width:3px,stroke-dasharray: 5 5
    
    class USER,ULTRATHINK entry
    class VOID_S,VOID_W,VOID_H resolution
    class P_WORK,P_FILE,P_TOOL,P_EVIDENCE,P_TIME,P_AMBIG pattern
    class H_START,H_CONTINUE,H_STANDARD,H_COMPONENT,H_REFACTOR,H_WORKFOLDER,H_SEARCH,H_FIND,H_EDIT,H_COMMIT,H_READ,H_SESSION,H_VERIFY,H_NAMING,H_STYLE,H_PREFLIGHT handler
    class T_SERENA,T_EDIT,T_WRITE,T_GREP,T_BASH,T_TODO,T_TASK tool
```

## Critical Dependency Chains

### 1. Development Initialization Chain
```
start-new-work
├── create-work-folder
│   └── Write (7 files)
├── TodoWrite
│   └── Task breakdown
├── update-session
│   └── Edit SESSION.md
└── standard-dev-workflow
    ├── search-code
    ├── edit-file
    └── commit-changes
```

### 2. File Operation Chain
```
file-operation (pattern)
├── check-conventions-first
│   ├── Special file rules
│   └── Standard file rules
├── read-file
│   └── Read tool
└── edit-file
    ├── Edit/MultiEdit
    └── Validation
```

### 3. Search Operation Chain
```
tool-selection (pattern)
├── search-code
│   ├── Serena find_symbol
│   ├── Serena search_pattern
│   └── Task agent
├── find-symbol
│   └── Serena find_symbol
└── grep-pattern
    └── Grep tool
```

### 4. Convention Enforcement Chain
```
check-conventions-first
├── File conventions
│   └── Special rules
├── Naming conventions
│   └── check-naming
├── Git conventions
│   └── check-commit-msg
└── Code conventions
    └── check-style
```

## Handler Reference Frequency

### Most Referenced Handlers (Incoming Links)
1. **resolve-session-void**: 7 files reference it
2. **resolve-work-void**: 7 files reference it
3. **resolve-handler-void**: 7 files reference it
4. **start-new-work**: 5+ references
5. **search-code**: 4+ references
6. **edit-file**: 4+ references

### Most Dependent Handlers (Outgoing Links)
1. **start-new-work**: References 4 other handlers
2. **standard-dev-workflow**: References 4 other handlers
3. **search-code**: References 4 tools
4. **check-conventions-first**: References 4 convention checks

### Orphaned Handlers (No References)
1. **checkpoint-session**
2. **measure-complexity**
3. **format-code**

## Cross-File Dependencies

```mermaid
graph LR
    subgraph "Index"
        REGISTRY[REGISTRY.md]
    end
    
    subgraph "Implementation"
        WORKFLOWS[WORKFLOWS.md]
        TOOLS[TOOLS.md]
        CONVENTIONS[CONVENTIONS.md]
        BUILDING[BUILDING-BETTER.md]
    end
    
    subgraph "Meta"
        PATTERNS[PATTERNS.md]
        BEHAVIORS[BEHAVIORS.md]
        MATRICES[MATRICES.md]
    end
    
    REGISTRY --> WORKFLOWS
    REGISTRY --> TOOLS
    REGISTRY --> CONVENTIONS
    REGISTRY --> BUILDING
    
    WORKFLOWS <--> CONVENTIONS
    WORKFLOWS <--> TOOLS
    TOOLS <--> CONVENTIONS
    
    PATTERNS --> WORKFLOWS
    PATTERNS --> TOOLS
    PATTERNS --> CONVENTIONS
    
    BEHAVIORS --> WORKFLOWS
    BEHAVIORS --> TOOLS
    BEHAVIORS --> CONVENTIONS
    
    MATRICES --> WORKFLOWS
    MATRICES --> TOOLS
    MATRICES --> CONVENTIONS
```

## Missing Handler Dependencies

These handlers are referenced but don't exist:

```mermaid
graph TD
    subgraph "Missing Handlers"
        M1[fix-bug]
        M2[debug-issue]
        M3[explain-code]
        M4[code-review]
        M5[optimize-code]
        M6[create-docs]
    end
    
    subgraph "Existing Templates"
        T1[bug-fix-template]
        T2[emergency-debug]
        T3[code-review-template]
    end
    
    subgraph "References From"
        R1[MATRICES.md]
        R2[REGISTRY.md]
    end
    
    R1 --> M1
    R1 --> M2
    R1 --> M3
    R1 --> M4
    R2 --> M1
    R2 --> M2
    
    M1 -.-> T1
    M2 -.-> T2
    M4 -.-> T3
    
    style M1 fill:#ffccbc,stroke:#d32f2f,stroke-width:3px,stroke-dasharray: 5 5
    style M2 fill:#ffccbc,stroke:#d32f2f,stroke-width:3px,stroke-dasharray: 5 5
    style M3 fill:#ffccbc,stroke:#d32f2f,stroke-width:3px,stroke-dasharray: 5 5
    style M4 fill:#ffccbc,stroke:#d32f2f,stroke-width:3px,stroke-dasharray: 5 5
    style M5 fill:#ffccbc,stroke:#d32f2f,stroke-width:3px,stroke-dasharray: 5 5
    style M6 fill:#ffccbc,stroke:#d32f2f,stroke-width:3px,stroke-dasharray: 5 5
```

## Trigger Overlap Analysis

```mermaid
graph TD
    subgraph "Ambiguous Triggers"
        UPDATE["update X"]
        CREATE["create X"]
    end
    
    subgraph "Potential Handlers"
        U1[update-todos]
        U2[edit-file]
        U3[update-tracker]
        U4[update-session]
        
        C1[create-component]
        C2[create-file]
        C3[create-todos]
        C4[create-work-folder]
        C5[create-docs]
    end
    
    UPDATE --> U1
    UPDATE --> U2
    UPDATE --> U3
    UPDATE --> U4
    
    CREATE --> C1
    CREATE --> C2
    CREATE --> C3
    CREATE --> C4
    CREATE --> C5
    
    style UPDATE fill:#ffeb3b,stroke:#f57f17
    style CREATE fill:#ffeb3b,stroke:#f57f17
```

---

**Key Insights from Dependency Analysis:**

1. **Strong Foundation**: ULTRATHINK resolution system is well-connected
2. **Clear Layers**: Good separation between patterns, handlers, and tools
3. **Missing Links**: Several important handlers are missing (fix-bug, debug-issue)
4. **Orphaned Code**: Some handlers have no incoming references
5. **Ambiguous Routes**: Some triggers map to multiple handlers without clear disambiguation

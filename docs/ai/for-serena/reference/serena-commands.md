# Serena MCP - Complete Command Reference

## Project Management Commands

### activate_project
Activates a project for Serena to work with.

**Parameters:**
- `project` (string, required): Project name or absolute path

**Examples:**
```
# First time - use full path
Activate project /home/user/dev/MomsBlog/blog

# Subsequent times - use project name
Activate project blog
```

### remove_project
Removes a project from Serena's configuration.

**Parameters:**
- `project_name` (string, required): Name of the project to remove

**Example:**
```
Remove project blog
```

### get_current_config
Shows current configuration including active project, tools, and modes.

**Parameters:** None

**Example:**
```
Show current Serena configuration
```

## Memory Management Commands

### list_memories
Lists all available memories for the current project.

**Parameters:** None

**Example:**
```
Show me all memories for this project
```

### read_memory
Reads the content of a specific memory file.

**Parameters:**
- `memory_file_name` (string, required): Name of the memory to read
- `max_answer_chars` (integer, optional): Maximum characters to return (default: 200000)

**Examples:**
```
Read memory session_2025-06-21_task_7_orchestration_fix
Read the serena_twes_integration_plan memory
```

### write_memory
Creates a new memory with specified content.

**Parameters:**
- `memory_name` (string, required): Name for the memory
- `content` (string, required): Memory content in markdown format
- `max_answer_chars` (integer, optional): Maximum response size (default: 200000)

**Example:**
```
Create a memory called "authentication_architecture" with content about our auth decisions
```

### delete_memory
Deletes a memory file. Use with caution.

**Parameters:**
- `memory_file_name` (string, required): Name of the memory to delete

**Example:**
```
Delete memory old_session_notes
```

## Symbol Navigation Commands

### find_symbol
Finds symbols (classes, functions, methods, etc.) by name pattern.

**Parameters:**
- `name_path` (string, required): Symbol name or path pattern
- `relative_path` (string, optional): Restrict search to file/directory
- `depth` (integer, optional): Depth for retrieving descendants (default: 0)
- `include_body` (boolean, optional): Include source code (default: false)
- `substring_matching` (boolean, optional): Allow partial matches (default: false)
- `include_kinds` (array[int], optional): LSP symbol kinds to include
- `exclude_kinds` (array[int], optional): LSP symbol kinds to exclude
- `max_answer_chars` (integer, optional): Maximum response size

**Examples:**
```
Find the Button component
Find all methods in the AuthService class
Find symbol "handleSubmit" in components directory with body
Find all React components (using include_kinds for classes)
```

**Symbol Kinds Reference:**
- 5 = Class
- 6 = Method  
- 12 = Function
- 13 = Variable
- 14 = Constant

### find_referencing_symbols
Finds all symbols that reference a given symbol.

**Parameters:**
- `name_path` (string, required): Symbol to find references for
- `relative_path` (string, required): File containing the symbol
- `include_kinds` (array[int], optional): Filter by symbol kinds
- `exclude_kinds` (array[int], optional): Exclude symbol kinds
- `max_answer_chars` (integer, optional): Maximum response size

**Example:**
```
Find all references to the Button component in components/Button.tsx
Show me what calls the validateUser function
```

### get_symbols_overview
Gets an overview of top-level symbols in a file or directory.

**Parameters:**
- `relative_path` (string, required): File or directory path
- `max_answer_chars` (integer, optional): Maximum response size

**Examples:**
```
Show me the structure of components/Header.tsx
Get symbols overview for the entire components directory
```

## Code Modification Commands

### replace_symbol_body
Replaces the entire body of a symbol.

**Parameters:**
- `name_path` (string, required): Symbol to replace
- `relative_path` (string, required): File containing the symbol
- `body` (string, required): New symbol body

**Example:**
```
Replace the handleClick method in Button.tsx with new implementation
```

### insert_before_symbol
Inserts code before a symbol definition.

**Parameters:**
- `name_path` (string, required): Symbol to insert before
- `relative_path` (string, required): File containing the symbol
- `body` (string, required): Code to insert

**Example:**
```
Insert a new import before the Button class definition
```

### insert_after_symbol
Inserts code after a symbol definition.

**Parameters:**
- `name_path` (string, required): Symbol to insert after
- `relative_path` (string, required): File containing the symbol
- `body` (string, required): Code to insert

**Example:**
```
Add a new method after the constructor in AuthService
```

### replace_regex
Replaces content using regular expressions.

**Parameters:**
- `relative_path` (string, required): File to modify
- `regex` (string, required): Pattern to match
- `repl` (string, required): Replacement string
- `allow_multiple_occurrences` (boolean, optional): Replace all matches

**Example:**
```
Replace all occurrences of "oldTheme" with "newTheme" in theme.ts
```

## File and Search Commands

### find_file
Finds files matching a pattern.

**Parameters:**
- `file_mask` (string, required): Filename or pattern (supports * and ?)
- `relative_path` (string, required): Directory to search in

**Examples:**
```
Find all TypeScript files starting with "Button" in components
Find *.test.tsx files in the src directory
```

### list_dir
Lists files and directories in a given path.

**Parameters:**
- `relative_path` (string, required): Directory to list
- `recursive` (boolean, required): Include subdirectories
- `max_answer_chars` (integer, optional): Maximum response size

**Examples:**
```
List all files in the components directory
Recursively list the entire src folder structure
```

### search_for_pattern
Searches for a pattern in file contents.

**Parameters:**
- `pattern` (string, required): Regex pattern to search for
- `only_in_code_files` (boolean, optional): Search only code files (default: true)
- `paths_include_glob` (string, optional): Include only matching paths
- `paths_exclude_glob` (string, optional): Exclude matching paths
- `context_lines_before` (integer, optional): Lines before match
- `context_lines_after` (integer, optional): Lines after match
- `max_answer_chars` (integer, optional): Maximum response size

**Examples:**
```
Search for "TODO" comments in all code files
Find all console.log statements with 2 lines of context
Search for "deprecated" in documentation files
```

## Workflow Commands

### initial_instructions
Gets initial instructions for working with the project.

**Parameters:** None

**Example:**
```
Show me the initial Serena instructions
```

### onboarding
Performs initial project onboarding.

**Parameters:** None

**Example:**
```
Run Serena onboarding for this project
```

### check_onboarding_performed
Checks if onboarding has been completed.

**Parameters:** None

**Example:**
```
Has onboarding been performed for this project?
```

### switch_modes
Switches between different operation modes.

**Parameters:**
- `modes` (array[string], required): Mode names to activate

**Available Modes:**
- `editing` - For code modifications
- `interactive` - For user interaction
- `planning` - For task planning
- `one-shot` - For single operations

**Example:**
```
Switch to editing and interactive modes
```

## Thinking and Analysis Commands

### think_about_task_adherence
Prompts reflection on whether current work aligns with the task.

**Parameters:** None

**Example:**
```
Think about task adherence
```

### think_about_collected_information
Analyzes whether collected information is sufficient.

**Parameters:** None

**Example:**
```
Think about the collected information
```

### think_about_whether_you_are_done
Evaluates if the current task is complete.

**Parameters:** None

**Example:**
```
Think about whether the task is done
```

### summarize_changes
Summarizes all changes made in the current session.

**Parameters:** None

**Example:**
```
Summarize the changes made
```

## Advanced Commands

### restart_language_server
Restarts the language server if it becomes out of sync.

**Parameters:** None

**Example:**
```
Restart the Serena language server
```

### prepare_for_new_conversation
Prepares Serena for a fresh conversation context.

**Parameters:** None

**Example:**
```
Prepare for a new conversation
```

## Command Patterns and Best Practices

### 1. **Natural Language Usage**
Most commands can be invoked using natural language:
```
"Find the Button component" → find_symbol with name_path="Button"
"Show me all memories" → list_memories
"What calls validateUser?" → find_referencing_symbols
```

### 2. **Path Specifications**
- Always use relative paths from project root
- Use forward slashes even on Windows
- Omit leading slashes

### 3. **Symbol Path Syntax**
```
ClassName
ClassName/methodName
/TopLevelFunction
fileName/functionName
```

### 4. **Memory Naming Conventions**
```
session_YYYY-MM-DD_description
feature_name_architecture
bug_fix_issue_123
```

### 5. **Search Strategies**
1. Start broad with overview commands
2. Narrow down with specific symbol searches
3. Use reference finding for impact analysis
4. Combine with pattern search for edge cases

## Common Workflows

### Finding and Modifying Code
```
1. Get symbols overview for the target directory
2. Find the specific symbol you need
3. Read the symbol with include_body=true
4. Make modifications using replace_symbol_body
5. Find references to ensure compatibility
```

### Creating New Features
```
1. Search for similar existing features
2. Find the appropriate location using overview
3. Insert new code before/after related symbols
4. Update imports at file beginning
5. Create memory documenting the feature
```

### Refactoring
```
1. Find all references to the symbol
2. Plan the refactoring approach
3. Use batch operations for consistency
4. Verify no references were missed
5. Update related documentation
```

## Error Handling

Common errors and solutions:

1. **"No symbol found"** - Try substring_matching=true or broader search
2. **"File is gitignored"** - Serena respects .gitignore for safety
3. **"Multiple matches"** - Add more context to make pattern unique
4. **"Language server out of sync"** - Use restart_language_server

## Performance Tips

1. Use `relative_path` to limit search scope
2. Set appropriate `max_answer_chars` for large results
3. Avoid `include_body=true` unless needed
4. Use overview before detailed searches
5. Let initial indexing complete before heavy operations
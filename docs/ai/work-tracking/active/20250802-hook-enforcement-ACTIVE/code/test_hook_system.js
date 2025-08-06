/**
 * Comprehensive test suite for Claude Code hook system
 * 
 * This test suite validates:
 * 1. UserPromptSubmit hook - development detection
 * 2. PreToolUse hook - ULTRATHINK enforcement
 * 3. Stop hook - session cleanup and analytics
 * 4. State management and persistence
 * 5. Edge cases and error handling
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const HOOKS_DIR = '.claude/hooks';
const LOGS_DIR = 'logs';
const STATE_FILE = path.join(LOGS_DIR, 'state.json');
const ANALYTICS_FILE = path.join(LOGS_DIR, 'analytics.json');

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logTest(name, passed, details = '') {
  const status = passed ? '✓' : '✗';
  const color = passed ? 'green' : 'red';
  log(`  ${status} ${name}`, color);
  if (details) {
    log(`    ${details}`, 'gray');
  }
}

// Helper functions
function clearState() {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
  if (fs.existsSync(ANALYTICS_FILE)) {
    fs.unlinkSync(ANALYTICS_FILE);
  }
}

function readState() {
  if (!fs.existsSync(STATE_FILE)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

function readAnalytics() {
  if (!fs.existsSync(ANALYTICS_FILE)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf8'));
}

function runHook(hookScript, input) {
  const hookPath = path.join(HOOKS_DIR, hookScript);
  const command = `uv run ${hookPath}`;
  
  try {
    const result = execSync(command, {
      input: JSON.stringify(input),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, CLAUDE_PROJECT_DIR: process.cwd() }
    });
    return { success: true, output: result, error: null };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout || '', 
      error: error.stderr || error.message 
    };
  }
}

// Test UserPromptSubmit hook
function testUserPromptSubmit() {
  logSection('Testing UserPromptSubmit Hook');
  
  // Test 1: Non-development prompt
  clearState();
  let result = runHook('user_prompt_submit.py', {
    user_prompt: 'What is the weather today?'
  });
  let state = readState();
  logTest(
    'Non-development prompt detection',
    result.success && state && !state.ultrathink_required,
    'Should not require ULTRATHINK for casual conversation'
  );
  
  // Test 2: Explicit development trigger
  clearState();
  result = runHook('user_prompt_submit.py', {
    user_prompt: 'implement a new feature for user authentication'
  });
  state = readState();
  logTest(
    'Explicit development trigger detection',
    result.success && state && state.ultrathink_required,
    `Detected: ${state?.ultrathink?.trigger?.keyword} (${state?.ultrathink?.trigger?.type})`
  );
  
  // Test 3: Implicit development trigger
  clearState();
  result = runHook('user_prompt_submit.py', {
    user_prompt: 'the login function is not working properly'
  });
  state = readState();
  logTest(
    'Implicit development trigger detection',
    result.success && state && state.ultrathink_required,
    `Detected: ${state?.ultrathink?.trigger?.keyword} (${state?.ultrathink?.trigger?.type})`
  );
  
  // Test 4: File context trigger
  clearState();
  result = runHook('user_prompt_submit.py', {
    user_prompt: 'check the code in src/auth.js'
  });
  state = readState();
  logTest(
    'File context trigger detection',
    result.success && state && state.ultrathink_required,
    `Detected: ${state?.ultrathink?.trigger?.keyword} (${state?.ultrathink?.trigger?.type})`
  );
  
  // Test 5: Handler suggestions
  clearState();
  result = runHook('user_prompt_submit.py', {
    user_prompt: 'test the authentication module'
  });
  state = readState();
  const hasSuggestions = state?.ultrathink?.handler_suggestions?.length > 0;
  logTest(
    'Handler suggestions generation',
    result.success && hasSuggestions,
    hasSuggestions ? `Found ${state.ultrathink.handler_suggestions.length} suggestions` : 'No suggestions found'
  );
}

// Test PreToolUse hook
function testPreToolUse() {
  logSection('Testing PreToolUse Hook');
  
  // Test 1: Development tool without ULTRATHINK
  clearState();
  // First set up state requiring ULTRATHINK
  runHook('user_prompt_submit.py', {
    user_prompt: 'fix the bug in the login function'
  });
  
  let result = runHook('pre_tool_use.py', {
    tool_name: 'Edit',
    tool_input: { file_path: 'test.js', content: 'console.log("test");' },
    message: 'Editing the file'
  });
  
  logTest(
    'Block development tool without ULTRATHINK',
    !result.success && result.error.includes('ULTRATHINK'),
    'Should block Edit tool when ULTRATHINK required'
  );
  
  // Test 2: Development tool with ULTRATHINK
  result = runHook('pre_tool_use.py', {
    tool_name: 'Edit',
    tool_input: { file_path: 'test.js', content: 'console.log("test");' },
    message: 'Let me ultrathink about this... [S:20250804|W:debugging|H:fix-bug|E:3/"validate fix"]'
  });
  
  let state = readState();
  logTest(
    'Allow development tool with ULTRATHINK',
    result.success && state?.ultrathink_completed,
    'Should allow Edit tool after ULTRATHINK'
  );
  
  // Test 3: Non-development tool
  clearState();
  runHook('user_prompt_submit.py', {
    user_prompt: 'search for authentication code'
  });
  
  result = runHook('pre_tool_use.py', {
    tool_name: 'Read',
    tool_input: { file_path: 'test.js' },
    message: 'Reading the file'
  });
  
  logTest(
    'Allow non-development tools',
    result.success,
    'Read tool should always be allowed'
  );
  
  // Test 4: Handler validation
  result = runHook('pre_tool_use.py', {
    tool_name: 'Write',
    tool_input: { file_path: 'test.js', content: 'test' },
    message: 'Let me ultrathink about this... [S:20250804|W:testing|H:invalid-handler|E:pending]'
  });
  
  logTest(
    'Validate handler names',
    result.success,
    'Should warn about invalid handlers but not block'
  );
  
  // Test 5: Track blocked attempts
  clearState();
  runHook('user_prompt_submit.py', {
    user_prompt: 'implement new feature'
  });
  
  // Try multiple blocked attempts
  for (let i = 0; i < 3; i++) {
    runHook('pre_tool_use.py', {
      tool_name: 'Write',
      tool_input: { file_path: `test${i}.js`, content: 'test' },
      message: 'Writing file'
    });
  }
  
  state = readState();
  logTest(
    'Track blocked attempts',
    state?.ultrathink?.blocked_attempts === 3,
    `Blocked attempts: ${state?.ultrathink?.blocked_attempts || 0}`
  );
}

// Test Stop hook
function testStopHook() {
  logSection('Testing Stop Hook');
  
  // Test 1: Successful ULTRATHINK compliance
  clearState();
  runHook('user_prompt_submit.py', {
    user_prompt: 'implement user authentication'
  });
  
  let result = runHook('stop.py', {
    content: 'Let me ultrathink about this... [S:20250804|W:implementation|H:create-component|E:5/"tests pass"]\n\nImplemented the feature successfully.'
  });
  
  let state = readState();
  logTest(
    'Clear state on successful compliance',
    result.success && state && !state.ultrathink_required,
    'State should be cleared after successful completion'
  );
  
  // Test 2: Failed ULTRATHINK compliance
  clearState();
  runHook('user_prompt_submit.py', {
    user_prompt: 'fix the login bug'
  });
  
  result = runHook('stop.py', {
    content: 'I fixed the bug by updating the login function.'
  });
  
  logTest(
    'Warn on missing ULTRATHINK',
    !result.success && result.error.includes('not properly used'),
    'Should warn when ULTRATHINK was required but not used'
  );
  
  // Test 3: No ULTRATHINK required
  clearState();
  runHook('user_prompt_submit.py', {
    user_prompt: 'What is React?'
  });
  
  result = runHook('stop.py', {
    content: 'React is a JavaScript library for building user interfaces.'
  });
  
  logTest(
    'No action when ULTRATHINK not required',
    result.success,
    'Should succeed silently for non-development conversations'
  );
  
  // Test 4: Analytics generation
  clearState();
  runHook('user_prompt_submit.py', {
    user_prompt: 'create a new component'
  });
  
  // Add some tool usage
  runHook('pre_tool_use.py', {
    tool_name: 'Write',
    tool_input: { file_path: 'test.js', content: 'test' },
    message: 'Writing'
  });
  
  result = runHook('stop.py', {
    content: 'Let me ultrathink about this... [S:20250804|W:development|H:create-component|E:done]'
  });
  
  const analytics = readAnalytics();
  logTest(
    'Generate analytics report',
    analytics.length > 0 && analytics[analytics.length - 1].ultrathink_compliance,
    `Analytics entries: ${analytics.length}`
  );
  
  // Test 5: Session ID update
  clearState();
  // Create state with old session ID
  fs.writeFileSync(STATE_FILE, JSON.stringify({
    session: { id: '20250803' },
    ultrathink_required: false
  }));
  
  result = runHook('stop.py', {
    content: 'Test content'
  });
  
  state = readState();
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  logTest(
    'Update session ID to current date',
    state?.session?.id === today,
    `Session ID: ${state?.session?.id}`
  );
}

// Test edge cases
function testEdgeCases() {
  logSection('Testing Edge Cases');
  
  // Test 1: Empty input
  let result = runHook('user_prompt_submit.py', {});
  logTest(
    'Handle empty input gracefully',
    result.success,
    'Should not crash on empty input'
  );
  
  // Test 2: Invalid JSON
  const command = `echo "invalid json" | uv run ${path.join(HOOKS_DIR, 'user_prompt_submit.py')}`;
  try {
    execSync(command, { encoding: 'utf8' });
    logTest('Handle invalid JSON', true, 'Gracefully handled');
  } catch (error) {
    logTest('Handle invalid JSON', error.code === 0, 'Should exit gracefully');
  }
  
  // Test 3: Missing state file
  clearState();
  result = runHook('pre_tool_use.py', {
    tool_name: 'Edit',
    tool_input: { file_path: 'test.js' },
    message: 'Test'
  });
  logTest(
    'Handle missing state file',
    result.success,
    'Should create default state if missing'
  );
  
  // Test 4: Corrupted state file
  fs.writeFileSync(STATE_FILE, 'corrupted data');
  result = runHook('stop.py', {
    content: 'Test content'
  });
  logTest(
    'Handle corrupted state file',
    result.success,
    'Should use default state on corruption'
  );
  
  // Test 5: Multiple ULTRATHINK statements
  clearState();
  runHook('user_prompt_submit.py', {
    user_prompt: 'implement multiple features'
  });
  
  result = runHook('pre_tool_use.py', {
    tool_name: 'Write',
    tool_input: { file_path: 'test.js' },
    message: 'First: [S:20250804|W:feat1|H:searching|E:pending]\nSecond: [S:20250804|W:feat2|H:create-component|E:3/"done"]'
  });
  
  const state = readState();
  logTest(
    'Track multiple ULTRATHINK statements',
    state?.ultrathink?.statements?.length === 2,
    `Statements tracked: ${state?.ultrathink?.statements?.length || 0}`
  );
}

// Test state persistence
function testStatePersistence() {
  logSection('Testing State Persistence');
  
  // Test 1: State persists across hook calls
  clearState();
  runHook('user_prompt_submit.py', {
    user_prompt: 'implement feature X'
  });
  
  let state1 = readState();
  
  runHook('pre_tool_use.py', {
    tool_name: 'Read',
    tool_input: { file_path: 'test.js' },
    message: 'Reading file'
  });
  
  let state2 = readState();
  logTest(
    'State persists across hook calls',
    state1?.ultrathink_required === state2?.ultrathink_required,
    'State should be consistent'
  );
  
  // Test 2: State migration from old format
  // This test verifies that hooks can read and understand old state format
  clearState();
  
  // Create old format state file
  const oldState = {
    ultrathink_required: true,
    ultrathink_completed: false,
    session: { id: new Date().toISOString().slice(0, 10).replace(/-/g, '') }
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(oldState));
  
  // Now trigger pre_tool_use hook which should block because ultrathink_required is true
  const result = runHook('pre_tool_use.py', {
    tool_name: 'Edit',
    tool_input: { file_path: 'test.js', content: 'test' },
    message: 'Testing migration'
  });
  
  // The hook should block the tool because it recognizes the old format
  logTest(
    'Migrate old state format',
    !result.success && result.error.includes('ULTRATHINK'),
    'Old state format should be recognized and enforced'
  );
  
  // Test 3: Analytics persistence
  clearState();
  const initialAnalytics = readAnalytics().length;
  
  for (let i = 0; i < 3; i++) {
    runHook('user_prompt_submit.py', {
      user_prompt: `test ${i}`
    });
    runHook('stop.py', {
      content: `Response ${i}`
    });
  }
  
  const finalAnalytics = readAnalytics();
  logTest(
    'Analytics accumulate over sessions',
    finalAnalytics.length >= initialAnalytics + 3,
    `Analytics entries: ${finalAnalytics.length}`
  );
}

// Main test runner
function runAllTests() {
  log('\n🧪 Claude Code Hook System Test Suite', 'blue');
  log('━'.repeat(60), 'blue');
  
  const startTime = Date.now();
  
  try {
    testUserPromptSubmit();
    testPreToolUse();
    testStopHook();
    testEdgeCases();
    testStatePersistence();
    
    const duration = Date.now() - startTime;
    log(`\n✅ All tests completed in ${duration}ms`, 'green');
    
    // Clean up
    clearState();
    log('\n🧹 Test artifacts cleaned up', 'gray');
    
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests();
} else {
  // Export for use as a module
  module.exports = {
    runAllTests,
    testUserPromptSubmit,
    testPreToolUse,
    testStopHook,
    testEdgeCases,
    testStatePersistence,
    clearState,
    readState,
    readAnalytics
  };
}
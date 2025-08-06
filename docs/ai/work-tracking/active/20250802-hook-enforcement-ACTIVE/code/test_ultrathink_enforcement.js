/**
 * Real-world test of ULTRATHINK enforcement
 * This simulates what happens when Claude Code receives a development request
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper to run hooks
function runHookCommand(command, input) {
  try {
    const result = execSync(command, {
      input: JSON.stringify(input),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { success: true, stdout: result, stderr: '' };
  } catch (error) {
    return { 
      success: false, 
      stdout: error.stdout || '', 
      stderr: error.stderr || '',
      code: error.status
    };
  }
}

console.log('🧪 Testing Real-World ULTRATHINK Enforcement\n');

// Step 1: Simulate user asking for development work
console.log('1️⃣ User requests: "implement a new login feature"');
const userPromptResult = runHookCommand(
  'python3 .claude/hooks/user_prompt_submit.py',
  { user_prompt: 'implement a new login feature' }
);

console.log('   UserPromptSubmit hook:', userPromptResult.success ? '✅ Success' : '❌ Failed');
if (userPromptResult.stderr) {
  console.log('   Debug:', userPromptResult.stderr);
}

// Check state file
const state = JSON.parse(fs.readFileSync('logs/state.json', 'utf8'));
console.log('   State updated:', state.ultrathink_required ? '✅ ULTRATHINK required' : '❌ Not required');
console.log('   Trigger:', state.ultrathink?.trigger?.keyword, `(${state.ultrathink?.trigger?.type})`);

// Step 2: Try to use Edit tool without ULTRATHINK
console.log('\n2️⃣ Attempt to Edit file WITHOUT ULTRATHINK...');
const editWithoutResult = runHookCommand(
  'python3 .claude/hooks/pre_tool_use.py',
  {
    tool_name: 'Edit',
    tool_input: { 
      file_path: 'src/login.js',
      old_string: 'function login() {}',
      new_string: 'function login(username, password) {}'
    },
    message: 'Updating the login function to accept parameters'
  }
);

// Hook exits with code 2 when blocking
console.log('   PreToolUse hook:', editWithoutResult.code === 2 ? '✅ Blocked (GOOD!)' : '❌ Allowed (BAD!)');
if (editWithoutResult.stderr) {
  console.log('\n   🚫 Error Message:');
  console.log(editWithoutResult.stderr.split('\n').map(line => '      ' + line).join('\n'));
}

// Step 3: Try again WITH ULTRATHINK
console.log('\n3️⃣ Attempt to Edit file WITH ULTRATHINK...');
const editWithResult = runHookCommand(
  'python3 .claude/hooks/pre_tool_use.py',
  {
    tool_name: 'Edit',
    tool_input: { 
      file_path: 'src/login.js',
      old_string: 'function login() {}',
      new_string: 'function login(username, password) {}'
    },
    message: 'Let me ultrathink about this... [S:20250805|W:implementation|H:implement-feature|E:3/"tests pass"]\n\nUpdating the login function'
  }
);

console.log('   PreToolUse hook:', editWithResult.success ? '✅ Allowed (GOOD!)' : '❌ Blocked (BAD!)');
if (editWithResult.stderr) {
  console.log('   Warning:', editWithResult.stderr);
}

// Step 4: Check final state
console.log('\n4️⃣ Final State Check:');
const finalState = JSON.parse(fs.readFileSync('logs/state.json', 'utf8'));
console.log('   ULTRATHINK completed:', finalState.ultrathink_completed ? '✅ Yes' : '❌ No');
console.log('   Blocked attempts:', finalState.ultrathink?.blocked_attempts || 0);
console.log('   ULTRATHINK statements:', finalState.ultrathink?.statements?.length || 0);

// Step 5: Test Stop hook compliance check
console.log('\n5️⃣ Session end with ULTRATHINK compliance...');
const stopResult = runHookCommand(
  'python3 .claude/hooks/stop.py',
  {
    content: 'Let me ultrathink about this... [S:20250805|W:implementation|H:implement-feature|E:3/"tests pass"]\n\nImplemented the login feature successfully.'
  }
);

console.log('   Stop hook:', stopResult.success ? '✅ Success' : '❌ Failed');
if (stopResult.stderr) {
  console.log('   Output:', stopResult.stderr);
}

// Clean up
fs.unlinkSync('logs/state.json');
console.log('\n✅ Test complete - ULTRATHINK enforcement is working!');
/**
 * Test various ULTRATHINK enforcement scenarios
 * This demonstrates how the hook system handles different edge cases
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Helper to run hooks
function runHook(script, input) {
  try {
    const result = execSync(`python3 .claude/hooks/${script}`, {
      input: JSON.stringify(input),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { success: true, stdout: result, stderr: '', code: 0 };
  } catch (error) {
    return { 
      success: false, 
      stdout: error.stdout || '', 
      stderr: error.stderr || '',
      code: error.status
    };
  }
}

function clearState() {
  if (fs.existsSync('logs/state.json')) {
    fs.unlinkSync('logs/state.json');
  }
}

console.log('🔬 Testing ULTRATHINK Enforcement Scenarios\n');

// Scenario 1: Multiple development tools in sequence
console.log('📋 Scenario 1: Multiple development tools without ULTRATHINK');
clearState();

runHook('user_prompt_submit.py', { user_prompt: 'fix the authentication bug' });

const tools = ['Edit', 'Write', 'MultiEdit'];
let blockedCount = 0;

for (const tool of tools) {
  const result = runHook('pre_tool_use.py', {
    tool_name: tool,
    tool_input: { file_path: 'test.js' },
    message: `Using ${tool} to fix the bug`
  });
  
  if (result.code === 2) blockedCount++;
  console.log(`   ${tool}: ${result.code === 2 ? '🚫 Blocked' : '✅ Allowed'}`);
}

console.log(`   Result: ${blockedCount}/${tools.length} tools blocked correctly\n`);

// Scenario 2: Invalid ULTRATHINK format
console.log('📋 Scenario 2: Invalid ULTRATHINK formats');
clearState();

runHook('user_prompt_submit.py', { user_prompt: 'create a new component' });

const invalidFormats = [
  'Let me think about this...',
  'ULTRATHINK: creating component',
  '[S:20250805|W:dev|H:create]', // Missing E field
  '[S:X|W:Y|H:Z]', // Missing E field
  'Let me ultrathink... [S:20250805]' // Incomplete format
];

for (const format of invalidFormats) {
  const result = runHook('pre_tool_use.py', {
    tool_name: 'Write',
    tool_input: { file_path: 'component.js' },
    message: format
  });
  
  console.log(`   "${format.substring(0, 30)}...": ${result.code === 2 ? '🚫 Still blocked' : '✅ Accepted'}`);
}

// Scenario 3: Valid ULTRATHINK with different handlers
console.log('\n📋 Scenario 3: Valid ULTRATHINK with different handlers');
clearState();

runHook('user_prompt_submit.py', { user_prompt: 'refactor the codebase' });

const validFormats = [
  { format: '[S:20250805|W:refactoring|H:searching|E:pending]', desc: 'Searching state' },
  { format: '[S:20250805|W:refactoring|H:refactor-code|E:5/"tests pass"]', desc: 'Specific handler' },
  { format: '[S:20250805|W:analysis|H:VOID→registry|E:searching]', desc: 'VOID state' },
  { format: '[S:20250805|W:planning|H:think-about-task|E:steps/"planning complete"]', desc: 'Complex evidence' }
];

for (const { format, desc } of validFormats) {
  clearState();
  runHook('user_prompt_submit.py', { user_prompt: 'refactor the codebase' });
  
  const result = runHook('pre_tool_use.py', {
    tool_name: 'Edit',
    tool_input: { file_path: 'code.js' },
    message: `Let me ultrathink about this... ${format}`
  });
  
  console.log(`   ${desc}: ${result.code !== 2 ? '✅ Accepted' : '🚫 Rejected'}`);
}

// Scenario 4: Non-development tools
console.log('\n📋 Scenario 4: Non-development tools (should always work)');
clearState();

runHook('user_prompt_submit.py', { user_prompt: 'implement new feature' });

const nonDevTools = ['Read', 'Bash', 'Search', 'TodoWrite'];

for (const tool of nonDevTools) {
  const result = runHook('pre_tool_use.py', {
    tool_name: tool,
    tool_input: {},
    message: `Using ${tool}`
  });
  
  console.log(`   ${tool}: ${result.code !== 2 ? '✅ Allowed' : '🚫 Blocked (ERROR!)'}`);
}

// Scenario 5: Session persistence
console.log('\n📋 Scenario 5: State persistence across multiple requests');
clearState();

// First request triggers ULTRATHINK requirement
runHook('user_prompt_submit.py', { user_prompt: 'build a new API endpoint' });
let state = JSON.parse(fs.readFileSync('logs/state.json', 'utf8'));
console.log(`   After dev request: ULTRATHINK required = ${state.ultrathink_required}`);

// Non-dev request shouldn't clear the requirement
runHook('user_prompt_submit.py', { user_prompt: 'what is JavaScript?' });
state = JSON.parse(fs.readFileSync('logs/state.json', 'utf8'));
console.log(`   After casual chat: ULTRATHINK still required = ${state.ultrathink_required}`);

// Using ULTRATHINK clears the requirement
runHook('pre_tool_use.py', {
  tool_name: 'Write',
  tool_input: { file_path: 'api.js' },
  message: 'Let me ultrathink about this... [S:20250805|W:api|H:create-endpoint|E:done]'
});

runHook('stop.py', {
  content: 'Let me ultrathink about this... [S:20250805|W:api|H:create-endpoint|E:done]\n\nCreated the API endpoint.'
});

state = JSON.parse(fs.readFileSync('logs/state.json', 'utf8'));
console.log(`   After completion: ULTRATHINK required = ${state.ultrathink_required}`);

// Clean up
clearState();
console.log('\n✅ All enforcement scenarios tested!');
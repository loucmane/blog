/**
 * Test potential improvements to the ULTRATHINK enforcement system
 * This identifies areas where we could enhance the hooks
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

console.log('🔧 Testing Potential Improvements\n');

// Test 1: Handler validation
console.log('1️⃣ Handler Validation');
clearState();
runHook('user_prompt_submit.py', { user_prompt: 'implement feature' });

const handlers = [
  { name: 'implement-feature', exists: true },
  { name: 'fix-bug', exists: true },
  { name: 'invalid-handler-xyz', exists: false },
  { name: 'create-component', exists: true }
];

for (const { name, exists } of handlers) {
  const result = runHook('pre_tool_use.py', {
    tool_name: 'Edit',
    tool_input: { file_path: 'test.js' },
    message: `Let me ultrathink about this... [S:20250805|W:dev|H:${name}|E:pending]`
  });
  
  const hasWarning = result.stderr.includes('not found in REGISTRY');
  console.log(`   Handler "${name}": ${exists ? '✅ Valid' : '⚠️  Invalid'} - ${hasWarning ? 'Warning shown' : 'No warning'}`);
}

// Test 2: Context tracking
console.log('\n2️⃣ Context Tracking');
clearState();

// Simulate a work session
runHook('user_prompt_submit.py', { user_prompt: 'work on authentication' });
runHook('pre_tool_use.py', {
  tool_name: 'Read',
  tool_input: { file_path: 'auth.js' },
  message: 'Reading auth file'
});

let state = JSON.parse(fs.readFileSync('logs/state.json', 'utf8'));
console.log(`   Tools used: ${state.context.tools_used.length}`);
console.log(`   Recent searches: ${state.context.recent_searches.length}`);
console.log(`   Work folders: ${state.context.work_folders.length}`);

// Test 3: Analytics insights
console.log('\n3️⃣ Analytics Insights');
clearState();

// Create several sessions with different compliance rates
const sessions = [
  { prompt: 'fix bug', complied: true },
  { prompt: 'implement feature', complied: false },
  { prompt: 'refactor code', complied: true },
  { prompt: 'create component', complied: true },
  { prompt: 'debug issue', complied: false }
];

for (const { prompt, complied } of sessions) {
  clearState();
  runHook('user_prompt_submit.py', { user_prompt: prompt });
  
  if (complied) {
    runHook('pre_tool_use.py', {
      tool_name: 'Edit',
      tool_input: {},
      message: 'Let me ultrathink about this... [S:20250805|W:work|H:handler|E:done]'
    });
  }
  
  runHook('stop.py', {
    content: complied ? 
      'Let me ultrathink about this... [S:20250805|W:work|H:handler|E:done]\nDone!' : 
      'Fixed the issue'
  });
}

const analytics = JSON.parse(fs.readFileSync('logs/analytics.json', 'utf8'));
const recentSessions = analytics.slice(-5);
const complianceRate = recentSessions.filter(s => s.ultrathink_compliance).length / recentSessions.length;

console.log(`   Total sessions: ${analytics.length}`);
console.log(`   Recent compliance rate: ${(complianceRate * 100).toFixed(0)}%`);
console.log(`   Sessions with blocked attempts: ${recentSessions.filter(s => s.blocked_attempts > 0).length}`);

// Test 4: Edge case - Multiple ULTRATHINK in one message
console.log('\n4️⃣ Multiple ULTRATHINK Statements');
clearState();
runHook('user_prompt_submit.py', { user_prompt: 'complex multi-step task' });

const multiMessage = `
Let me ultrathink about this... [S:20250805|W:analysis|H:searching|E:pending]

After searching, I found the right approach.

Let me ultrathink about this... [S:20250805|W:implementation|H:implement-feature|E:5/"tests pass"]

Now implementing the feature...
`;

const result = runHook('pre_tool_use.py', {
  tool_name: 'Write',
  tool_input: { file_path: 'feature.js' },
  message: multiMessage
});

state = JSON.parse(fs.readFileSync('logs/state.json', 'utf8'));
console.log(`   ULTRATHINK statements captured: ${state.ultrathink?.statements?.length || 0}`);
console.log(`   Tool allowed: ${result.code !== 2 ? '✅ Yes' : '❌ No'}`);

// Test 5: Suggestions improvement
console.log('\n5️⃣ Handler Suggestions Quality');
clearState();

const prompts = [
  'test the authentication module',
  'debug the login function',
  'create a new React component',
  'fix the database connection issue',
  'implement user profile feature'
];

for (const prompt of prompts) {
  clearState();
  runHook('user_prompt_submit.py', { user_prompt: prompt });
  
  state = JSON.parse(fs.readFileSync('logs/state.json', 'utf8'));
  const suggestions = state.ultrathink?.handler_suggestions || [];
  
  console.log(`   "${prompt}"`);
  if (suggestions.length > 0) {
    console.log(`     → ${suggestions[0].name} (${suggestions[0].score.toFixed(1)})`);
  } else {
    console.log(`     → No suggestions`);
  }
}

// Clean up
clearState();
console.log('\n✅ Improvement areas identified!');
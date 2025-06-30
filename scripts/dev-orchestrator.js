#!/usr/bin/env node
/**
 * Smart orchestrator that runs each package with proper port configuration
 * Handles the complexities of monorepo + different port requirements
 */

const { spawn } = require('child_process');
const path = require('path');

// Detect worktree number - FIXED to handle all patterns
function getWorktreeInfo() {
  const cwd = process.cwd();
  const basename = path.basename(cwd);
  
  // Extract the final number from worktree names like:
  // task-7-orch-perf-1, task-7-orch-a11y-2, etc.
  const match = basename.match(/-(\d+)$/);
  
  if (match && cwd.includes('.worktrees/')) {
    const number = parseInt(match[1]);
    
    // Also get the type (perf, arch, ux, a11y, innov) for grouping
    const typeMatch = basename.match(/orch-([^-]+)-\d+$/);
    const type = typeMatch ? typeMatch[1] : 'unknown';
    
    // Calculate actual unique port offset
    // Each type gets 2 slots, then add the instance number
    const typeOffsets = {
      'perf': 0,
      'arch': 2, 
      'ux': 4,
      'a11y': 6,
      'innov': 8
    };
    
    const baseOffset = typeOffsets[type] || 10;
    const finalNumber = baseOffset + number;
    
    console.log(`🔍 Detected: ${basename} → Type: ${type}, Instance: ${number}, Port offset: ${finalNumber}`);
    
    return {
      number: finalNumber,
      name: basename,
      type: type,
      instance: number,
      isWorktree: true
    };
  }
  
  // Not in worktree or no match
  return {
    number: 0,
    name: 'main',
    isWorktree: false
  };
}

// Calculate ports
const info = getWorktreeInfo();
const ports = {
  web: 3000 + info.number,
  backend: 4000 + info.number,
  ui: 5000 + info.number
};

console.log('🚀 Smart Development Orchestrator');
console.log('📍 Location:', info.isWorktree ? `Worktree: ${info.name}` : 'Main repository');
console.log('🔢 Instance:', info.number);
console.log('\n🌐 Port Configuration:');
console.log(`   Next.js Web:  http://localhost:${ports.web}`);
console.log(`   Backend API:  http://localhost:${ports.backend}`);
console.log(`   UI Rollup:    http://localhost:${ports.ui}`);
console.log('\n📦 Starting packages...\n');

// Keep track of child processes
const children = [];

// Function to spawn a package with proper configuration
function spawnPackage(name, command, args, envOrOptions = {}) {
  console.log(`Starting ${name}...`);
  
  // Handle both env-only and full options
  const options = envOrOptions.cwd ? envOrOptions : { env: { ...process.env, ...envOrOptions } };
  
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: options.env || { ...process.env, ...envOrOptions },
    cwd: options.cwd || process.cwd(),
    shell: true
  });
  
  child.on('error', (err) => {
    console.error(`❌ ${name} failed to start:`, err.message);
  });
  
  children.push(child);
  return child;
}

// Start Backend with PORT environment variable
spawnPackage(
  'Backend API',
  'pnpm',
  ['--filter', '@minniewinnie/backend', 'run', 'dev'],
  { PORT: ports.backend }
);

// Start Web - use npx to bypass pnpm's argument handling
spawnPackage(
  'Next.js Web',
  'npx',
  ['next', 'dev', '--port', ports.web],
  { 
    cwd: path.join(process.cwd(), 'packages/web')
  }
);

// Start UI build watcher
spawnPackage(
  'UI Library',
  'pnpm',
  ['--filter', '@minniewinnie/ui', 'run', 'dev'],
  { UI_PORT: ports.ui }
);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down all services...');
  children.forEach(child => {
    child.kill('SIGTERM');
  });
  process.exit(0);
});

process.on('SIGTERM', () => {
  children.forEach(child => {
    child.kill('SIGTERM');
  });
  process.exit(0);
});

// Keep the process running
process.stdin.resume();
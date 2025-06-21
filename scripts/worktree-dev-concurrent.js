#!/usr/bin/env node
const { execSync, spawn } = require('child_process');
const path = require('path');

// Get all worktrees
const worktrees = execSync('git worktree list', { encoding: 'utf8' })
  .split('\n')
  .filter(line => line.includes('.worktrees/'))
  .map(line => line.split(' ')[0]);

if (worktrees.length === 0) {
  console.error('No worktrees found in .worktrees/ directory');
  console.log('Run: /init-parallel feature-name=<name> number-of-parallel-worktrees=<number>');
  process.exit(1);
}

console.log(`Found ${worktrees.length} worktrees. Starting dev servers...\n`);

// Build concurrently command
const commands = worktrees.map((worktree, index) => {
  const name = path.basename(worktree);
  const port = 3001 + index;
  return {
    name: `${name}:${port}`,
    command: `cd ${worktree} && pnpm dev`,
    color: ['blue', 'green', 'yellow', 'red', 'magenta', 'cyan'][index % 6]
  };
});

// Install concurrently if not present
try {
  require.resolve('concurrently');
} catch (e) {
  console.log('Installing concurrently...');
  execSync('pnpm add -D concurrently', { stdio: 'inherit' });
}

const concurrently = require('concurrently');

// Run all dev servers
const { result } = concurrently(
  commands.map(cmd => ({
    command: cmd.command,
    name: cmd.name,
    prefixColor: cmd.color
  })),
  {
    prefix: 'name',
    killOthers: ['failure', 'success'],
    restartTries: 0,
  }
);

// Print URLs
console.log('\nDev servers starting on:');
worktrees.forEach((worktree, index) => {
  const name = path.basename(worktree);
  const port = 3001 + index;
  console.log(`  http://localhost:${port} - ${name}`);
});

result.catch(() => {
  console.log('\nOne or more dev servers stopped.');
});
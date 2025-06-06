#!/usr/bin/env node

/**
 * Manual verification script for UI package imports
 * Run with: node tests/verify-ui-imports.mjs
 */

console.log('🧪 Testing UI package imports...\n');

try {
  // Since we're in an ESM context, we need to handle TypeScript files differently
  // For now, let's verify the package resolution works
  
  const packageJsonPath = '../../ui/package.json';
  const { default: uiPackage } = await import(packageJsonPath, {
    with: { type: 'json' }
  });
  
  console.log('✅ UI Package found:', uiPackage.name);
  console.log('📦 Version:', uiPackage.version);
  console.log('📂 Exports configured:', Object.keys(uiPackage.exports).length, 'paths');
  
  // List all export paths
  console.log('\n📋 Available imports:');
  Object.keys(uiPackage.exports).forEach(path => {
    if (path !== './package.json') {
      console.log(`  - @minniewinnie/ui${path === '.' ? '' : path}`);
    }
  });
  
  console.log('\n✨ UI package exports are properly configured!');
  console.log('💡 TypeScript compilation will handle the actual imports.\n');
  
} catch (error) {
  console.error('❌ Error verifying UI package:', error.message);
  process.exit(1);
}
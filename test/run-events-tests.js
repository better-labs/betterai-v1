#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Events Tests...\n');

const testFiles = [
  'test/lib/data/events.test.ts',
  'test/routes/events-edge-cases.test.ts',
  'test/e2e/events-integration.test.ts'
];

let passedTests = 0;
let failedTests = 0;

testFiles.forEach((testFile, index) => {
  console.log(`\n📁 Running ${testFile}...`);
  
  try {
    execSync(`npx jest ${testFile} --verbose`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    passedTests++;
    console.log(`✅ ${testFile} passed`);
  } catch (error) {
    failedTests++;
    console.log(`❌ ${testFile} failed`);
  }
});

console.log(`\n📊 Test Summary:`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📈 Total: ${passedTests + failedTests}`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\n🎉 All events tests passed!');
} 
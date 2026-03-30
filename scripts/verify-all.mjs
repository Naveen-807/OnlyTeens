#!/usr/bin/env node

/**
 * Proof18 Verification Script
 * Runs all verification checks in sequence:
 * 1. Hardhat tests
 * 2. TypeScript type checking
 * 3. Next.js build
 * 
 * Usage: node scripts/verify-all.mjs
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const CHECKS = [
  {
    name: 'Hardhat Tests',
    command: 'npm',
    args: ['run', 'hardhat:test'],
    required: true,
  },
  {
    name: 'TypeScript Check',
    command: 'npm',
    args: ['run', 'typecheck'],
    required: true,
  },
  {
    name: 'Next.js Build',
    command: 'npm',
    args: ['run', 'build'],
    required: true,
  },
];

function runCommand(name, command, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${name}`);
    console.log(`Command: ${command} ${args.join(' ')}`);
    console.log('='.repeat(60) + '\n');

    const proc = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`\n[PASS] ${name}`);
        resolve(true);
      } else {
        console.log(`\n[FAIL] ${name} (exit code: ${code})`);
        reject(new Error(`${name} failed with exit code ${code}`));
      }
    });

    proc.on('error', (err) => {
      console.log(`\n[ERROR] ${name}: ${err.message}`);
      reject(err);
    });
  });
}

async function main() {
  console.log('\n');
  console.log('*'.repeat(60));
  console.log('*  PROOF18 VERIFICATION SUITE');
  console.log('*  Running all acceptance checks...');
  console.log('*'.repeat(60));

  const results = [];
  let allPassed = true;

  for (const check of CHECKS) {
    try {
      await runCommand(check.name, check.command, check.args);
      results.push({ name: check.name, passed: true });
    } catch (error) {
      results.push({ name: check.name, passed: false, error: error.message });
      if (check.required) {
        allPassed = false;
        console.log(`\n[ABORT] Required check "${check.name}" failed. Stopping.`);
        break;
      }
    }
  }

  // Summary
  console.log('\n');
  console.log('='.repeat(60));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  
  for (const result of results) {
    const status = result.passed ? '[PASS]' : '[FAIL]';
    console.log(`${status} ${result.name}`);
  }

  console.log('='.repeat(60));

  if (allPassed && results.length === CHECKS.length) {
    console.log('\n[SUCCESS] All verification checks passed!');
    console.log('Gate 1 is GREEN. Repo is ready for Phase 1.\n');
    process.exit(0);
  } else {
    console.log('\n[FAILURE] Some verification checks failed.');
    console.log('Fix the issues above before proceeding.\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Verification script error:', err);
  process.exit(1);
});

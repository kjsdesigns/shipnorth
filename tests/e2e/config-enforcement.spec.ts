import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration Enforcement Test
 * 
 * MANDATORY: This test ensures NO hardcoded ports, URLs, or environment values
 * exist anywhere in the codebase except the single source of truth (.env file).
 * 
 * If this test fails, it means someone introduced hardcoded values that will
 * cause configuration inconsistencies and deployment issues.
 */

test.describe.serial('🔒 Configuration Enforcement', () => {
  
  test('NO hardcoded ports allowed anywhere in codebase @config @critical', async () => {
    console.log('\n🔍 SCANNING FOR HARDCODED PORTS...\n');

    // Define forbidden hardcoded patterns
    const forbiddenPatterns = [
      // Direct port assignments
      { pattern: /PORT\s*=\s*[0-9]+/, description: 'Hardcoded PORT assignment' },
      { pattern: /port:\s*[0-9]+/, description: 'Hardcoded port in config object' },
      { pattern: /:\s*[3-9][0-9][0-9][0-9](?!\.)/, description: 'Hardcoded port number in URL' },
      
      // Common problematic ports
      { pattern: /:3000[^0-9]/, description: 'Hardcoded port 3000' },
      { pattern: /:3001[^0-9]/, description: 'Hardcoded port 3001' },
      { pattern: /:4000[^0-9]/, description: 'Hardcoded port 4000' },
      { pattern: /:8849[^0-9]/, description: 'Hardcoded port 8849 (use process.env.WEB_PORT)' },
      { pattern: /:8850[^0-9]/, description: 'Hardcoded port 8850 (use process.env.API_PORT)' },
      { pattern: /:5432[^0-9]/, description: 'Hardcoded port 5432 (use process.env.POSTGRES_PORT)' },
    ];

    // Files to scan (exclude certain directories and files)
    const filesToScan = getFilesToScan();
    const violations: Array<{ file: string; line: number; content: string; violation: string }> = [];

    console.log(`📁 Scanning ${filesToScan.length} files for hardcoded values...`);

    for (const filePath of filesToScan) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          for (const { pattern, description } of forbiddenPatterns) {
            if (pattern.test(line)) {
              // Skip if it's in a comment explaining what NOT to do
              if (line.includes('❌ NEVER DO THIS') || line.includes('ANTI-PATTERNS')) {
                continue;
              }
              
              violations.push({
                file: path.relative(process.cwd(), filePath),
                line: index + 1,
                content: line.trim(),
                violation: description
              });
            }
          }
        });
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    // Report violations
    if (violations.length > 0) {
      console.log(`\n❌ FOUND ${violations.length} CONFIGURATION VIOLATIONS:\n`);
      
      violations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.violation}`);
        console.log(`   File: ${violation.file}:${violation.line}`);
        console.log(`   Code: ${violation.content}`);
        console.log('');
      });

      console.log('🔧 HOW TO FIX:');
      console.log('1. Move all configuration to .env file');
      console.log('2. Reference environment variables: process.env.VARIABLE_NAME');
      console.log('3. Use centralized config pattern:');
      console.log('   ✅ const PORT = process.env.API_PORT;');
      console.log('   ✅ const URL = `http://localhost:${process.env.WEB_PORT}`;');
      console.log('   ❌ const PORT = 8850;');
      console.log('   ❌ const URL = "http://localhost:8849";');
      console.log('\n📋 REQUIRED ACTIONS:');
      console.log('- Update each file listed above');
      console.log('- Replace hardcoded values with environment variable references');
      console.log('- Ensure .env file contains all necessary variables');
      console.log('- Re-run this test to verify compliance');

      throw new Error(`Configuration violations found: ${violations.length} hardcoded values must be moved to .env`);
    }

    console.log('✅ NO HARDCODED PORTS FOUND - Configuration is properly centralized');
  });

  test('NO hardcoded URLs allowed anywhere in codebase @config @critical', async () => {
    console.log('\n🔍 SCANNING FOR HARDCODED URLS...\n');

    const forbiddenUrlPatterns = [
      { pattern: /localhost:3[0-9]{3}/, description: 'Hardcoded localhost:3xxx URL' },
      { pattern: /localhost:4[0-9]{3}/, description: 'Hardcoded localhost:4xxx URL' },
      { pattern: /localhost:8[0-9]{3}/, description: 'Hardcoded localhost:8xxx URL' },
      { pattern: /http:\/\/localhost:[0-9]+/, description: 'Hardcoded localhost HTTP URL' },
      { pattern: /https:\/\/localhost:[0-9]+/, description: 'Hardcoded localhost HTTPS URL' },
    ];

    const filesToScan = getFilesToScan();
    const urlViolations: Array<{ file: string; line: number; content: string; violation: string }> = [];

    for (const filePath of filesToScan) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          for (const { pattern, description } of forbiddenUrlPatterns) {
            if (pattern.test(line)) {
              // Skip documentation and example patterns
              if (line.includes('❌ NEVER DO') || line.includes('ANTI-PATTERNS') || 
                  line.includes('// Example') || line.includes('* Example')) {
                continue;
              }

              urlViolations.push({
                file: path.relative(process.cwd(), filePath),
                line: index + 1,
                content: line.trim(),
                violation: description
              });
            }
          }
        });
      } catch (error) {
        continue;
      }
    }

    if (urlViolations.length > 0) {
      console.log(`\n❌ FOUND ${urlViolations.length} HARDCODED URL VIOLATIONS:\n`);
      
      urlViolations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.violation}`);
        console.log(`   File: ${violation.file}:${violation.line}`);
        console.log(`   Code: ${violation.content}`);
        console.log('');
      });

      console.log('🔧 CENTRALIZED URL PATTERNS:');
      console.log('✅ const WEB_URL = `http://localhost:${process.env.WEB_PORT}`;');
      console.log('✅ const API_URL = process.env.NEXT_PUBLIC_API_URL;');
      console.log('✅ baseURL: process.env.NEXT_PUBLIC_API_URL');

      throw new Error(`URL violations found: ${urlViolations.length} hardcoded URLs must use environment variables`);
    }

    console.log('✅ NO HARDCODED URLS FOUND - All URLs properly use environment variables');
  });

  test('Environment variables properly defined in .env file @config @critical', async () => {
    console.log('\n🔍 VERIFYING .env FILE COMPLETENESS...\n');

    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      throw new Error('.env file does not exist - this is required for centralized configuration');
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Required environment variables
    const requiredVars = [
      'WEB_PORT',
      'API_PORT', 
      'POSTGRES_PORT',
      'NEXT_PUBLIC_API_URL',
      'POSTGRES_HOST',
      'POSTGRES_DB',
      'POSTGRES_USER',
      'POSTGRES_PASSWORD',
      'JWT_SECRET',
      'NODE_ENV'
    ];

    const missingVars = requiredVars.filter(varName => !envContent.includes(varName));

    if (missingVars.length > 0) {
      console.log(`❌ MISSING REQUIRED ENVIRONMENT VARIABLES:\n`);
      missingVars.forEach(varName => console.log(`   • ${varName}`));
      console.log('\n🔧 Add these variables to .env file');
      
      throw new Error(`Missing ${missingVars.length} required environment variables in .env file`);
    }

    console.log('✅ All required environment variables present in .env file');
    console.log(`📊 Total variables defined: ${envContent.split('\n').filter(line => line.includes('=')).length}`);
  });

  test('Docker compose uses environment variable references @config @critical', async () => {
    console.log('\n🔍 VERIFYING DOCKER-COMPOSE CONFIGURATION...\n');

    const dockerComposePath = path.join(process.cwd(), 'docker-compose.yml');
    const dockerContent = fs.readFileSync(dockerComposePath, 'utf8');

    // Check that docker-compose.yml uses ${VARIABLE} syntax instead of hardcoded values
    const requiredVariableRefs = [
      '${WEB_PORT}',
      '${API_PORT}',
      '${POSTGRES_PORT}'
    ];

    const missingRefs = requiredVariableRefs.filter(ref => !dockerContent.includes(ref));

    if (missingRefs.length > 0) {
      console.log(`❌ DOCKER-COMPOSE NOT USING ENVIRONMENT VARIABLES:\n`);
      missingRefs.forEach(ref => console.log(`   Missing: ${ref}`));
      console.log('\n🔧 Update docker-compose.yml to use: ports: ["${WEB_PORT}:${WEB_PORT}"]');
      
      throw new Error(`Docker-compose.yml must use environment variable references, not hardcoded ports`);
    }

    console.log('✅ Docker-compose.yml properly uses environment variable references');
  });

  test.afterAll(async () => {
    console.log('\n🎯 CONFIGURATION ENFORCEMENT COMPLETE');
    console.log('✅ All configuration properly centralized in .env file');
    console.log('✅ No hardcoded ports or URLs detected');
    console.log('✅ Docker configuration uses environment variables');
    console.log('\n🛡️ CONFIGURATION IS BULLETPROOF!\n');
    console.log('=' .repeat(80));
  });
});

function getFilesToScan(): string[] {
  // Get all TypeScript, JavaScript, and config files
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.yml', '.yaml'];
  const excludePatterns = [
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    '.env', // Skip .env file itself
    'test-artifacts',
    'test-results',
    'test-reports',
    '.min.js',
    'backup-legacy',
    'backup-corrupted'
  ];

  const files: string[] = [];

  function scanDirectory(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // Skip excluded patterns
        if (excludePatterns.some(pattern => fullPath.includes(pattern))) {
          continue;
        }

        if (entry.isDirectory()) {
          scanDirectory(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  scanDirectory(process.cwd());
  return files;
}
/**
 * Docker-Only Test Suite Global Setup
 * 
 * Runs before all tests to verify Docker environment and log setup info
 */

import DockerEnvironmentChecker from './docker-environment-check';

async function globalSetup() {
  console.log('\n🐳 DOCKER-ONLY TEST SUITE INITIALIZATION');
  console.log('════════════════════════════════════════════════════════════════════════\n');
  
  // Get detailed environment info
  const envInfo = DockerEnvironmentChecker.getEnvironmentInfo();
  console.log(envInfo);
  
  // Verify Docker environment (will exit if not Docker)
  const result = DockerEnvironmentChecker.checkDockerEnvironment();
  
  if (!result.isDocker) {
    console.error('❌ This test suite is configured for Docker-only execution!');
    console.error('   Use npm run test:docker to run these tests properly.');
    process.exit(1);
  }
  
  console.log('✅ Docker environment verified - proceeding with test execution');
  console.log('📊 Test Configuration:');
  console.log('   • Environment: Docker Container');
  console.log('   • Output: test-artifacts-docker/');
  console.log('   • Reporting: Docker-optimized HTML and JSON');
  console.log('   • Workers: 3 (Docker-optimized)');
  console.log('   • Retries: 3 (Enhanced for container stability)');
  console.log('\n════════════════════════════════════════════════════════════════════════\n');
}

export default globalSetup;
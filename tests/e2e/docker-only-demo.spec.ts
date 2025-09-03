import { test, expect } from '@playwright/test';
import DockerEnvironmentChecker from '../utils/docker-environment-check';

/**
 * Docker-Only Test Demonstration
 * 
 * This test suite demonstrates the Docker environment enforcement
 * and will refuse to run locally.
 */

// Enforce Docker environment at the top level
DockerEnvironmentChecker.enforceDockerOnly('Docker-Only Demo Test Suite');

test.describe('🐳 Docker-Only Test Demo', () => {
  
  test.beforeAll(async () => {
    // Log environment info for verification
    console.log(DockerEnvironmentChecker.getEnvironmentInfo());
  });

  test('Docker environment verification @docker-only', async ({ page }) => {
    const result = DockerEnvironmentChecker.checkDockerEnvironment();
    
    console.log('🔍 Docker Environment Check:');
    console.log(`   Status: ${result.isDocker ? '✅ Docker' : '❌ Local'}`);
    console.log(`   Reason: ${result.reason}`);
    console.log(`   Environment: ${result.environment}`);
    
    // This test should only run in Docker
    expect(result.isDocker).toBe(true);
    expect(result.environment).toBe('docker');
  });

  test('Docker-specific functionality test @docker-only', async ({ page }) => {
    // This test demonstrates Docker-specific functionality
    console.log('🚀 Running Docker-specific test...');
    
    // Navigate to health endpoint to verify container network
    await page.goto(`http://localhost:${process.env.API_PORT || 8850}/health');
    
    const response = await page.locator('pre').textContent();
    const healthData = JSON.parse(response || '{}');
    
    expect(healthData).toHaveProperty('status', 'healthy');
    console.log('✅ Container network connectivity verified');
  });

  test('Container resource verification @docker-only', async ({ page }) => {
    // Verify we're running in container environment
    const isDocker = DockerEnvironmentChecker.isRunningInDocker();
    expect(isDocker).toBe(true);
    
    console.log('✅ Container resource verification passed');
  });

});
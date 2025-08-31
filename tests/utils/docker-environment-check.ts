/**
 * Docker Environment Detection Utility
 * 
 * Ensures tests that require Docker environment refuse to run locally
 * to prevent environment-specific issues and maintain test reliability.
 */

import * as fs from 'fs';
import * as os from 'os';

export interface DockerCheckResult {
  isDocker: boolean;
  reason: string;
  environment: 'docker' | 'local' | 'unknown';
}

export class DockerEnvironmentChecker {
  /**
   * Comprehensive Docker environment detection using multiple methods
   */
  static checkDockerEnvironment(): DockerCheckResult {
    // Method 1: Check for explicit DOCKER_ENV environment variable
    if (process.env.DOCKER_ENV === 'true') {
      return {
        isDocker: true,
        reason: 'DOCKER_ENV environment variable set to true',
        environment: 'docker'
      };
    }

    // Method 2: Check for Docker container indicators in filesystem
    if (this.hasDockerContainerIndicators()) {
      return {
        isDocker: true,
        reason: 'Docker container filesystem indicators detected',
        environment: 'docker'
      };
    }

    // Method 3: Check hostname patterns (Docker often uses container IDs as hostnames)
    const hostname = os.hostname();
    if (this.isDockerHostname(hostname)) {
      return {
        isDocker: true,
        reason: `Docker hostname pattern detected: ${hostname}`,
        environment: 'docker'
      };
    }

    // Method 4: Check for Docker-specific environment variables
    if (this.hasDockerEnvironmentVariables()) {
      return {
        isDocker: true,
        reason: 'Docker-specific environment variables detected',
        environment: 'docker'
      };
    }

    // If none of the above, we're likely running locally
    return {
      isDocker: false,
      reason: 'No Docker environment indicators found - appears to be local execution',
      environment: 'local'
    };
  }

  /**
   * Check for Docker container filesystem indicators
   */
  private static hasDockerContainerIndicators(): boolean {
    try {
      // Check for /.dockerenv file (standard Docker indicator)
      if (fs.existsSync('/.dockerenv')) {
        return true;
      }

      // Check for Docker-specific mount points
      if (fs.existsSync('/proc/1/cgroup')) {
        const cgroupContent = fs.readFileSync('/proc/1/cgroup', 'utf8');
        if (cgroupContent.includes('docker') || cgroupContent.includes('containerd')) {
          return true;
        }
      }

      // Check for container-specific directories
      if (fs.existsSync('/sys/fs/cgroup/docker') || fs.existsSync('/var/lib/docker')) {
        return true;
      }

      return false;
    } catch (error) {
      // If we can't check filesystem, assume local
      return false;
    }
  }

  /**
   * Check if hostname follows Docker container patterns
   */
  private static isDockerHostname(hostname: string): boolean {
    // Docker often uses 12-character hex strings or container names
    const dockerPatterns = [
      /^[a-f0-9]{12}$/, // 12-char hex (common Docker pattern)
      /^shipnorth-/, // Our container naming pattern
      /^test-runner/, // Test runner container
      /^[a-f0-9]{64}$/, // 64-char hex (some Docker versions)
    ];

    return dockerPatterns.some(pattern => pattern.test(hostname));
  }

  /**
   * Check for Docker-specific environment variables
   */
  private static hasDockerEnvironmentVariables(): boolean {
    const dockerEnvVars = [
      'DOCKER_ENV',
      'DOCKER_CONTAINER',
      'CONTAINER_ID',
      'DOCKER_IMAGE',
    ];

    return dockerEnvVars.some(envVar => process.env[envVar]);
  }

  /**
   * Enforce Docker-only execution with descriptive error
   */
  static enforceDockerOnly(testSuiteName: string = 'Test Suite'): void {
    const result = this.checkDockerEnvironment();
    
    if (!result.isDocker) {
      const errorMessage = this.generateDockerOnlyError(testSuiteName, result);
      console.error(errorMessage);
      process.exit(1);
    }

    console.log(`✅ Docker environment confirmed: ${result.reason}`);
  }

  /**
   * Generate comprehensive error message for local execution attempts
   */
  private static generateDockerOnlyError(testSuiteName: string, result: DockerCheckResult): string {
    return `
🚫 DOCKER-ONLY TEST SUITE ENFORCEMENT
════════════════════════════════════════════════════════════════════════

❌ ${testSuiteName} can ONLY be run in Docker environment.

🔍 Detection Result:
   Environment: ${result.environment}
   Reason: ${result.reason}

🐳 To run these tests properly, use:

   ┌─ RECOMMENDED COMMANDS ─────────────────────────────┐
   │                                                    │
   │  # Run full Docker test suite                      │
   │  npm run test:docker                               │
   │                                                    │
   │  # Run critical tests only                         │
   │  npm run test:docker:critical                      │
   │                                                    │
   │  # Run full suite with scoreboard                  │
   │  npm run test:docker:full                          │
   │                                                    │
   │  # Build test runner image first (if needed)       │
   │  npm run test:docker:build                         │
   │                                                    │
   └────────────────────────────────────────────────────┘

💡 Why Docker-only?
   • Consistent environment isolation
   • Reliable database state management  
   • Predictable network configuration
   • Container-specific service dependencies
   • Prevents host system interference

🔧 Docker Test Environment Includes:
   ✅ PostgreSQL database with test data
   ✅ API server with proper configuration
   ✅ Web frontend with development setup
   ✅ Playwright browsers and dependencies
   ✅ Network isolation and port mapping

📚 For local development testing, use:
   npm run test:local     # Local environment tests
   npm run test:dev       # Development tests

════════════════════════════════════════════════════════════════════════
`;
  }

  /**
   * Non-fatal check that returns boolean for conditional logic
   */
  static isRunningInDocker(): boolean {
    return this.checkDockerEnvironment().isDocker;
  }

  /**
   * Get environment info for logging/debugging
   */
  static getEnvironmentInfo(): string {
    const result = this.checkDockerEnvironment();
    const hostname = os.hostname();
    const platform = os.platform();
    
    return `
🔍 Environment Detection Results:
   Docker Status: ${result.isDocker ? '✅ Docker' : '❌ Local'}
   Reason: ${result.reason}
   Hostname: ${hostname}
   Platform: ${platform}
   DOCKER_ENV: ${process.env.DOCKER_ENV || 'not set'}
   NODE_ENV: ${process.env.NODE_ENV || 'not set'}
`;
  }
}

export default DockerEnvironmentChecker;
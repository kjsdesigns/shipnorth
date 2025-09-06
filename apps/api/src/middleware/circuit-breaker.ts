interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  name: string;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: Date | null;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  nextAttempt: Date | null;
}

class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;
  private successCount: number = 0;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
    this.state = {
      failures: 0,
      lastFailureTime: null,
      state: 'CLOSED',
      nextAttempt: null
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state.state = 'HALF_OPEN';
        console.log(`🔄 Circuit breaker ${this.config.name}: Attempting reset (HALF_OPEN)`);
      } else {
        throw new Error(`Circuit breaker ${this.config.name} is OPEN`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.successCount++;

    if (this.state.state === 'HALF_OPEN') {
      if (this.successCount >= 3) { // Require 3 successes to close
        this.reset();
        console.log(`✅ Circuit breaker ${this.config.name}: Reset to CLOSED`);
      }
    } else {
      // Reset failure count on success
      this.state.failures = 0;
    }
  }

  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailureTime = new Date();
    this.successCount = 0;

    if (this.state.failures >= this.config.failureThreshold) {
      this.state.state = 'OPEN';
      this.state.nextAttempt = new Date(Date.now() + this.config.resetTimeout);
      
      console.warn(`⚡ Circuit breaker ${this.config.name}: OPENED (${this.state.failures} failures)`);
    }
  }

  private shouldAttemptReset(): boolean {
    return this.state.nextAttempt !== null && new Date() >= this.state.nextAttempt;
  }

  private reset(): void {
    this.state = {
      failures: 0,
      lastFailureTime: null,
      state: 'CLOSED',
      nextAttempt: null
    };
    this.successCount = 0;
  }

  getStatus(): {
    name: string;
    state: string;
    failures: number;
    lastFailureTime: Date | null;
    nextAttempt: Date | null;
  } {
    return {
      name: this.config.name,
      state: this.state.state,
      failures: this.state.failures,
      lastFailureTime: this.state.lastFailureTime,
      nextAttempt: this.state.nextAttempt
    };
  }
}

class CircuitBreakerService {
  private breakers: Map<string, CircuitBreaker> = new Map();

  createBreaker(name: string, config: Partial<CircuitBreakerConfig> = {}): CircuitBreaker {
    const fullConfig: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
      name,
      ...config
    };

    const breaker = new CircuitBreaker(fullConfig);
    this.breakers.set(name, breaker);
    
    console.log(`⚡ Circuit breaker created: ${name}`);
    return breaker;
  }

  getBreaker(name: string): CircuitBreaker | null {
    return this.breakers.get(name) || null;
  }

  // Pre-configured breakers for external services
  getShipStationBreaker(): CircuitBreaker {
    if (!this.breakers.has('shipstation')) {
      this.createBreaker('shipstation', {
        failureThreshold: 3,
        resetTimeout: 30000 // 30 seconds for external API
      });
    }
    return this.breakers.get('shipstation')!;
  }

  getStripeBreaker(): CircuitBreaker {
    if (!this.breakers.has('stripe')) {
      this.createBreaker('stripe', {
        failureThreshold: 5,
        resetTimeout: 60000
      });
    }
    return this.breakers.get('stripe')!;
  }

  getDatabaseBreaker(): CircuitBreaker {
    if (!this.breakers.has('database')) {
      this.createBreaker('database', {
        failureThreshold: 10,
        resetTimeout: 5000 // Fast recovery for DB
      });
    }
    return this.breakers.get('database')!;
  }

  getAllStatuses(): Array<ReturnType<CircuitBreaker['getStatus']>> {
    return Array.from(this.breakers.values()).map(breaker => breaker.getStatus());
  }

  resetBreaker(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker['reset'](); // Access private method
      console.log(`🔄 Circuit breaker manually reset: ${name}`);
      return true;
    }
    return false;
  }
}

export default new CircuitBreakerService();
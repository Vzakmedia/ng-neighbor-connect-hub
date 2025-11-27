export type ConnectionState = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'failed';

export interface ReconnectionConfig {
  baseDelay: number;
  maxDelay: number;
  maxRetries: number;
  jitterFactor: number;
}

export interface ReconnectionState {
  state: ConnectionState;
  attempts: number;
  lastAttemptAt: number;
  lastConnectedAt: number;
  nextRetryAt: number;
  error: string | null;
}

const DEFAULT_CONFIG: ReconnectionConfig = {
  baseDelay: 1000,
  maxDelay: 30000,
  maxRetries: 10,
  jitterFactor: 0.5,
};

export class ReconnectionManager {
  private state: ReconnectionState;
  private config: ReconnectionConfig;
  private retryTimer: NodeJS.Timeout | null = null;
  private onStateChange?: (state: ConnectionState) => void;
  private onReconnect?: () => Promise<void>;

  constructor(config: Partial<ReconnectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      state: 'disconnected',
      attempts: 0,
      lastAttemptAt: 0,
      lastConnectedAt: 0,
      nextRetryAt: 0,
      error: null,
    };
  }

  setOnStateChange(callback: (state: ConnectionState) => void) {
    this.onStateChange = callback;
  }

  setOnReconnect(callback: () => Promise<void>) {
    this.onReconnect = callback;
  }

  // Calculate backoff delay with exponential backoff and jitter
  private calculateBackoff(attempt: number): number {
    const exponentialDelay = this.config.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * this.config.jitterFactor * exponentialDelay;
    return Math.min(exponentialDelay + jitter, this.config.maxDelay);
  }

  // Transition to a new state
  private transitionTo(newState: ConnectionState, error: string | null = null): void {
    const oldState = this.state.state;
    this.state.state = newState;
    this.state.error = error;

    console.log(`[ReconnectionManager] ${oldState} -> ${newState}`, error ? { error } : '');

    if (newState === 'connected') {
      this.state.lastConnectedAt = Date.now();
      this.state.attempts = 0;
      this.clearRetryTimer();
    }

    this.onStateChange?.(newState);
  }

  // Start connection attempt
  async connect(): Promise<void> {
    if (this.state.state === 'connecting' || this.state.state === 'connected') {
      return;
    }

    this.transitionTo('connecting');
    this.state.lastAttemptAt = Date.now();

    try {
      await this.onReconnect?.();
      this.transitionTo('connected');
    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  // Handle connection error
  private handleConnectionError(error: Error): void {
    this.state.attempts++;

    if (this.state.attempts >= this.config.maxRetries) {
      this.transitionTo('failed', error.message);
      return;
    }

    this.transitionTo('reconnecting', error.message);
    this.scheduleRetry();
  }

  // Schedule retry with backoff
  private scheduleRetry(): void {
    this.clearRetryTimer();

    const delay = this.calculateBackoff(this.state.attempts);
    this.state.nextRetryAt = Date.now() + delay;

    console.log(`[ReconnectionManager] Scheduling retry #${this.state.attempts} in ${delay}ms`);

    this.retryTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Handle successful connection
  onConnected(): void {
    this.transitionTo('connected');
  }

  // Handle connection lost
  onDisconnected(error?: string): void {
    if (this.state.state === 'connected') {
      this.transitionTo('reconnecting', error || 'Connection lost');
      this.scheduleRetry();
    }
  }

  // Handle network handoff (WiFi <-> Cellular)
  onNetworkHandoff(): void {
    console.log('[ReconnectionManager] Network handoff detected');
    
    // Cancel any pending retry
    this.clearRetryTimer();
    
    // Reset attempts counter for handoff (not a failure)
    this.state.attempts = 0;
    
    // Immediately attempt reconnection
    this.connect();
  }

  // Manual retry (user triggered)
  async manualRetry(): Promise<void> {
    this.clearRetryTimer();
    this.state.attempts = 0;
    await this.connect();
  }

  // Clear retry timer
  private clearRetryTimer(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  // Get current state
  getState(): ReconnectionState {
    return { ...this.state };
  }

  // Get connection state
  getConnectionState(): ConnectionState {
    return this.state.state;
  }

  // Check if connected
  isConnected(): boolean {
    return this.state.state === 'connected';
  }

  // Check if should retry
  shouldRetry(): boolean {
    return this.state.state === 'reconnecting' && this.state.attempts < this.config.maxRetries;
  }

  // Reset manager
  reset(): void {
    this.clearRetryTimer();
    this.state = {
      state: 'disconnected',
      attempts: 0,
      lastAttemptAt: 0,
      lastConnectedAt: 0,
      nextRetryAt: 0,
      error: null,
    };
  }

  // Cleanup
  destroy(): void {
    this.clearRetryTimer();
    this.onStateChange = undefined;
    this.onReconnect = undefined;
  }
}

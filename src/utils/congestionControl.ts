export interface CongestionState {
  windowSize: number;
  rtt: number;
  rttVariance: number;
  ssthresh: number;
  inSlowStart: boolean;
  pendingAcks: number;
  lastCongestionTime: number;
  sentMessages: Map<string, number>;
}

export interface MessageBatch {
  messages: Array<{ id: string; data: any }>;
  scheduledAt: number;
}

const INITIAL_WINDOW_SIZE = 2;
const MAX_WINDOW_SIZE = 20;
const MIN_WINDOW_SIZE = 1;
const INITIAL_SSTHRESH = 10;
const BATCH_INTERVAL_MS = 100;
const ALPHA = 0.125; // RTT smoothing factor
const BETA = 0.25; // RTT variance smoothing factor

export class CongestionController {
  private state: CongestionState;
  private batch: MessageBatch;
  private batchTimer: NodeJS.Timeout | null = null;
  private onFlushBatch?: (messages: Array<{ id: string; data: any }>) => void;

  constructor() {
    this.state = {
      windowSize: INITIAL_WINDOW_SIZE,
      rtt: 100,
      rttVariance: 50,
      ssthresh: INITIAL_SSTHRESH,
      inSlowStart: true,
      pendingAcks: 0,
      lastCongestionTime: 0,
      sentMessages: new Map(),
    };
    this.batch = {
      messages: [],
      scheduledAt: Date.now(),
    };
  }

  setOnFlushBatch(callback: (messages: Array<{ id: string; data: any }>) => void) {
    this.onFlushBatch = callback;
  }

  // Track message send
  trackSend(messageId: string): void {
    this.state.sentMessages.set(messageId, Date.now());
    this.state.pendingAcks++;
  }

  // Track message acknowledgment and update RTT
  trackAck(messageId: string): void {
    const sendTime = this.state.sentMessages.get(messageId);
    if (!sendTime) return;

    const rtt = Date.now() - sendTime;
    this.updateRtt(rtt);
    this.state.sentMessages.delete(messageId);
    this.state.pendingAcks = Math.max(0, this.state.pendingAcks - 1);

    // Increase window on successful ACK
    this.onSuccess();
  }

  // Update RTT using exponential weighted moving average
  private updateRtt(sampleRtt: number): void {
    const diff = Math.abs(sampleRtt - this.state.rtt);
    this.state.rttVariance = (1 - BETA) * this.state.rttVariance + BETA * diff;
    this.state.rtt = (1 - ALPHA) * this.state.rtt + ALPHA * sampleRtt;
  }

  // Handle successful transmission
  private onSuccess(): void {
    if (this.state.inSlowStart) {
      // Slow start: exponential growth
      this.state.windowSize = Math.min(
        this.state.windowSize + 1,
        this.state.ssthresh
      );
      if (this.state.windowSize >= this.state.ssthresh) {
        this.state.inSlowStart = false;
      }
    } else {
      // Congestion avoidance: linear growth
      this.state.windowSize = Math.min(
        this.state.windowSize + 1 / this.state.windowSize,
        MAX_WINDOW_SIZE
      );
    }
  }

  // Handle transmission failure (congestion detected)
  onFailure(): void {
    this.state.lastCongestionTime = Date.now();
    this.state.ssthresh = Math.max(this.state.windowSize / 2, MIN_WINDOW_SIZE);
    this.state.windowSize = MIN_WINDOW_SIZE;
    this.state.inSlowStart = false;
  }

  // Add message to batch
  addToBatch(messageId: string, data: any, priority: boolean = false): void {
    // Priority messages bypass batching
    if (priority) {
      this.flushBatch();
      this.onFlushBatch?.([{ id: messageId, data }]);
      return;
    }

    this.batch.messages.push({ id: messageId, data });

    // Start batch timer if not already running
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flushBatch(), BATCH_INTERVAL_MS);
    }

    // Flush if batch is full
    if (this.batch.messages.length >= this.state.windowSize) {
      this.flushBatch();
    }
  }

  // Flush current batch
  private flushBatch(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.batch.messages.length > 0) {
      this.onFlushBatch?.(this.batch.messages);
      this.batch = {
        messages: [],
        scheduledAt: Date.now(),
      };
    }
  }

  // Check if we can send more messages
  canSend(): boolean {
    return this.state.pendingAcks < this.state.windowSize;
  }

  // Get current congestion level
  getCongestionLevel(): 'none' | 'low' | 'medium' | 'high' {
    const utilization = this.state.pendingAcks / this.state.windowSize;
    
    if (utilization < 0.3) return 'none';
    if (utilization < 0.6) return 'low';
    if (utilization < 0.85) return 'medium';
    return 'high';
  }

  // Get send rate (messages per second)
  getSendRate(): number {
    if (this.state.rtt === 0) return 0;
    return (this.state.windowSize / this.state.rtt) * 1000;
  }

  // Get current state
  getState(): CongestionState {
    return { ...this.state };
  }

  // Reset controller
  reset(): void {
    this.state = {
      windowSize: INITIAL_WINDOW_SIZE,
      rtt: 100,
      rttVariance: 50,
      ssthresh: INITIAL_SSTHRESH,
      inSlowStart: true,
      pendingAcks: 0,
      lastCongestionTime: 0,
      sentMessages: new Map(),
    };
    this.batch = {
      messages: [],
      scheduledAt: Date.now(),
    };
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }
}

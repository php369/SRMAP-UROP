/**
 * WebSocket Reconnection with Exponential Backoff
 * Handles reconnection logic for Socket.IO connections
 */

import { io, Socket } from 'socket.io-client';
import { logger } from './logger';

export interface ReconnectionConfig {
  maxReconnectAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  jitterRange?: number;
  onReconnecting?: (attempt: number, delay: number) => void;
  onReconnected?: () => void;
  onMaxAttemptsReached?: () => void;
}

export class SocketReconnectionManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private baseDelay: number;
  private maxDelay: number;
  private jitterRange: number;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isManualDisconnect = false;
  private config: ReconnectionConfig;

  constructor(config: ReconnectionConfig = {}) {
    this.maxReconnectAttempts = config.maxReconnectAttempts || 10;
    this.baseDelay = config.baseDelay || 1000; // 1 second
    this.maxDelay = config.maxDelay || 30000; // 30 seconds
    this.jitterRange = config.jitterRange || 1000; // 1 second
    this.config = config;
  }

  /**
   * Calculate reconnection delay with exponential backoff and jitter
   */
  private getReconnectDelay(): number {
    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts),
      this.maxDelay
    );

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * this.jitterRange;

    return exponentialDelay + jitter;
  }

  /**
   * Connect to socket server
   */
  connect(url: string, options: any = {}): Socket {
    // Prevent multiple connections
    if (this.socket?.connected) {
      logger.info('Socket already connected');
      return this.socket;
    }

    this.isManualDisconnect = false;

    // Create socket with manual reconnection
    this.socket = io(url, {
      ...options,
      reconnection: false, // Handle reconnection manually
      autoConnect: true,
    });

    this.setupEventListeners();

    logger.info('Socket connection initiated');
    return this.socket;
  }

  /**
   * Setup socket event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      logger.info('✅ Socket connected');
      this.reconnectAttempts = 0; // Reset on successful connection

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      if (this.config.onReconnected) {
        this.config.onReconnected();
      }
    });

    this.socket.on('disconnect', (reason) => {
      logger.warn('Socket disconnected:', { reason });

      // Don't reconnect if it was a manual disconnect
      if (this.isManualDisconnect) {
        logger.info('Manual disconnect, not reconnecting');
        return;
      }

      // Don't reconnect if server initiated disconnect
      if (reason === 'io server disconnect') {
        logger.warn('Server initiated disconnect, not reconnecting');
        return;
      }

      // Attempt reconnection
      this.scheduleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      logger.error('Socket connection error:', { error });
      this.scheduleReconnect();
    });

    this.socket.on('error', (error) => {
      logger.error('Socket error:', { error });
    });

    // Custom reconnection event
    this.socket.on('reconnect_attempt', (attempt) => {
      logger.info(`Reconnection attempt ${attempt}`);
    });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect() {
    // Check if max attempts reached
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');

      if (this.config.onMaxAttemptsReached) {
        this.config.onMaxAttemptsReached();
      }

      return;
    }

    // Clear existing timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = this.getReconnectDelay();
    this.reconnectAttempts++;

    logger.info(
      `Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${Math.round(delay)}ms`
    );

    if (this.config.onReconnecting) {
      this.config.onReconnecting(this.reconnectAttempts, delay);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.attemptReconnect();
    }, delay);
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect() {
    if (!this.socket) {
      logger.error('No socket to reconnect');
      return;
    }

    logger.info(`Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    try {
      this.socket.connect();
    } catch (error) {
      logger.error('Reconnection attempt failed:', { error });
      this.scheduleReconnect();
    }
  }

  /**
   * Manually disconnect
   */
  disconnect() {
    this.isManualDisconnect = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.reconnectAttempts = 0;
    logger.info('Socket manually disconnected');
  }

  /**
   * Force immediate reconnection
   */
  forceReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts = 0;
    this.attemptReconnect();
  }

  /**
   * Get current socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get reconnection status
   */
  getStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    maxAttempts: number;
    isReconnecting: boolean;
  } {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      isReconnecting: this.reconnectTimeout !== null,
    };
  }

  /**
   * Reset reconnection attempts
   */
  resetAttempts() {
    this.reconnectAttempts = 0;
  }
}

/**
 * Usage Example:
 * 
 * import { SocketReconnectionManager } from '@/utils/socketReconnection';
 * 
 * const socketManager = new SocketReconnectionManager({
 *   maxReconnectAttempts: 10,
 *   baseDelay: 1000,
 *   maxDelay: 30000,
 *   onReconnecting: (attempt, delay) => {
 *     console.log(`Reconnecting in ${delay}ms (attempt ${attempt})`);
 *     // Show toast notification
 *   },
 *   onReconnected: () => {
 *     console.log('Reconnected successfully!');
 *     // Hide toast, refresh data
 *   },
 *   onMaxAttemptsReached: () => {
 *     console.error('Could not reconnect. Please refresh the page.');
 *     // Show error message
 *   },
 * });
 * 
 * // Connect
 * const socket = socketManager.connect('http://localhost:3001', {
 *   auth: { token: 'your-token' },
 * });
 * 
 * // Listen to events
 * socket.on('notification', (data) => {
 *   console.log('Notification:', data);
 * });
 * 
 * // Disconnect
 * socketManager.disconnect();
 * 
 * // Force reconnect
 * socketManager.forceReconnect();
 * 
 * // Check status
 * const status = socketManager.getStatus();
 * console.log('Connected:', status.connected);
 */

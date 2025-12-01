/**
 * Monitoring and Analytics Utility
 * Integrates Sentry for error tracking and performance monitoring
 */

interface MonitoringConfig {
  dsn?: string;
  environment: string;
  release?: string;
  sampleRate?: number;
  tracesSampleRate?: number;
  enabled?: boolean;
}

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private config: MonitoringConfig;
  private initialized = false;
  private sentryAvailable = false;

  constructor() {
    this.config = {
      environment: import.meta.env.VITE_ENVIRONMENT || 'development',
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',
      sampleRate: 1.0,
      tracesSampleRate: 0.1,
      enabled: import.meta.env.PROD,
    };
  }

  /**
   * Initialize monitoring services
   */
  async initialize(config?: Partial<MonitoringConfig>) {
    if (this.initialized) {
      console.warn('Monitoring already initialized');
      return;
    }

    this.config = { ...this.config, ...config };

    if (!this.config.enabled) {
      console.log('📊 Monitoring disabled in development');
      return;
    }

    try {
      // Initialize Sentry (if available)
      await this.initializeSentry();

      // Initialize performance monitoring
      this.initializePerformanceMonitoring();

      // Initialize error tracking
      this.initializeErrorTracking();

      this.initialized = true;
      console.log('✅ Monitoring initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize monitoring:', error);
    }
  }

  /**
   * Initialize Sentry for error tracking
   */
  private async initializeSentry() {
    if (!this.config.dsn) {
      console.log('📊 Sentry DSN not configured, skipping Sentry initialization');
      return;
    }

    try {
      // Dynamically import Sentry to avoid bundling if not used
      const Sentry = await import('@sentry/react');

      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,
        sampleRate: this.config.sampleRate,
        tracesSampleRate: this.config.tracesSampleRate,
        integrations: [
          new Sentry.BrowserTracing({
            tracePropagationTargets: ['localhost', /^https:\/\/.*\.srmap\.edu\.in/],
          }),
          new Sentry.Replay({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        beforeSend(event, hint) {
          // Filter out certain errors
          if (event.exception) {
            const error = hint.originalException;
            
            // Ignore network errors
            if (error instanceof Error && error.message.includes('Network')) {
              return null;
            }

            // Ignore cancelled requests
            if (error instanceof Error && error.message.includes('cancel')) {
              return null;
            }
          }

          return event;
        },
      });

      this.sentryAvailable = true;
      console.log('✅ Sentry initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Sentry:', error);
    }
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      // Monitor Largest Contentful Paint (LCP)
      this.observePerformanceMetric('largest-contentful-paint', (entries) => {
        const lastEntry = entries[entries.length - 1];
        this.trackPerformance({
          name: 'LCP',
          value: lastEntry.renderTime || lastEntry.loadTime,
          unit: 'ms',
        });
      });

      // Monitor First Input Delay (FID)
      this.observePerformanceMetric('first-input', (entries) => {
        const firstEntry = entries[0];
        this.trackPerformance({
          name: 'FID',
          value: firstEntry.processingStart - firstEntry.startTime,
          unit: 'ms',
        });
      });

      // Monitor Cumulative Layout Shift (CLS)
      let clsValue = 0;
      this.observePerformanceMetric('layout-shift', (entries) => {
        for (const entry of entries) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.trackPerformance({
          name: 'CLS',
          value: clsValue,
          unit: 'score',
        });
      });

      console.log('✅ Performance monitoring initialized');
    }
  }

  /**
   * Observe performance metrics
   */
  private observePerformanceMetric(
    type: string,
    callback: (entries: PerformanceEntry[]) => void
  ) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type, buffered: true });
    } catch (error) {
      console.error(`Failed to observe ${type}:`, error);
    }
  }

  /**
   * Initialize global error tracking
   */
  private initializeErrorTracking() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(event.reason, {
        type: 'unhandledrejection',
        promise: event.promise,
      });
    });

    // Catch global errors
    window.addEventListener('error', (event) => {
      this.captureException(event.error, {
        type: 'error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    console.log('✅ Error tracking initialized');
  }

  /**
   * Capture an exception
   */
  captureException(error: Error | any, context?: Record<string, any>) {
    console.error('🐛 Error captured:', error, context);

    if (this.sentryAvailable) {
      import('@sentry/react').then((Sentry) => {
        if (context) {
          Sentry.setContext('error_context', context);
        }
        Sentry.captureException(error);
      });
    }

    // Log to console in development
    if (!this.config.enabled) {
      console.error('Error:', error);
      console.error('Context:', context);
    }
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    console.log(`📝 Message captured [${level}]:`, message);

    if (this.sentryAvailable) {
      import('@sentry/react').then((Sentry) => {
        Sentry.captureMessage(message, level);
      });
    }
  }

  /**
   * Track an analytics event
   */
  trackEvent(event: AnalyticsEvent) {
    console.log('📊 Event tracked:', event);

    // Send to analytics service (Google Analytics, Mixpanel, etc.)
    if (this.config.enabled && (window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.metadata,
      });
    }

    // Send to Sentry as breadcrumb
    if (this.sentryAvailable) {
      import('@sentry/react').then((Sentry) => {
        Sentry.addBreadcrumb({
          category: event.category,
          message: event.action,
          level: 'info',
          data: {
            label: event.label,
            value: event.value,
            ...event.metadata,
          },
        });
      });
    }
  }

  /**
   * Track a page view
   */
  trackPageView(path: string, title?: string) {
    console.log('📄 Page view:', path, title);

    if (this.config.enabled && (window as any).gtag) {
      (window as any).gtag('config', (window as any).GA_MEASUREMENT_ID, {
        page_path: path,
        page_title: title,
      });
    }

    this.trackEvent({
      category: 'Navigation',
      action: 'page_view',
      label: path,
      metadata: { title },
    });
  }

  /**
   * Track a performance metric
   */
  trackPerformance(metric: PerformanceMetric) {
    console.log('⚡ Performance metric:', metric);

    // Send to analytics
    if (this.config.enabled && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_unit: metric.unit,
        ...metric.metadata,
      });
    }

    // Send to Sentry
    if (this.sentryAvailable) {
      import('@sentry/react').then((Sentry) => {
        Sentry.addBreadcrumb({
          category: 'performance',
          message: `${metric.name}: ${metric.value}${metric.unit}`,
          level: 'info',
          data: metric.metadata,
        });
      });
    }
  }

  /**
   * Set user context
   */
  setUser(user: { id: string; email?: string; name?: string; role?: string }) {
    console.log('👤 User context set:', user);

    if (this.sentryAvailable) {
      import('@sentry/react').then((Sentry) => {
        Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.name,
          role: user.role,
        });
      });
    }

    // Set user in analytics
    if (this.config.enabled && (window as any).gtag) {
      (window as any).gtag('set', 'user_properties', {
        user_id: user.id,
        user_role: user.role,
      });
    }
  }

  /**
   * Clear user context
   */
  clearUser() {
    console.log('👤 User context cleared');

    if (this.sentryAvailable) {
      import('@sentry/react').then((Sentry) => {
        Sentry.setUser(null);
      });
    }
  }

  /**
   * Add custom context
   */
  setContext(key: string, value: Record<string, any>) {
    if (this.sentryAvailable) {
      import('@sentry/react').then((Sentry) => {
        Sentry.setContext(key, value);
      });
    }
  }

  /**
   * Start a transaction for performance monitoring
   */
  startTransaction(name: string, op: string) {
    if (this.sentryAvailable) {
      return import('@sentry/react').then((Sentry) => {
        return Sentry.startTransaction({ name, op });
      });
    }
    return Promise.resolve(null);
  }

  /**
   * Get Web Vitals
   */
  async getWebVitals() {
    try {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');

      getCLS((metric) => {
        this.trackPerformance({
          name: 'CLS',
          value: metric.value,
          unit: 'score',
          metadata: { rating: metric.rating },
        });
      });

      getFID((metric) => {
        this.trackPerformance({
          name: 'FID',
          value: metric.value,
          unit: 'ms',
          metadata: { rating: metric.rating },
        });
      });

      getFCP((metric) => {
        this.trackPerformance({
          name: 'FCP',
          value: metric.value,
          unit: 'ms',
          metadata: { rating: metric.rating },
        });
      });

      getLCP((metric) => {
        this.trackPerformance({
          name: 'LCP',
          value: metric.value,
          unit: 'ms',
          metadata: { rating: metric.rating },
        });
      });

      getTTFB((metric) => {
        this.trackPerformance({
          name: 'TTFB',
          value: metric.value,
          unit: 'ms',
          metadata: { rating: metric.rating },
        });
      });
    } catch (error) {
      console.error('Failed to get Web Vitals:', error);
    }
  }
}

// Export singleton instance
export const monitoring = new MonitoringService();

// Export types
export type { MonitoringConfig, AnalyticsEvent, PerformanceMetric };

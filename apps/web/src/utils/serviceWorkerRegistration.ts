/**
 * Service Worker Registration Utility
 * Handles registration, updates, and communication with the service worker
 */

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

/**
 * Register the service worker
 */
export function register(config?: ServiceWorkerConfig) {
  if ('serviceWorker' in navigator) {
    // Wait for the page to load
    window.addEventListener('load', () => {
      const swUrl = `/service-worker.js`;

      registerValidSW(swUrl, config);
    });
  } else {
    console.log('Service Worker is not supported in this browser');
  }
}

/**
 * Register a valid service worker
 */
async function registerValidSW(swUrl: string, config?: ServiceWorkerConfig) {
  try {
    const registration = await navigator.serviceWorker.register(swUrl);

    console.log('✅ Service Worker registered successfully:', registration);

    // Check for updates
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      
      if (installingWorker == null) {
        return;
      }

      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available
            console.log('🔄 New content is available; please refresh.');
            
            if (config && config.onUpdate) {
              config.onUpdate(registration);
            }
          } else {
            // Content cached for offline use
            console.log('✅ Content is cached for offline use.');
            
            if (config && config.onSuccess) {
              config.onSuccess(registration);
            }
          }
        }
      };
    };

    // Check for updates periodically (every hour)
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
  }
}

/**
 * Unregister the service worker
 */
export async function unregister() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      console.log('✅ Service Worker unregistered successfully');
    } catch (error) {
      console.error('❌ Service Worker unregistration failed:', error);
    }
  }
}

/**
 * Update the service worker
 */
export async function update() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      console.log('✅ Service Worker update check completed');
    } catch (error) {
      console.error('❌ Service Worker update failed:', error);
    }
  }
}

/**
 * Skip waiting and activate new service worker immediately
 */
export async function skipWaiting() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page after the new service worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }
}

/**
 * Clear all caches
 */
export async function clearCache() {
  if ('serviceWorker' in navigator && 'caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('✅ All caches cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear caches:', error);
      return false;
    }
  }
  return false;
}

/**
 * Get cache size
 */
export async function getCacheSize(): Promise<number> {
  if ('serviceWorker' in navigator && 'caches' in window) {
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }

      return totalSize;
    } catch (error) {
      console.error('❌ Failed to get cache size:', error);
      return 0;
    }
  }
  return 0;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if the app is running in standalone mode (PWA)
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Request background sync
 */
export async function requestBackgroundSync(tag: string) {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      console.log(`✅ Background sync registered: ${tag}`);
      return true;
    } catch (error) {
      console.error(`❌ Background sync failed: ${tag}`, error);
      return false;
    }
  }
  return false;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    console.log(`📬 Notification permission: ${permission}`);
    return permission;
  }
  return 'denied';
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(vapidPublicKey: string) {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log('✅ Push notification subscription:', subscription);
      return subscription;
    } catch (error) {
      console.error('❌ Push notification subscription failed:', error);
      return null;
    }
  }
  return null;
}

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Listen for service worker messages
 */
export function listenForMessages(callback: (message: any) => void) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      callback(event.data);
    });
  }
}

/**
 * Send message to service worker
 */
export async function sendMessage(message: any): Promise<any> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration.active) {
      return new Promise((resolve, reject) => {
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = (event) => {
          if (event.data.error) {
            reject(event.data.error);
          } else {
            resolve(event.data);
          }
        };

        registration.active.postMessage(message, [messageChannel.port2]);
      });
    }
  }
  
  throw new Error('Service Worker not available');
}

/**
 * Setup online/offline listeners
 */
export function setupOnlineOfflineListeners(config?: ServiceWorkerConfig) {
  window.addEventListener('online', () => {
    console.log('🌐 Back online');
    if (config?.onOnline) {
      config.onOnline();
    }
  });

  window.addEventListener('offline', () => {
    console.log('📡 Gone offline');
    if (config?.onOffline) {
      config.onOffline();
    }
  });
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

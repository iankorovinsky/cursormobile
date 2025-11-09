/**
 * iPhone PWA Notification Utility
 * 
 * Requirements for iPhone notifications:
 * - App must be added to home screen
 * - Permission must be requested with user interaction
 * - Service worker must be registered
 * - HTTPS required (or localhost for development)
 */

export interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string; // Used to replace existing notifications with same tag
  data?: Record<string, unknown>; // Custom data to pass with notification
  requireInteraction?: boolean;
  silent?: boolean;
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Check current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission (must be called from user interaction)
 * @returns Promise<NotificationPermission>
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    throw new Error('Notifications are not supported in this browser');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  // Request permission (must be called from user interaction on iOS)
  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Show a notification
 * Works best when app is in background or closed
 * @param options Notification options
 * @returns Promise<Notification | null>
 */
export async function showNotification(options: NotificationOptions): Promise<Notification | null> {
  if (!isNotificationSupported()) {
    console.warn('Notifications are not supported');
    return null;
  }

  // Check permission
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  // If service worker is available, use it for better background support
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Use service worker to show notification (works when app is closed)
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon,
        badge: options.badge,
        tag: options.tag, // Replaces existing notification with same tag
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
      });

      console.log('✅ Notification sent successfully via service worker:', {
        title: options.title,
        body: options.body,
        tag: options.tag,
      });

      return null; // Service worker notification doesn't return Notification object
    } catch (error) {
      console.error('Error showing notification via service worker:', error);
      // Fall through to direct notification
    }
  }

  // Fallback to direct notification (works when app is in foreground)
  try {
    const notificationOptions: NotificationOptions = {
      body: options.body,
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
    };
    
    // Only add icon/badge if provided (to avoid 404 errors)
    if (options.icon) {
      notificationOptions.icon = options.icon;
    }
    if (options.badge) {
      notificationOptions.badge = options.badge;
    }

    const notification = new Notification(options.title, notificationOptions);

    console.log('✅ Notification sent successfully (direct):', {
      title: options.title,
      body: options.body,
      tag: options.tag,
    });

    // Auto-close after 5 seconds if not requiring interaction
    if (!options.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 5000);
    }

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
}

/**
 * Close a notification by tag
 */
export async function closeNotification(tag: string): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications({ tag });
      notifications.forEach(notification => notification.close());
    } catch (error) {
      console.error('Error closing notification:', error);
    }
  }
}

/**
 * Close all notifications
 */
export async function closeAllNotifications(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications();
      notifications.forEach(notification => notification.close());
    } catch (error) {
      console.error('Error closing all notifications:', error);
    }
  }
}

/**
 * Check if app is running as PWA (added to home screen on iOS)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  
  // iOS Safari
  if ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone) {
    return true;
  }
  
  // Android Chrome
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  return false;
}

/**
 * Check if app is in foreground
 */
export function isAppInForeground(): boolean {
  if (typeof document === 'undefined') return true;
  return !document.hidden;
}

/**
 * Show a notification when a message is ready
 * Call this function when you detect that a message/response is complete
 * 
 * @param messageText - The message content to show in notification
 * @param title - Optional title (defaults to "New Message")
 */
export async function notifyMessageReady(
  messageText: string,
  title: string = 'New Message from Cursor'
): Promise<boolean> {
  // Check if notifications are supported
  if (!isNotificationSupported()) {
    console.warn('Notifications are not supported on this device');
    return false;
  }

  // Check permission
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted. User needs to enable notifications first.');
    return false;
  }

  // Show notification
  try {
    await showNotification({
      title: title,
      body: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
      // Icon and badge are optional - only include if files exist
      tag: 'new-message', // This will replace any existing "new-message" notification
      data: {
        url: '/chat', // Where to navigate when notification is clicked
        timestamp: Date.now(),
      },
      requireInteraction: false, // Auto-dismiss after 5 seconds
    });

    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
}

/**
 * Request notification permission (must be called from user interaction)
 * Use this in a button click handler
 */
export async function requestNotificationAccess(): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false;
  }

  try {
    const permission = await requestNotificationPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}


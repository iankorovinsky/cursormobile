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
 * Check if we're on Chrome iOS (which has limited PWA support)
 */
export function isChromeIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /CriOS/i.test(ua) || (/Chrome/i.test(ua) && /iPhone|iPad|iPod/i.test(ua));
}

/**
 * Check if we're on Safari iOS
 */
export function isSafariIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS|OPiOS/i.test(ua);
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  // Chrome on iOS has very limited PWA support - notifications may not work
  if (isChromeIOS()) {
    console.warn('⚠️ Chrome on iOS has limited PWA support. Please use Safari for best experience.');
  }
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Check current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
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
  if (typeof window === 'undefined' || !('Notification' in window)) {
    throw new Error('Notification API is not available');
  }
  
  console.log('🔐 requestNotificationPermission called');
  console.log('📊 Current permission:', Notification.permission);
  
  if (!isNotificationSupported()) {
    const hasNotification = 'Notification' in window;
    const hasServiceWorker = 'serviceWorker' in navigator;
    console.error('❌ Notifications not supported:', { hasNotification, hasServiceWorker });
    throw new Error('Notifications are not supported in this browser');
  }

  if (Notification.permission === 'granted') {
    console.log('✅ Permission already granted');
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    console.warn('❌ Permission already denied');
    return 'denied';
  }

  console.log('📱 Requesting permission from user...');
  // Request permission (must be called from user interaction on iOS)
  try {
    const permission = await Notification.requestPermission();
    console.log('📋 User responded with:', permission);
    return permission;
  } catch (error) {
    console.error('❌ Error in Notification.requestPermission:', error);
    throw error;
  }
}

/**
 * Show a notification
 * Works best when app is in background or closed
 * @param options Notification options
 * @returns Promise<Notification | null>
 */
export async function showNotification(options: NotificationOptions): Promise<Notification | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('❌ Notification API is not available');
    return null;
  }
  
  if (!isNotificationSupported()) {
    console.warn('❌ Notifications are not supported in this browser');
    if (isChromeIOS()) {
      console.warn('💡 Chrome on iOS has limited PWA support. Please use Safari instead.');
    }
    return null;
  }

  // Check permission
  if (Notification.permission !== 'granted') {
    console.warn('❌ Notification permission not granted. Current permission:', Notification.permission);
    return null;
  }

  // Warn if using Chrome on iOS
  if (isChromeIOS()) {
    console.warn('⚠️ Chrome on iOS: Notifications may not work properly. Safari is recommended for iPhone PWAs.');
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


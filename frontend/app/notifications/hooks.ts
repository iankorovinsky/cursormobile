'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
  isStandalone,
  type NotificationOptions,
} from './utils';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    setIsSupported(isNotificationSupported());
    setPermission(getNotificationPermission());
    setIsPWA(isStandalone());
    
    // Log initial state
    console.log('🔔 useNotifications initialized:', {
      isSupported: isNotificationSupported(),
      permission: getNotificationPermission(),
      isPWA: isStandalone(),
      hasNotification: 'Notification' in window,
      hasServiceWorker: 'serviceWorker' in navigator,
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.error('❌ Notification API not available');
      return false;
    }
    
    console.log('🔐 Requesting notification permission...');
    console.log('📊 Current state:', { isSupported, currentPermission: Notification.permission });
    
    if (!isSupported) {
      console.warn('❌ Notifications are not supported');
      console.warn('💡 Check: Notification API available?', 'Notification' in window);
      console.warn('💡 Check: Service Worker available?', 'serviceWorker' in navigator);
      return false;
    }

    try {
      const newPermission = await requestNotificationPermission();
      console.log('📋 Permission result:', newPermission);
      
      // Update state
      setPermission(newPermission);
      
      // Also check the actual permission status (in case it changed)
      const actualPermission = typeof window !== 'undefined' && 'Notification' in window
        ? Notification.permission
        : 'denied';
      console.log('📊 Actual Notification.permission:', actualPermission);
      
      if (actualPermission !== newPermission) {
        console.warn('⚠️ Permission mismatch! Setting to actual value:', actualPermission);
        setPermission(actualPermission);
      }
      
      if (newPermission === 'granted' || actualPermission === 'granted') {
        console.log('✅ Notification permission granted!');
        return true;
      } else if (newPermission === 'denied' || actualPermission === 'denied') {
        console.warn('❌ Notification permission denied by user');
        return false;
      } else {
        console.warn('⚠️ Notification permission is default (user dismissed)');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      // Check actual permission in case of error
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const actualPermission = Notification.permission;
        setPermission(actualPermission);
        return actualPermission === 'granted';
      }
      return false;
    }
  }, [isSupported]);

  const notify = useCallback(async (options: NotificationOptions): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Notifications are not supported');
      return false;
    }

    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    try {
      await showNotification(options);
      console.log('✅ Notification hook: Notification sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Notification hook: Error showing notification:', error);
      return false;
    }
  }, [isSupported, permission]);

  return {
    isSupported,
    permission,
    isPWA,
    requestPermission,
    notify,
    canNotify: permission === 'granted',
  };
}


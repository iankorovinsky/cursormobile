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
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Notifications are not supported');
      return false;
    }

    try {
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);
      return newPermission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
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


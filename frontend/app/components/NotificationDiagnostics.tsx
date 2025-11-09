'use client';

import { useEffect, useState } from 'react';
import { useNotifications } from '../notifications/hooks';

export default function NotificationDiagnostics() {
  const { isSupported, permission, isPWA } = useNotifications();
  const [diagnostics, setDiagnostics] = useState<{
    userAgent: string;
    isStandalone: boolean;
    hasNotification: boolean;
    hasServiceWorker: boolean;
    notificationPermission: string;
    serviceWorkerRegistered: boolean;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkServiceWorker = async () => {
      let swRegistered = false;
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          swRegistered = registrations.length > 0;
        } catch (e) {
          swRegistered = false;
        }
      }

      setDiagnostics({
        userAgent: navigator.userAgent,
        isStandalone: (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches,
        hasNotification: 'Notification' in window,
        hasServiceWorker: 'serviceWorker' in navigator,
        notificationPermission: typeof window !== 'undefined' && 'Notification' in window
          ? Notification.permission
          : 'not available',
        serviceWorkerRegistered: swRegistered,
      });
    };

    checkServiceWorker();
  }, []);

  if (!diagnostics) {
    return (
      <div className="px-4 py-2 text-xs text-gray-500">
        Loading diagnostics...
      </div>
    );
  }

  const isChromeIOS = /CriOS/i.test(diagnostics.userAgent);
  const isSafariIOS = /iPhone|iPad|iPod/.test(diagnostics.userAgent) && !isChromeIOS;

  return (
    <div className="px-4 py-2 text-xs border-t border-gray-800 space-y-2">
      <div className="font-semibold text-white mb-2">🔍 Notification Diagnostics</div>
      
      <div className="space-y-1 text-gray-300">
        <div>
          <span className="text-gray-500">Browser:</span>{' '}
          {isChromeIOS ? 'Chrome iOS' : isSafariIOS ? 'Safari iOS' : 'Other'}
        </div>
        <div>
          <span className="text-gray-500">PWA Mode:</span>{' '}
          <span className={diagnostics.isStandalone ? 'text-green-400' : 'text-yellow-400'}>
            {diagnostics.isStandalone ? 'Yes ✓' : 'No (open from home screen)'}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Notification API:</span>{' '}
          <span className={diagnostics.hasNotification ? 'text-green-400' : 'text-red-400'}>
            {diagnostics.hasNotification ? 'Available ✓' : 'Not Available ✗'}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Service Worker:</span>{' '}
          <span className={diagnostics.hasServiceWorker ? 'text-green-400' : 'text-red-400'}>
            {diagnostics.hasServiceWorker ? 'Available ✓' : 'Not Available ✗'}
          </span>
        </div>
        <div>
          <span className="text-gray-500">SW Registered:</span>{' '}
          <span className={diagnostics.serviceWorkerRegistered ? 'text-green-400' : 'text-yellow-400'}>
            {diagnostics.serviceWorkerRegistered ? 'Yes ✓' : 'No'}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Permission:</span>{' '}
          <span className={
            diagnostics.notificationPermission === 'granted' ? 'text-green-400' :
            diagnostics.notificationPermission === 'denied' ? 'text-red-400' :
            'text-yellow-400'
          }>
            {diagnostics.notificationPermission}
          </span>
        </div>
      </div>

      {diagnostics.notificationPermission === 'denied' && (
        <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-700 rounded text-yellow-400">
          <div className="font-semibold mb-1">To enable notifications:</div>
          {diagnostics.isStandalone ? (
            <div className="text-xs space-y-1">
              <div>1. Open Safari (not the PWA)</div>
              <div>2. Settings → Safari → Website Settings</div>
              <div>3. Find your website URL</div>
              <div>4. Enable Notifications</div>
            </div>
          ) : (
            <div className="text-xs">
              Settings → Safari → Website Settings → Notifications
            </div>
          )}
        </div>
      )}

      {isChromeIOS && (
        <div className="mt-2 p-2 bg-red-900/20 border border-red-700 rounded text-red-400 text-xs">
          ⚠️ Chrome on iOS has limited PWA support. Use Safari for best results.
        </div>
      )}
    </div>
  );
}


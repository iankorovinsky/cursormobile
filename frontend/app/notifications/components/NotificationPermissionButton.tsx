'use client';

import { useNotifications } from '../hooks';
import { useState } from 'react';

export default function NotificationPermissionButton() {
  const { isSupported, permission, isPWA, requestPermission, canNotify } = useNotifications();
  const [isRequesting, setIsRequesting] = useState(false);

  if (!isSupported) {
    const isChrome = typeof window !== 'undefined' && /CriOS/i.test(window.navigator.userAgent);
    return (
      <div className="px-4 py-2 text-xs">
        {isChrome ? (
          <div className="space-y-2">
            <div className="text-red-400">
              ⚠️ Chrome on iOS has limited PWA support
            </div>
            <div className="text-yellow-400">
              💡 Please use <strong>Safari</strong> for notifications to work properly
            </div>
            <div className="text-gray-400 text-xs mt-2">
              Steps: Open in Safari → Add to Home Screen → Enable notifications
            </div>
          </div>
        ) : (
          <div className="text-gray-500">
            Notifications not supported
          </div>
        )}
      </div>
    );
  }

  if (permission === 'granted') {
    return (
      <div className="px-4 py-2 text-xs text-green-400">
        ✓ Notifications enabled
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="px-4 py-2 text-xs">
        <div className="text-red-400 mb-2">
          ⚠️ Notifications blocked
        </div>
        {isPWA ? (
          <div className="text-yellow-400 space-y-1 text-xs">
            <div className="font-semibold mb-1">PWAs don't appear in main Settings</div>
            <div className="text-gray-300 space-y-1">
              <div>1. Open Safari (not the PWA)</div>
              <div>2. Settings → Safari</div>
              <div>3. "Website Settings" or "Advanced"</div>
              <div>4. Find your website URL</div>
              <div>5. Enable Notifications</div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-xs">
            Settings → Safari → Website Settings → Notifications
          </div>
        )}
      </div>
    );
  }

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    const granted = await requestPermission();
    setIsRequesting(false);
    
    if (!granted) {
      const currentPermission = typeof window !== 'undefined' && 'Notification' in window
        ? Notification.permission
        : 'denied';
      
      if (currentPermission === 'denied') {
        if (isPWA) {
          alert('Notifications are blocked for this PWA.\n\n⚠️ PWAs don\'t always appear in main Settings.\n\nTry this instead:\n1. Open Safari (not the PWA)\n2. Go to Settings > Safari\n3. Tap "Website Settings" or "Advanced"\n4. Find your website URL\n5. Tap it and enable Notifications\n\nThen come back and try again!');
        } else {
          alert('Notifications are blocked. Please enable them in:\n\nSettings > Safari > Website Settings > Notifications\n\nOr add the app to your home screen first for better PWA support.');
        }
      } else {
        alert('Please enable notifications in your browser settings to receive alerts when messages are ready.');
      }
    }
  };

  const isChrome = typeof window !== 'undefined' && /CriOS/i.test(window.navigator.userAgent);
  
  return (
    <div className="px-4 py-2 border-t border-gray-800">
      {isChrome && (
        <div className="mb-2 p-2 bg-yellow-900/20 border border-yellow-700 rounded text-xs text-yellow-400">
          ⚠️ <strong>Chrome on iOS limitation:</strong> Notifications may not work. Please use <strong>Safari</strong> for iPhone PWAs.
        </div>
      )}
      {!isPWA && !isChrome && (
        <div className="mb-2 text-xs text-yellow-400">
          💡 Add to Home Screen for best notification experience
        </div>
      )}
      <button
        onClick={handleRequestPermission}
        disabled={isRequesting}
        className="w-full px-4 py-2 text-sm text-center text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {isRequesting ? 'Requesting...' : 'Enable Notifications'}
      </button>
    </div>
  );
}


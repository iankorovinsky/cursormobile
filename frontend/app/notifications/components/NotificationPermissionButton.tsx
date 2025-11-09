'use client';

import { useNotifications } from '../hooks';
import { useState } from 'react';

export default function NotificationPermissionButton() {
  const { isSupported, permission, isPWA, requestPermission, canNotify } = useNotifications();
  const [isRequesting, setIsRequesting] = useState(false);

  if (!isSupported) {
    return (
      <div className="px-4 py-2 text-xs text-gray-500">
        Notifications not supported
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
      <div className="px-4 py-2 text-xs text-red-400">
        Notifications blocked. Enable in Settings
      </div>
    );
  }

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    const granted = await requestPermission();
    setIsRequesting(false);
    
    if (!granted) {
      alert('Please enable notifications in your browser settings to receive alerts when messages are ready.');
    }
  };

  return (
    <div className="px-4 py-2 border-t border-gray-800">
      {!isPWA && (
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


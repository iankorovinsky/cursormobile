'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if Chrome on iOS
    const isChromeIOS = /CriOS/i.test(window.navigator.userAgent);
    if (isChromeIOS) {
      console.warn('⚠️ Chrome on iOS detected: Service Workers may not work properly. Safari is recommended for iPhone PWAs.');
    }
    
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration);
          console.log('📱 Service Worker scope:', registration.scope);
          console.log('🔔 Service Worker state:', registration.active?.state || 'not active');
          
          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
          if (isChromeIOS) {
            console.error('💡 This is expected on Chrome iOS. Please use Safari for full PWA support.');
          }
        });
    } else {
      console.warn('⚠️ Service Workers not supported in this browser');
      if (isChromeIOS) {
        console.warn('💡 Chrome on iOS has limited support. Use Safari for iPhone PWAs.');
      }
    }
  }, []);

  return null; // This component doesn't render anything
}


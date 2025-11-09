/**
 * Dynamic backend URL configuration
 * Automatically detects the correct backend URL based on the current environment
 */

import { isStandalone } from '@/app/notifications/utils';

/**
 * Get ngrok backend URL from local ngrok API
 * Returns the public URL of the tunnel forwarding to port 8000
 */
async function getNgrokBackendUrl(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try to fetch from ngrok's local API (only works if ngrok is running locally)
    // Note: This won't work from iPhone, but we can cache it
    const response = await fetch('http://127.0.0.1:4040/api/tunnels');
    if (!response.ok) return null;
    
    const data = await response.json();
    const tunnels = data.tunnels || [];
    
    // Find tunnel forwarding to port 8000
    for (const tunnel of tunnels) {
      if (tunnel.proto === 'https' && tunnel.config?.addr?.includes(':8000')) {
        // Convert https:// to wss://
        return tunnel.public_url.replace('https://', 'wss://');
      }
    }
  } catch (error) {
    // ngrok API not accessible (normal when not running locally or from iPhone)
    return null;
  }
  
  return null;
}

/**
 * Get the relay server WebSocket URL
 * Priority:
 * 1. NEXT_PUBLIC_RELAY_SERVER_URL env var (if set)
 * 2. Stored ngrok URL in localStorage (if set)
 * 3. Dynamic detection based on current hostname
 *    - localhost -> ws://localhost:8000
 *    - local IP (192.168.x.x) -> wss://<ip>:8001 if HTTPS, ws://<ip>:8000 if HTTP
 *    - ngrok/https -> wss://<hostname> (assumes port 8000 or same domain)
 */
export function getRelayServerUrl(): string {
  // Check for explicit env var first
  if (process.env.NEXT_PUBLIC_RELAY_SERVER_URL) {
    return process.env.NEXT_PUBLIC_RELAY_SERVER_URL;
  }

  // Server-side rendering fallback
  if (typeof window === 'undefined') {
    return 'ws://localhost:8000';
  }

  // Check for stored ngrok URL (set automatically or manually) - check early
  const storedNgrokUrl = localStorage.getItem('NGROK_BACKEND_URL');
  if (storedNgrokUrl) {
    console.log('📡 Using stored ngrok backend URL:', storedNgrokUrl);
    return storedNgrokUrl;
  }

  const hostname = window.location.hostname;
  const isHTTPS = window.location.protocol === 'https:';
  const isPWA = isStandalone();
  
  // If on localhost, backend is also on localhost:8000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'ws://localhost:8000';
  }

  // If on a local IP (192.168.x.x, 10.x.x.x, etc)
  if (isLocalIP(hostname)) {
    // If frontend is HTTPS, use ngrok URL (hardcoded for now)
    // If frontend is HTTP, use ws:// on port 8000 (direct backend)
    if (isHTTPS) {
      // Hardcoded ngrok URL - update this when ngrok URL changes
      const ngrokUrl = 'wss://katharine-unrecurring-untastefully.ngrok-free.dev';
      if (isPWA) {
        console.log('📱 PWA detected on HTTPS with local IP - using ngrok backend:', ngrokUrl);
      }
      return ngrokUrl;
    } else {
      const backendUrl = `ws://${hostname}:8000`;
      return backendUrl;
    }
  }

  // For ngrok or production domains
  // Try to detect if backend is on a different subdomain or port
  // If frontend is on https://xyz.ngrok-free.app
  // Backend might be on a different ngrok URL or on port 8000
  
  // Check if there's a backend URL hint in localStorage (for manual override)
  // This takes priority over ngrok auto-detection
  const storedBackendUrl = localStorage.getItem('RELAY_SERVER_URL');
  if (storedBackendUrl) {
    console.log('📡 Using stored backend URL:', storedBackendUrl);
    return storedBackendUrl;
  }

  // Default: try same hostname on port 8000
  // This works if you're using ngrok with --hostname flag for both services
  // For HTTPS domains (ngrok, production), use wss://
  const protocol = isHTTPS ? 'wss:' : 'ws:';
  return `${protocol}//${hostname}:8000`;
}

/**
 * Check if a hostname is a local IP address
 */
function isLocalIP(hostname: string): boolean {
  // Match common local IP ranges
  return /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(hostname);
}

/**
 * Manually set the backend URL (stored in localStorage)
 * Useful for demo/testing with ngrok where backend and frontend have different URLs
 */
export function setRelayServerUrl(url: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('RELAY_SERVER_URL', url);
  console.log('📡 Backend URL set to:', url);
  console.log('🔄 Reload the page for changes to take effect');
}

/**
 * Clear the manually set backend URL
 */
export function clearRelayServerUrl(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('RELAY_SERVER_URL');
  console.log('📡 Backend URL cleared, will use auto-detection');
}

/**
 * Auto-detect and store ngrok backend URL
 * This runs once on page load to detect ngrok and cache the URL
 */
if (typeof window !== 'undefined') {
  // Try to detect ngrok backend URL (only works when accessing from same machine)
  getNgrokBackendUrl().then((ngrokUrl) => {
    if (ngrokUrl && !localStorage.getItem('NGROK_BACKEND_URL')) {
      localStorage.setItem('NGROK_BACKEND_URL', ngrokUrl);
      console.log('✅ Auto-detected ngrok backend URL:', ngrokUrl);
      console.log('🔄 Reload the page to use the ngrok backend');
    }
  }).catch(() => {
    // Silently fail if ngrok API is not accessible
  });
}

// Make these available on window for easy debugging in console
if (typeof window !== 'undefined') {
  (window as any).__setBackendUrl = setRelayServerUrl;
  (window as any).__clearBackendUrl = clearRelayServerUrl;
  (window as any).__getBackendUrl = getRelayServerUrl;
  (window as any).__setNgrokUrl = (url: string) => {
    localStorage.setItem('NGROK_BACKEND_URL', url);
    console.log('📡 Ngrok URL set:', url);
    console.log('🔄 Reload the page for changes to take effect');
  };
  (window as any).__clearNgrokUrl = () => {
    localStorage.removeItem('NGROK_BACKEND_URL');
    console.log('📡 Ngrok URL cleared');
  };
  
  console.log('💡 Backend URL helpers available:');
  console.log('   __setBackendUrl("ws://your-backend-url")');
  console.log('   __setNgrokUrl("wss://your-ngrok-url")');
  console.log('   __clearBackendUrl()');
  console.log('   __clearNgrokUrl()');
  console.log('   __getBackendUrl()');
}


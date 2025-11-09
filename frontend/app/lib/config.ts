/**
 * Dynamic backend URL configuration
 * Automatically detects the correct backend URL based on the current environment
 */

/**
 * Get the relay server WebSocket URL
 * Priority:
 * 1. NEXT_PUBLIC_RELAY_SERVER_URL env var (if set)
 * 2. Dynamic detection based on current hostname
 *    - localhost -> ws://localhost:8000
 *    - local IP (192.168.x.x) -> ws://<ip>:8000
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

  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  // If on localhost, backend is also on localhost:8000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'ws://localhost:8000';
  }

  // If on a local IP (192.168.x.x, 10.x.x.x, etc), use same IP with port 8000
  if (isLocalIP(hostname)) {
    return `${protocol}//${hostname}:8000`;
  }

  // For ngrok or production domains
  // Try to detect if backend is on a different subdomain or port
  // If frontend is on https://xyz.ngrok-free.app
  // Backend might be on a different ngrok URL or on port 8000
  
  // Check if there's a backend URL hint in localStorage (for manual override)
  const storedBackendUrl = localStorage.getItem('RELAY_SERVER_URL');
  if (storedBackendUrl) {
    console.log('📡 Using stored backend URL:', storedBackendUrl);
    return storedBackendUrl;
  }

  // Default: try same hostname on port 8000
  // This works if you're using ngrok with --hostname flag for both services
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

// Make these available on window for easy debugging in console
if (typeof window !== 'undefined') {
  (window as any).__setBackendUrl = setRelayServerUrl;
  (window as any).__clearBackendUrl = clearRelayServerUrl;
  (window as any).__getBackendUrl = getRelayServerUrl;
  
  console.log('💡 Backend URL helpers available:');
  console.log('   __setBackendUrl("ws://your-backend-url")');
  console.log('   __clearBackendUrl()');
  console.log('   __getBackendUrl()');
}


'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface User {
  name?: string;
  email?: string;
  picture?: string;
}

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasCheckedCallback = useRef(false);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      setUser(data && Object.keys(data).length > 0 ? data : null);
      setIsLoading(false);
    } catch {
      setUser(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check auth state on mount
    checkAuth();

    // Also check after a short delay in case we just returned from callback
    // This helps catch the case when the callback has processed but component
    // mounted before the session was fully established
    const timeoutId = setTimeout(() => {
      checkAuth();
    }, 1000);

    // Check again after 2 seconds (in case backend needs more time)
    const timeoutId2 = setTimeout(() => {
      checkAuth();
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, []);

  useEffect(() => {
    // Check auth state when route changes (e.g., after callback redirect)
    // This handles the case when we return from Auth0 callback
    if (pathname && !hasCheckedCallback.current) {
      // Check if we just came from a callback
      const code = searchParams?.get('code');
      if (code || pathname.includes('callback')) {
        hasCheckedCallback.current = true;
        // Delay to ensure backend has processed the callback
        setTimeout(() => {
          checkAuth();
        }, 300);
      }
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    // Check auth state when window gains focus (e.g., after redirect)
    const handleFocus = () => {
      checkAuth();
    };

    // Check auth state when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuth();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="px-4 py-2 text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-col gap-2 p-4 border-t border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          {user.picture && (
            <img
              src={user.picture}
              alt={user.name || 'User'}
              className="w-8 h-8 rounded-full"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user.email}
            </p>
          </div>
        </div>
        <a
          href="/api/auth/logout"
          className="w-full px-4 py-2 text-sm text-center text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
        >
          Logout
        </a>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-800">
      <a
        href="/api/auth/login"
        className="block w-full px-4 py-2 text-sm text-center text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
      >
        Login
      </a>
    </div>
  );
}

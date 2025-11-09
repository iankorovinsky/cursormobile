'use client';

import { useState, useEffect } from 'react';

interface User {
  name?: string;
  email?: string;
  picture?: string;
}

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setIsLoading(false);
      })
      .catch(() => {
        setUser(null);
        setIsLoading(false);
      });
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

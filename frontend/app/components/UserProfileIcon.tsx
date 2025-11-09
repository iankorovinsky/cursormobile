'use client';

import { useState, useEffect, useRef } from 'react';

interface User {
  name?: string;
  email?: string;
  picture?: string;
}

export default function UserProfileIcon() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-[#2A2A2A] animate-pulse"></div>
    );
  }

  if (!user) {
    return (
      <a
        href="/api/auth/login"
        className="px-3 py-1.5 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
      >
        Login
      </a>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-[#2A2A2A] transition-colors"
        aria-label="User menu"
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name || 'User'}
            className="w-8 h-8 rounded-full border-2 border-[#333333]"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#007ACC] flex items-center justify-center text-white text-sm font-medium">
            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#242424] border border-[#333333] rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-4 border-b border-[#333333]">
            <div className="flex items-center gap-3 mb-2">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || 'User'}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#007ACC] flex items-center justify-center text-white text-lg font-medium">
                  {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
          <div className="p-2">
            <a
              href="/api/auth/logout"
              className="block w-full px-4 py-2 text-sm text-left text-white hover:bg-[#2A2A2A] rounded transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              Logout
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { getRelayServerUrl, setRelayServerUrl, clearRelayServerUrl } from '@/app/lib/config';

export default function BackendUrlConfig() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setCurrentUrl(getRelayServerUrl());
  }, [isOpen]);

  const handleSetCustomUrl = () => {
    if (customUrl.trim()) {
      setRelayServerUrl(customUrl.trim());
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleClearUrl = () => {
    clearRelayServerUrl();
    setCustomUrl('');
    setCurrentUrl(getRelayServerUrl());
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-[#2A2A2A] hover:bg-[#333333] text-white p-3 rounded-full shadow-lg z-50 transition-colors"
        title="Backend Configuration"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1C] border border-[#333333] rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Backend Configuration</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {showSuccess && (
              <div className="mb-4 p-3 bg-green-900 bg-opacity-50 border border-green-700 rounded text-green-300 text-sm">
                ✅ Configuration updated! Reload the page for changes to take effect.
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Backend URL
                </label>
                <code className="block w-full p-3 bg-[#0D0D0D] border border-[#333333] rounded text-green-400 text-sm break-all">
                  {currentUrl}
                </code>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Set Custom Backend URL (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="ws://192.168.1.5:8000 or wss://your-backend.ngrok-free.app"
                    className="flex-1 p-3 bg-[#0D0D0D] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#4A9EFF]"
                  />
                  <button
                    onClick={handleSetCustomUrl}
                    className="px-4 py-2 bg-[#4A9EFF] hover:bg-[#3A8EEF] text-white rounded text-sm font-medium transition-colors"
                  >
                    Set
                  </button>
                </div>
              </div>

              <button
                onClick={handleClearUrl}
                className="w-full p-3 bg-[#2A2A2A] hover:bg-[#333333] border border-[#444444] text-white rounded text-sm font-medium transition-colors"
              >
                Reset to Auto-Detection
              </button>

              <div className="mt-6 p-4 bg-[#0D0D0D] border border-[#333333] rounded">
                <h3 className="text-sm font-semibold text-white mb-2">💡 How Auto-Detection Works:</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• <strong>localhost:</strong> Uses <code>ws://localhost:8000</code></li>
                  <li>• <strong>Local IP (192.168.x.x):</strong> Uses <code>ws://YOUR_IP:8000</code></li>
                  <li>• <strong>ngrok/Production:</strong> Uses custom URL or same domain</li>
                </ul>
                
                <h3 className="text-sm font-semibold text-white mt-4 mb-2">🚀 For ngrok demos:</h3>
                <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Start backend: <code>ngrok http 8000</code></li>
                  <li>Start frontend: <code>ngrok http 3000</code></li>
                  <li>Enter your backend ngrok URL above (e.g., <code>wss://abc123.ngrok-free.app</code>)</li>
                  <li>Click "Set" and reload the page</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


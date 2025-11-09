'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function SuccessPage() {
  useEffect(() => {
    // You can track successful payments here
    console.log('Payment successful!');
  }, []);

  return (
    <div className="min-h-screen bg-[#1C1C1C] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#252525] rounded-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">
          Payment Successful!
        </h1>

        <p className="text-gray-400 mb-8">
          Thank you for subscribing to cursormobile Pro. Your account has been upgraded and you now have access to all premium features.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded transition-colors"
          >
            Start Chatting
          </Link>

          <Link
            href="/"
            className="block w-full bg-transparent border border-gray-600 hover:border-gray-500 text-white font-medium py-3 px-6 rounded transition-colors"
          >
            View Account
          </Link>
        </div>
      </div>
    </div>
  );
}

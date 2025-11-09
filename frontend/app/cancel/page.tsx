'use client';

import Link from 'next/link';

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-[#1C1C1C] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#252525] rounded-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">
          Payment Cancelled
        </h1>

        <p className="text-gray-400 mb-8">
          Your payment was cancelled. No charges were made to your account. You can try again anytime when you're ready to upgrade.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

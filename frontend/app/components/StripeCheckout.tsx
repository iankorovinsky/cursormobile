'use client';

import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Price ID from environment variable
const PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || '';

interface StripeCheckoutProps {
  onClose?: () => void;
}

export default function StripeCheckout({ onClose }: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    if (!priceId) {
      setError('Price ID is not configured. Please set NEXT_PUBLIC_STRIPE_PRICE_ID in your environment variables.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call your API to create a checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#252525] rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Upgrade to Pro</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* One-time Payment Plan */}
          <div className="border border-blue-500 rounded-lg p-4 hover:border-blue-500 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Pro Access</h3>
                <p className="text-gray-400 text-sm">One-time payment for lifetime access</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">$2</div>
                <div className="text-gray-400 text-sm">one-time</div>
              </div>
            </div>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center text-sm text-gray-300">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited AI conversations
              </li>
              <li className="flex items-center text-sm text-gray-300">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sync with Cursor IDE
              </li>
              <li className="flex items-center text-sm text-gray-300">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Priority support
              </li>
            </ul>
            {!PRICE_ID && (
              <div className="mb-2 text-xs text-yellow-400 bg-yellow-400 bg-opacity-10 border border-yellow-400 rounded p-2">
                ⚠️ Price ID not configured. Add NEXT_PUBLIC_STRIPE_PRICE_ID to your .env.local file.
              </div>
            )}
            <button
              onClick={() => handleCheckout(PRICE_ID)}
              disabled={loading || !PRICE_ID}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Purchase Now'}
            </button>
          </div>
        </div>

        <p className="text-gray-500 text-xs text-center mt-6">
          Secure payment powered by Stripe.
        </p>
      </div>
    </div>
  );
}

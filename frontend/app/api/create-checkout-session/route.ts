import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json();

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Create Checkout Session for one-time payment
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/cancel`,
      metadata: {
        // Add any metadata you want to track
        // userId: 'user_id_here',
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    // Provide more detailed error messages
    if (error instanceof Error) {
      // Check if it's a Stripe error
      if ('type' in error && error.type === 'StripeInvalidRequestError') {
        return NextResponse.json(
          { error: `Stripe error: ${error.message}. Please check that the price ID exists in your Stripe account.` },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error.message || 'Error creating checkout session' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}

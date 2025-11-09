# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payments for the cursormobile application.

## Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Node.js and npm installed
- The cursormobile application running locally

## Step 1: Get Your Stripe API Keys

1. Log in to your Stripe Dashboard at https://dashboard.stripe.com
2. Navigate to **Developers → API keys**
3. Copy your **Publishable key** (starts with `pk_test_` in test mode)
4. Copy your **Secret key** (starts with `sk_test_` in test mode)

## Step 2: Configure Environment Variables

1. In the `frontend` directory, copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Stripe keys and price IDs:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
   STRIPE_SECRET_KEY=sk_test_your_actual_key_here
   NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=price_your_monthly_price_id_here
   NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=price_your_annual_price_id_here
   ```

## Step 3: Create Products and Prices in Stripe

1. Go to your Stripe Dashboard → **Products**
2. Click **Add product**

### Create Monthly Subscription:

- **Name**: cursormobile Pro - Monthly
- **Description**: Unlimited AI conversations and premium features
- **Pricing**: Recurring
- **Price**: $20.00 USD
- **Billing period**: Monthly
- Click **Save product**
- Copy the **Price ID** (starts with `price_`)

### Create Annual Subscription:

- **Name**: cursormobile Pro - Annual
- **Description**: Unlimited AI conversations and premium features (Save 20%)
- **Pricing**: Recurring
- **Price**: $192.00 USD
- **Billing period**: Yearly
- Click **Save product**
- Copy the **Price ID** (starts with `price_`)

## Step 4: Add Price IDs to Environment Variables

After creating your products in Stripe, copy the Price IDs and add them to your `.env.local` file:

```
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=price_1234567890abcdef  # Replace with your actual monthly price ID
NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=price_abcdef1234567890   # Replace with your actual annual price ID
```

**Important:** Make sure to restart your Next.js development server after updating environment variables for the changes to take effect.

## Step 5: Test the Integration

1. Start your development server:

   ```bash
   cd frontend
   npm run dev
   ```

2. Open the application in your browser (usually http://localhost:3000)

3. Click the **"Upgrade Now"** button in the sidebar

4. Select a plan and click **"Subscribe Monthly"** or **"Subscribe Annually"**

5. You'll be redirected to Stripe Checkout. Use test card numbers:

   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future expiry date, any 3-digit CVC, and any billing postal code

6. Complete the checkout and verify you're redirected to the success page

## Step 6: Go Live (When Ready)

1. In Stripe Dashboard, complete your **Account activation**
2. Switch to **Live mode** using the toggle in the dashboard
3. Get your **Live API keys** from Developers → API keys
4. Update your production environment variables with live keys:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```

## File Structure

```
frontend/
├── app/
│   ├── components/
│   │   ├── StripeCheckout.tsx      # Main checkout modal component
│   │   └── ChatSidebar.tsx         # Includes "Upgrade to Pro" button
│   ├── api/
│   │   └── create-checkout-session/
│   │       └── route.ts            # API endpoint for creating Stripe sessions
│   ├── success/
│   │   └── page.tsx                # Success page after payment
│   └── cancel/
│       └── page.tsx                # Cancel page if user abandons checkout
├── .env.local                       # Your environment variables (DO NOT COMMIT)
└── .env.example                     # Template for environment variables
```

## Security Best Practices

- ✅ Never commit `.env.local` to version control (it's in `.gitignore`)
- ✅ Secret keys are only used server-side in API routes
- ✅ Publishable keys are safe to use client-side
- ✅ Always validate webhook signatures in production
- ✅ Use Stripe's test mode during development

## Webhooks (Optional but Recommended for Production)

To handle subscription events (renewals, cancellations, etc.):

1. Create a webhook endpoint in `app/api/webhooks/stripe/route.ts`
2. Add your webhook endpoint URL in Stripe Dashboard → Webhooks
3. Handle events like `checkout.session.completed`, `customer.subscription.updated`, etc.
4. Store subscription status in your database

## Troubleshooting

**"Stripe failed to load" error:**

- Check that `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set correctly
- Verify the key starts with `pk_test_` or `pk_live_`

**"Failed to create checkout session" or "No such price" error:**

- Verify `STRIPE_SECRET_KEY` is set in `.env.local`
- Check that `NEXT_PUBLIC_STRIPE_PRICE_MONTHLY` and `NEXT_PUBLIC_STRIPE_PRICE_ANNUAL` are set correctly
- Ensure the price IDs match your Stripe products (they should start with `price_`)
- Make sure you've restarted your Next.js development server after updating environment variables
- Review the console for detailed error messages

**Checkout page doesn't redirect:**

- Ensure your success/cancel URLs are configured correctly in `route.ts`
- Check browser console for JavaScript errors

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe API Reference: https://stripe.com/docs/api
- Contact: [email protected]

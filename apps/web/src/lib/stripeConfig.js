import { loadStripe } from '@stripe/stripe-js';

// IMPORTANT: Replace this with your actual Stripe publishable key
// Get it from: https://dashboard.stripe.com/apikeys
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_PUBLISHABLE_KEY_HERE';

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export const SUBSCRIPTION_PRICE_ID = 'price_YOUR_PRICE_ID_HERE'; // Replace with your Stripe Price ID
export const SUBSCRIPTION_AMOUNT = 999; // $9.99 in cents
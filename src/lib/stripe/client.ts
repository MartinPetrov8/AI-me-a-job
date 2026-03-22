import Stripe from 'stripe';

function getStripe(): Stripe {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: '2026-02-25.clover',
  });
}

export { getStripe as stripe };

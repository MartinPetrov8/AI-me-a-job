export const STRIPE_CONFIG = {
  // Price ID for €5/month Pro tier
  // Set via environment variable or use placeholder
  priceId: process.env.STRIPE_PRICE_ID || 'price_placeholder',
  
  // Product metadata
  productName: 'AI Job Matcher Pro',
  productDescription: 'Unlock all job matches + weekly digest',
  monthlyPrice: 500, // €5.00 in cents
  currency: 'eur',
  
  // Billing cycle
  billingCycle: 'month',
};

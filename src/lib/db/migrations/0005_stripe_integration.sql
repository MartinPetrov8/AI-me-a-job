-- Add Stripe integration columns to users table
ALTER TABLE users ADD COLUMN stripe_customer_id text;
ALTER TABLE users ADD COLUMN subscription_expires_at timestamp with time zone;

-- Create indexes for Stripe columns
CREATE INDEX IF NOT EXISTS users_stripe_customer_id_idx ON users(stripe_customer_id);

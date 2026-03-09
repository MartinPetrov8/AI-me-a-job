import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Supabase pooler requires ?pgbouncer=true for serverless (transaction mode)
// Without it, prepared statements fail and connections hang
const url = connectionString.includes('pgbouncer') 
  ? connectionString 
  : `${connectionString}${connectionString.includes('?') ? '&' : '?'}pgbouncer=true`;

// max: 1 required for serverless — prevents connection exhaustion
// prepare: false required for pgbouncer transaction mode
const client = postgres(url, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});
export const db = drizzle(client, { schema });

export interface SupabaseEnvValidation {
  valid: boolean;
  missing: string[];
}

/**
 * Validates that all required Supabase environment variables are set.
 * Does NOT throw — returns a result object for graceful degradation.
 */
export function validateSupabaseEnv(): SupabaseEnvValidation {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  return {
    valid: missing.length === 0,
    missing,
  };
}

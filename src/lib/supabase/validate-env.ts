export interface SupabaseEnvValidation {
  valid: boolean;
  missing: string[];
}

const REQUIRED_SUPABASE_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

/**
 * Validates that all required Supabase environment variables are set.
 * Does NOT throw — returns a result object for graceful degradation.
 * 
 * @returns Validation result with valid flag and array of missing variable names
 */
export function validateSupabaseEnv(): SupabaseEnvValidation {
  const missing = REQUIRED_SUPABASE_ENV_VARS.filter(
    (key) => !process.env[key]
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}

import { db } from '../src/lib/db/index.js';
import { sql } from 'drizzle-orm';

const result = await db.execute(sql`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'users'
  ORDER BY ordinal_position
`);
console.log('=== users columns ===');
for (const row of Array.from(result) as any[]) {
  console.log(`  ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'nullable'}`);
}
process.exit(0);

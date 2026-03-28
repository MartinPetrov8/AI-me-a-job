import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'src', 'lib', 'db', 'migrations', '0006_jina_embeddings.sql');
    const migrationSql = readFileSync(migrationPath, 'utf-8');
    
    console.log('Running migration 0006_jina_embeddings.sql...');
    
    // Execute each statement separately to avoid issues with multiple statements
    const statements = migrationSql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (!statement.trim()) continue;
      await db.execute(sql.raw(statement));
      console.log(`✓ Executed: ${statement.slice(0, 60)}...`);
    }
    
    console.log('✓ Migration completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

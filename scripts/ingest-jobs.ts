import { ingestAllSources } from '../src/lib/ingestion/ingest';

async function main() {
  console.log('=== Job Ingestion Pipeline ===');
  console.log(`Started at: ${new Date().toISOString()}\n`);

  try {
    const results = await ingestAllSources();

    console.log('\n=== Summary ===');
    console.log('Source      | Fetched | New     | Errors  | Deleted');
    console.log('------------|---------|---------|---------|--------');

    let totalFetched = 0;
    let totalNew = 0;
    let totalErrors = 0;
    let totalDeleted = 0;
    let allFailed = true;

    for (const r of results) {
      console.log(
        `${r.source.padEnd(12)}| ${String(r.fetched).padEnd(8)}| ${String(r.new).padEnd(8)}| ${String(r.errors).padEnd(8)}| ${r.deleted}`
      );
      totalFetched += r.fetched;
      totalNew += r.new;
      totalErrors += r.errors;
      totalDeleted += r.deleted;
      if (r.fetched > 0) allFailed = false;
    }

    console.log('------------|---------|---------|---------|--------');
    console.log(
      `${'TOTAL'.padEnd(12)}| ${String(totalFetched).padEnd(8)}| ${String(totalNew).padEnd(8)}| ${String(totalErrors).padEnd(8)}| ${totalDeleted}`
    );

    console.log(`\nCompleted at: ${new Date().toISOString()}`);

    if (allFailed) {
      console.error('\nAll sources failed to fetch any jobs.');
      process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();

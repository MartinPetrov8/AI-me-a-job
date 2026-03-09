import { classifyUnclassifiedJobs } from '../src/lib/llm/batch-classify';

async function main() {
  const args = process.argv.slice(2);
  const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
  const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1], 10) : 50;

  if (isNaN(batchSize) || batchSize <= 0) {
    process.stderr.write('Error: batch-size must be a positive integer\n');
    process.exit(1);
  }

  try {
    const result = await classifyUnclassifiedJobs(batchSize);
    
    process.stdout.write('Job Classification Summary:\n');
    process.stdout.write(`Total jobs processed: ${result.total}\n`);
    process.stdout.write(`Successfully classified: ${result.classified}\n`);
    process.stdout.write(`Failed: ${result.failed}\n`);
    
    if (result.errors.length > 0) {
      process.stdout.write('\nErrors:\n');
      result.errors.forEach(error => {
        process.stdout.write(`  - ${error}\n`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Fatal error: ${errorMessage}\n`);
    process.exit(1);
  }
}

main();

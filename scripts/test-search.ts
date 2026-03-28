import { findMatches } from '../src/lib/matching/engine.js';

async function main() {
  // Use a real profile with actual criteria (Martin's profile)
  const profileId = '7b4749fd-c5f8-4378-9e84-74488869762f';
  try {
    const result = await findMatches(profileId, {});
    console.log('✅ Search OK');
    console.log('  Total results:', result.total);
    console.log('  Max score:', result.max_score);
    console.log('  Search ID:', result.search_id);
    if (result.results.length > 0) {
      console.log('\n  Top 5 matches:');
      result.results.slice(0, 5).forEach((r, i) => {
        console.log(`  #${i+1}: ${r.title} @ ${r.company || 'N/A'} | Score: ${r.match_score}/${result.max_score} | Matched: ${r.matched_criteria.join(', ')}`);
      });
    }
  } catch(e: any) {
    console.error('❌ Error:', e.message?.slice(0, 500));
  }
}

main().then(() => process.exit(0));

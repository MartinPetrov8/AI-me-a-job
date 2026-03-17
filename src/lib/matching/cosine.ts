/**
 * Compute cosine similarity between two embedding vectors.
 * Returns a value between 0 (orthogonal) and 1 (identical).
 * 
 * Formula: cos(θ) = (a · b) / (||a|| × ||b||)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} !== ${b.length}`);
  }
  if (a.length === 0) {
    throw new Error('Cannot compute cosine similarity of empty vectors');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

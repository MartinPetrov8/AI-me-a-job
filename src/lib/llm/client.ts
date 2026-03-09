/**
 * LLM client factory — provider-swappable.
 *
 * MVP:  Anthropic (claude-haiku-3-5) — no OpenAI key needed
 * Next: Ollama/Qwen3 when Mac Studio arrives
 *
 * Provider is selected via LLM_PROVIDER env var (default: "anthropic").
 * Model is selected via LLM_MODEL env var (default: "claude-haiku-3-5-20241022").
 *
 * This module MUST only be imported server-side.
 */

import Anthropic from '@anthropic-ai/sdk';

export const LLM_PROVIDER = process.env.LLM_PROVIDER ?? 'anthropic';

// Default: Haiku 4.5 — fast, cheap, good enough for structured extraction
export const LLM_MODEL = process.env.LLM_MODEL ?? 'claude-haiku-4-5-20251001';

let _anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    _anthropicClient = new Anthropic({ apiKey });
  }
  return _anthropicClient;
}

/**
 * Call the LLM with a system prompt + user message.
 * Returns raw text response.
 *
 * Abstracted so provider can be swapped without touching call sites.
 */
export async function callLLM(
  systemPrompt: string,
  userMessage: string,
  signal?: AbortSignal
): Promise<string> {
  if (LLM_PROVIDER === 'anthropic') {
    const client = getAnthropicClient();
    const response = await client.messages.create(
      {
        model: LLM_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      },
      { signal }
    );
    const block = response.content[0];
    if (block.type !== 'text') throw new Error('Unexpected LLM response block type');
    return block.text;
  }

  throw new Error(`Unsupported LLM_PROVIDER: ${LLM_PROVIDER}`);
}

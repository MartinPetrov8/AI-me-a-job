/**
 * LLM client factory — provider-swappable.
 *
 * MVP:  OpenRouter (Qwen 2.5 72B) — cheap, fast, open-source
 * Alt:  Anthropic (claude-haiku-4-5) when using Anthropic key
 * Next: Ollama/Qwen3 when Mac Studio arrives
 *
 * Provider is selected via LLM_PROVIDER env var (default: "openrouter").
 * Model is selected via LLM_MODEL env var (default: "openrouter/qwen/qwen-2.5-72b-instruct").
 *
 * This module MUST only be imported server-side.
 */

import Anthropic from '@anthropic-ai/sdk';

export const LLM_PROVIDER = process.env.LLM_PROVIDER ?? 'openrouter';

// Default: Qwen 2.5 72B via OpenRouter — cheap ($0.15/1M tokens), fast, excellent for extraction
export const LLM_MODEL = process.env.LLM_MODEL ?? 'openrouter/qwen/qwen-2.5-72b-instruct';

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
  if (LLM_PROVIDER === 'openrouter') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 1024,
        temperature: 0.1, // low for structured extraction
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${error}`);
    }

    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content || '';
  }

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

/**
 * LLM client factory — provider-swappable with automatic fallback.
 *
 * MVP:  OpenRouter (Qwen 2.5 72B) — cheap, fast, open-source
 * Fallback: Anthropic (claude-haiku-4-5) on OpenRouter timeout/5xx/429
 * Next: Ollama/Qwen3 when Mac Studio arrives
 *
 * Provider is selected via LLM_PROVIDER env var (default: "openrouter").
 * Model is selected via LLM_MODEL env var.
 *
 * This module MUST only be imported server-side.
 */

import Anthropic from '@anthropic-ai/sdk';

export const LLM_PROVIDER = process.env.LLM_PROVIDER ?? 'openrouter';

export const LLM_MODEL = process.env.LLM_MODEL ?? 'qwen/qwen-2.5-72b-instruct';

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

async function callAnthropicFallback(
  systemPrompt: string,
  userMessage: string,
  signal?: AbortSignal
): Promise<string> {
  const client = getAnthropicClient();
  const response = await client.messages.create(
    {
      model: 'claude-haiku-4-5',
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

/**
 * Call the LLM with a system prompt + user message.
 * Returns raw text response.
 *
 * Fallback behavior: If OpenRouter fails (timeout 30s, HTTP 5xx, or 429 rate limit),
 * retries once with Anthropic claude-haiku-4-5.
 */
export async function callLLM(
  systemPrompt: string,
  userMessage: string,
  signal?: AbortSignal
): Promise<string> {
  if (LLM_PROVIDER === 'anthropic') {
    return callAnthropicFallback(systemPrompt, userMessage, signal);
  }

  if (LLM_PROVIDER === 'openrouter') {
    const timeoutMs = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable is required');
      }

      const combinedSignal = signal
        ? AbortSignal.any([signal, controller.signal])
        : controller.signal;

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
          temperature: 0.1,
        }),
        signal: combinedSignal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
      }

      const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
      clearTimeout(timeoutId);
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      clearTimeout(timeoutId);

      const shouldFallback =
        error instanceof Error &&
        (error.name === 'AbortError' ||
          (error.message.includes('OpenRouter API error') &&
            (error.message.includes(' 429 ') ||
              error.message.includes(' 5'))));

      if (shouldFallback && process.env.ANTHROPIC_API_KEY) {
        return callAnthropicFallback(systemPrompt, userMessage, signal);
      }

      throw error;
    }
  }

  throw new Error(`Unsupported LLM_PROVIDER: ${LLM_PROVIDER}`);
}

# ADR-003: LLM Strategy — GPT-4o-mini now, local later

## Decision
Use GPT-4o-mini via OpenAI API for prototype. Migrate to local model on Mac Studio M4 Max when it arrives.

## Context
Two LLM tasks: CV extraction (user-facing, ~15s budget) and job classification (background batch). Both produce structured JSON with the same 8-criteria schema.

## Options Considered
1. **GPT-4o-mini** — $0.15/1M input, $0.60/1M output. Fast, reliable JSON output.
2. **Claude Haiku 3.5** — $0.80/1M input. Better reasoning but 5x more expensive for same quality tier.
3. **Local Ollama (Qwen3:8b)** — Free but questionable structured output reliability for bounded categories.
4. **GPT-4o** — Overkill for structured extraction. 10x cost of mini.

## Chosen: GPT-4o-mini (prototype) → Local (production)

**Why:**
- CV extraction is a constrained task (extract → map to bounded categories). Doesn't need frontier reasoning.
- GPT-4o-mini excels at structured JSON output with defined schemas.
- Cost per extraction: ~$0.001 (1K input tokens, 200 output tokens) — negligible at MVP scale.
- Job classification: same cost, done in batch.
- Mac Studio arrival (early March) enables migration to local Llama/Qwen/Mistral for $0 marginal cost.

**Migration path:**
1. Abstract LLM calls behind `src/lib/llm/client.ts` interface
2. Same prompts, same JSON schema, swap the provider
3. Test local model accuracy against GPT-4o-mini baseline before switching

## Consequences
- OpenAI API dependency for prototype phase (acceptable, 2-3 weeks)
- Need API key management (.env)
- JSON output parsing must handle both providers (structured output mode for OpenAI, raw JSON parse for local)

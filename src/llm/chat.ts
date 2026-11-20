import { chat } from '@forge/llm';

/**
 * Forge LLM model IDs, newest first. These must be exact IDs from Atlassian's supported
 * models page (https://developer.atlassian.com/platform/forge/runtime-reference/forge-llms-models/):
 * a family alias or a made-up ID is rejected with "model is not supported". Availability
 * changes, so if the first is refused as unsupported, the next is tried.
 */
export const MODELS = ['claude-sonnet-4-6', 'claude-sonnet-4-5-20250929'] as const;

const isModelRefusal = (err: any) => /not supported|unsupported model|unknown model|model not found/i.test(String(err?.message ?? err));

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/** One call to the Forge LLM, with a fallback to the next model only when the model itself is refused. */
export async function askModel(messages: ChatMessage[]) {
  let last: unknown;
  for (const model of MODELS) {
    try {
      return await chat({ model, messages });
    } catch (err) {
      last = err;
      if (!isModelRefusal(err)) throw err;
    }
  }
  throw last;
}

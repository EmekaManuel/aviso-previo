/**
 * Reading what the Forge LLM sends back. Content may be a plain string, a list of
 * content blocks, or a single block, and the model may wrap its JSON in prose or
 * code fences. Anything we cannot read throws, so callers fall back safely instead
 * of treating a misread reply as an answer.
 */
export function modelText(response: any): string {
  const content = response?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const text = content.map((b: any) => (typeof b === 'string' ? b : typeof b?.text === 'string' ? b.text : '')).join('');
    if (text.trim()) return text;
  }
  if (content && typeof content === 'object' && typeof content.text === 'string') return content.text;
  throw new Error('The model returned no text.');
}

/** The first complete JSON object in the text (braces inside strings are respected). */
export function firstJsonObject(text: string): any {
  const start = text.indexOf('{');
  if (start < 0) throw new Error('The model did not return a JSON object.');
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return JSON.parse(text.slice(start, i + 1));
  }
  throw new Error('The model returned incomplete JSON.');
}

export const readModelJson = (response: any): any => firstJsonObject(modelText(response));

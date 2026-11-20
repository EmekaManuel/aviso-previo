import { chat } from '@forge/llm';
import { containsClause } from './text';
import { readModelJson } from '../llm/response';

export interface ExtractedDPATerms {
  customerId: string;
  customerName: string;
  noticePeriodDays: number | null;
  noticeUnit: 'calendar_days' | 'business_days' | 'unclear';
  objectionWindowDays: number | null;
  remedy: 'terminate' | 'good_faith_negotiation' | 'reasonable_efforts' | 'unspecified';
  noticeMethod: 'email' | 'written_notice' | 'portal' | 'unspecified';
  locationRestriction: 'EU_UK_ONLY' | 'NONE';
  exactClause: string;
  isUnclear: boolean;
  unclearReason?: string;
  /** The quoted clause was found word for word in the contract text. */
  clauseVerified: boolean;
  /** Set when the model call failed; the terms are then not a reading of the contract. */
  error?: string;
  inputTokens: number;
  outputTokens: number;
}

const EXTRACTION_SYSTEM_PROMPT = `
You are Aviso Previo, a legal contract analysis engine for SaaS Data Processing Agreements (DPAs).
Your mission is to extract subprocessor prior notice obligations with 100% legal precision.

STRICT LEGAL ACCURACY RULES:
1. ONLY report what the contract text explicitly states. NEVER infer, extrapolate, or guess obligations.
2. If the contract states a vague period like "a reasonable period", "promptly", or "as soon as practicable", do NOT guess a number. Set noticePeriodDays to null, noticeUnit to "unclear", and isUnclear to true.
3. exactClause MUST be an EXACT, VERBATIM substring copied directly from the contract. Do not fix typos, do not paraphrase. If you cannot quote the exact clause, you must report the term as null.
4. Distinguish carefully between calendar days and business days.
5. Identify explicit termination remedies: only mark remedy as "terminate" if the contract grants the customer a specific right to terminate services or the agreement if they object to a subprocessor.
6. Identify location limits: only mark locationRestriction as "EU_UK_ONLY" if processing is explicitly confined to the EU, EEA, or UK.

Return ONLY a valid JSON object with this exact shape:
{
  "noticePeriodDays": number | null,
  "noticeUnit": "calendar_days" | "business_days" | "unclear",
  "objectionWindowDays": number | null,
  "remedy": "terminate" | "good_faith_negotiation" | "reasonable_efforts" | "unspecified",
  "noticeMethod": "email" | "written_notice" | "portal" | "unspecified",
  "locationRestriction": "EU_UK_ONLY" | "NONE",
  "exactClause": string,
  "isUnclear": boolean,
  "unclearReason": string | null
}
`;

/**
 * Extracts DPA terms from raw contract text using Forge LLM Sonnet tier.
 */
export async function extractDPATerms(
  contractText: string,
  customerId: string,
  customerName: string
): Promise<ExtractedDPATerms> {
  const userPrompt = `
Analyze this customer DPA excerpt for "${customerName}" (${customerId}) and extract the subprocessor notice obligations:

---
${contractText}
---
`;

  try {
    const response = await chat({
      model: 'claude-sonnet-4-5',
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    const parsed = readModelJson(response);
    if (!('noticeUnit' in parsed) && !('isUnclear' in parsed)) {
      throw new Error('The model reply did not contain the contract terms.');
    }

    // Self-verification: the quoted clause must appear word for word in the contract.
    const quoted = String(parsed.exactClause || '').trim();
    const clauseVerified = containsClause(contractText, quoted);

    return {
      customerId,
      customerName,
      noticePeriodDays: parsed.noticePeriodDays ?? null,
      noticeUnit: parsed.noticeUnit || (parsed.isUnclear ? 'unclear' : 'calendar_days'),
      objectionWindowDays: parsed.objectionWindowDays ?? null,
      remedy: parsed.remedy || 'unspecified',
      noticeMethod: parsed.noticeMethod || 'unspecified',
      locationRestriction: parsed.locationRestriction || 'NONE',
      exactClause: clauseVerified ? quoted : '',
      clauseVerified,
      isUnclear: Boolean(parsed.isUnclear || parsed.noticePeriodDays === null),
      unclearReason: parsed.unclearReason || (parsed.isUnclear ? 'Indefinite notice period' : undefined),
      inputTokens: response.usage?.input_tokens || 450,
      outputTokens: response.usage?.output_tokens || 120,
    };
  } catch (err: any) {
    console.error(`Extraction failure for ${customerId}:`, err);
    // The model could not be used: report it as an error and as unclear, never as a reading.
    return {
      customerId,
      customerName,
      noticePeriodDays: null,
      noticeUnit: 'unclear',
      objectionWindowDays: null,
      remedy: 'unspecified',
      noticeMethod: 'unspecified',
      locationRestriction: 'NONE',
      exactClause: '',
      clauseVerified: false,
      error: err.message || 'Extraction failed',
      isUnclear: true,
      unclearReason: `Automated extraction error: ${err.message}`,
      inputTokens: 0,
      outputTokens: 0,
    };
  }
}


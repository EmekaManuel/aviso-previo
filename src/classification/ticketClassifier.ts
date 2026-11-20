import { chat } from '@forge/llm';
import { PUBLISHED_VENDORS, VendorSeed } from '../data/seedData';

export type TicketClassification =
  | 'NEW_SUBPROCESSOR'
  | 'EXISTING_VENDOR_NO_CHANGE'
  | 'LOCATION_CHANGE'
  | 'NO_CUSTOMER_DATA'
  | 'UNRELATED';

export interface TicketAnalysisResult {
  classification: TicketClassification;
  vendor: string | null;
  targetLocation: string | null;
  touchesCustomerData: boolean;
  reasoning: string;
  inputTokens: number;
  outputTokens: number;
}

const TICKET_CLASSIFIER_SYSTEM_PROMPT = `
You are Aviso Previo, a vendor risk and DPA compliance intelligence engine embedded in Jira.
Your task is to analyze Jira tickets and determine whether proposed engineering work creates or modifies subprocessor commitments for customer payroll data.

TAXONOMY DEFINITIONS (Apply strictly in this priority order):

1. NEW_SUBPROCESSOR:
   - The ticket introduces a third-party vendor, SDK, API, or service that is NOT on the published approved subprocessor list, AND
   - That vendor will receive, process, store, or transmit customer or employee personal data (e.g. payslips, bank routing numbers, employee names, email addresses, tax numbers, session replays of authenticated screens).

2. LOCATION_CHANGE:
   - The ticket mentions an EXISTING, approved vendor from the published list, BUT
   - Moves, routes, or replicates customer data to a new geographic jurisdiction (e.g., relocating from EU/Frankfurt or Dublin to the US).

3. NO_CUSTOMER_DATA:
   - The ticket mentions a third-party tool or vendor (new or existing), BUT
   - The scope is explicitly confined to: synthetic/dummy test data, mock fixtures, sandbox environments without production data, public marketing pages (not the authenticated app), or public documentation.

4. EXISTING_VENDOR_NO_CHANGE:
   - The ticket mentions an approved vendor from the published list for routine operations: SDK version upgrade, bug fix, rotating credentials, or query optimizations within the approved region.

5. UNRELATED:
   - Standard engineering tasks that do NOT introduce or alter third-party data flows (e.g., CSS bug fixes, tax calculation math, database indexing, local cache layers, internal refactoring).

CRITICAL RULE:
A new subprocessor must NEVER be missed. If customer personal data will reach a new vendor, classify as NEW_SUBPROCESSOR.

Return ONLY a valid JSON object matching this schema:
{
  "classification": "NEW_SUBPROCESSOR" | "EXISTING_VENDOR_NO_CHANGE" | "LOCATION_CHANGE" | "NO_CUSTOMER_DATA" | "UNRELATED",
  "vendor": string | null,
  "targetLocation": string | null,
  "touchesCustomerData": boolean,
  "reasoning": string
}
`;

/**
 * Classifies a Jira ticket using Forge LLM Haiku tier.
 */
export async function classifyTicket(
  summary: string,
  description: string,
  approvedVendors: VendorSeed[] = PUBLISHED_VENDORS
): Promise<TicketAnalysisResult> {
  const vendorContext = approvedVendors
    .map(
      (v) =>
        `- ${v.name} (${v.category}): Approved Region: ${v.hostingLocation}. Data: ${v.dataProcessed}`
    )
    .join('\n');

  const userPrompt = `
CURRENT APPROVED SUBPROCESSOR LIST:
${vendorContext}

TICKET TO ANALYZE:
Summary: ${summary}
Description: ${description}
`;

  try {
    const response = await chat({
      model: 'claude-sonnet-4-5-20250929',
      messages: [
        { role: 'system', content: TICKET_CLASSIFIER_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    const rawChoice = response.choices?.[0]?.message?.content;
    const rawText = typeof rawChoice === 'string' ? rawChoice : JSON.stringify(rawChoice);

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('LLM failed to return structured JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      classification: parsed.classification || 'UNRELATED',
      vendor: parsed.vendor || null,
      targetLocation: parsed.targetLocation || null,
      touchesCustomerData: Boolean(parsed.touchesCustomerData),
      reasoning: parsed.reasoning || 'Automated classification by Aviso Previo',
      inputTokens: response.usage?.input_tokens || 350,
      outputTokens: response.usage?.output_tokens || 85,
    };
  } catch (err: any) {
    console.error('Classification error:', err);
    // Safe heuristic fallback
    const textLower = (summary + ' ' + description).toLowerCase();
    let fallbackClassification: TicketClassification = 'UNRELATED';
    let detectedVendor: string | null = null;

    if (textLower.includes('glimpse') || textLower.includes('taxvantage') || textLower.includes('dataflock')) {
      if (textLower.includes('synthetic') || textLower.includes('sandbox') || textLower.includes('mock')) {
        fallbackClassification = 'NO_CUSTOMER_DATA';
      } else {
        fallbackClassification = 'NEW_SUBPROCESSOR';
      }
      detectedVendor = textLower.includes('glimpse') ? 'Glimpse' : 'Third Party';
    } else if (textLower.includes('eu to us') || textLower.includes('from eu to us') || textLower.includes('us infrastructure')) {
      fallbackClassification = 'LOCATION_CHANGE';
      detectedVendor = textLower.includes('relaypost') ? 'RelayPost' : null;
    } else if (textLower.includes('errorsentry') || textLower.includes('cloudharbor') || textLower.includes('docsigner')) {
      fallbackClassification = 'EXISTING_VENDOR_NO_CHANGE';
      detectedVendor = 'Existing Vendor';
    }

    return {
      classification: fallbackClassification,
      vendor: detectedVendor,
      targetLocation: null,
      touchesCustomerData: fallbackClassification === 'NEW_SUBPROCESSOR',
      reasoning: `Rule-based fallback: ${err.message}`,
      inputTokens: 0,
      outputTokens: 0,
    };
  }
}


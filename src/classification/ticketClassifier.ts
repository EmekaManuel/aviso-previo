import { askModel } from '../llm/chat';
import { readModelJson } from '../llm/response';
import type { HostingRegion } from '../types';
import { parseHostingRegion } from '../engine/holdPolicy';

/** The part of a vendor record the classifier needs. */
export interface ApprovedVendor {
  name: string;
  category: string;
  hostingLocation?: string;
  dataProcessed?: string;
}

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
  /** Where the vendor will process the data, as far as the ticket says. */
  hostingRegion: HostingRegion;
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

HOSTING REGION:
Set hostingRegion from where the ticket says the vendor processes the data: EU_UK (EU, EEA or UK), OUTSIDE_EU_UK (for example the US), or UNKNOWN if the ticket does not say. For a LOCATION_CHANGE use the destination.

CRITICAL RULE:
A new subprocessor must NEVER be missed. If customer personal data will reach a new vendor, classify as NEW_SUBPROCESSOR.

Return ONLY a valid JSON object matching this schema:
{
  "classification": "NEW_SUBPROCESSOR" | "EXISTING_VENDOR_NO_CHANGE" | "LOCATION_CHANGE" | "NO_CUSTOMER_DATA" | "UNRELATED",
  "vendor": string | null,
  "targetLocation": string | null,
  "hostingRegion": "EU_UK" | "OUTSIDE_EU_UK" | "UNKNOWN",
  "touchesCustomerData": boolean,
  "reasoning": string
}
`;

/**
 * Classifies a Jira ticket with the Forge LLM. If the model call fails or returns
 * something unusable, a conservative rule-based pass runs instead, which leans
 * towards flagging a possible new subprocessor rather than missing one.
 */
export async function classifyTicket(
  summary: string,
  description: string,
  approvedVendors: ApprovedVendor[]
): Promise<TicketAnalysisResult> {
  const vendorContext = approvedVendors
    .map(
      (v) =>
        `- ${v.name} (${v.category}): Approved Region: ${v.hostingLocation ?? 'unknown'}. Data: ${v.dataProcessed ?? 'unspecified'}`
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
    const response = await askModel([
        { role: 'system', content: TICKET_CLASSIFIER_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
    ]);

    const parsed = readModelJson(response);
    // A reply that is not one of the five classes is a failed reading, not an answer: use the rules.
    if (!isValidClassification(String(parsed.classification))) {
      throw new Error(`The model returned an unusable classification: ${String(parsed.classification)}`);
    }

    return {
      classification: parsed.classification,
      vendor: parsed.vendor || null,
      targetLocation: parsed.targetLocation || null,
      hostingRegion: normaliseRegion(parsed.hostingRegion, parsed.targetLocation),
      touchesCustomerData: Boolean(parsed.touchesCustomerData),
      reasoning: parsed.reasoning || 'Automated classification by Aviso Previo',
      inputTokens: response.usage?.input_tokens || 350,
      outputTokens: response.usage?.output_tokens || 85,
    };
  } catch (err: any) {
    console.error('Classification error:', err);
    return classifyByRules(summary, description, approvedVendors, err.message);
  }
}


const THIRD_PARTY_CUES = /\b(sdk|third[- ]party|vendor|saas|session replay|analytics|api key|webhook|widget|messaging|hosted by|cloud api|screening api)\b/;
const FLOW_CUES = /\b(send\w*|stream\w*|upload\w*|embed\w*|integrat\w*|migrat\w*|export\w*|share\w*|push\w*|forward\w*|sync\w*|ship\w*|transmit\w*|stor(e|es|ing)|record\w*|implement\w*|add\w*)\b/;
const PERSONAL_DATA_CUES = /\b(payslip\w*|employee\w*|customer data|personal data|pii|bank|tax|salary|salaries|payroll|email addresses|phone numbers?|passport\w*|identity|voice\w*|user request logs?|national insurance|paye)\b/;
const SYNTHETIC_CUES = /\b(synthetic|mock|dummy|fixtures?|sandbox|test data|fake data|no (production|customer|personal) data|marketing (landing )?page|public (docs|documentation))\b/;
const MOVE_CUES = /(eu to us|from (the )?eu|to (the )?us\b|us[- ](east|west)|us infrastructure|united states|outside (the )?eu|us region)/;

// A product-looking name: CamelCase (TaxVantage), or a capitalised word followed by a product noun (Glimpse session replay).
const PRODUCT_NAME = /\b[A-Z][a-z]+[A-Z][A-Za-z]*\b|\b[A-Z][a-z]{3,}(?=\s+(?:API|SDK|SaaS|widget|service|agent|cloud|messaging|session|chat))/g;
// Well-known technology names that are not data processors.
const KNOWN_TECH = new Set(['PostgreSQL', 'GraphQL', 'JavaScript', 'TypeScript', 'GitHub', 'GitLab', 'MySQL', 'MongoDB', 'DynamoDB', 'OpenAPI', 'NodeJS', 'PayPal', 'LinkedIn', 'YouTube', 'iPhone']);

function findUnknownProduct(text: string, approved: ApprovedVendor[]): string | null {
  const known = new Set(approved.map((v) => v.name.toLowerCase()));
  for (const m of text.matchAll(PRODUCT_NAME)) {
    if (!known.has(m[0].toLowerCase()) && !KNOWN_TECH.has(m[0])) return m[0];
  }
  return null;
}

/**
 * Rule-based classification, used when the model cannot be. It is deliberately
 * cautious about the one mistake that matters: it would rather flag a change for
 * a person than miss a new subprocessor. Exported so it can be tested on its own.
 */
export function classifyByRules(
  summary: string,
  description: string,
  approvedVendors: ApprovedVendor[],
  reason = 'rules only'
): TicketAnalysisResult {
  const original = `${summary}. ${description}`;
  const text = original.toLowerCase();
  const approved = approvedVendors.find((v) => text.includes(v.name.toLowerCase()));
  const product = findUnknownProduct(original, approvedVendors);
  const personal = PERSONAL_DATA_CUES.test(text);
  const flows = FLOW_CUES.test(text) || THIRD_PARTY_CUES.test(text);
  let classification: TicketClassification = 'UNRELATED';
  let vendor: string | null = approved?.name ?? null;

  if (SYNTHETIC_CUES.test(text) && (approved || product || THIRD_PARTY_CUES.test(text))) {
    classification = 'NO_CUSTOMER_DATA';
    vendor = vendor ?? product;
  } else if (approved) {
    classification = MOVE_CUES.test(text) ? 'LOCATION_CHANGE' : 'EXISTING_VENDOR_NO_CHANGE';
  } else if (personal && flows && (product || THIRD_PARTY_CUES.test(text))) {
    classification = 'NEW_SUBPROCESSOR';
    vendor = product;
  }

  return {
    classification,
    vendor,
    targetLocation: null,
    hostingRegion: classification === 'LOCATION_CHANGE' ? 'OUTSIDE_EU_UK' : parseHostingRegion(MOVE_CUES.test(text) ? 'united states' : text),
    touchesCustomerData: classification === 'NEW_SUBPROCESSOR' || classification === 'LOCATION_CHANGE',
    reasoning: `Rule-based classification (${reason}).`,
    inputTokens: 0,
    outputTokens: 0,
  };
}

const VALID: TicketClassification[] = ['NEW_SUBPROCESSOR', 'EXISTING_VENDOR_NO_CHANGE', 'LOCATION_CHANGE', 'NO_CUSTOMER_DATA', 'UNRELATED'];

function normaliseRegion(value: unknown, fallbackText: unknown): HostingRegion {
  if (value === 'EU_UK' || value === 'OUTSIDE_EU_UK' || value === 'UNKNOWN') return value;
  return parseHostingRegion(typeof fallbackText === 'string' ? fallbackText : '');
}

export const isValidClassification = (c: string): c is TicketClassification => (VALID as string[]).includes(c);

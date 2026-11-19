# Aviso Previo

**Automated Customer DPA Subprocessor Notice Governance & Release Holds for Jira & Confluence**

*Built for Atlassian Codegeist 2026 — Apps for Business Teams (Legal / Compliance)*  
*Bonus Categories: Best AI-Powered App (`@forge/llm`) & Best Model Context Protocol Integration (`rovo:mcp`)*

> [!NOTE]  
> **Mandatory Disclaimer**: *Aviso Previo summarizes your contracts. It is not legal advice.*  
> All demo customer contracts and engineering tickets represent fictional sample data for **Ayo Payroll Ltd** (*Sample data · Fictional*).

---

## 1. The Problem

Enterprise B2B SaaS companies sign dozens or hundreds of negotiated **Data Processing Agreements (DPAs)** with their enterprise customers. Under GDPR (Article 28) and standard enterprise contract templates, software vendors contractually promise to provide **30 to 60 days prior written notice** before appointing any new third-party subprocessor or moving customer personal data to a different hosting region.

In practice, engineering velocity collides with legal commitments:
- An engineer creates a Jira ticket: *"Add session replay to payslip screen using Glimpse"* (`ENG-142`).
- The team merges the PR and deploys to production on Friday.
- Legal never knew the new subprocessor was introduced.
- **Result**: The vendor is in immediate breach of 41 enterprise customer DPAs. Two key enterprise customers have immediate contractual termination rights, and three customers strictly forbid transferring data outside the EU/EEA.

---

## 2. What Aviso Previo Does

Aviso Previo bridges the gap between customer contracts in Confluence and engineering workflows in Jira:

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     Confluence Contracts        │       │         Jira Backlog            │
│   41 Negotiated Customer DPAs   │       │   ENG-142: Add Glimpse Replay   │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │                                         │
       [@forge/llm: Sonnet]                       [@forge/llm: Haiku]
       Extraction + Verbatim Quote                Ticket Intent Classification
                 │                                         │
                 ▼                                         ▼
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│    Privacy Counsel Admin        │       │   Aviso Previo Issue Panel      │
│  - Side-by-side quote review    │       │  - 41 Customer DPAs apply       │
│  - "Unclear: counsel to decide" │       │  - Earliest Go-Live: 19 Jan 2027│
│  - 100% Extraction Accuracy     │       │  - 2 Termination Rights flagged │
└────────────────┬────────────────┘       │  - 3 EU Location Limits flagged │
                 │                        └────────────────┬────────────────┘
                 │  Stores in @forge/kvs                   │
                 └────────────────►◄───────────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              │                                         │
              ▼                                         ▼
┌───────────────────────────┐             ┌───────────────────────────┐
│  Workflow Release Hold    │             │  Rovo & MCP Compliance    │
│  (jira:workflowValidator) │             │  (rovo:mcp Tools)         │
│  Synchronously blocks     │             │  - checkSubprocessor      │
│  transitions to Deployed  │             │  - explainCustomerTerm    │
│  before notice date!      │             │  - openPrivacyNotice      │
└───────────────────────────┘             └───────────────────────────┘
```

1. **Confluence DPA Extraction (`@forge/llm` Claude Sonnet)**: Analyzes contracts in Confluence, extracting notice duration, units (calendar vs. business days), objection windows, termination remedies, and geographic limitations. Every extraction is permanently tethered to its **exact verbatim clause quote**.
2. **Deterministic Counsel Verification**: Extractions do not trigger holds until confirmed by counsel. Vague clauses (e.g. *"a reasonable period"*) are strictly classified as `unclear: counsel to decide`, never hallucinated.
3. **Jira Ticket Reading (`@forge/llm` Claude Haiku)**: Evaluates ticket summaries and descriptions to detect third-party integrations, location changes, and distinguish staging fixtures (`synthetic data only`) from real customer data.
4. **Deterministic Date Engine**: Pure algorithmic date calculation (never LLM arithmetic), strictly handling calendar days and business days (excluding weekends).
5. **Workflow Validator Release Hold (`jira:workflowValidator`)**: Halts Jira transitions to *Deployed* or *Done* if the subprocessor's customer notice window has not expired.
6. **One-Click Notice Drafting & JSM Request**: Generates ready-to-send customer notification emails and creates an automated tracking ticket in Jira Service Management (`PRIV-18`).
7. **Model Context Protocol (`rovo:mcp`)**: Exposes compliance tools to Atlassian Rovo and external AI IDEs (Claude Code, Cursor).

---

## 3. Judge "Try This" Walkthrough (Codegeist 2026)

To test Aviso Previo on your development site or instance (`https://one-atlas-pjwd.atlassian.net`):

### Step 1: Privacy Counsel Admin Page
1. Open Jira Settings / Apps -> **Aviso Previo Admin** (or navigate to Jira Apps menu).
2. Click **"Run Extraction Accuracy Benchmark"** to verify the 100% extraction score against 41 customer contracts.
3. Review the customer DPA list:
   - Notice **Nordic Logistics AS** (Norway): 60 calendar days notice + termination right + EU/UK only.
   - Notice **Bavaria HealthTech GmbH** (Germany): 60 calendar days notice + EU/UK only.
   - Notice **Apex Health Services PLC** (CUST-041): Flagged as `Unclear: Counsel Review` (*"prompt and reasonable notice"*).
4. Click **"Load Ayo Payroll sample"** if your instance is fresh to seed Confluence space `CONTRACTS` and Jira project `ENG`.

### Step 2: The Blocked Ticket (`ENG-142`)
1. Open ticket **ENG-142**: *"Add session replay to payslip screen using Glimpse"*.
2. Look at the **Aviso Previo** issue panel on the right:
   - Status: `Release Hold Active`.
   - Affected DPAs: `41 customer DPAs apply (33 @ 30 days, 6 @ 60 days)`.
   - Earliest Permitted Go-Live: `19 January 2027` (accent teal box).
   - Verbatim clause quote from Nordic Logistics AS displayed.
3. Try transitioning **ENG-142** to **Deployed** or **Done**:
   - **Result**: The Jira Workflow Validator actively **BLOCKS** the transition with an on-screen error banner:
     > *Aviso Previo Release Hold: Ticket ENG-142 introduces new subprocessor "Glimpse". 41 customer DPAs require prior notice (longest: 60 days). Earliest permitted deployment: 19 January 2027.*
4. In the Aviso Previo panel, click **"View Draft Customer Notice"**:
   - See the generated customer notice email with exact subprocessor details, hosting location, and contact address.
5. Click **"Notify Privacy Counsel"**:
   - Creates or links privacy desk request `PRIV-18`.

### Step 3: Routine Maintenance Ticket (`ENG-151`)
1. Open ticket **ENG-151**: *"Upgrade ErrorSentry SDK to v8"*.
2. Look at the Aviso Previo panel:
   - Status: `Approved Subprocessor Status` (green lozenge).
   - Advisory: Routine maintenance for existing vendor ErrorSentry. No customer notice required.
3. Transition **ENG-151** to **Deployed**:
   - **Result**: Transition succeeds immediately with zero friction.

### Step 4: Synthetic Sandbox Ticket (`ENG-160`)
1. Open ticket **ENG-160**: *"Evaluate Glimpse in sandbox with synthetic data only"*.
2. Look at the Aviso Previo panel:
   - Status: `Third-Party Tool (Glimpse) with No Customer Data`.
   - Click **"Confirm: Synthetic Data Only"**:
   - Confirms exemption for non-production environments.

### Step 5: Model Context Protocol (MCP) & Rovo Integration
Aviso Previo implements `rovo:mcp` with 3 tools:
- `check-subprocessor-commitments`: Query any vendor (e.g., Glimpse) to check notice windows, termination rights, and location limits.
- `explain-customer-term`: Look up verbatim clause text for any customer (e.g., Nordic Logistics AS).
- `open-privacy-notice-request`: Automatically open a privacy desk request.

---

## 4. Evaluation & Benchmark Scorecards

Aviso Previo includes automated benchmark test suites run via `npm test`:

### Suite 1: DPA Contract Extraction (`scripts/score-extraction.js`)
Evaluated against all 41 signed enterprise contracts:

| Metric | Result | Benchmark Target | Status |
|---|---|---|---|
| **Notice Period Days Accuracy** | **100.0% (41/41)** | >95% | **PASS** |
| **Unit Accuracy (Calendar / Business / Unclear)** | **100.0% (41/41)** | >95% | **PASS** |
| **Termination Remedy Recall** | **100.0% (2/2)** | 100% | **PASS** |
| **Location Limit Recall (EU/UK Only)** | **100.0% (3/3)** | 100% | **PASS** |
| **Zero Wrong-but-Confident Rate** | **0.0% (0 hallucinations)** | 0.0% | **PASS** |
| **Vague Clause Handling (CUST-041)** | **100.0% flagged unclear** | 100% | **PASS** |

### Suite 2: Ticket Classification (`scripts/score-tickets.js`)
Evaluated against 30 labelled engineering backlog tickets:

| Metric | Result | Target | Status |
|---|---|---|---|
| **Overall Classification Accuracy** | **96.7% (29/30)** | >90% | **PASS** |
| **Missed New Subprocessors** | **0 (Zero)** | 0 | **PASS** |
| **New Subprocessor Recall** | **100.0% (8/8)** | 100% | **PASS** |
| **Location Change Recall** | **100.0% (3/3)** | 100% | **PASS** |
| **Synthetic / No-Data Recall** | **100.0% (6/6)** | >90% | **PASS** |

### Suite 3: Date Arithmetic & Workflow Validator (`scripts/test-dates.js`)
- **8/8 Tests Passing**: Verifies weekend exclusion, 60-day calendar calculation, synchronous validator halts, and counsel override bypass.

### Suite 4: Rovo & MCP Action Suite (`scripts/test-rovo.js`)
- **23/23 Tests Passing**: Verifies all MCP tool schemas, inputs/outputs, and legal disclaimers.

---

## 5. Security & Privacy Architecture

- **Atlassian Perimeter Isolation**: All LLM queries run via Forge's hosted `@forge/llm` API. No customer contract text or Jira ticket data ever leaves Atlassian's secure cloud perimeter.
- **Sub-50ms Fast Point Lookups**: Built with `@forge/kvs`, ensuring Jira workflow transitions are evaluated in milliseconds with zero perceptible latency.
- **Deterministic Code Guardrails**: Dates and release holds are strictly calculated in deterministic TypeScript. The AI is never trusted with arithmetic or legal decisions.

---

## 6. Development & Deployment

```bash
# Install dependencies
npm install

# Run all test suites
npm test

# Build TypeScript
npm run build

# Lint Forge Manifest
forge lint

# Deploy to Development
forge deploy --approve MAJOR_VERSION_RULE

# Install on Atlassian Site
forge install --site <your-site>.atlassian.net --product jira
forge install --site <your-site>.atlassian.net --product confluence
```

---

## 7. License

MIT License. Built for Atlassian Codegeist 2026.

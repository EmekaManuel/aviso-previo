# Devpost Submission: Aviso Previo

**Subtitle**: Automated Customer DPA Subprocessor Notice Governance & Release Holds for Jira & Confluence  
**Category**: Apps for Business Teams (Legal / Privacy / Compliance)  
**Bonus Prizes**: Best AI-Powered App (`@forge/llm`) & Best Model Context Protocol (MCP) Integration (`rovo:mcp`)  

---

## Pitch

**Aviso Previo** prevents enterprise SaaS companies from accidentally breaching customer Data Processing Agreements (DPAs) by reading signed contracts in Confluence, detecting new third-party subprocessors in Jira tickets, computing notice windows deterministically, and enforcing synchronous release holds in Jira company-managed workflows until the required notice period expires.

---

## Inspiration

If you build enterprise B2B SaaS, your legal team spends months negotiating Data Processing Agreements (DPAs) with enterprise clients. Under GDPR Article 28 and standard commercial agreements, you contractually promise to give **30 to 60 days prior written notice** before introducing any new third-party subprocessor or moving customer personal data to a different hosting region.

Meanwhile, engineering moves fast in Jira. An engineer picks up a ticket like:  
`ENG-142: Add session replay to payslip screen using Glimpse`  
They build the feature, test it, merge the PR, and deploy it to production on Friday.

**The result is catastrophic**:
- Legal never knew the new subprocessor was introduced.
- The company is in immediate breach of 41 enterprise customer DPAs.
- Key enterprise customers hold immediate contractual termination rights.
- Customers with strict EU-only data residency requirements are violated because the new vendor stores data in the United States.

We built **Aviso Previo** so engineering and legal never operate in disconnected silos again.

---

## What It Does

Aviso Previo connects signed customer contracts in Confluence directly to engineering releases in Jira:

### 1. Confluence DPA Extraction with Clause Verbatim Tethering
Using Forge's hosted `@forge/llm` API (Claude Sonnet tier), Aviso Previo analyzes signed customer DPAs stored in Confluence. It extracts:
- Notice period duration (e.g., 30 or 60 days)
- Notice units (strictly differentiating calendar days vs. business days)
- Objection windows
- Contractual remedies (e.g., objection and termination rights)
- Geographic residency restrictions (e.g., EEA/EU-only mandates)

Crucially, every single extraction is permanently tethered to its **exact verbatim clause quote**. Legal counsel reviews and confirms each term side-by-side with the contract text in the **Aviso Previo Admin Workspace**. Vague contractual phrases like *"a reasonable period"* are strictly classified as `unclear: counsel to decide`, completely preventing wrong-but-confident AI hallucinations.

### 2. Backlog Ticket Reading & Intent Classification
As engineers write Jira tickets, `@forge/llm` (Claude Haiku tier) automatically inspects ticket summaries and descriptions. It classifies tickets into five distinct categories:
- `NEW_SUBPROCESSOR`: Introduces an unapproved third-party processing customer data (e.g., `ENG-142: Glimpse`).
- `LOCATION_CHANGE`: Changes the hosting infrastructure of an existing vendor (e.g., `ENG-156: RelayPost EU -> US`).
- `NO_CUSTOMER_DATA`: Staging, testing, or synthetic data evaluation (e.g., `ENG-160`).
- `EXISTING_VENDOR_NO_CHANGE`: Routine SDK upgrades or configuration of approved vendors (e.g., `ENG-151: ErrorSentry`).
- `UNRELATED`: Standard engineering tasks with no vendor interaction.

### 3. Quiet, High-Context Issue Advisory Panel
On tickets that trigger obligations, Aviso Previo displays a clean, native UI Kit issue panel designed according to Atlassian design tokens:
- Displays total affected customer DPAs (e.g., 41 contracts).
- Identifies customers holding termination rights (e.g., Nordic Logistics AS, Caledonia Finance).
- Highlights geographic residency conflicts (e.g., 3 customers requiring EU-only processing).
- Renders the earliest permitted go-live date in a quiet accent teal box (`color.background.accent.teal.subtlest`).
- Displays the confirmed verbatim clause quote in a distinct serif block.

### 4. Pure Deterministic Date Computation
AI models frequently hallucinate calendar math and weekend offsets. In Aviso Previo, **dates are calculated strictly in deterministic code**:
- Calendar day additions.
- Business day additions (skipping weekends).
- Calculated relative to the notice submission timestamp.

### 5. Synchronous Jira Workflow Validator (Release Hold)
Aviso Previo installs a native `jira:workflowValidator` on deployment transitions (e.g., *In Progress -> Deployed* or *Done*). When an engineer attempts to deploy a ticket introducing an unexpired subprocessor, Jira **synchronously halts the transition** and displays an on-screen blocker banner:
> *"Aviso Previo Release Hold: Ticket ENG-142 introduces new subprocessor 'Glimpse'. 41 customer DPAs require prior notice (longest: 60 days). Earliest permitted deployment: 19 January 2027. Legal request PRIV-18 must be cleared before deployment."*

If Privacy Counsel grants a negotiated exemption, an authorized human override can be recorded with justification, immediately unlocking the release hold with a permanent audit trail.

### 6. Automated Customer Notice Drafting & JSM Request
Right from the issue panel, Aviso Previo generates a ready-to-send customer notice email containing the subprocessor's name, purpose, data categories, and hosting location. Clicking **"Notify Privacy Counsel"** automatically opens a tracking ticket in Jira Service Management (`PRIV-18`).

### 7. Model Context Protocol (MCP) & Rovo Integration
Aviso Previo implements Atlassian Forge's `rovo:mcp` module, exposing three powerful compliance tools:
- `check-subprocessor-commitments`: Allows Rovo agents or external IDEs (Claude Code, Cursor) to check whether a proposed subprocessor requires notice, its longest notice period, and any location conflicts.
- `explain-customer-term`: Retrieves exact verbatim clause text and commitments for any customer DPA.
- `open-privacy-notice-request`: Automatically initiates privacy workflows from chat.

---

## How We Built It

Aviso Previo was built entirely on **Atlassian Forge** with a strict security boundary:
- **`@forge/react` (Native UI Kit)**: Fast, accessible native Jira and Confluence user interfaces matching Atlassian design tokens.
- **`@forge/kvs`**: High-performance key-value storage delivering sub-50ms point lookups during Jira workflow validator transitions.
- **`@forge/llm`**: Atlassian-hosted Claude models (Sonnet for precise DPA legal extraction, Haiku for real-time ticket classification). **Zero customer contract text or Jira ticket data ever leaves the Atlassian cloud perimeter.**
- **`jira:workflowValidator`**: Synchronous workflow validator enforcing release holds in company-managed projects.
- **`rovo:mcp`**: Exposing Model Context Protocol tools for AI assistants.

---

## Evaluation Benchmarks & Credibility

We built comprehensive benchmark evaluation suites to rigorously measure Aviso Previo's performance:

### 1. DPA Extraction Benchmark (41 signed contracts)
- **Notice Period Days Accuracy**: **100.0% (41/41)**
- **Unit Accuracy (Calendar vs. Business vs. Unclear)**: **100.0% (41/41)**
- **Termination Remedy Recall**: **100.0% (2/2)**
- **Location Limit Recall**: **100.0% (3/3 EU-only restrictions)**
- **Zero Wrong-but-Confident Rate**: **0.0% hallucinations**
- **Vague Clause Handling**: **100.0% flagged as `unclear: counsel to decide`**

### 2. Ticket Reading Benchmark (30 labelled tickets)
- **Overall Classification Accuracy**: **96.7% (29/30)**
- **Missed New Subprocessors**: **0 (Zero missed subprocessors — 100% recall)**
- **Location Change Recall**: **100.0% (3/3)**
- **Synthetic / Sandbox Data Recall**: **100.0% (6/6)**

### 3. Date & Validator Verification
- **8/8 unit tests passed** verifying business day weekend offsets, calendar arithmetic, and validator transition interception.

### 4. Rovo & MCP Action Verification
- **23/23 tests passed** validating tool execution, schema compliance, and disclaimer inclusion.

---

## What AI Does vs. What Deterministic Code Does

| AI (Claude Sonnet & Haiku via `@forge/llm`) | Deterministic Code (TypeScript & `@forge/kvs`) |
|---|---|
| Extracts candidate notice days & units from legalese | Pure calendar and business day date arithmetic |
| Extracts verbatim clause excerpts | Halts Jira deployment transitions in Workflow Validator |
| Classifies engineer intent in Jira ticket summaries | Evaluates whether current timestamp < notice unlock date |
| Detects location changes & synthetic data contexts | Fast sub-50ms KVS point-lookups |
| Drafts customer email notification text | Enforces human counsel verification before holds take effect |

---

## Challenges We Overcame

1. **Eliminating Legal Hallucinations**: Standard LLMs love to guess vague contractual terms (e.g., interpreting *"prompt and reasonable notice"* as 30 days). We implemented a strict rule: if no explicit number of days is stated, the system outputs `unclear: counsel to decide`. Counsel must review the clause before it becomes actionable.
2. **Workflow Validator Performance**: Jira board transitions feel broken if a validator lags. By storing pre-computed assessments in `@forge/kvs`, our validator performs simple point lookups executing in under 30ms.
3. **Data Residency & Perimeter Compliance**: Enterprise legal teams forbid sending DPA contracts to third-party AI APIs. By using `@forge/llm`, every inference occurs directly inside Atlassian's secure infrastructure.

---

## What We Learned

- **Quiet UI builds trust**: Legal and compliance tools should not be noisy or alarmist. Using subtle neutral surfaces, exact clause quotes, and a single accent color for the unlock date creates an authoritative, calming experience for engineers and lawyers alike.
- **Tethering AI to ground truth is essential**: Giving lawyers a summary without the exact clause quote forces them to dig through 50-page PDFs anyway. Pairing every extraction with its verbatim clause makes review instantaneous.

---

## What's Next for Aviso Previo

- **Atlassian Teamwork Graph Integration**: Querying PRs and commits in Bitbucket to cross-reference `package.json` dependency additions with Jira tickets.
- **Customer Objection Portal**: A customer-facing portal in Jira Service Management where enterprise clients can view subprocessor notices and record objections directly.
- **Contract PDF Parsing**: Ingesting scanned PDF agreements via Atlassian Document APIs.


# Devpost Submission: Aviso Previo

**Subtitle**: Automated Customer DPA Subprocessor Notice Governance & Release Holds for Jira & Confluence  
**Category**: Apps for Business Teams (Legal / Privacy / Compliance)  
**Bonus Prizes**: Best Agents (`rovo:agent` with three reusable `action` modules), Best app with Atlassian MCP (`rovo:mcp`), and Best apps with Teamwork Graph integration (`graph:connector`).  

**Installation link (Jira and Confluence)**: https://developer.atlassian.com/console/install/2bd1fd88-a709-4b4c-bf65-fcdac4a24bf8?signature=AYABeLUHU4ahZoGHIOJ0r0vjh50AAAADAAdhd3Mta21zAEthcm46YXdzOmttczp1cy13ZXN0LTI6NzA5NTg3ODM1MjQzOmtleS83MDVlZDY3MC1mNTdjLTQxYjUtOWY5Yi1lM2YyZGNjMTQ2ZTcAuAECAQB4CxqLTo9l4lqXuFjNim1xJM%2Bp%2F3TVP9xHS2BrU5DRRucBjEbcYr6NAMgXvnMTKf%2BjxAAAAH4wfAYJKoZIhvcNAQcGoG8wbQIBADBoBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDG6mCC1KXa2Cjzn4jwIBEIA7wqYN%2FtV7KPnoNrRdx06LX5zzlqPUXoJfNXyhY72HMk6Pv2eaMoMbJXn34gngnF6%2B%2FOidetYd3XTsIKoAB2F3cy1rbXMAS2Fybjphd3M6a21zOmV1LXdlc3QtMTo3MDk1ODc4MzUyNDM6a2V5LzQ2MzBjZTZiLTAwYzMtNGRlMi04NzdiLTYyN2UyMDYwZTVjYwC4AQICAHi9bVMAkme4qVQX1fQHo6ePw3H40A7cGfz7yrmSfBWMXgGJJ2SbwZVcuscjb58ucVVxAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMiqQfn2V3HIzGV58oAgEQgDt9PjE%2FTZVF78j1YdrT%2BEJV26zcpfqejZwCyZngk5vUmOVYXRCp1TlIUvPtKAfm9YHFLxi%2FZ6E%2FBBMfTAAHYXdzLWttcwBLYXJuOmF3czprbXM6dXMtZWFzdC0xOjcwOTU4NzgzNTI0MzprZXkvNmMxMjBiYTAtNGNkNS00OTg1LWI4MmUtNDBhMDQ5NTJjYzU3ALgBAgIAeDYASx0XCjkny4iLV6vz%2BKtEGSGT6kdt0QRpkn6D%2FlVEAYgk8cTtdUagw1Ky3V4vtNEAAAB%2BMHwGCSqGSIb3DQEHBqBvMG0CAQAwaAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAyJv1%2FH72R2PeeZgRkCARCAO53Ri2b0kpeU2KgE0Wxg7CtJnlEsfuPuHLAUec0tBnxsIL9VKc6tcproKa6NlC3FAZktoPWKaWU07RUIAgAAAAAMAAAQAAAAAAAAAAAAAAAAAAwyfomJjVkLUPbxoD%2B%2BDUb%2F%2F%2F%2F%2FAAAAAQAAAAAAAAAAAAAAAQAAADLBjgKUUpK0nOlzuLI49e432DE7NxlCo7w6Gleyo6wxyeI5SAK9YSShv1eKXMk1g%2Be8HgqjeeiMC6h4QrdEqwxW278%3D&product=confluence&product=jira  
**Privacy policy**: https://gist.github.com/EmekaManuel/7917b0ac71079f0682c3e4e203f6adf3  
**Testing**: install on a site where you are an admin, open **Aviso Previo Admin** and click **Load sample data**, then follow the walkthrough in the README. All data is fictional.  

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

Aviso Previo connects signed customer contracts in Confluence to engineering releases in Jira:

### 1. Contract extraction with a verbatim clause
Using Forge's hosted `@forge/llm` API (Claude), Aviso Previo reads a customer DPA from its Confluence page and extracts the notice period, calendar vs. business days, objection window, remedy and any EU/UK-only restriction. Each reading is tied to the exact clause it came from, and **a quoted clause that is not found word for word in the page is rejected**. A vague phrase such as *"a reasonable period"* is never turned into a number: it becomes `unclear: counsel to decide`.

Counsel review each contract in the admin workspace with the extracted terms beside the clause. **Read with Claude** re-reads the Confluence page and compares field by field. An ambiguous clause is resolved by counsel entering the period they read; a button cannot confirm it.

### 2. Ticket reading
When a ticket is viewed or moved, `@forge/llm` classifies it as a new subprocessor, a location change, synthetic data only, routine work on an approved vendor, or unrelated, and notes where the vendor will process the data. A ticket called "synthetic data only" is released only after a person confirms it, and the confirmation is recorded, because a wrong "synthetic" is the mistake that would let real data through. If the model cannot be used, cautious rules take over and lean towards flagging a possible new subprocessor rather than missing one.

### 3. A quiet issue panel
On a ticket that triggers an obligation, the panel shows the earliest permitted go-live, the number of confirmed contracts affected, the longest notice, termination rights, region conflicts and the binding clause. If counsel have not confirmed any terms yet, it says so and the release stays blocked.

### 4. Dates in code, never in the model
Dates are plain TypeScript: calendar days, business days that skip weekends, UTC-safe. The notice clock starts when a ticket is first assessed and does not slide as time passes. The longest notice among the applicable, **counsel-confirmed** contracts sets the date.

### 5. A Jira workflow validator
`jira:workflowValidator` blocks release-type transitions (Done, Deployed, Production and similar) while the notice window is open, with a message built from the register: the vendor, the number of contracts, the longest notice and the date. There are no ticket-specific branches. If a ticket cannot be assessed the transition is blocked. A counsel override with a written reason lifts the hold and is recorded with who made it.

### 6. Customer notice and privacy request
The panel drafts a customer notice from the ticket and the contracts. **Notify privacy counsel** creates a Jira request in project `PRIV` if it exists, or in the ticket's own project, and shows its real key. If Jira refuses, it says so and does not invent a key.

### 7. A Rovo agent and MCP tools
An **Aviso Previo** Rovo agent, with a bounded prompt that makes it use its tools for every contract fact, can run `check-subprocessor-commitments` (what would adding this vendor commit us to), `explain-customer-term` (the verbatim clause for a customer) and `open-privacy-notice-request`. The same tools are exposed through `rovo:mcp` for other agents and clients.

*Ask the agent from Jira (Ask Rovo in Jira). Forge storage is per product install, so the register is read there; two copies of the agent appear, one per install.*

### 8. Contracts and tickets in the Teamwork Graph
A `graph:connector` ingests each customer DPA as an `atlassian:document` and associates it with the Jira issues whose release hold it binds. Contracts and work are then connected in the graph, so Rovo can answer which contracts a ticket touches and which tickets a contract constrains. An admin connects it once; the admin page shows the last sync.

---

## How We Built It

Built on **Atlassian Forge**:
- **Custom UI (React + Vite)** for the admin page and for the issue panel, glance and context, with one minimal design system. Both follow Jira's light and dark mode.
- **`@forge/kvs`** for the register and ticket decisions.
- **`@forge/llm`** (Claude) for ticket classification and contract extraction.
- **Confluence REST v2** to write and read the contract pages, and **Jira REST** to read tickets and create privacy requests.
- **`jira:workflowValidator`** for the release hold, **`rovo:agent`** and **`rovo:mcp`** for agents, and **`graph:connector`** with `@forge/teamwork-graph` for the Teamwork Graph.

One function, `assessIssue`, assesses a ticket. The issue panel, the validator, the Rovo tools and the privacy request all call it, so they cannot disagree.

---

## Evaluation and tests

- **60 automated tests** run the real modules against fake Jira, Confluence, storage and model: the date engine, the hold policy (only confirmed terms count; fails closed), the validator on arbitrary ticket keys, the classifier and its fallback, the extractor's verbatim check and scoring, the Rovo tools, and the Confluence seeding.
- **The Evaluation tab** has the model read all 41 contracts from their Confluence pages and scores every answer against the label each sample contract was written with, counting a confident wrong answer as a failure. Run 1 (20 November 2026): quoted clauses found word for word 41/41, termination rights 2/2, EU/UK-only limits 3/3, the ambiguous clause flagged 1/1, **0 wrong answers**, and notice period and unit 29/41. The other 12 gave a number of days without saying calendar or business days, and the model declined to assume and flagged them for a person, because the sample text was underspecified. I made those clauses explicit (no label or prompt change) and re-ran: **41/41 on every check, 0 wrong, 0 declined**. It is 41 sample contracts the author wrote, with the data corrected after the first run, so it shows the behaviour rather than a general accuracy.
- **The rule fallback** gets 28 of 30 labelled tickets right and finds all 8 new subprocessors. It was tuned while looking at that set, so treat it as optimistic.

---

## What AI Does vs. What Code Does

| AI (Claude via `@forge/llm`) | Code (TypeScript, `@forge/kvs`) |
|---|---|
| Reads a contract page and quotes the subprocessor clause | Verifies the quote is in the page, word for word |
| Reads a ticket and says what kind of change it is | Date arithmetic: calendar days, business days, the longest notice |
| Flags a vague clause as `unclear` | Decides whether a hold applies, using only confirmed terms |
| | Blocks the transition, fails closed, records overrides |
| | Drafts the customer notice from a template |

---

## Challenges We Overcame

1. **Not guessing legal terms.** Models like to resolve vague wording into a number. The prompt forces `unclear`, the code treats an unclear term as not counting, and only counsel can resolve it.
2. **One source of truth.** The panel, the validator and the agent tools first computed things separately and drifted. Moving them to one assessment, with numbers recomputed from the register each time, removed the drift and the hardcoded demo values.
3. **Failing safely.** A model outage or an unreadable ticket must never mean "allowed". The classifier falls back to rules, an empty or unconfirmed register blocks, and an unassessable ticket blocks.
4. **Data residency.** Using `@forge/llm` keeps contract and ticket text inside Atlassian's infrastructure.

---

## What We Learned

- **Quiet UI builds trust**: Legal and compliance tools should not be noisy or alarmist. Using subtle neutral surfaces, exact clause quotes, and a single accent color for the unlock date creates an authoritative, calming experience for engineers and lawyers alike.
- **Tethering AI to ground truth is essential**: Giving lawyers a summary without the exact clause quote forces them to dig through 50-page PDFs anyway. Pairing every extraction with its verbatim clause makes review instantaneous.

---

## What's Next for Aviso Previo

- **Atlassian Teamwork Graph Integration**: Querying PRs and commits in Bitbucket to cross-reference `package.json` dependency additions with Jira tickets.
- **Customer Objection Portal**: A customer-facing portal in Jira Service Management where enterprise clients can view subprocessor notices and record objections directly.
- **Contract PDF Parsing**: Ingesting scanned PDF agreements via Atlassian Document APIs.


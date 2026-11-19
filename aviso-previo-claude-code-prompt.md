# Claude Code kickoff prompt: Aviso Previo (Codegeist 2026)

Paste everything below the line into Claude Code in an empty folder, with the Forge MCP Server connected. Full plan: https://claude.ai/artifact/Y7ruyNfdLGtB9PcKGjgoXW

---

I'm building a Forge app called Aviso Previo for Atlassian Codegeist 2026 (category: Apps for Business Teams, legal), solo. Submission target is 21 Dec 2026. I write TypeScript, React, Python, Solidity and Rust, but I've never built on Atlassian, so explain Forge-specific things briefly the first time they come up.

## The product

A SaaS company's data processing agreements (DPAs) with its customers require notice before a new subprocessor touches customer data, and give customers a window to object. Terms differ per customer: 14/30/60 days, business days, "reasonable period", termination rights, EU-only location limits. Engineers add vendors in Jira tickets without knowing any of this. Aviso Previo:
1. Extracts each customer's DPA terms (notice period and unit, objection window, remedy, notice method, location limits) from Confluence pages into a register. Every term stores the exact clause it came from. Unclear terms are recorded as unclear, never guessed. Counsel confirms each DPA once before it counts.
2. Reads Jira tickets and Confluence design pages when created or edited, and classifies: new subprocessor / existing vendor, no change / existing vendor, new location / third party but no customer data / unrelated. It compares against the published subprocessor list page.
3. For a new subprocessor or location change, shows an issue panel: affected customers, longest notice, who can object or terminate, location conflicts, earliest go-live date, each number clickable to the clause. Opens a request in the legal JSM project with the customer list and a draft notice.
4. A workflow validator blocks the transition to Deployed before the notice date.
The app reports what contracts say. It never states what any law requires. Dates are computed in code, never by the model. Every screen says: "Aviso Previo summarizes your contracts. It is not legal advice."

## Platform rules

- Forge postdates much of your training data. Before using any module, scope, API or manifest key, check it with the Forge MCP Server or developer.atlassian.com, and record it in docs/FORGE.md with the page you checked. Never guess a signature.
- Use Forge LLMs (@forge/llm), not an external API: customer contracts must not leave Atlassian. Sonnet tier for DPA extraction, Haiku for ticket reading. Return structured JSON and validate it. Log tokens per call to docs/COSTS.md.
- UI Kit for panels. Forge storage (recommend KVS or Forge SQL, with reasons) for the register and decisions.
- jira:workflowValidator only works in company-managed projects; the demo project is company-managed. For team-managed, fall back to a warning banner.
- Expected modules (confirm each): jira:issuePanel, Jira issue created/updated triggers, Confluence page read, jira:workflowValidator, admin page, llm, rovo:agent with actions, rovo:mcp exposing check-vendor.

## Build in phases. Stop after each, show me it working, list what you verified and what you couldn't.

1. Spike: app on my dev site; an issue panel showing one Forge LLM answer; one Confluence page read; a validator that blocks a transition with a message. Check Rovo is available.
2. Seed script for the fictional company "Ayo Payroll": 41 DPAs built from clause variants I approve, a subprocessor list page with 9 vendors, a company-managed ENG project, a legal JSM project, and the planted tickets ENG-142 (new vendor Glimpse, fictional), ENG-151 (SDK upgrade, no panel), ENG-156 (email provider moves EU to US, location conflict for 3 customers), ENG-160 (sandbox with synthetic data, no customer data). "Sample data, fictional" banner everywhere. No real company, person or vendor names.
3. Extraction into the register, with an admin page where counsel reviews each DPA's terms beside their clauses and confirms. Build an answer key for the 41 DPAs and a script that scores extraction.
4. Ticket reading and the issue panel. Build a 30-ticket labelled test set and a scoring script.
5. Date computation (calendar and business days), legal request creation, workflow validator.
6. Rovo agent and actions (check-vendor, explain-term, open-notice-request), then rovo:mcp reusing check-vendor.
7. Judge experience: empty states, "Load sample" button, "Try this" box, permission checks (no clause text for users without access), clean-site install test.
8. README, Devpost draft, video script.

## Ground rules

- One journey working end to end beats breadth. If we fall behind, cut in this order: Teamwork Graph, Marketplace, PDF reading, location changes, drafted notice text, MCP, validator.
- Never cut the panel, the clause quotes, or counsel's confirm.
- Label anything simulated in the UI and README.
- Copy is plain and concrete, with the ENG-142 example. No "seamless", "empowering", "revolutionize".
- The interface belongs in Jira: Atlassian design tokens, quiet, one accent colour for the notice date. Clause quotes in a readable serif block, like a contract excerpt. No gradients.
- Disagree with me when I'm wrong; ask before choices that are expensive to reverse.

Start with phase 1.

# Aviso Previo — Codegeist 2026 build plan

Nov 19, 2026 · @North

## What we're building

Aviso Previo is a Forge app that warns a company, from inside the Jira ticket, that a piece of engineering work will add a new subprocessor, and tells legal exactly which customer contracts that triggers and by when. Category: **Apps for Business Teams (legal)**. Submission target: **Sunday 21 Dec 2026**, a day before the deadline (22 Dec, 9pm Lagos time).

**The person.** The privacy counsel at a 200-person B2B SaaS company. On a Thursday afternoon a customer's procurement team emails her: "Your app now sends our employees' data to a session-replay vendor. Our DPA required 60 days' notice." She checks Jira: the ticket that added it closed three weeks ago. Nobody on the team knew the contracts said anything about it.

**The rule she's enforcing.** A SaaS company's data processing agreements (DPAs) with its customers require notice before a new subprocessor touches customer data, and usually give the customer a window to object. The terms differ from customer to customer: 14 days, 30 days, 60 days, "a reasonable period", some with a right to terminate, some forbidding processing outside the EU.

**What Aviso Previo does:**

1. **Reads the signed DPAs** and records, per customer: notice period, objection window, objection remedy, notice method, and location limits. Every term links to the clause it came from.
2. **Reads engineering tickets and design pages** when they're created or edited, and decides whether the work would bring a third party into contact with customer data. It then checks that party against the company's published subprocessor list.
3. **When the party is new, shows a panel on the ticket:** "This adds a new subprocessor. 41 customer DPAs apply: 33 need 30 days' notice, 6 need 60, and 2 can object and terminate. 3 forbid processing outside the EU; this vendor stores data in the US. Earliest go-live: 19 January." It opens a legal request with the customer list and a draft notice.
4. **Holds the release.** A workflow validator stops the ticket moving to Deployed before the notice date. This step is plain code.

**The 60-second demo:** an engineer writes an ordinary ticket → the panel appears with 41 contracts and a go-live date → click through to the exact clause in one customer's DPA → the legal request appears with the notice drafted → the engineer tries Deployed and is stopped, with the unlock date → a ticket that only upgrades an existing vendor gets no panel.

**The name.** *Aviso previo* is Spanish and Portuguese for "prior notice", which is both what every DPA demands and what the app enforces. It follows the same pattern as Cada Caso: a short phrase naming the rule itself. In English copy the product says plainly what it does: "Aviso Previo tells you which customer contracts a change will trigger, before you ship it."

## What exists and the gap

Tools exist on both sides of this problem, and none connects them: legal-team apps track contracts, vendor-risk tools assess a vendor once someone files a request, and nothing reads the company's own customer DPAs at the moment an engineer decides to add a vendor.

| Existing tool | What it does | Why it doesn't solve this |
| --- | --- | --- |
| [Appvibe Contract Management](https://marketplace.atlassian.com/apps/1236504/appvibe-contract-management), [Pact](https://marketplace.atlassian.com/apps/1221110) | Contract lifecycle in Jira: templates, approvals, renewal alerts | Track contracts as records; don't read obligations or connect them to engineering work |
| [AI Vendor Risk Management for Jira](https://marketplace.atlassian.com/apps/1236763) | Vendor onboarding and security questionnaires, pulling in tickets raised for vendor onboarding | Starts when someone raises an onboarding ticket, the step that gets skipped. Assesses the vendor's risk, not the notice you owe your customers |
| [OneTrust vendor risk module](https://www.onetrust.com/company/news/press-releases/onetrust-vendor-risk-management-privacytech) | Vendor intake, assessments, detects your vendors' own sub-processors | Inbound view (your vendors' vendors). Separate platform outside Jira; engineering doesn't see it |
| Vanta, UpGuard Jira integrations | Create Jira issues from failing compliance tests or vendor risk findings | Push compliance work into Jira; don't read engineering tickets for new data flows |

One practitioner guide describes today's fallback: a privacy analyst periodically emails engineering asking which vendors touch personal data, a process that depends on memory and returns incomplete answers ([FitGap](https://us.fitgap.com/stack-guides/map-vendor-data-flows-to-flag-unauthorized-processing)).

**The judges' own ecosystem has this problem.** Marketplace partners publish subprocessor lists for their apps, with analytics, support and error-tracking vendors on them ([example](https://brokenbuild.atlassian.net/wiki/spaces/TRUST/pages/3284926465)), and must give customers notice when those lists change. Use one sentence of this in the pitch.

## Where Claude Code fits

Claude Code writes most of the code; you drive, test, and make the calls only a person can. For a solo developer new to Forge, this is how three weeks of work fits the time.

| Claude Code does | You do |
| --- | --- |
| Scaffold the Forge app; write the manifest, functions, UI Kit panels and the workflow validator | Run `forge login` and anything that needs your Atlassian account |
| Write the DPA extraction and ticket-reading prompts, and score them against the test set | Check each extracted term against its clause; you are the counsel in the eval |
| Write the seed script and the 41 fictional DPAs from clause templates | Approve every clause variant so the sample reads like real negotiated contracts |
| Write Jira and Confluence calls, checking each against the Forge docs | Create the dev site; enable Jira, JSM, Confluence and Rovo; apply for any early-access program |
| Run `forge deploy`, read `forge logs`, fix errors | Click through the app after every phase |
| Draft the README, Devpost text and video script | Record the video and decide what it says |

**Setup, once:**

- Install Claude Code and the Forge CLI (`npm install -g @forge/cli`).
- Connect Claude Code to the Forge MCP Server, which serves the official Forge docs and manifest references to coding agents. This stops it guessing module names on a platform newer than its training data.
- Paste the kickoff prompt at the end of this doc into Claude Code in an empty folder.

## Platform facts checked, and open risks

Everything the core needs exists in Forge today; the two real risks are the validator's project-type limit and Teamwork Graph's early-access status.

| Piece | What the docs say (checked 19 Nov) | What it means for us |
| --- | --- | --- |
| Forge LLMs | Generally available; Claude models (Haiku, Sonnet, Opus) through `@forge/llm`, enabled by an `llm` manifest module. No free quota; tokens billed to the developer ([pricing](https://developer.atlassian.com/platform/forge/runtime-reference/forge-llms-api-pricing/)). | Data never leaves Atlassian, which matters when the input is customer contracts. Sonnet for DPA extraction (once per contract), Haiku for reading tickets (often). Codegeist gives no credits. |
| `jira:workflowValidator` | Blocks a transition with an error message, via a Jira expression or a function ([module](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-workflow-validator/)). Only supported in company-managed projects ([Atlassian staff answer](https://community.developer.atlassian.com/t/how-to-block-the-transition-with-forge/57922)). | The demo project must be company-managed. For team-managed projects, fall back to a warning banner and a JQL filter of tickets shipping early. |
| `rovo:agent`, `rovo:mcp` | Agents and actions are standard modules; `rovo:mcp` exposes actions as tools on Atlassian's MCP infrastructure, with external access switched on per site by an admin ([module](https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-mcp/)). Rovo must be active on the site. | The MCP bonus reuses the agent's actions: about one day of work. |
| Teamwork Graph API | Early-access program: apply, install only in test organizations, with restrictions on distributing apps that use it ([docs](https://developer.atlassian.com/platform/teamwork-graph/api-reference/object-types/overview/)). | Not in the default plan: Marketplace is. Apply tonight anyway; build it only if access arrives by 26 Nov and judges can install the app on their own sites. |
| Reading DPAs | DPAs usually arrive as PDFs. | Phase 1 reads DPAs as Confluence pages (legal pastes the text). PDF attachments are a stretch goal, and only if a PDF parser runs inside Forge's function limits. |

**Questions to close in the first two days:**

- [ ] Does a free developer site include Jira, JSM, Confluence and Rovo together?
- [ ] Can a validator function read app storage (the notice date) fast enough to run on every transition?
- [ ] What does extracting one 6-page DPA cost on the Sonnet tier?
- [ ] Has the Teamwork Graph early-access application been answered?

## Architecture

Three Confluence and Jira inputs feed two AI steps; everything downstream of counsel's confirm is deterministic code.

&#91;embedded content: architecture · 3 inputs, 4 steps, 4 outputs\]

**Modules:** `jira:issuePanel` (the panel), Jira issue created/updated triggers (read the ticket), Confluence REST via `@forge/api` (DPAs and the subprocessor list), `llm` (Forge LLMs), a Jira admin page (counsel's review and confirm), `jira:workflowValidator` (release hold), `rovo:agent` with actions, `rovo:mcp`.

**Stored data (Forge storage):**

| Record | Fields |
| --- | --- |
| Contract term | customer, notice period, unit (calendar or business days), objection window, remedy, notice method, location limit, clause quote, page link, status (draft / confirmed / unclear) |
| Vendor | name, purpose, data location, source (subprocessor list) |
| Ticket decision | issue key, classification, vendor, AI reason, overridden by + reason, affected customers, earliest go-live date, legal request key |

## Sample data: Ayo Payroll

The demo runs on a fictional payroll SaaS called Ayo Payroll, which processes employee data for 41 business customers in Nigeria, the UK and the EU. Payroll data is unmistakably personal data, so no judge has to be convinced the contracts matter. A seed script loads it all in one click, labelled "Sample data, fictional" everywhere.

**What the seed creates:**

- **41 DPAs** as Confluence pages in a "Customer contracts" space, built from clause variants a person would recognize as negotiated: notice of 14, 30 or 60 days, "30 business days", "a reasonable period"; objection windows of 15 to 30 days; remedies from "discuss in good faith" to "terminate the affected services"; three with an EU/UK-only location clause. A few bury the subprocessor clause inside a long data-transfer section, as real ones do.
- **A published subprocessor list** page with 9 current vendors (hosting, email, support, error tracking).
- **An engineering project** (company-managed) with 20 ordinary tickets and a Deployed status.
- **A legal JSM project** for privacy requests.

**Planted cases the demo and tests depend on:**

| Ticket | What it says | Correct result |
| --- | --- | --- |
| ENG-142 | "Add session replay to the payslip screen using Glimpse (fictional vendor) to debug layout bugs" | New subprocessor. 41 DPAs, longest notice 60 days, 2 can terminate, 3 location conflicts (vendor stores data in the US). Validator holds Deployed |
| ENG-151 | "Upgrade the error-tracking SDK to v8" | Existing vendor, no change. No panel |
| ENG-156 | "Move the email provider's sending region from EU to US" | Existing vendor, new location. Panel for the 3 EU-only customers only |
| ENG-160 | "Evaluate Glimpse in a sandbox with synthetic data only" | Third party, but no customer data. Panel says so and asks a person to confirm |

ENG-151 and ENG-160 prove it isn't keyword matching: both mention vendors, and only one triggers notice.

**Honesty rules:** no real company or person names; fictional vendor names, even where a real one would fit; the app works the same on real contracts with the sample unloaded.

## Legal accuracy rules

Aviso Previo reports what each contract says and does the date arithmetic; it never tells anyone what the law requires. These rules keep it trustworthy to a lawyer judging it.

1. **Every extracted term quotes its clause.** The panel shows "60 days" next to the sentence it came from, with a link to the page. No quote, no term.
2. **Unclear terms are flagged, not guessed.** "A reasonable period" or "promptly" is recorded as *unclear: counsel to decide*, and those customers are listed separately.
3. **Counsel confirms each DPA once.** Extraction produces a draft register entry; it counts only after counsel clicks confirm. Until then the panel says "unconfirmed".
4. **The AI flags; a person decides.** The "new subprocessor" call on a ticket can be overridden by the engineer or counsel, with a reason recorded on the ticket.
5. **Dates are computed in code**, including business days where the clause says so, never by the model.
6. **No jurisdiction claims.** The app never says "GDPR requires" or "the NDPA requires". It only says what the contract says.
7. **Every screen carries one line:** "Aviso Previo summarizes your contracts. It is not legal advice."

## Bonus prize plan

Aim for three of the four bonuses: Rovo agent, MCP and Marketplace. Teamwork Graph is an optional extra, only if early access arrives by 26 Nov and doesn't block the listing or judges' installs. Each pays $1,500 to 6 winners and stacks on a main placing.

| Bonus | What we build | Cost | What the video shows |
| --- | --- | --- | --- |
| Best Agents (Rovo) | Agent "Aviso Previo" with actions `check-vendor` (which customers need notice if we add X?), `explain-term` (quote a customer's clause), `open-notice-request` | 2–3 days | A product manager asks in Rovo chat "if we add Glimpse, who do we have to tell?" and gets the list with dates |
| Atlassian MCP | `rovo:mcp` exposing `check-vendor` | About 1 day | Claude Code is about to add a vendor SDK, calls the tool, and warns "this needs 60 days' notice to 41 customers" before writing the code |
| Teamwork Graph | Link work item → vendor → customer contract through the graph, so "which work touches Customer X's commitments?" is one query | 2 days, if early access is granted | Only if access is confirmed; otherwise no claim |
| Marketplace published | Submit the listing by 12 Dec | 1 day | Listing or review-ticket link |

The MCP beat is the strongest extra: the warning reaches the developer before the code exists, not just before deploy.

## Judge experience and testing

A judge installs on an empty site, loads the sample in under two minutes, and then writes their own ticket in their own words. That is the "not a single hardcoded demo path" test, so the app must handle it.

**What a judge sees, in order:**

1. The admin page: "No contracts found yet", with **Load Ayo Payroll sample** and **Use my own Confluence space**.
2. A progress list while the sample loads (contracts, subprocessor list, projects).
3. A "Try this" box: "Create a ticket in ENG that adds any tool which would see payroll data. Then try one that doesn't."
4. Their ticket gets a panel, or an explicit "No new subprocessor" line with the reason.

**Two test sets, scored after every prompt change:**

- **Extraction:** the 41 sample DPAs with an answer key (notice period, unit, objection window, remedy, location limit). Target: every term correct or flagged unclear; zero wrong-but-confident terms.
- **Ticket reading:** 30 tickets written by someone else (ask a friend), each labelled new subprocessor / existing vendor / no customer data / location change. Target: no missed new subprocessors; a few false alarms are acceptable, because a person overrides them.

Put both scores in the Devpost write-up.

**Must pass before submitting:**

- [ ] Fresh company-managed site: sample loads, the four planted tickets behave as written.
- [ ] Validator blocks ENG-142 with the unlock date, and allows it after the date is moved past in a test.
- [ ] Empty states: no contracts, no subprocessor list, LLM failure or timeout. Each shows a plain message.
- [ ] A user without access to the contracts space sees counts and dates, not clause text.
- [ ] Install, uninstall, reinstall on a second clean site.

## Submission: video and Devpost write-up

The video's first ten seconds must make a judge who has never read a DPA understand the stakes: "One engineer added one vendor, and broke 41 customer contracts."

**Video, aim for 3:30, public on YouTube:**

| Time | Scene | What the viewer learns |
| --- | --- | --- |
| 0:00–0:30 | The customer's email to counsel, then the closed ticket that caused it. One sentence on what a DPA's notice clause is. | The problem and who has it |
| 0:30–1:20 | An engineer writes ENG-142. The panel: 41 contracts, 60-day maximum, 2 can terminate, 3 location conflicts, go-live 19 Jan. Click a number → the exact clause. | The core moment |
| 1:20–1:50 | Counsel's legal request with the customer list and drafted notice; she confirms. | Legal's side |
| 1:50–2:15 | The engineer tries Deployed and is stopped with the unlock date. | The guardrail |
| 2:15–2:40 | ENG-151 (SDK upgrade): no panel. ENG-160 (sandbox, synthetic data): "no customer data". | It reads, it doesn't keyword-match |
| 2:40–3:15 | Rovo chat: "if we add Glimpse, who do we tell?" Then Claude Code, over MCP, warned before adding the SDK. | The bonuses, working |
| 3:15–3:30 | Built on Forge, Forge LLMs, Rovo, MCP. The two test scores. | Credibility |

**Devpost write-up, in this order:**

- **What it does,** in two sentences, using the ENG-142 example.
- **Who it's for:** privacy and commercial counsel at SaaS companies with negotiated DPAs, and the engineers whose tickets trigger them.
- **Category** (Business Teams, legal) **and bonuses,** with each bonus's materials.
- **The Forge modules used.**
- **What the AI does and doesn't do:** it extracts terms and reads tickets; counsel confirms each contract; dates and the release hold are code.
- **Both test scores and known limits:** PDF reading, team-managed projects.
- **Install link,** plus three lines on how to test with the sample.

Plain words throughout, and no claim the video doesn't show.

## Cut list

The ticket panel, the clause quotes, and the counsel confirm are the product and are never cut. If the schedule slips, cut in this order:

1. Teamwork Graph integration.
2. Marketplace listing.
3. PDF attachments (Confluence pages only).
4. Location-change detection (ENG-156); keep new-vendor detection.
5. Drafted notice text in the legal request (keep the customer list and dates).
6. MCP module.
7. Workflow validator (fall back to a warning banner and a JQL filter).

**Never build:** a contract repository, renewal alerts, dashboards, e-signature, a vendor questionnaire. Each one turns this into a contract-management app, and those already exist.

## Schedule

Eight phases from 20 Nov, each ending in something you can demo, and the last four days kept for judges' testing, the video and the write-up.

&#91;embedded content: build schedule · 8 phases, 3 milestones\]

**What you can show at the end of each phase:**

| Phase ends | Demoable checkpoint |
| --- | --- |
| 21 Nov | A panel on a Jira issue showing a Forge LLM answer; a validator blocking a transition |
| 25 Nov | The Ayo Payroll site: 41 DPAs, subprocessor list, ENG and legal projects, planted tickets |
| 30 Nov | Admin page: each DPA's terms beside their clauses, counsel confirms; extraction score |
| 5 Dec | ENG-142 gets the panel, ENG-151 doesn't; ticket-reading score |
| 9 Dec | The full 60-second story, including the release hold |
| 12 Dec | Rovo chat and the MCP warning in Claude Code; Marketplace listing submitted for review |
| 17 Dec | A clean site where a stranger can install, load the sample and test with their own ticket |
| 20 Dec | Video on YouTube, Devpost text drafted |

**Decision on 26 Nov:** the Marketplace listing goes ahead regardless. Add Teamwork Graph in the 10–12 Dec slot only if early access has been granted, its terms allow a Marketplace listing, and judges can install the app on their own sites.

## Claude Code kickoff prompt

Paste the block below into Claude Code in an empty folder, with the Forge MCP Server connected. It's also saved in the hackathon project as `claude/aviso-previo-claude-code-prompt.md`.

```markdown
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
```

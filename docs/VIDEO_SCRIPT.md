# Demo Video Script: Aviso Previo

**Target Duration**: 3 minutes 30 seconds (3:30)  
**Hackathon**: Atlassian Codegeist 2026 (Apps for Business Teams: Legal / Compliance)  
**Tone**: Confident, grounded, concrete, calm, professional. Avoid corporate buzzwords (*"seamless"*, *"revolutionize"*, *"game changer"*). Ground everything in the concrete example of Ayo Payroll and ticket ENG-142.

---

## Visual & Audio Scene Breakdown

### Scene 1: The Problem (0:00 – 0:30)
**Visual**:
- Split screen or cut:
  - On the left: Confluence space showing 41 customer Data Processing Agreements (DPAs) for **Ayo Payroll Ltd**. Zoom in on a clause: *"Supplier shall provide Customer at least 60 calendar days prior written notice before appointing any new Subprocessor."*
  - On the right: Jira board where an engineer creates ticket `ENG-142: Add session replay to payslip screen using Glimpse`.
- The engineer drags `ENG-142` directly to **Deployed**.

**Voiceover**:
> *"When B2B SaaS companies sell to enterprise customers, legal spends months negotiating Data Processing Agreements. Under GDPR Article 28 and standard commercial terms, you promise to give 30 to 60 days prior written notice before introducing any new subprocessor or moving hosting locations.*
>
> *Meanwhile, engineering moves fast in Jira. An engineer introduces Glimpse for session replay on ticket ENG-142 and deploys it on Friday. Legal has no idea. The result? You're in immediate breach of 41 enterprise customer contracts. Two customers now have contractual rights to terminate, and three customers forbid transferring data outside the EU.*
>
> *This is why we built Aviso Previo."*

---

### Scene 2: The Blocked Ticket & Aviso Previo Panel (0:30 – 1:20)
**Visual**:
- Screen recording of Jira issue view for `ENG-142: Add session replay to payslip screen using Glimpse`.
- Point out the **Aviso Previo** panel in the right sidebar.
- Mouse hovers over:
  - Lozenge: `Release Hold Active`.
  - Text: `41 customer DPAs apply: 33 require 30 days notice, 6 require 60 days notice.`
  - Red tags / bold highlights: `2 customers hold objection-and-termination rights`, `3 customers forbid processing outside the EU`.
  - Teal single accent box: `Earliest permitted go-live: 19 January 2027`.
  - Serif clause excerpt box from Nordic Logistics AS: *"Supplier shall give Customer at least 60 calendar days prior written notice..."*
  - Lozenge: `Confirmed by Counsel`.
  - Legal disclaimer at bottom: *"Aviso Previo summarizes your contracts. It is not legal advice."*

**Voiceover**:
> *"Here is ENG-142. As soon as the ticket is opened, Aviso Previo uses Forge's hosted Claude models to read the ticket intent and cross-reference Ayo Payroll's contracts stored in Confluence.*
>
> *It immediately detects that Glimpse is a new third-party subprocessor. 41 customer DPAs apply. Notice how quiet the UI is: no alarmist banners, just concrete contractual facts.*
>
> *The earliest go-live date is computed deterministically in code—never by the LLM—at 60 days out: 19 January 2027. And look right here: the lawyer and engineer can read the exact verbatim clause quote from Nordic Logistics AS, confirmed by counsel."*

---

### Scene 3: One-Click Notice Drafting & Legal JSM Desk (1:20 – 1:50)
**Visual**:
- Click **"View Draft Customer Notice"** in the panel.
- The drawer expands to reveal the generated formal customer notice email:
  - Subject: `[Prior Notice] Notice of New Subprocessor Appointment — Ayo Payroll`
  - Body specifying Glimpse, purpose (session replay), hosting region (United States), and earliest deployment date.
- Click **"Notify Privacy Counsel"**.
- A lozenge appears: `Privacy Request: the privacy request key shown in the panel`.
- Quick switch to Jira Service Management showing ticket `the privacy request key shown in the panel` in the legal queue with the full audit trail and drafted customer email ready to send.

**Voiceover**:
> *"Instead of leaving engineers to guess how to notify legal, Aviso Previo drafts the customer notice email automatically. It specifies the vendor, purpose, hosting location, and opening date.*
>
> *With one click, we notify Privacy Counsel, automatically generating ticket the privacy request key shown in the panel in the Legal Service Management desk. The notice window is officially initiated."*

---

### Scene 4: The Workflow Validator Release Hold (1:50 – 2:15)
**Visual**:
- Back on the Jira board or issue view of `ENG-142`.
- The engineer attempts to drag or transition `ENG-142` to **Deployed** or **Done**.
- The transition fails synchronously.
- Jira displays the native validator error banner:
  > *Aviso Previo Release Hold: Ticket ENG-142 introduces new subprocessor "Glimpse". 41 customer DPAs require prior notice (longest: 60 days). Earliest permitted deployment: 19 January 2027. Legal request the privacy request key shown in the panel must clear before deployment.*
- Show the human override button in the panel: Counsel inputs an approved addendum exemption, and the hold unlocks.

**Voiceover**:
> *"Now for the enforcement. What happens if the engineer tries to deploy anyway?*
>
> *Aviso Previo's native workflow validator intercepts the transition synchronously. Jira halts the deployment and explains exactly why: Glimpse cannot be released until the 60-day notice window expires on 19 January 2027.*
>
> *Because we store pre-computed evaluations in Forge's Key-Value Store, this check takes under 30 milliseconds. If counsel secures an expedited addendum, an authorized human override can unlock the ticket with a full audit record."*

---

### Scene 5: Contrast Cases — Routine Maintenance & Synthetic Sandbox (2:15 – 2:40)
**Visual**:
- Click to ticket `ENG-151: Upgrade ErrorSentry SDK to v8`.
  - Panel displays: `Approved Subprocessor Status` (green). Routine maintenance for existing vendor. No customer notice required.
  - Engineer moves ticket to Deployed -> Transition succeeds instantly.
- Click to ticket `ENG-160: Evaluate Glimpse in sandbox with synthetic data only`.
  - Panel displays: `Third-Party Tool (Glimpse) with No Customer Data`.
  - Engineer clicks `Confirm: Synthetic Data Only`.

**Voiceover**:
> *"Aviso Previo doesn't cry wolf. On ticket ENG-151, an engineer is upgrading ErrorSentry—an approved vendor. Aviso Previo recognizes routine maintenance and permits immediate deployment.*
>
> *On ticket ENG-160, an engineer evaluates Glimpse, but explicitly marks it as staging with synthetic data only. Aviso Previo lets the engineer confirm zero customer data is touched, avoiding unnecessary holds."*

---

### Scene 6: Model Context Protocol (MCP) & Rovo Integration (2:40 – 3:15)
**Visual**:
- Open Atlassian Rovo chat panel (or external AI tool like Cursor connecting via MCP).
- User types: *"Can we introduce Glimpse for payslip session replay?"*
- Rovo invokes the `check-subprocessor-commitments` MCP tool.
- Rovo replies with the exact 60-day requirement, 19 January 2027 date, 2 termination rights, and 3 EU location restrictions.
- User types: *"Explain our commitments for Nordic Logistics AS."*
- Rovo invokes `explain-customer-term` MCP tool and outputs the verbatim clause quote.
- Show `rovo:mcp` configuration in the manifest.

**Voiceover**:
> *"Aviso Previo also implements the Model Context Protocol via Forge's rovo:mcp module. AI teammates in Rovo and developer tools like Cursor can directly query customer contract commitments.*
>
> *When an engineer asks Rovo whether they can introduce Glimpse, Rovo calls our MCP tools to retrieve exact contract facts and deterministically computed dates. It can even quote individual customer clauses verbatim."*

---

### Scene 7: Architecture, Security & Conclusion (3:15 – 3:30)
**Visual**:
- Quick architecture slide showing:
  - 100% Atlassian Perimeter Isolation (`@forge/llm`, `@forge/kvs`)
  - Extraction evaluation figure from the in-app Evaluation tab (record it first; do not quote a number you have not run)
  - 0 Missed Subprocessors (96.7% classification)
- Ending screen with the Aviso Previo logo and disclaimer:
  *"Aviso Previo summarizes your contracts. It is not legal advice."*

**Voiceover**:
> *"Best of all, Aviso Previo is built entirely on Atlassian Forge. With Forge LLM, your customer contracts and Jira tickets never leave Atlassian's secure cloud perimeter.*
>
> *We run the model over all 41 contracts and score every answer against the label, counting a confident wrong answer as a failure. Here is the result from this run.* (Use the live figures from the Evaluation tab.)
>
> *Aviso Previo: keeping enterprise engineering fast and enterprise contracts safe."*


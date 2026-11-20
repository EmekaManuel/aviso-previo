# Aviso Previo privacy policy

Last updated: 20 November 2026

Aviso Previo is an Atlassian Forge app that helps teams check customer data processing agreements (DPAs) against the Jira tickets that change a subprocessor. This policy explains what it handles and where.

## What the app handles

- **Contract data you load.** The customer names, countries, extracted notice terms and clause text of the DPAs in the register, and the Confluence pages they are read from. The sample data shipped with the app is fictional.
- **Jira ticket text.** The summary and description of a ticket, read so the app can tell whether it adds or moves a subprocessor.
- **Decisions and requests.** The classification of each ticket, the notice start time, any counsel override with its written reason, and the Jira privacy request the app creates.
- **Account IDs.** When a person confirms a contract term or overrides a hold, their Atlassian account ID is stored with that record so the decision can be audited.

## Where it is processed

All of it stays inside Atlassian's infrastructure.

- Data is stored in Forge hosted storage on the site where the app is installed.
- Reading contracts and classifying tickets uses Forge's hosted LLM (Claude), which runs inside Atlassian's platform.
- The app makes no calls to servers outside Atlassian. It does not send data to the developer or to any third party, and it has no analytics or tracking.
- If an admin connects the Teamwork Graph connector, contract titles, short descriptions and clause text are added to the Teamwork Graph for that site and are visible to users of that site.

## Retention and deletion

Data is kept for as long as the app is installed. Uninstalling the app removes the data Forge stores for it, and disconnecting the Teamwork Graph connector removes the objects it ingested. A site admin can also delete individual Jira requests and Confluence pages the app created.

## Your responsibilities

Aviso Previo summarizes your contracts. It is not legal advice. Review every extracted term against the contract before you rely on it. Do not load contracts or ticket text that you are not permitted to process in your Atlassian site.

## Contact

Questions about this policy: [ADD A CONTACT EMAIL BEFORE PUBLISHING]

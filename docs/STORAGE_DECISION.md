# Forge Storage Architecture: KVS vs Forge SQL

## Recommendation: Key-Value Store (`@forge/kvs`)

Aviso Previo chooses **`@forge/kvs`** over **Forge SQL** for the following architectural and operational reasons:

### 1. Workflow Validator Latency Sensitivity
The `jira:workflowValidator` executes synchronously when an engineer attempts to move a Jira ticket to "Deployed". Forge functions have strict execution timeout windows (typically 25s max, but transitions should complete under 1–2s for responsive UX). KVS provides O(1) point lookups by issue key (`ticket:ENG-142`), returning the earliest permitted unlock date without SQL query planning or relational join overhead.

### 2. Predictable Access Patterns
Aviso Previo has three primary data sets:
- **DPA Register (`dpa:{customerId}`)**: Customer name, notice period, unit, objection window, remedy, notice method, location limits, exact clause text, page link, confirmation status.
- **Published Subprocessor List (`vendor:{vendorKey}`)**: Name, data processed, hosting regions, approved date.
- **Ticket Assessment (`decision:{issueKey}`)**: Issue key, classification, detected vendor, earliest go-live date, legal request key, override status.

All reads and writes are keyed by specific entities or retrieved using prefix scans (`WhereConditions.beginsWith("dpa:")`).

### 3. Zero Schema Migration Overhead & Painless Seed Loading
Judges and evaluators need to install the app on clean Atlassian sites and run "Load Ayo Payroll sample" in under two minutes. With KVS, populating 41 DPA records and 9 vendors is a batch write operation without DDL migrations, schema lock risks, or connection pool exhaustion.

### 4. Cold-Start Performance
`@forge/kvs` is natively integrated into Forge's serverless runtime environment, avoiding cold database connection establishment delays associated with relational pools.


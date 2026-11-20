# Forge Reference Log: Aviso Previo

This document tracks every Forge manifest module, permission scope, runtime configuration, and API signature used in Aviso Previo, verified against official Atlassian documentation (developer.atlassian.com).

---

## 1. Modules

### `jira:issuePanel`
- **Doc verified**: `https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-panel/`
- **Purpose**: Displays the Aviso Previo subprocessor advisory panel on Jira issue view.
- **Render type**: Custom UI (`resource: main`, built from `admin-ui/panel`)
- **Manifest key**:
  ```yaml
  jira:issuePanel:
    - key: aviso-previo-issue-panel
      title: Aviso Previo
      icon: https://developer.atlassian.com/platform/forge/images/icons/issue-panel-icon.svg
      resource: main
      resolver:
        function: resolver
  ```

### `jira:adminPage`
- **Doc verified**: `https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-admin-page/`
- **Purpose**: Privacy Counsel administration workspace to review DPA extractions, confirm terms against clause quotes, and load Ayo Payroll sample data.
- **Render type**: Custom UI (`resource: admin`, built from `admin-ui/src`)

### `jira:workflowValidator`
- **Doc verified**: `https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-workflow-validator/`
- **Purpose**: Halts transitions to "Deployed" when a ticket introduces a subprocessor whose customer notice window has not expired.
- **Availability**: Company-managed projects only (team-managed fallback: warning banner & JQL filter).
- **Function Return Signature**:
  ```typescript
  interface WorkflowValidatorResult {
    result: boolean;
    errorMessage?: string; // Displayed in Jira UI if result is false
  }
  ```

### `llm`
- **Doc verified**: `https://developer.atlassian.com/platform/forge/manifest-reference/modules/llm/`
- **Purpose**: Enables native Atlassian-hosted Claude models (`@forge/llm`) without sending customer contract data outside Atlassian's compliance boundary.
- **Model Family**: `claude`. Used for contract extraction (reads a Confluence page) and ticket classification (with a rule fallback).

---

## 2. Permissions & Scopes

- **`read:jira-work`**: Read issue summary, description, and status for subprocessor detection.
- **`write:jira-work`**: Create legal request tickets in JSM / seed projects and issues.
- **`read:jira-user`**: Fetch current user account ID for project lead assignments.
- **`read:page:confluence`**: Read Confluence DPA pages and the published subprocessor list via Confluence REST API v2 (`/wiki/api/v2/pages/{id}`).
- **`write:confluence-content`**: Create and update Confluence pages for DPA contracts and subprocessor lists.
- **`write:confluence-space`**: Create the "Customer contracts" space (`CONTRACTS`).
- **`storage:app`**: Persist DPA contract terms, vendor registry, and ticket decisions using `@forge/kvs`.

---

## 3. Storage Architecture: Key-Value Store (`@forge/kvs`)
- **Package**: `@forge/kvs`
- **Doc verified**: `https://developer.atlassian.com/platform/forge/runtime-reference/forge-kvs/`
- **Access Patterns**:
  - `dpa:{id}`: Customer DPA term with exact clause quote and confirmation state.
  - `dpas:list`: Array of all registered DPA IDs.
  - `vendor:{key}`: Approved vendor record with data categories and hosting regions.
  - `vendors:list`: Array of all approved vendor keys.
  - `decision:{issueKey}`: Ticket classification, detected subprocessor, affected counts, and earliest unlock date.

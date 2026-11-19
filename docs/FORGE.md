# Forge Reference Log: Aviso Previo

This document tracks every Forge manifest module, permission scope, runtime configuration, and API signature used in Aviso Previo, verified against official Atlassian documentation (developer.atlassian.com) on November 19, 2026.

---

## 1. Modules

### `jira:issuePanel`
- **Doc verified**: `https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-panel/`
- **Purpose**: Displays the Aviso Previo subprocessor advisory panel on Jira issue view.
- **Render type**: UI Kit `render: native`
- **Manifest key**:
  ```yaml
  jira:issuePanel:
    - key: aviso-previo-issue-panel
      title: Aviso Previo
      icon: https://developer.atlassian.com/platform/forge/images/icons/issue-panel-icon.svg
      render: native
      resource: main
      resolver:
        function: resolver
  ```

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
- **Manifest key**:
  ```yaml
  jira:workflowValidator:
    - key: aviso-previo-release-validator
      name: Aviso Previo Subprocessor Notice Hold
      description: Blocks deployment transitions before customer DPA notice windows expire.
      function: release-validator-func
  ```

### `llm`
- **Doc verified**: `https://developer.atlassian.com/platform/forge/manifest-reference/modules/llm/`
- **Purpose**: Enables native Atlassian-hosted Claude models (`@forge/llm`) without sending customer contract data outside Atlassian's compliance boundary.
- **Model Family**: `claude` (Anthropic Claude models hosted within Atlassian's perimeter; Sonnet tier for DPA contract extraction, Haiku tier for ticket analysis).
- **Manifest key**:
  ```yaml
  llm:
    - key: aviso-previo-llm
      model:
        - claude
  ```

### `rovo:agent` (Phase 6)
- **Doc verified**: `https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-agent/`
- **Purpose**: Custom AI teammate "Aviso Previo" answering privacy inquiries in Rovo chat.
- **Actions list**: `check-vendor`, `explain-term`, `open-notice-request`.

### `rovo:mcp` (Phase 6)
- **Doc verified**: `https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-mcp/`
- **Purpose**: Exposes Forge actions as tools to external MCP clients (Claude Code, Cursor) via Atlassian's MCP infrastructure.

---

## 2. Permissions & Scopes

- **`read:jira-work`**: Read issue summary, description, and status for subprocessor detection.
- **`write:jira-work`**: Create legal request tickets in JSM / update issues with notice tags.
- **`read:page:confluence`**: Read Confluence DPA pages and the published subprocessor list via Confluence REST API v2 (`/wiki/api/v2/pages/{id}`).
- **`storage:app`**: Persist DPA contract terms, vendor registry, and ticket decisions using `@forge/kvs`.

---

## 3. Storage Architecture: Key-Value Store (`@forge/kvs`)
- **Package**: `@forge/kvs`
- **Doc verified**: `https://developer.atlassian.com/platform/forge/runtime-reference/forge-kvs/`
- **Rationale**: Single-key deterministic lookup by customer ID / issue key / vendor name; query prefix matching with `WhereConditions.beginsWith()`. No relational migration overhead; fast execution during workflow validator checks.

---

## 4. UI Kit (`@forge/react`)
- **Package**: `@forge/react`
- **Doc verified**: `https://developer.atlassian.com/platform/forge/ui-kit/components/`
- **Components used**: `SectionMessage`, `Text`, `Box`, `Stack`, `Heading`, `Badge`, `Lozenge`, `Button`, `Link`, `Table`.


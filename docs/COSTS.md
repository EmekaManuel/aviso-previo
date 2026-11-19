# Token & Cost Tracker: Aviso Previo Forge LLMs

Every call to `@forge/llm` is logged here. Forge LLMs charge token usage directly to the developer Atlassian account.

Model tiers used:
- **Claude Sonnet** (`claude-sonnet-4-5`): DPA Extraction (runs once per customer DPA upon contract import).
- **Claude Haiku** (`claude-haiku-4-5`): Ticket Reading & Vendor Classification (runs on issue create/edit).

---

## Token Consumption Log

| Date | Invocation / Context | Model Tier | Input Tokens | Output Tokens | Total Cost / Notes |
|------|----------------------|------------|--------------|---------------|--------------------|
| 2026-11-19 | Phase 1 Spike Test | Claude Haiku | - | - | Initial connection verification |


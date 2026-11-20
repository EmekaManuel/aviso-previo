# Token & Cost Tracker: Aviso Previo Forge LLMs

Every call to `@forge/llm` is logged here. Forge LLMs charge token usage directly to the developer Atlassian account.

Model tiers used:
- **Claude** (`claude-sonnet-4-5`): contract extraction. One call per "Read with Claude", and 41 per evaluation run. It is not run automatically on import.
- **Claude** (`claude-sonnet-4-5-20250929`): ticket classification. One call the first time a ticket is assessed; later checks use the stored decision.

---

## Token Consumption Log

| Date | Invocation / Context | Model Tier | Input Tokens | Output Tokens | Total Cost / Notes |
|------|----------------------|------------|--------------|---------------|--------------------|
| 2026-11-19 | Phase 1 Spike Test | Claude Haiku | - | - | Initial connection verification |


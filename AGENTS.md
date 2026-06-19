# Carrier Snail

A reminder app where every reminder is delivered by a snail physically crawling
across a real map toward you at genuine snail speed (~0.03 mph). The product
constitution lives in `specs/` (mission.md, tech-stack.md, roadmap.md, prd.md) —
read it before making product or architecture decisions. The **Delivery Floor**
defined in `specs/mission.md` is inviolable law: nothing ever delivers in under
24h / 40% of honest distance-time, at any speed, level, or price.

## Agent skills

### Issue tracker

Issues and PRDs live as **GitHub issues** (via the `gh` CLI); external PRs are **not** a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, verbatim: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

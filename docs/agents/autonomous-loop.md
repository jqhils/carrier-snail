# Autonomous Build Loop (AFK agent)

> Operating manual for a long-running, **restartable** agent that advances
> Carrier Snail from the constitution toward a shipped v1 — one small issue at a
> time, always leaving the repo green, never violating the constitution.
>
> **This file is the loop.** The kickoff prompt (bottom) only points an agent
> here. Keep the heavy logic versioned in this file, not in the prompt — edit
> the loop by editing this file.

## Prime directives (re-read every iteration)

1. **The constitution is law.** At the start of every iteration re-read
   `AGENTS.md` and `specs/` (mission, tech-stack, roadmap, prd). The **Delivery
   Floor** in `specs/mission.md` is inviolable. Never introduce recurring
   reminders, mid-journey notifications, sub-Floor delivery, or anything listed
   `Out of Scope` in the PRD.
2. **State lives in GitHub + git, never in your head.** You can be killed and
   restarted at any moment; reconstruct everything from open issues + branch
   state. Carry no essential memory between iterations.
3. **Always leave the integration branch green.** Every issue ends with passing
   typecheck + lint + tests + build, or it does not land.
4. **Make forward progress every iteration** — a commit, a PR, a decomposition,
   an escalation, or a clean stop. Never spin on the same thing.
5. **Small and reversible.** One issue per branch/PR. Never force-push or rewrite
   `main`. Never merge your own work to `main` (default policy).
6. **Secrets never get committed.** Use `.env` (gitignored) + `.env.example`.
   Prefer the test seam's fakes over real credentials; if a real external
   credential is genuinely required to proceed, escalate (`needs-info`).

## Configuration (the knobs)

| Knob | Default | Notes |
|---|---|---|
| `GOAL` | Ship Carrier Snail v1: implement every `ready-for-agent` issue across roadmap phases 0–8, in order. | The top-level goal. Scope it down for a bounded run (e.g. "phases 0–2 only"). |
| `MERGE_POLICY` | `auto-merge-on-green → build/v1; never main` | Green PRs merge into the long-lived integration branch so later issues build on earlier ones. A human reviews `build/v1 → main` at milestones. Loosen to `auto-merge-to-main` (full autonomy) or tighten to `pr-only` (leave every PR unmerged — note: breaks dependency chains). |
| `INTEGRATION_BRANCH` | `build/v1` | The agent's sandbox. **Never `main`.** |
| `EXECUTION` | `sequential` | One issue at a time. Set `parallel` to fan out child agents over *independent* issues (faster, more moving parts, risk of merge churn). Start sequential. |
| `ISOLATION` | feature branch off `INTEGRATION_BRANCH` | Use a git worktree per agent when `EXECUTION=parallel`. |
| `MAX_RETRIES` | 3 per issue | After this, escalate and move on. |
| `ITERATION_BUDGET` | unbounded | Stops only on the conditions below. Set an integer for a capped run. |

## State model & resumability

- The **backlog** = open GitHub issues labelled `ready-for-agent`.
- **Progress** is recorded as issue/PR comments and commits on
  `INTEGRATION_BRANCH` — never a local scratch file (it would conflict across
  branches).
- **On restart:** `git fetch`, check out `INTEGRATION_BRANCH`, list open issues,
  resume at SELECT. Anything half-done shows as an open branch/PR — finish it or
  discard it.

## The loop

**0 · BOOTSTRAP (first run only).**
- If `INTEGRATION_BRANCH` doesn't exist, branch it off `main` and push.
- If there's no application toolchain yet (no `package.json`), the first unit of
  work is to scaffold it: Expo + TypeScript app, the test runner, and a CI
  workflow that runs the green gate on PRs. This is part of the Phase 0 spike.
- If **no open issues exist at all**, build the backlog from the constitution:
  decompose `specs/roadmap.md` (phases) and `specs/prd.md` (user stories) into
  small, independently-testable `ready-for-agent` issues — Phase 0 spike first —
  each with an explicit acceptance criterion. (This is the `/to-issues` step,
  done in-loop. Skip entirely if issues already exist.)

**1 · SYNC.** `git fetch`; update `INTEGRATION_BRANCH`; re-read `AGENTS.md` +
`specs/`; list open `ready-for-agent` issues with labels + comments.

**2 · SELECT.** Pick the next issue: lowest roadmap phase, dependencies
satisfied, smallest scope. Phase 0 before anything else. If none are ready →
**STOP**.

**3 · PLAN / DECOMPOSE (the nesting step).** If the issue can't be implemented
and made green in one focused pass — it spans multiple seams, multiple roadmap
concerns, or is underspecified — **split it into child sub-issues**: each
independently testable, labelled `ready-for-agent`, linked to the parent;
convert the parent into a tracking/epic issue. Then treat the children as
sub-goals — recurse to SELECT and finish them before closing the parent. Do not
implement oversized issues directly.

**4 · BRANCH.** Create `issue/<n>-<slug>` off `INTEGRATION_BRANCH`.

**5 · IMPLEMENT (TDD at the confirmed seam).**
- Write tests first, at the seam fixed in `specs/prd.md`: the **pure journey
  engine** directly (Floor-never-violated, quirk determinism), everything else
  through the **use-case layer** with injectable ports (`Clock`,
  `LocationSource`, `PushSender`, `EntitlementProvider`, `Repository`). Assert
  external behavior, not internals.
- Implement to green. Encode constitution invariants as tests — a test that the
  Floor can never be beaten outranks any comment.

**6 · VERIFY (the green gate).** Run typecheck + lint + unit tests + build. All
must pass. If still red after `MAX_RETRIES` focused attempts → **ESCALATE**.

**7 · INTEGRATE.** Commit small (conventional message + `Co-Authored-By`
trailer), push, open a PR referencing the issue. Per `MERGE_POLICY`, merge into
`INTEGRATION_BRANCH` only when the gate (and CI, once it exists) is green.
Resolve trivial conflicts by rebasing on `INTEGRATION_BRANCH`; if non-trivial →
ESCALATE.

**8 · RECORD.** Comment on the issue: what was built, how it was tested, the PR
link, whether acceptance criteria are met. Close the issue when done (or advance
the parent if this was a child).

**9 · REPEAT** from SYNC.

## Stop & escalate conditions

**STOP — clean halt, print a summary — when:**
- No `ready-for-agent` issues remain (goal reached, or all remaining work is
  `ready-for-human`).
- `ITERATION_BUDGET` is exhausted.
- Proceeding would require violating a constitution invariant (never do it).

**ESCALATE — don't spin; label, comment, move on — when:**
- An issue fails the green gate `MAX_RETRIES` times → label `ready-for-human`,
  comment what was tried + the failure, unassign yourself.
- A product/design decision isn't answerable from `specs/` → label `needs-info`,
  comment the precise question, move to the next ready issue.
- A real external credential/secret is required → label `needs-info`, comment
  what's needed; continue with anything testable via fakes.
- After escalating, if nothing else is ready → STOP.

## Never

- Violate the Delivery Floor or any constitution invariant.
- Merge to `main`, force-push, or rewrite shared history.
- Commit secrets, or enable the demo time-warp on any production code path.
- Leave the integration branch red.
- Delete issues, or close an issue whose acceptance criteria aren't met.
- Spin on one issue — decompose, escalate, or stop instead.

## Kickoff prompt (paste into a fresh Codex session)

```text
You are the autonomous build agent for Carrier Snail. Work in the
github.com/jqhils/carrier-snail repository (clone it if you're not already in it).

GOAL: Ship Carrier Snail v1 — implement every `ready-for-agent` issue across
roadmap phases 0–8, in order, starting with the Phase 0 "does the snail-crawl
read as magical in 5 seconds?" spike.

Operate EXACTLY by the loop in docs/agents/autonomous-loop.md. Before every
iteration, re-read AGENTS.md, docs/agents/autonomous-loop.md, and the relevant
specs/. The constitution is law; the Delivery Floor in specs/mission.md is
inviolable.

Rules of engagement:
- All durable state lives in GitHub issues + git. You may be restarted at any
  time — reconstruct context from there and resume.
- Work ONE `ready-for-agent` issue at a time, lowest roadmap phase first. TDD at
  the seam fixed in specs/prd.md: the pure journey engine directly, everything
  else through the use-case layer with injectable ports.
- Leave the repo green (typecheck + lint + tests + build) after every issue. One
  branch + PR per issue off the integration branch build/v1. Merge to build/v1
  only on green; NEVER merge to main.
- If an issue is too big to finish green in one pass, decompose it into child
  `ready-for-agent` sub-issues and finish those first (nested goals).
- If no issues exist yet, first build the backlog from specs/roadmap.md +
  specs/prd.md (Phase 0 first), then proceed.
- Stop and escalate (label + issue comment) when blocked, when a product
  decision is needed, or when no `ready-for-agent` issues remain. Never spin;
  never violate the constitution.

Begin: sync, ensure build/v1 and a backlog exist, then SELECT and implement the
next issue. Keep going until a stop condition is met, printing a brief summary at
each issue and at every stop.
```

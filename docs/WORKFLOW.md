```md
# WORKFLOW.md — KiloCode Model Switching Workflow (Complete)

## Purpose

Ship changes with high speed and low cost by switching models intentionally:

- ARCHITECT (Claude) for decisions and plans
- CODE (Qwen) for implementation
- DEBUG (GLM/Claude) for fixing failures

This file is the primary workflow authority.

---

## Roles / Models

- **ARCHITECT = Claude**
  - Best for: architecture, tradeoffs, decomposition, contracts, risk control.
- **CODE = Qwen**
  - Best for: implementing well-defined tasks from PLAN.md.
- **DEBUG = GLM (cheap) or Claude (hard)**
  - Best for: diagnosing failures using logs/tests and applying minimal fixes.

---

## Source of Truth Files

- `WORKFLOW.md` (this file): switching rules + templates.
- `PLAN.md`: checklist + contracts + test plan for the current scope.
- (Optional) `DECISIONS.md`: record important design decisions and why.

---

## Global Rules (Hard)

1. **Always read** `WORKFLOW.md` and `PLAN.md` before writing or editing code.
2. **One checklist item at a time** (from PLAN.md). No parallel feature creep.
3. **CODE must not invent architecture.** If something is unclear → switch to ARCHITECT.
4. **DEBUG must apply the smallest safe fix.** No large refactors unless ARCHITECT approves.
5. After any code change: **run tests** (or provide exact commands) and record results.
6. If inputs are missing (logs, repro steps, acceptance criteria), request only what’s needed,
   but still propose best-effort next steps.

---

## Mandatory Output Header (Always)

At the top of every response, output this block:

PHASE: <INTAKE|PLAN|CODE|TEST|DEBUG|PR>
MODEL: <ARCHITECT|CODE|DEBUG>
CHECKLIST_ITEM: <PLAN.md item id/title or "N/A">
GATE_REASON: <why this phase/model>

---

## Auto Switch Triggers (Hard Rules)

### Switch to DEBUG immediately if ANY appear

Keywords in logs/output/context:

- `test failed`, `FAILED`, `assert`, `expected`, `actual`
- `exception`, `stack trace`, `Unhandled`, `panic`
- `NullReference`, `TypeError`, `cannot read property`
- HTTP/service failures: `500`, `400`, `401`, `403`, `404`, `timeout`, `connection refused`
- Build failures: `compilation error`, `tsc`, `dotnet build failed`, `npm ERR`

### Switch to ARCHITECT immediately if ANY appear

Request contains:

- `design`, `architecture`, `tradeoff`, `choose`, `structure`, `rewrite`
- `multi-tenant`, `security`, `performance`, `scalability`
- `contract`, `OpenAPI`, `DTO`, `schema`, `migration`
- ambiguous requirements or “make it better” without constraints

### Use CODE when

- A checklist item exists in PLAN.md and is implementable.
- Requirements and acceptance criteria are clear.

---

## Files & Naming Conventions

- `PLAN.md` must be in repo root (or `/docs/PLAN.md`, but be consistent).
- Checklist items should be numbered:
  - `[P1]`, `[P2]`, ...
- Each checklist item must include:
  - objective
  - files to touch (if known)
  - acceptance criteria
  - test command(s)

---

# PHASES

## Phase 0 — INTAKE

**Goal:** Decide which phase/model to start with.

**Inputs:**

- Objective statement
- Constraints (time/cost, style rules, stack)
- Done criteria (what “finished” means)

**Required Output (besides header):**

- 3 bullets:
  - Objective
  - Constraints
  - Done criteria
- Proposed next phase + why

**Exit Gate:**

- If unclear requirements / needs design → PLAN (ARCHITECT)
- Else → CODE

---

## Phase 1 — PLAN (ARCHITECT)

**Goal:** Produce/Update `PLAN.md` to make implementation deterministic.

**PLAN.md Template (must follow):**

- Title + date
- Scope:
  - In-scope
  - Out-of-scope
- Current assumptions
- Checklist:
  - [P1] ...
  - [P2] ...
- Contracts (if applicable):
  - DTOs
  - Endpoints
  - Events/Commands
- Risks + mitigations
- Test plan:
  - Commands
  - Expected results
- Rollback plan (how to undo safely)

**Exit Gate:**

- `PLAN.md` checklist items are small, ordered, and testable → switch to CODE

---

## Phase 2 — CODE (Qwen)

**Goal:** Implement exactly one checklist item from `PLAN.md`.

**Rules:**

- Implement **only** the selected checklist item.
- If new requirement emerges → stop and switch to ARCHITECT to update PLAN.md.
- Keep diffs small.

**Required Output (besides header):**

- What was implemented (1–3 lines)
- Files changed (list)
- Next: TEST phase with commands

**Exit Gate:**

- Changes complete → switch to TEST

---

## Phase 3 — TEST (CODE)

**Goal:** Validate with automated checks.

**Required Output (besides header):**

- Exact commands used (copy/pasteable)
- Summary of results:
  - Passed: ...
  - Failed: ... (include key error lines)

**Exit Gate:**

- Any failure → DEBUG
- All green:
  - If more checklist items remain → CODE (next item)
  - Else → PR

---

## Phase 4 — DEBUG (GLM/Claude)

**Goal:** Fix failures with minimal change.

**Model selection:**

- Use **GLM** if:
  - obvious null / mapping / typo / missing mock / assertion mismatch
- Use **Claude** if:
  - concurrency/async issues
  - architectural/data-model mismatch
  - unclear root cause after first pass
  - multi-layer behavior (API + DB + auth + caching)

**Required Inputs (ask if missing):**

- Failing test name(s)
- Error/stack trace
- Steps to reproduce (if runtime)
- Recent changes summary

**Required Output (besides header):**

- Hypothesis (1–2 lines)
- Experiment (what to check/run)
- Fix (what changed)
- Re-run tests + results

**Exit Gate:**

- Tests green → back to CODE (next item) or PR

---

## Phase 5 — PR (Finalize)

**Goal:** Wrap up cleanly.

**Required Output (besides header):**

- Summary (what/why)
- Checklist items completed (P1..Pn)
- Files changed (high level)
- How to verify manually (steps)
- Risk notes + mitigation
- Follow-ups (optional)

---

## Operating Instructions (Copy/Paste Prompt)

Use this at the start of a session:

"Follow WORKFLOW.md strictly. Always print the PHASE HEADER.
Use PLAN.md as the single source of truth. Implement one checklist item at a time.
Switch models based on Auto Switch Triggers and Exit Gates."

---

## Minimal PLAN.md Example (Reference)

# PLAN.md (Example)

- Scope: Add endpoint X, update DTO Y
- Checklist:
  - [P1] Add DTO Y + validation
  - [P2] Add endpoint X + handler
  - [P3] Add unit tests for handler
- Tests:
  - `dotnet test`
  - `npm test`
```

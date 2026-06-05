# Agent GitHub Workflow

How human maintainers and coding agents drive work through GitHub for this repo.
Labels are **workflow communication** — a quick, human-readable badge of *where a
piece of work is*. They are **not** a replacement for CI status checks: the
authoritative signal that code is correct is the GitHub Actions **Verify** run
(`npm run verify`) on the PR's commit SHA. Never mark something "ready to ship"
or "ready to merge" on the strength of a label alone if CI is red.

> If this workflow changes, update **both** this file and `AGENTS.md` in the same change.

---

## Why labels ≠ CI

- **CI verifies a commit SHA.** It runs on pull requests, branch updates, pushes
  to `main`, and manual dispatch — all of which point at concrete code.
- **Labels track state.** They tell a reviewer or agent what to do next, but they
  do not prove anything about the code. An `issue-status:*` change never triggers
  code verification on its own; only commits do.

---

## Labels

### Issue status (exactly one active at a time)

```text
issue-status:ready-to-start
issue-status:in-progress
issue-status:ready-for-review
issue-status:needs-fix
issue-status:ready-to-merge
issue-status:blocked
```

### PR status (exactly one active at a time)

```text
pr-status:needs-review
pr-status:changes-requested
pr-status:ci-failed
pr-status:ready-to-ship
```

When you transition state, **remove the previous label of the same family** so only
one `issue-status:*` (and one `pr-status:*`) is ever active.

### One-time label setup

Create the labels once per repo with the GitHub CLI (idempotent-ish; re-running
errors only on existing labels, which is harmless):

```bash
# Issue status labels
gh label create "issue-status:ready-to-start"  --color 0E8A16 --description "Specced and ready to implement"
gh label create "issue-status:in-progress"     --color FBCA04 --description "An agent/human is actively working on it"
gh label create "issue-status:ready-for-review" --color 1D76DB --description "Implementation complete, awaiting review"
gh label create "issue-status:needs-fix"       --color D93F0B --description "Review or CI found problems"
gh label create "issue-status:ready-to-merge"  --color 0E8A16 --description "Reviewed and CI green; safe to merge"
gh label create "issue-status:blocked"         --color B60205 --description "Blocked on a dependency or decision"

# PR status labels
gh label create "pr-status:needs-review"       --color 1D76DB --description "Open PR awaiting review"
gh label create "pr-status:changes-requested"  --color D93F0B --description "Reviewer requested changes"
gh label create "pr-status:ci-failed"          --color B60205 --description "Verify (CI) is red"
gh label create "pr-status:ready-to-ship"      --color 0E8A16 --description "Reviewed and CI green; safe to merge"
```

---

## Issue workflow

1. **Create the issue** with these sections:
   - **Goal** — the outcome in one or two sentences.
   - **Scope** — what is in scope.
   - **Acceptance criteria** — checklist of what "done" means.
   - **Non-goals** — what is explicitly out of scope.
   - **Test plan** — how the change will be verified.
2. When the issue is specced and ready to implement, apply
   `issue-status:ready-to-start`.
3. When an agent starts work, switch to `issue-status:in-progress`.
4. When implementation is complete, the agent **must**:
   - Run the relevant local checks (see *Local checks*, below).
   - Comment on the issue with: changed files, tests run, and known gaps.
   - Switch to `issue-status:ready-for-review`.
5. If review (or CI) finds missing work or defects, switch to
   `issue-status:needs-fix`.
6. After fixes are completed, switch back to `issue-status:ready-for-review`.
7. After review passes **and** the related PR has green CI, switch to
   `issue-status:ready-to-merge`.

Use `issue-status:blocked` at any time when work cannot proceed; record what it is
blocked on in a comment.

---

## PR workflow

1. **Branch naming**:

   ```text
   issue-<issue-number>-short-slug
   ```

   e.g. `issue-42-export-filename-unicode`.

2. **PR description must include**:
   - `Closes #<issue-number>` (or `Refs #<issue-number>` if it does not fully close it).
   - **Summary** of the change.
   - **Test plan** (commands run, what was checked).
   - **Screenshots** if the UI changed.
   - **Known limitations**.

3. When the PR is opened, apply `pr-status:needs-review`.

4. GitHub Actions runs **Verify** (`npm run verify`) automatically.

5. **If CI fails**:
   - Apply `pr-status:ci-failed`.
   - Move the related issue to `issue-status:needs-fix`.

6. **If the reviewer requests changes**:
   - Apply `pr-status:changes-requested`.
   - Move the related issue to `issue-status:needs-fix`.

7. **After fixes are pushed**:
   - CI reruns automatically (the push is a new commit SHA).
   - Move the PR back to `pr-status:needs-review`.

8. **When review passes and CI is green**:
   - Apply `pr-status:ready-to-ship`.
   - Move the related issue to `issue-status:ready-to-merge`.

Draft PRs are skipped by CI; marking a draft **Ready for review** triggers Verify.

---

## Local checks

These run in **your local terminal** and do **not** consume LLM tokens. Only
pasting full logs back into an AI agent consumes tokens — so when a hook fails,
prefer to read the short summary yourself and paste back only the relevant lines.

### Enable the native git hooks (once per clone)

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit .githooks/pre-push
```

- **`pre-commit`** (read-only gate): `npm run check`, `npm run typecheck`,
  `npm run test`. It never auto-formats; if `check` complains, fix manually with
  `npm run check:fix` and re-commit.
- **`pre-push`**: `npm run verify` — the same authoritative command CI runs.

### The authoritative command

```bash
npm run verify   # Biome check + tsc --noEmit + vitest run + vite build
```

CI and the `pre-push` hook both run exactly this. If `npm run verify` is green
locally, CI should be green too.

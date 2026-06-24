---
name: git-superpowers
description: Advanced Git workflows for product development and documentation projects. Use when Kimi needs to manage project history, create meaningful commits, set up branch strategies, track document iterations, or maintain a clean repository for non-code deliverables like PRDs, research reports, and MVP plans.
---

# Git Superpowers

A lightweight Git workflow skill tailored for product/document projects where the main artifacts are Markdown files, not source code.

## When to use this skill

- Initializing or maintaining the project Git repository.
- Committing PRD, research, planning, or work-log changes with clear messages.
- Creating branches for parallel work streams (e.g., `docs/research`, `prd/v2`).
- Recovering from context loss by reading `WORK_LOG.md` and recent commits.
- Avoiding destructive Git mutations (reset, rebase, push, force-push) unless explicitly asked.

## Workflow

### 1. Check repository state

Always run these commands before making changes:

```bash
git status
git log --oneline -10
```

If a `WORK_LOG.md` exists, read it to understand recent decisions and next steps.

### 2. Commit conventions

Use present-tense, lowercase, prefix-style messages:

| Prefix | Use case |
|---|---|
| `docs:` | PRD, research, plan, README changes |
| `log:` | WORK_LOG updates |
| `chore:` | Config, formatting, scaffolding |
| `feat:` | New capability or section |
| `fix:` | Correction or clarification |

Example: `docs: add target user segment to PRD`

### 3. Branching strategy

Default to `main`. For larger parallel work, create short-lived branches:

```bash
git checkout -b docs/<topic>
```

Merge back with a simple merge commit. Avoid rebasing unless requested.

### 4. Work log recovery

If context is lost, reconstruct state from:

1. `WORK_LOG.md` (manual project snapshot).
2. Recent `git log` and diffs.
3. File timestamps and current directory contents.

## Restrictions

- Do **not** run `git push`, `git reset`, `git rebase`, or force-push without explicit user confirmation.
- Do **not** commit sensitive data (API keys, credentials).
- Keep the working directory clean: stage related changes together.

## Bundled scripts

- `scripts/commit_log.py`: Append a timestamped entry to `WORK_LOG.md` and commit it.

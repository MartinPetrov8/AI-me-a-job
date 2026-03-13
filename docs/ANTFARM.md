# Antfarm Integration — AI Me a Job

How the AI Factory (Antfarm) is used to develop this project.

---

## Setup

**Antfarm CLI:**
```bash
node ~/.openclaw/workspace/antfarm/dist/cli/cli.js
```

**Workflow:** `feature-dev`  
**DB:** `/home/node/.openclaw/antfarm/antfarm.db`

---

## Running a Sprint

```bash
node ~/.openclaw/workspace/antfarm/dist/cli/cli.js workflow run feature-dev "<task spec>"
```

### Required fields in task spec
```
PROJECT: aimeajob
REPO_PATH: /home/node/.openclaw/workspace/projects/ai-job-matcher/repo
BRANCH: main
STACK: Next.js 16, TypeScript, Tailwind CSS
LINTER: npx tsc --noEmit
TEST_CMD: npm run build
DEPLOY_CMD: cd /home/node/.openclaw/workspace/projects/ai-job-matcher/repo && git push origin main && npx vercel --prod --yes --token <TOKEN>
```

### Per story
```
STORY N — <title>
<description>
ACCEPTANCE: bash -c '<shell command that exits 0>'
```

---

## Pipeline Stages

| Stage | Agent | Model | What it does |
|-------|-------|-------|-------------|
| Planner | `feature-dev_planner` | Sonnet 4.5 | Decomposes task into ordered stories |
| Setup | `feature-dev_setup` | Sonnet 4.5 | Reads codebase, establishes baseline |
| Developer | `feature-dev_developer` | Sonnet 4.5 | Implements each story |
| Verifier | `feature-dev_verifier` | Sonnet 4.5 | Runs acceptance criteria checks |
| Reviewer | `feature-dev_reviewer` | Sonnet 4.5 | Code review with checklist |
| UI Reviewer | `feature-dev_uireviewer` | Sonnet 4.5 | Frontend-specific review |
| Gate | `feature-dev_gate` | Sonnet 4.5 | Quality gate before merge |

---

## Checking Status

```bash
# Recent runs
node ~/.openclaw/workspace/antfarm/dist/cli/cli.js workflow runs

# Logs for a specific run
node ~/.openclaw/workspace/antfarm/dist/cli/cli.js logs <run-id>
```

---

## Known Issues & Fixes

### Antfarm cron broken (Mar 2026)
**Error:** `Cannot find module 'discord-api-types/v10.mjs'` in npx cache

**Fix applied (Mar 13, 2026):**
1. Clear npx cache: `rm -rf ~/.npm/_npx`
2. Register cron agents directly via OpenClaw cron tool (10 agents for `feature-dev`)
3. Patch `antfarm/dist/installer/gateway-api.js` — add `jobs.json` direct-read fallback in `checkCronToolAvailable()` and `listCronJobs()`

**Root cause:** OpenClaw runs from Docker image (not git install), so `npm update -g openclaw` cannot update it. The npx cache entry for `openclaw` has a broken `discord-api-types` peer dependency.

### Zombie run blocking new runs
Antfarm keeps one run "running" at a time. If a run gets stuck:
```bash
node -e "
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('/home/node/.openclaw/antfarm/antfarm.db');
db.prepare(\"UPDATE runs SET status='cancelled' WHERE id='<run-id>'\").run();
db.prepare(\"UPDATE steps SET status='cancelled' WHERE run_id='<run-id>' AND status NOT IN ('done','failed','cancelled')\").run();
console.log('Done');
"
```

---

## Sprint History

| Run # | Stories | Status | Notes |
|-------|---------|--------|-------|
| #79 | UI-7, UI-8, UI-9 | Running | Restore page, filter pills, sort controls |
| #73 | (cancelled) | Cancelled | Pre-fix attempt |
| #71, #70 | AI Job Matcher features | Completed | Earlier feature sprints |
| #68 | Sprint 1 (scaffold) | Completed | First successful Antfarm run on this project |

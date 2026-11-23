<!-- Pega aquí las reglas del MCP que te dio tu profesor -->
# MCP-RULES.md — Antigravity Kit: MCP Protocol

> Reglas de activación de los 5 MCPs activos en conjunto con las Skills.
> **Full protocol & flows:** `.agent/skills/mcp-integration/SKILL.md`
> **Research template:** `docs/Deepresearch-notebookLLM.md`
> **Backend reference:** Supabase MCP (29 tools) — use `list-tables`, `execute-sql`, `create-bucket`
> **System map:** `.agent/ARCHITECTURE.md`

---

## 🔴 MANDATORY RULE

**Every new SaaS project MUST start with NotebookLM Deep Research BEFORE any code.**

---

## MCP Activation Table

| MCP | Tools | Phase | Complementary Skills | Agent |
|-----|-------|-------|----------------------|-------|
| **NotebookLM** | 32 | Research & Planning | `brainstorming`, `plan-writing` | `project-planner` |
| **Supabase** | 29 | Backend, DB & Auth | `database-design`, `api-patterns`, `nodejs-best-practices` | `backend-specialist` |
| **Context7** | 2 | Libraries & Docs | `react-best-practices`, `frontend-design` | `frontend-specialist` |
| **TestSprite** | 8 | Audit (every phase) | `webapp-testing`, `testing-patterns` | `test-engineer` |
| **GitHub** | 26 | Versioning & CI | `deployment-procedures`, `clean-code` | `devops-engineer` |

> Magic-MCP has been removed. UI components are built with Context7 + frontend-design skill only.

---

## Phase → MCP Trigger Rules

```
INVESTIGATE  → NotebookLM: research_start(mode:"deep") + brainstorming skill
PLAN         → NotebookLM: notebook_query + plan-writing skill → PRD
REPO SETUP   → GitHub: create_repository + branch strategy (main/develop/feature/*)
BACKEND      → Supabase: list-tables → execute-sql (tables+RLS) → create auth policies
BACKEND TEST → TestSprite: generate_backend_test_plan
FRONTEND     → Context7: resolve-library-id → get-library-docs (react-bits, framer-motion, etc.)
FRONTEND TEST→ TestSprite: generate_frontend_test_plan
FULL AUDIT   → TestSprite: generate_code_and_execute + checklist.py
DEPLOY       → GitHub: PR develop→main → merge (squash) → CI/CD pipeline
```

---

## Supabase Golden Rules

| Rule | Detail |
|------|--------|
| `list-tables` FIRST | Always inspect existing schema before any DB operation |
| RLS mandatory | ALL tables must have Row Level Security enabled |
| `execute-sql` | Use for DDL (CREATE TABLE, ALTER, etc.) and complex queries |
| Auth via Supabase | Use built-in auth — never roll custom auth |
| Storage buckets | Use `create-bucket` for file storage (avatars, media assets) |
| Env vars | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` required |
| Service role | Only on server-side API routes — NEVER expose in client code |

---

## Context7 UI Workflow (Without Magic-MCP)

```
1. Context7: resolve-library-id("react-bits") → get-library-docs (extract component patterns)
2. Context7: resolve-library-id("framer-motion") → get-library-docs (animation APIs)
3. frontend-specialist: apply frontend-design rules + web-design-guidelines + tailwind-patterns
4. TestSprite: frontend audit after each UI milestone
```

> react-bits repo: `https://github.com/DavidHDev/react-bits.git`
> Max 3 Context7 calls per question. Prefer targeted doc queries over broad ones.

---

## GitHub Branching Strategy

```
main        ← production (PR only, never commit directly)
  └─ develop ← integration branch
       ├─ feature/{kebab-name}    ← new features
       ├─ fix/{kebab-name}        ← bug fixes
       └─ docs/{kebab-name}       ← documentation only
```

**Commit format (Conventional Commits):**
`feat|fix|docs|test|refactor|chore|ci: short description in English`

---

## TestSprite Cadence

| After this... | Run this TestSprite action |
|---------------|---------------------------|
| DB tables created (Supabase) | `generate_backend_test_plan` |
| UI components built | `generate_frontend_test_plan` |
| Auth flow integrated | Both backend + frontend plans |
| Before ANY deploy | `generate_code_and_execute` (full codebase) |
| After each PR | `testScope: "diff"` only |

> Check `.testsprite/config.json` first. If missing → run `testsprite_bootstrap`.

---

## SaaS Full Cycle (Quick Reference)

```
[1] NotebookLM: deep research (Deepresearch-notebookLLM.md template)
[2] GitHub: create_repository + develop branch
[3] Supabase: list-tables → execute-sql (schema+RLS) → configure auth + storage
[4] TestSprite: backend test plan
[5] Context7: library docs → frontend-specialist builds UI components
[6] TestSprite: frontend test plan
[7] python .agent/scripts/verify_all.py . --url <URL>
[8] GitHub: PR develop→main → squash merge → CI/CD deploys

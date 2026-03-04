# Project Structure — aimeajob

```
aimeajob/
├── docs/                          # All planning docs (already here)
│   ├── PROBLEM.md
│   ├── USER_STORIES.md
│   ├── SCOPE.md
│   ├── STAKEHOLDER_INTERVIEW.md
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── STRUCTURE.md
│   ├── API.md
│   ├── PLAN.md
│   └── ADR/
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # Root layout (fonts, metadata)
│   │   ├── page.tsx               # Landing page (/)
│   │   ├── upload/
│   │   │   └── page.tsx           # CV upload page
│   │   ├── profile/
│   │   │   └── page.tsx           # Review/edit criteria
│   │   ├── preferences/
│   │   │   └── page.tsx           # Preference questions
│   │   ├── results/
│   │   │   └── page.tsx           # Matched jobs display
│   │   └── globals.css            # Tailwind + global styles
│   │
│   ├── api/                       # API route handlers (Next.js Route Handlers)
│   │   ├── upload/route.ts        # POST: CV upload + extraction
│   │   ├── profile/route.ts       # GET/PUT: profile CRUD
│   │   ├── preferences/route.ts   # PUT: save preferences
│   │   ├── search/route.ts        # POST: execute match
│   │   ├── search/delta/route.ts  # POST: 24h delta search
│   │   ├── save/route.ts          # POST: save via email
│   │   └── restore/route.ts       # POST: restore by email
│   │
│   ├── lib/                       # Shared business logic
│   │   ├── db/
│   │   │   ├── schema.ts          # Drizzle schema (source of truth)
│   │   │   ├── index.ts           # DB connection + client
│   │   │   └── migrations/        # Drizzle migration files
│   │   ├── llm/
│   │   │   ├── extract-cv.ts      # CV → 8 criteria (Task A)
│   │   │   ├── classify-job.ts    # Job posting → 8 criteria (Task B)
│   │   │   ├── prompts.ts         # System prompts for both tasks
│   │   │   └── client.ts          # LLM client (OpenAI SDK, swappable)
│   │   ├── matching/
│   │   │   ├── engine.ts          # SQL matching query builder
│   │   │   └── scoring.ts         # Match score calculation logic
│   │   ├── ingestion/
│   │   │   ├── adzuna.ts          # Adzuna API client
│   │   │   ├── jooble.ts          # Jooble API client
│   │   │   ├── eures.ts           # EURES API client
│   │   │   ├── ingest.ts          # Orchestrator: fetch → classify → upsert
│   │   │   └── types.ts           # Shared types for job API responses
│   │   ├── cv-parser/
│   │   │   └── extract-text.ts    # PDF/DOCX → plain text
│   │   ├── criteria.ts            # Bounded category constants (the 8 criteria enums)
│   │   └── validation.ts          # Zod schemas for all inputs
│   │
│   └── components/                # React components
│       ├── ui/                    # Generic UI (buttons, inputs, cards)
│       ├── cv-upload.tsx          # File upload widget
│       ├── criteria-form.tsx      # 8-criteria review/edit form
│       ├── preferences-form.tsx   # Preference questions form
│       ├── job-card.tsx           # Single job result card
│       ├── match-badge.tsx        # "7/8 match" badge with breakdown
│       └── landing-hero.tsx       # Landing page hero section
│
├── scripts/
│   ├── ingest-jobs.ts             # Job ingestion script (cron entry point)
│   └── seed.ts                    # Seed DB with test data
│
├── tests/
│   ├── lib/
│   │   ├── matching.test.ts       # Matching engine unit tests
│   │   ├── extract-cv.test.ts     # CV extraction tests (mocked LLM)
│   │   └── classify-job.test.ts   # Job classification tests (mocked LLM)
│   ├── api/
│   │   ├── upload.test.ts         # Upload API integration test
│   │   └── search.test.ts         # Search API integration test
│   └── fixtures/
│       ├── sample-cv.pdf          # Test CV for extraction
│       └── sample-jobs.json       # Test job postings
│
├── .env.example                   # Required environment variables
├── .env.local                     # Local dev (gitignored)
├── drizzle.config.ts              # Drizzle ORM configuration
├── next.config.js                 # Next.js config
├── tailwind.config.ts             # Tailwind config
├── tsconfig.json                  # TypeScript config
├── package.json
└── README.md
```

## Key Conventions

- **All business logic in `src/lib/`** — never in API routes or components
- **API routes are thin** — validate input, call lib function, return response
- **Components are presentational** — data fetching happens in page.tsx or API routes
- **One file per concern** — no 500-line files with mixed responsibilities
- **`criteria.ts`** — single source of truth for all bounded category labels
- **All DB access through Drizzle** — no raw SQL in application code (except matching engine which may use raw for performance)

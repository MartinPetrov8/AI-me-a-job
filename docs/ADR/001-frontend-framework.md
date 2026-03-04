# ADR-001: Frontend Framework — Next.js on Vercel

## Decision
Next.js 14+ (App Router) deployed on Vercel.

## Context
Need a mobile-first web app with SSR for the landing page, API routes for backend logic, and auto-scaling for variable traffic.

## Options Considered
1. **Next.js on Vercel** — Full-stack React, SSR, serverless API routes, built-in image optimization
2. **SvelteKit on Vercel** — Lighter bundle, less ecosystem
3. **Static SPA (React/Vite) + separate API** — More infrastructure to manage

## Chosen: Next.js on Vercel

**Why:**
- SSR for landing page SEO (STORY-008)
- API routes co-located = simpler deployment, one repo
- Vercel auto-scales from 0 to thousands (Martin's scalability requirement)
- Largest ecosystem for components, libraries, examples
- TypeScript-first
- Free tier covers MVP traffic easily

## Consequences
- Locked to Vercel's deployment model (acceptable for MVP, can eject later)
- Cold starts on serverless functions (~200ms, acceptable)
- Bundle size larger than SvelteKit (mitigated by code splitting)

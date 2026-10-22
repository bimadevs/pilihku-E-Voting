# PROJECT KNOWLEDGE BASE

**Generated:** 2026-10-21
**Commit:** e75ffa0
**Branch:** main

## OVERVIEW
PilihKu — e-voting for Indonesian school OSIS elections (Ketua & Wakil OSIS). Next.js 16 App Router + React 19 + Tailwind v3 + Supabase (Postgres, Auth, Storage, Realtime). Every page is a client component that talks to Supabase from the browser; the only server-side entry point is `src/middleware.ts`.

## STRUCTURE
```
pilihku-E-Voting/
├── src/
│   ├── app/            # 11 routes: public landing, ballot, admin control room
│   ├── components/     # cross-cutting: BrandLogo, WinnerAnnouncement, ui/
│   ├── hooks/          # useRealtimeVotes - dead stub
│   ├── lib/            # 3 Supabase client factories + cn()
│   ├── types/          # Candidate/Voter/Vote + generated Database
│   └── middleware.ts   # edge guard: admin session + voting window
├── supabase_setup.sql       # DDL + RLS + storage bucket (DB source of truth)
├── supabase_rls_policies.sql # RLS policies only, duplicate set
├── PRODUCT.md               # product brief: users, principles, a11y targets
└── docs/screenshots/        # README screenshot assets
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Public landing page | `src/app/page.tsx` | 1044 lines |
| Ballot (the voting surface) | `src/app/vote/page.tsx` | 993 lines |
| Voter login (NIS) | `src/app/auth/login/page.tsx` | the voter sign-in route |
| Admin control room | `src/app/admin` | dashboard + 6 feature pages; see `src/app/admin/AGENTS.md` |
| Route guard + voting window | `src/middleware.ts` | matcher covers the admin, ballot and login routes |
| Supabase clients | `src/lib/auth.ts`, `src/lib/supabase.ts` | `supabaseClient` (11 files) / `supabase` (1 file) |
| Database schema + RLS | `supabase_setup.sql` | 5 tables, 15 policies, bucket `candidate-photos` |
| Product intent | `PRODUCT.md` | users, principles, accessibility targets |

## CODE MAP
| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| `supabaseClient` | const | `src/lib/auth.ts:9` | 80 refs in 12 files | the client every page uses; `createBrowserClient` from `@supabase/ssr`; 1 definition + 11 importers |
| `supabase` | const | `src/lib/supabase.ts:13` | 3 refs | plain `createClient`; all 3 references are inside the dead hook |
| `cn` | function | `src/lib/utils.ts:4` | 2 importers | `twMerge(clsx(...))`; used only by the two dialog copies, `src/components/ui/dialog.tsx` and `src/app/components/ui/dialog.tsx` |
| `middleware` | function | `src/middleware.ts:5` | — | admin session guard + `voting_schedule` window check |
| `BrandLogo` | component | `src/components/BrandLogo.tsx` | 18 in 5 files | `SIZE_MAP` x `variant` logo switch |
| `WinnerAnnouncement` | component | `src/components/WinnerAnnouncement.tsx` | 4 | countdown + auto-pick winner; falls back to candidate #1 at 0 votes |
| `useRealtimeVotes` | hook | `src/hooks/useRealtimeVotes.ts:4` | 0 importers | stub; the payload merge is never implemented |
| `Database` | interface | `src/types/supabase.ts` | 0 importers | full DB type, never bound to a client |

## CONVENTIONS
- Client-first. `'use client'` is line 1 of 22 files. The server components are exactly `src/app/layout.tsx`, `src/app/loading.tsx`, `src/app/not-found.tsx`, `src/app/sitemap.ts`, `src/app/vote/layout.tsx`, `src/app/components/StructuredData.tsx` and `src/components/BrandLogo.tsx`, and none of them fetch data.
- Supabase env triple with fallback, repeated verbatim in 3 places: `NEXT_PUBLIC_SUPABASE_URL` plus `NEXT_PUBLIC_SUPABASE_ANON_KEY || NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''`.
- Alias `@/*` -> `./src/*`. Client import is always `import { supabaseClient } from '@/lib/auth'`.
- Components use a PascalCase named export and the filename usually matches. Route pages use `export default function <Route>Page()`.
- Props interfaces are named `XProps` (`BrandLogoProps`, `SpinnerProps`, `CandidateCardProps`).
- Supabase columns are snake_case but Indonesian: `ketua_name`, `wakil_class`, `program_kerja`, `has_voted`.
- UI copy and comments are Indonesian; identifiers are English. Tailwind palette is ad-hoc `slate`/`blue`/`emerald`/`amber`/`rose`/`purple` with no brand tokens and no `cva`; `cn()` is used only inside the two dialog copies, `src/components/ui/dialog.tsx` and `src/app/components/ui/dialog.tsx`.
- Quote style is inconsistent: single quotes everywhere except the two dialog copies (`src/components/ui/dialog.tsx` and `src/app/components/ui/dialog.tsx`), which use `"use client"`.

## ANTI-PATTERNS (THIS PROJECT)
- Do NOT create a 4th Supabase client. Three exist: `@/lib/auth` (browser-SSR), `@/lib/supabase` (plain), and one inline in `middleware.ts`. The names are inverted vs intuition: `@/lib/auth` holds the browser query client, `@/lib/supabase` holds the plain one.
- Do NOT trust the `voter` cookie as identity. `src/app/auth/login/page.tsx:37` writes unsigned JSON via `document.cookie` (not httpOnly) and `src/app/vote/page.tsx:184` trusts its `id`.
- Do NOT rely on RLS to stop a double vote. `votes` has no UNIQUE on `voter_id`, and "Publik dapat memperbarui status voting sendiri" is `FOR UPDATE TO public USING (true)`, so any anonymous client can flip `has_voted` on any NIS row.
- Do NOT add another tally implementation. Four exist: `src/app/page.tsx` `fetchVotingStats`, `src/app/admin/results/page.tsx` `fetchVotingResults`, `src/app/admin/settings/page.tsx` `fetchVotingResults`, `src/components/WinnerAnnouncement.tsx` `fetchWinner`.
- Do NOT add a 4th spinner, 3rd dialog, 3rd line parser or 2nd toast helper. They already exist (see NOTES).
- Do NOT import `src/types/index.ts` expecting the domain shape. Pages redeclare `Candidate` and `Voter` locally, and `src/types/index.ts` lacks `ketua_class`, `wakil_class`, `program_kerja` and the photo fields.
- Do NOT write "Next.js 14" anywhere. `package.json` pins `next ^16.3.4`; README.md and the `src/app/layout.tsx` metadata are stale.
- Do NOT add an interactive `<div>`, `<tr>` or `<th>` without `role`, `tabIndex` and `onKeyDown`. There are 5 such click targets today and zero `onKeyDown` in the whole repo.
- Do NOT add a `<button>` without `type=` inside a form. 29 of the 54 `<button>` elements in the repo omit it.

## UNIQUE STYLES
- Per-paslon colour identity. `CANDIDATE_THEMES` in `src/app/vote/page.tsx:68` maps the ballot number to blue/purple/emerald/amber/rose. The colour system exists only on the ballot; the landing page renders the same number as a neutral slate badge.
- Ballot text is one blob parsed at render time. `visi` is free text; `misi` and `program_kerja` are split on newlines by three different parsers.
- Results are recomputed in the browser from raw `votes` rows. There is no view, no RPC and no trigger in either SQL file.
- `settings` rows are never deleted. The admin edits the newest one (`order created_at desc limit 1`).
- Storage bucket is `candidate-photos`; uploads are `public/ketua_<ts>.<ext>` and `public/wakil_<ts>.<ext>` resolved through `getPublicUrl`.
- Footer credit is "Built by BimaDev" linking to instagram.com/biimaa_jo.

## COMMANDS
```bash
npm run dev      # next dev --turbopack
npm run build    # next build (also type-checks)
npm run start    # next start
npm run lint     # eslint .
```
No test script and no test framework exist. `npx tsc --noEmit` type-checks without a full build.

## NOTES
- Host is inconsistent: `src/app/layout.tsx` metadataBase and canonical use `https://pilihku.bimadev.xyz`, `src/app/sitemap.ts` uses `https://pilihku-e-voting.vercel.app`.
- `src/app/layout.tsx` sets `<html lang="en">` on an Indonesian app, and `verification.google` is the placeholder `your-google-verification-code`.
- The Tailwind config declares `darkMode: 'class'` and `--background`/`--foreground`, but no `dark:` class and no CSS variable definition exist, so `bg-background`/`text-foreground` resolve to nothing. `plugins: []` also makes the `animate-in`/`fade-out-0` classes used in `src/components/ui/dialog.tsx` and `src/app/components/ui/dialog.tsx` inert.
- `next.config.ts` allows any https host for `next/image` (`hostname: "**"`).
- README says `cp .env.example .env.local`, but the repo ships `.example.env`.
- README links to a MIT License that the repo does not track.
- Files no live file imports: `src/hooks/useRealtimeVotes.ts`, `src/types/supabase.ts`, `src/components/ui/spinner.tsx`, `src/app/components/loading-spinner.tsx`, `src/app/components/voting-header.tsx`, `src/app/components/confirm-vote-modal.tsx`, `src/app/components/candidates/CandidateCard.tsx`, `src/app/components/admin/ExportResults.tsx`. `src/types/index.ts` is imported only by two of those orphans, so it is dead transitively, not directly.
- `src/app/components/ui/dialog.tsx` and `src/components/ui/dialog.tsx` are near-identical; the overlay is `bg-black/80` in one and `bg-black/50 backdrop-blur-sm` in the other. The two spinners differ only in default size (`w-5 h-5` vs `w-4 h-4`).
- `CustomToast` plus `showNotification` are triplicated across `src/app/admin/candidates/page.tsx`, `src/app/admin/results/page.tsx` and `src/app/admin/voters/page.tsx`.
- `supabase_setup.sql` and `supabase_rls_policies.sql` carry the same policy set; only the setup file also creates the storage policies.
- Generated by init-deep at `--max-depth=3`. The admin feature pages `src/app/admin/{voters,candidates,results,settings,schedule,login}` sit one level deeper and are covered by `src/app/admin/AGENTS.md`.

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

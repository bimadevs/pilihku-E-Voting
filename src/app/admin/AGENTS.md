# src/app/admin — Admin Control Room

**Scored 10 (distinct domain):** the committee side of the product — 7 routes behind a Supabase session.

## OVERVIEW
The admin control room: seven routes behind a Supabase auth session, with `/admin/login` as the only public one.

## STRUCTURE
```
admin/
├── layout.tsx              client  wraps children in <Navbar/>, skips chrome on /admin/login
├── page.tsx                client  /admin            dashboard, 238 LOC
├── login/page.tsx          client  /admin/login      email+password, 306 LOC
├── candidates/page.tsx     client  /admin/candidates CRUD + storage, 766 LOC
├── voters/page.tsx         client  /admin/voters     import + CRUD, 863 LOC
├── results/page.tsx        client  /admin/results    charts + export, 706 LOC
├── schedule/page.tsx       client  /admin/schedule   voting window, 318 LOC
├── settings/page.tsx       client  /admin/settings   announcement + winner, 479 LOC
└── components/navbar.tsx   client  fixed top nav, 6 links, mobile drawer
```

## WHERE TO LOOK
| Task | File | Non-obvious mechanics |
|------|------|------------------------|
| Who may enter | `src/middleware.ts` | Supabase session required; `matcher` includes `/admin/:path*` |
| Sign in | `login/page.tsx` | `signInWithPassword`; on success stores the session in `localStorage.setItem('session', ...)` and pushes `/admin` |
| Manage paslon | `candidates/page.tsx` | uploads `ketua_*.ext` / `wakil_*.ext` to the `candidate-photos` bucket, then `getPublicUrl`; rolls the photos back if the row insert fails |
| Manage DPT | `voters/page.tsx` | XLSX/CSV import, per-row duplicate-NIS check, cascade delete (votes first, then voters), paginated list, template download |
| Read results | `results/page.tsx` | tallies in the browser, 30s `setInterval` polling, 3 Chart.js charts, XLSX export, print view, per-class stats |
| Open/close voting | `schedule/page.tsx` | deactivates the current row, then inserts a new one — the partial unique index `voting_schedule_active_idx` allows only one active row |
| Announce the winner | `settings/page.tsx` | reads the newest `settings` row, writes `announcement_time` and `winner_id`, can reset both to null |
| Sign out | `page.tsx` | `supabaseClient.auth.signOut()` then `router.push('/')` |

## CONVENTIONS
- Session re-checks are per page: `getSession()` in `candidates/page.tsx`, `settings/page.tsx` and `voters/page.tsx` only. The other admin pages trust the middleware guard.
- Every admin page re-implements its own toast. `CustomToast` plus `showNotification` are copied into `candidates`, `results` and `voters` (the `results` copy uses different icons: `Clock` / `TrendingUp`).
- The admin shell is a fixed 64px navbar over a `max-w-7xl` container, so every feature page inherits the `pt-16` offset from `src/app/admin/layout.tsx`.
- Delete order is always child rows first: `votes` before `candidates`, `votes` before `voters`.
- Error text is Indonesian and user-facing; the raw Supabase error is only logged.
- `Navbar` returns `null` on `/admin/login`, and `src/app/admin/layout.tsx` also short-circuits the whole chrome for that path. Two guards for one rule.

## ANTI-PATTERNS
- Do NOT treat a 2xx response as a success. Several pages destructure `error` away, so a failed read looks like empty data. `results/page.tsx:167` and `schedule/page.tsx:118` both drop the error.
- Do NOT rely on the middleware alone for admin authorization. The `Hanya admin yang dapat mengelola ...` policies are `FOR ALL TO authenticated USING (true)`, so any signed-in Supabase user, not just admins, can write every table.
- Do NOT add another confirm-and-delete prompt to the admin area. Two exist: the shared Radix component in `voters/components/ConfirmationDialog.tsx` and the inline plain-div one at `schedule/page.tsx:24`.
- Do NOT save the winner from the results screen. `src/app/admin/settings/page.tsx:82` sets `winnerId` from the live standings, so opening that page overwrites the winner the committee chose.

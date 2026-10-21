# src/app — Route Surface

**Scored 11 (distinct domain):** owns all 11 App Router URLs and the public / voter / admin split.

## OVERVIEW
Eleven App Router URLs in three groups: the public landing page, the voter flow (login, ballot, receipt) and the seven-route admin control room. The layouts and the special files (loading, error, not-found, sitemap) live here too. There are no API route handlers and no Server Actions anywhere in the app.

## STRUCTURE
```
app/
├── layout.tsx        server  root shell: Geist fonts, global metadata, <Toaster/>
├── page.tsx          client  /            landing, 1044 LOC
├── loading.tsx       server  route-level spinner
├── error.tsx         client  error boundary with reset()
├── not-found.tsx     server  404
├── sitemap.ts        server  3 URLs
├── globals.css                Tailwind layers + .animate-blob keyframes
├── auth/login/       client  /auth/login  NIS voter login
├── vote/             client  /vote, /vote/success
├── admin/            client  /admin + 6 sub-routes (see admin/AGENTS.md)
└── components/               app-scoped components (see its own AGENTS.md)
```

## WHERE TO LOOK
| Route | File | What it owns |
|-------|------|--------------|
| `/` | `page.tsx` | hero, 3 guarantee cards, live results section, paslon grid, LUBER block, sticky mobile bar, footer |
| `/vote` | `vote/page.tsx` | ballot: cookie session, candidate feed, confirm sheet, vote write |
| `/vote/success` | `vote/success/page.tsx` | post-vote receipt with a share button |
| `/auth/login` | `auth/login/page.tsx` | NIS lookup, eligibility check, cookie write |
| `/admin` | `admin/page.tsx` | 4 stat cards, quick menu, logout |
| `/admin/*` | `admin/*/page.tsx` | candidates, voters, results, schedule, settings, login |

## CONVENTIONS
- Data is fetched in a `useEffect` with `[]` deps. The fetcher is redefined every render and is deliberately not in the dep array; `react-hooks/exhaustive-deps` is not enabled in `eslint.config.mjs`.
- Loading state is a per-page `useState` boolean plus a Tailwind `animate-spin` div, not a Suspense boundary.
- Toasts come from `react-hot-toast` (`toast.error` / `toast.success`).
- `useSearchParams()` must sit inside a `<Suspense>` boundary. `page.tsx` wraps `SearchParamsHandler` in `<Suspense fallback={null}>` to read the `?message=` query that `middleware.ts` appends when a redirect happens.
- `next/image` is used everywhere and always carries `alt`. There is no raw `<img>` in the repo.
- Page-level state is a group of `useState` hooks declared at the top of the component; there is no reducer, context or store anywhere.

## ANTI-PATTERNS
- Do NOT add a dynamic route segment. The URL space is flat and hand-written: `/`, `/vote`, `/vote/success`, `/auth/login`, `/admin`, and `/admin/<feature>`.
- Do NOT use the `?message=` query as a general-purpose notification channel. It is produced only by the middleware redirect and is read by a single handler component.
- Do NOT fetch in a `useMemo` or during render. Every read in this app happens in an effect or in an event handler.

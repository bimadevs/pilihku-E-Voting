# src/lib — Data Access Layer

**Scored 5 (distinct domain):** the only directory whose symbols are referenced from all over the app. `supabaseClient` alone is imported by 11 files.

## OVERVIEW
Three Supabase client factories and one class-name helper. The directory is tiny, but `src/lib/auth.ts` is the most-imported module in the repo.

## STRUCTURE
```
lib/
├── auth.ts      13 LOC   exports `supabaseClient`  = createBrowserClient() from @supabase/ssr
├── supabase.ts  15 LOC   exports `supabase`        = createClient() from @supabase/supabase-js
└── utils.ts      6 LOC   exports `cn`              = twMerge(clsx(...))
```

## WHERE TO LOOK
| Need | Import | Reality |
|------|--------|---------|
| Any query from a component | `import { supabaseClient } from '@/lib/auth'` | the only client used by pages; keeps the auth cookie |
| Realtime in a hook | `import { supabase } from '@/lib/supabase'` | plain client, no cookie handling; only `useRealtimeVotes` uses it |
| Server-side session | inline `createServerClient` in `src/middleware.ts` | no server helper is exported |
| Conditional Tailwind classes | `import { cn } from '@/lib/utils'` | used by the two dialog copies, `src/components/ui/dialog.tsx` and `src/app/components/ui/dialog.tsx`, and nowhere else |

## CONVENTIONS
- The URL and key are read once at module load. A missing value does not throw: `createClient('', '')` succeeds and only fails on the first query, so a misconfigured deploy shows up as a query error rather than a boot error.
- `supabaseClient` is the SSR-aware browser client from `@supabase/ssr`, so it persists the Supabase auth session across reloads. `supabase` is the bare `supabase-js` client.
- `src/lib/supabase.ts` warns only when `NODE_ENV === 'production'` and `typeof window !== 'undefined'`, so the missing-URL case is completely silent in development.
- `cn` is the shadcn-style `twMerge(clsx(...))` helper, but there is no shadcn CLI setup in this repo and no other shadcn infrastructure.

## ANTI-PATTERNS
- Do NOT import `supabase` from `@/lib/supabase` in a component that needs the session. It is a different client with no cookie handling, so the Supabase auth session is not carried with it.
- The server-side client is constructed inline in `src/middleware.ts` with its own `getAll`/`setAll` cookie adapter. There is no exported server client in this directory to import.
- Do NOT assume the Supabase client is typed. `src/types/supabase.ts` declares a `Database` type, but `createBrowserClient` is called without a type parameter, so every query is untyped.
- Do NOT use `cn` as a default for new class composition — the surrounding files build classes with raw template literals. Match the file you are editing.

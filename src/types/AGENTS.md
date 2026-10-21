# src/types — Type Contracts

**Scored 4 (distinct domain):** the shared type surface. It is also the most misleading directory in the repo: nothing imports either file.

## OVERVIEW
Two type files, and no live file imports either one. The real contracts live next to the components that consume them.

## STRUCTURE
```
types/
├── index.ts      25 LOC   exports Candidate, Voter, Vote
└── supabase.ts  154 LOC   exports Json, Database (5 tables, Row/Insert/Update)
```

## WHERE TO LOOK
| File | What it declares | Status |
|------|-------------------|--------|
| `index.ts` | `Candidate { id, candidate_number, ketua_name, wakil_name, visi, misi, photo_url? }`, `Voter { id, nis, full_name, class, has_voted }`, `Vote { id, voter_id, candidate_id, created_at }` | imported only by two orphan files |
| `supabase.ts` | `Database` with `public.Tables` for `candidates`, `voters`, `votes`, `voting_schedule`, `settings`, each with `Row` / `Insert` / `Update` | never imported, never bound to a client |

## CONVENTIONS
- `supabase.ts` mirrors the SQL column for column and is the most accurate description of the schema in the repo — more accurate than the hand-written model next to it.
- `Vote.created_at` is typed `string` here, matching the ISO text the API returns over the wire, while the `Database` type declares the same column optional.
- `Database` has only a `Tables` key. There are no `Views`, `Functions` or `Enums` entries, which is correct — the schema has none.
- The `Candidate` type is declared three times: `src/types/index.ts:1`, `src/app/page.tsx:34` and `src/app/vote/page.tsx:30`. The two local copies are the ones the app actually uses.

## ANTI-PATTERNS
- The only two importers of `@/types` are `src/app/components/candidates/CandidateCard.tsx` and `src/app/components/confirm-vote-modal.tsx`, and both are orphans themselves. Nothing in the live app reads this directory.
- Do NOT assume `Database` is wired up. `createBrowserClient` in `src/lib/auth.ts` takes no type parameter, so `supabaseClient.from('candidates')` returns `any`-ish rows and typos in column names are not caught.
- Do NOT add a fourth `Candidate` declaration. Extend `src/types/index.ts` to match the local copies, then import it in `src/app/page.tsx` and `src/app/vote/page.tsx`.
- Do NOT edit `supabase.ts` by hand when the SQL changes; it is a hand-maintained mirror of `supabase_setup.sql` and nothing regenerates it.

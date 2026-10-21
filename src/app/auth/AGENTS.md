# src/app/auth — NIS Voter Login

**Scored 2 (distinct domain):** the voter identity boundary. It has no Supabase Auth session; it mints a cookie.

## OVERVIEW
`/auth/login` is the voter sign-in. It is not Supabase Auth — it looks the voter up in the `voters` table by NIS, checks eligibility, and writes the whole voter row into a `document.cookie` value named `voter`. Admin sign-in is a different system entirely (`src/app/admin/login/page.tsx`).

## STRUCTURE
```
auth/
└── login/page.tsx  client  NIS form, 206 LOC
```

## WHERE TO LOOK
| Concern | Location | Detail |
|---------|----------|--------|
| Lookup | `src/app/auth/login/page.tsx:21-25` | `from('voters').select('*').eq('nis', nis).single()` |
| Eligibility | `src/app/auth/login/page.tsx:32-35` | rejects when `voter.has_voted` is already true |
| Session write | `src/app/auth/login/page.tsx:37` | `document.cookie = \`voter=${JSON.stringify(voter)}; path=/\`` |
| Navigation | `src/app/auth/login/page.tsx:38` | `window.location.href = '/vote'` — a full page load, not a router push |
| Middleware gate | `src/middleware.ts:59-82` | the same route is also blocked unless a `voting_schedule` window is open |

## CONVENTIONS
- The input is `id="nis"` with a matching `htmlFor="nis"` label — one of the few properly paired labels in the repo.
- Error copy is Indonesian and shown inline above the form, not as a toast.
- The NIS lookup uses `.single()`, so a duplicated NIS surfaces as a Supabase error, not an empty result.

## ANTI-PATTERNS
- Do NOT put anything extra in the cookie. The whole voter row is written, `nis` and `full_name` included, so every request to this host carries a PII payload that no route needs.
- Do NOT skip the `has_voted` check here. The ballot page enforces it too, but only after it has already decided the voter is eligible, so the check has to exist at both ends.
- Do NOT add a server action or a Supabase Auth call to this route. The voter side of the product has no Supabase user account by design.
- Do NOT use `router.push('/vote')` here without checking the middleware gate: `/vote` is also gated on an open `voting_schedule`, and a client-side navigation would land on a redirect back to `/?message=...`.

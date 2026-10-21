# src/app/vote — The Ballot

**Scored 4 (distinct domain):** the one screen a voter actually interacts with, plus the post-vote screen.

## OVERVIEW
`/vote` is the ballot and `/vote/success` is the receipt. Together they own the vote write path. The ballot renders four mutually exclusive states.

## STRUCTURE
```
vote/
├── layout.tsx        server  own metadata + <StructuredData/> JSON-LD
├── page.tsx          client  the ballot, 993 LOC
└── success/page.tsx  client  receipt, clears the voter cookie
```

## WHERE TO LOOK
| Concern | Location | Detail |
|---------|----------|--------|
| Session restore | `src/app/vote/page.tsx:174-190` | parses the `voter` cookie out of `document.cookie`, then re-reads the row from `voters` by `id` |
| The 4 render states | `src/app/vote/page.tsx:324, 337, 375` | checking session, no session, already voted, then the active ballot |
| Candidate list | `src/app/vote/page.tsx:210-224` | `candidates` ordered by `candidate_number`, each with a `visi`/`misi`/`program` tab set |
| Per-paslon theme | `src/app/vote/page.tsx:68-140` | `CANDIDATE_THEMES` array, picked by `getCandidateTheme(candidate_number, index)` |
| Text parsing | `src/app/vote/page.tsx:146` `parseLines` | splits `misi` / `program_kerja` on newlines and strips bullet markers |
| Vote write | `src/app/vote/page.tsx:275-312` `handleVote` | INSERT into `votes`, then UPDATE `voters` SET `has_voted = true` |
| Confirm sheet | `src/app/vote/page.tsx:855-990` | Radix `DialogPrimitive` bottom sheet, built inline instead of using `src/components/ui/dialog.tsx` |
| Cookie cleanup | `src/app/vote/success/page.tsx:11` | `document.cookie = 'voter=; path=/; expires=Thu, 01 Jan 1970 ...'` |

## CONVENTIONS
- The sticky bottom dock is the primary action surface: it shows the selected paslon and enables "Lanjutkan Konfirmasi Suara" only after a selection.
- Selecting a paslon is a `div` `onClick` (`src/app/vote/page.tsx:545`) with `cursor-pointer`; the inner buttons call `e.stopPropagation()` so tab switching does not select the card.
- Selection state is `selectedCandidateId` plus a `Record<string, TabType>` of per-candidate active tabs, so switching tabs on one paslon does not reset another.
- Turnout is recomputed from `voters` (`select('has_voted')`), not from the `votes` count.

## ANTI-PATTERNS
- Do NOT let anything other than `handleVote` write to the `votes` table. Inserting the ballot row and flipping `has_voted` is the entire write contract of the ballot.
- Do NOT reorder or merge the two vote writes. The INSERT and the `has_voted` UPDATE are two separate round trips with no transaction, so a failure between them leaves a vote cast but the voter still marked eligible.
- Do NOT extract the confirm sheet into `src/components/ui/dialog.tsx` without checking the styling: the ballot sheet is a bottom sheet on mobile and a centred dialog on `sm:` and up, which the shared dialog does not do.
- Do NOT add a `use client` directive to `layout.tsx`; it is a server component that emits the JSON-LD.

# src/components — Cross-Cutting Components

**Scored 4 (distinct domain):** the brand surface and the winner reveal, both used by more than one route.

## OVERVIEW
Components shared across routes. Two live components and a `ui/` primitive folder. The naming here is the "correct" one for the repo: `src/app/components` and `src/app/<segment>/components` are the other two roots.

## STRUCTURE
```
components/
├── BrandLogo.tsx        server  87 LOC, 5 importers
├── WinnerAnnouncement.tsx client 509 LOC, 1 importer (the landing page)
└── ui/
    ├── dialog.tsx       client  121 LOC, Radix dialog copy B
    └── spinner.tsx      server  28 LOC, ORPHAN
```

## WHERE TO LOOK
| Concern | Location | Detail |
|---------|----------|--------|
| Brand mark | `src/components/BrandLogo.tsx` | `SIZE_MAP` for xs/sm/md/lg/xl, `variant` `squircle` (PNG) vs `mark` (SVG), optional wordmark + "Sistem E-Voting Resmi" tagline |
| Winner's reveal | `src/components/WinnerAnnouncement.tsx` | 1s countdown interval, announcement-status check, winner lookup, confetti modal |
| Dialog primitive | `src/components/ui/dialog.tsx` | Radix + `cn()`; exports `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogTrigger`, `DialogClose` |
| Spinner | `src/components/ui/spinner.tsx` | `SpinnerProps`, default `w-4 h-4`; imported by nothing |

## CONVENTIONS
- `BrandLogo` takes `size`, `variant`, `showText` and `showTagline`; every visual decision is a lookup in `SIZE_MAP`, not inline classes at the call site.
- The logo image is `priority` because it sits in the sticky header on every page.
- `WinnerAnnouncement.tsx` opens with `'use client'` on line 1. It subscribes to Supabase Realtime and drives a 1s countdown, so it must stay a client component.

## ANTI-PATTERNS
- Do NOT import `@/components/ui/dialog` and `@/app/components/ui/dialog` in the same feature. One of the two has to go.
- Do NOT rely on `WinnerAnnouncement` to declare a real winner. At zero votes it falls back to the first candidate (`src/components/WinnerAnnouncement.tsx:175-183`), so it will show a "winner" for an election nobody voted in.
- Do NOT read the vote count from `WinnerAnnouncement`. It tallies `votes` in the browser like the other three copies, and it also re-fetches from inside the 1s countdown interval.
- Do NOT copy `BrandLogo` with a new `SIZE_MAP`; extend the existing one.

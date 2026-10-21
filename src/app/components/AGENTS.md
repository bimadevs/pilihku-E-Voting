# src/app/components — App-Scoped Components

**Scored 4 (distinct domain):** the third component root. Two of its files are live, five are orphans.

## OVERVIEW
Components that belong to the app surface but not to one route. This directory sits next to `src/components` (cross-cutting) and `src/app/<segment>/components` (route-local). Three component roots is the repo's main structural inconsistency.

## STRUCTURE
```
components/
├── CandidateDetailModal.tsx   client  live - used by the landing page
├── StructuredData.tsx          server  live - JSON-LD, used by src/app/vote/layout.tsx
├── confirm-vote-modal.tsx      client  ORPHAN - superseded by the inline sheet in src/app/vote/page.tsx
├── loading-spinner.tsx         -       ORPHAN - 7-line CSS border spinner
├── voting-header.tsx           client  ORPHAN - the header is inline in src/app/page.tsx
├── admin/ExportResults.tsx     client  ORPHAN - results export lives in src/app/admin/results/page.tsx
├── candidates/CandidateCard.tsx client  ORPHAN - the paslon card is inline in src/app/page.tsx
└── ui/dialog.tsx               client  live - used by src/app/admin/candidates/page.tsx
```

## WHERE TO LOOK
| File | Status | Note |
|------|--------|------|
| `src/app/components/CandidateDetailModal.tsx` | live | 347 lines; tab switcher for visi/misi/proker, own `parseLines` at `:75`, Escape handler at `:52-70` |
| `src/app/components/StructuredData.tsx` | live | schema.org `WebApplication` JSON-LD; names "SMK Mudita Singkawang" as the provider |
| `src/app/components/ui/dialog.tsx` | live | Radix dialog copy A; overlay is `bg-black/80` here vs `bg-black/50 backdrop-blur-sm` in `src/components/ui/dialog.tsx` |
| Line parsers | `src/app/components/CandidateDetailModal.tsx:75`, `src/app/vote/page.tsx:146`, `src/app/page.tsx:235` | three parsers that each strip a different marker set: digits-and-dash, dash-and-bullet, and dash-and-bullet plus a 2-line cap |
| the other 5 | orphan | defined, never imported anywhere |

## CONVENTIONS
- The modal owns its own tab state and resets to `visi` when `candidate?.id` changes (`:45-50`).
- `StructuredData` renders a `<script type="application/ld+json">` with `dangerouslySetInnerHTML` and is mounted by `src/app/vote/layout.tsx`.
- Orphan components still compile and still ship in the bundle. They are not tree-shaken because nothing imports them, but they do add maintenance surface.

## ANTI-PATTERNS
- Do NOT import `src/app/components/ui/dialog.tsx` and `src/components/ui/dialog.tsx` interchangeably. Pick one; they are the same component with a different overlay colour.
- Do NOT wire up an orphan file expecting it to be current. `src/app/components/confirm-vote-modal.tsx` uses a plain div overlay while the live ballot sheet is a Radix bottom sheet; `src/app/components/candidates/CandidateCard.tsx` does not match the paslon card rendered inline in `src/app/page.tsx`.
- The orphan files still type-check and still lint clean, so nothing in the build flags them. Grepping for their basename is the only way to notice they are unused.
- Do NOT create a 4th component root. Put a route-private component in `src/app/<segment>/components/`, and anything cross-route in `src/components/`.

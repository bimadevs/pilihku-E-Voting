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

<!-- NEXT-AGENTS-MD-START -->[Next.js Docs Index]|root: ./node_modules/next/dist/docs|STOP. What you remember about Next.js is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command from this file's directory: npx @next/codemod agents-md --output AGENTS.md|01-app:{04-glossary.md}|01-app/01-getting-started:{01-installation.md,02-project-structure.md,03-layouts-and-pages.md,04-linking-and-navigating.md,05-server-and-client-components.md,06-fetching-data.md,07-mutating-data.md,08-caching.md,09-revalidating.md,10-error-handling.md,11-css.md,12-images.md,13-fonts.md,14-metadata-and-og-images.md,15-route-handlers.md,16-proxy.md,17-deploying.md,18-upgrading.md}|01-app/02-guides:{adopting-partial-prefetching.md,ai-agents.md,analytics.md,authentication-with-cache-components.md,authentication.md,backend-for-frontend.md,building.md,caching-without-cache-components.md,cdn-caching.md,ci-build-caching.md,content-security-policy.md,css-in-js.md,custom-server.md,data-security.md,debugging.md,deploying-to-platforms.md,draft-mode.md,environment-variables.md,forms.md,how-revalidation-works.md,incremental-static-regeneration-cache-components.md,incremental-static-regeneration.md,instant-navigation.md,instrumentation.md,interactive-apps.md,internationalization.md,json-ld.md,lazy-loading.md,local-development.md,mcp.md,mdx.md,memory-usage.md,migrating-to-cache-components.md,multi-tenant.md,multi-zones.md,offline-support.md,open-telemetry.md,optimizing-prefetching.md,package-bundling.md,ppr-platform-guide.md,prefetching.md,preserving-ui-state.md,preventing-flash-before-hydration.md,production-checklist.md,progressive-web-apps.md,public-static-pages.md,redirecting.md,rendering-philosophy.md,sass.md,scripts.md,self-hosting.md,server-actions.md,server-and-client-boundary.md,single-page-applications.md,static-exports.md,streaming.md,tailwind-v3-css.md,third-party-libraries.md,videos.md,view-transitions.md}|01-app/02-guides/client-side-data-fetching:{swr.md,tanstack-query.md}|01-app/02-guides/migrating:{app-router-migration.md,from-create-react-app.md,from-vite.md}|01-app/02-guides/testing:{cypress.md,jest.md,playwright.md,vitest.md}|01-app/02-guides/upgrading:{codemods.md,version-14.md,version-15.md,version-16.md}|01-app/03-api-reference:{07-edge.md,08-turbopack.md}|01-app/03-api-reference/01-directives:{use-cache-private.md,use-cache-remote.md,use-cache.md,use-client.md,use-server.md}|01-app/03-api-reference/02-components:{font.md,form.md,image.md,link.md,script.md}|01-app/03-api-reference/03-file-conventions/01-metadata:{app-icons.md,manifest.md,opengraph-image.md,robots.md,sitemap.md}|01-app/03-api-reference/03-file-conventions/02-route-segment-config:{dynamicParams.md,instant.md,maxDuration.md,preferredRegion.md,prefetch.md,runtime.md}|01-app/03-api-reference/03-file-conventions:{default.md,dynamic-routes.md,error.md,forbidden.md,instrumentation-client.md,instrumentation.md,intercepting-routes.md,layout.md,loading.md,mdx-components.md,middleware.md,not-found.md,page.md,parallel-routes.md,proxy.md,public-folder.md,route-groups.md,route.md,src-folder.md,template.md,unauthorized.md}|01-app/03-api-reference/04-functions:{after.md,cacheLife.md,cacheTag.md,catchError.md,connection.md,cookies.md,draft-mode.md,fetch.md,forbidden.md,generate-image-metadata.md,generate-metadata.md,generate-sitemaps.md,generate-static-params.md,generate-viewport.md,headers.md,image-response.md,io.md,next-request.md,next-response.md,next-root-params.md,not-found.md,permanentRedirect.md,redirect.md,refresh.md,revalidatePath.md,revalidateTag.md,unauthorized.md,unstable_cache.md,unstable_noStore.md,unstable_rethrow.md,updateTag.md,use-link-status.md,use-offline.md,use-params.md,use-pathname.md,use-report-web-vitals.md,use-router.md,use-search-params.md,use-selected-layout-segment.md,use-selected-layout-segments.md,userAgent.md}|01-app/03-api-reference/05-config/01-next-config-js:{adapterPath.md,allowedDevOrigins.md,appDir.md,assetPrefix.md,authInterrupts.md,basePath.md,cacheComponents.md,cacheHandlers.md,cacheLife.md,cacheMaxMemorySize.md,compress.md,crossOrigin.md,cssChunking.md,deploymentId.md,devIndicators.md,distDir.md,env.md,expireTime.md,exportPathMap.md,generateBuildId.md,generateEtags.md,headers.md,htmlLimitedBots.md,httpAgentOptions.md,images.md,incrementalCacheHandlerPath.md,inlineCss.md,instrumentationClientInject.md,logging.md,mdxRs.md,onDemandEntries.md,optimizePackageImports.md,output.md,outputHashSalt.md,pageExtensions.md,partialPrefetching.md,poweredByHeader.md,prefetchInlining.md,productionBrowserSourceMaps.md,proxyClientMaxBodySize.md,reactCompiler.md,reactMaxHeadersLength.md,reactStrictMode.md,redirects.md,rewrites.md,sassOptions.md,serverActions.md,serverComponentsHmrCache.md,serverExternalPackages.md,staleTimes.md,staticGeneration.md,supportsImmutableAssets.md,taint.md,trailingSlash.md,transpilePackages.md,turbopack.md,turbopackChunking.md,turbopackFileSystemCache.md,turbopackIgnoreIssue.md,turbopackLocalPostcssConfig.md,turbopackMemoryEviction.md,turbopackRustReactCompiler.md,typedRoutes.md,typescript.md,urlImports.md,useLightningcss.md,useOffline.md,useTypeScriptCli.md,webVitalsAttribution.md,webpack.md}|01-app/03-api-reference/05-config:{02-typescript.md,03-eslint.md}|01-app/03-api-reference/06-cli:{create-next-app.md,next.md}|01-app/03-api-reference/07-adapters:{01-configuration.md,02-creating-an-adapter.md,03-api-reference.md,04-testing-adapters.md,05-routing-with-next-routing.md,06-implementing-ppr-in-an-adapter.md,07-runtime-integration.md,08-invoking-entrypoints.md,09-output-types.md,10-routing-information.md,11-use-cases.md,12-immutable-static-assets.md}|02-pages/01-getting-started:{01-installation.md,02-project-structure.md,04-images.md,05-fonts.md,06-css.md,11-deploying.md}|02-pages/02-guides:{analytics.md,authentication.md,babel.md,ci-build-caching.md,content-security-policy.md,css-in-js.md,custom-server.md,debugging.md,draft-mode.md,environment-variables.md,forms.md,incremental-static-regeneration.md,instrumentation.md,internationalization.md,lazy-loading.md,mdx.md,multi-zones.md,open-telemetry.md,package-bundling.md,post-css.md,preview-mode.md,production-checklist.md,redirecting.md,sass.md,scripts.md,self-hosting.md,static-exports.md,tailwind-v3-css.md,third-party-libraries.md}|02-pages/02-guides/migrating:{app-router-migration.md,from-create-react-app.md,from-vite.md}|02-pages/02-guides/testing:{cypress.md,jest.md,playwright.md,vitest.md}|02-pages/02-guides/upgrading:{codemods.md,version-10.md,version-11.md,version-12.md,version-13.md,version-14.md,version-9.md}|02-pages/03-building-your-application/01-routing:{01-pages-and-layouts.md,02-dynamic-routes.md,03-linking-and-navigating.md,05-custom-app.md,06-custom-document.md,07-api-routes.md,08-custom-error.md}|02-pages/03-building-your-application/02-rendering:{01-server-side-rendering.md,02-static-site-generation.md,04-automatic-static-optimization.md,05-client-side-rendering.md}|02-pages/03-building-your-application/03-data-fetching:{01-get-static-props.md,02-get-static-paths.md,03-get-server-side-props.md,05-client-side.md}|02-pages/03-building-your-application/06-configuring:{12-error-handling.md}|02-pages/04-api-reference:{06-edge.md,08-turbopack.md}|02-pages/04-api-reference/01-components:{font.md,form.md,head.md,image-legacy.md,image.md,link.md,script.md}|02-pages/04-api-reference/02-file-conventions:{instrumentation.md,proxy.md,public-folder.md,src-folder.md}|02-pages/04-api-reference/03-functions:{catchError.md,get-initial-props.md,get-server-side-props.md,get-static-paths.md,get-static-props.md,next-request.md,next-response.md,use-params.md,use-report-web-vitals.md,use-router.md,use-search-params.md,userAgent.md}|02-pages/04-api-reference/04-config/01-next-config-js:{adapterPath.md,allowedDevOrigins.md,assetPrefix.md,basePath.md,bundlePagesRouterDependencies.md,compress.md,crossOrigin.md,deploymentId.md,devIndicators.md,distDir.md,env.md,exportPathMap.md,generateBuildId.md,generateEtags.md,headers.md,httpAgentOptions.md,images.md,logging.md,onDemandEntries.md,optimizePackageImports.md,output.md,pageExtensions.md,poweredByHeader.md,productionBrowserSourceMaps.md,proxyClientMaxBodySize.md,reactStrictMode.md,redirects.md,rewrites.md,serverExternalPackages.md,trailingSlash.md,transpilePackages.md,turbopack.md,turbopackChunking.md,typescript.md,urlImports.md,useLightningcss.md,useTypeScriptCli.md,webVitalsAttribution.md,webpack.md}|02-pages/04-api-reference/04-config:{01-typescript.md,02-eslint.md}|02-pages/04-api-reference/05-cli:{create-next-app.md,next.md}|02-pages/04-api-reference/06-adapters:{01-configuration.md,02-creating-an-adapter.md,03-api-reference.md,04-testing-adapters.md,05-routing-with-next-routing.md,06-runtime-integration.md,07-invoking-entrypoints.md,08-output-types.md,09-routing-information.md,10-use-cases.md}|03-architecture:{accessibility.md,fast-refresh.md,nextjs-compiler.md,supported-browsers.md}|04-community:{01-contribution-guide.md,02-rspack.md}<!-- NEXT-AGENTS-MD-END -->

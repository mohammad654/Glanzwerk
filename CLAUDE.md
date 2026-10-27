# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

`frontend/` is a working, bilingual, prerendered Angular marketing site. `backend/` is an **empty directory** — nothing is scaffolded. `docs/` does not exist yet.

**Not a git repository.** Run `git init` before the first commit.

Planning and source material at the root:

- `project-architecture.md` — the agreed backend/frontend architecture. Still the spec for `backend/`; its Angular sections are now historical (see "Where the docs are out of date").
- `prompt.md` — the original wishlist `project-architecture.md` was derived from. Over-specifies. Ask before pulling extras from it.
- `cleaning and related services.md` — the service offering the current site copy was built from. Inspiration, not a spec.
- `images/` — the user's original photos. Already imported and renamed into `frontend/public/assets/images/`; the root copy is a leftover.
- `Lebenslauf Firma Glanzwerk .pdf` — company background (German). Business context only.
- `.claude/CLAUDE.md` — the working agreement (pair-programming, baby steps). Separate concern; don't merge it into this file.

## Commands

All from `frontend/`.

```bash
npm start                  # ng serve — GERMAN only, at /, port 4200
npm run start:en           # ng serve — English only, at /
npm run preview            # build both locales + serve at :4300 with / -> /de/

npm run build              # both locales, prerendered, into dist/glanzwerk/browser/
npm test                   # Vitest
npx ng test --watch=false  # single run, for CI or a quick check
npm run sitemap            # regenerate public/sitemap.xml (also runs on prebuild)
npm run icons              # regenerate public/assets/icons/sprite.svg (also runs on prebuild)

npx ng extract-i18n --output-path src/locale --out-file messages.xlf
```

Single test file: `npx ng test --watch=false --include='**/seo.spec.ts'`.

**`npm start` cannot show the language switcher working.** The dev server serves one locale at the root, so there is no `/de/` or `/en/` for the toggle to link to. Use `npm run preview` for anything involving locale URLs, canonicals or hreflang.

## Frontend architecture

Angular 22, **standalone components** (no NgModules), **zoneless**, **Vitest**, 2016 file naming (`app.component.ts`). Bootstrap 5 source SCSS, imported part by part. Icons are an SVG sprite, not a webfont. Swiper web components, loaded on demand. `@angular/ssr` for static prerendering, `@angular/localize` for i18n.

### Content catalogs are the single source of truth

`core/service-catalog.ts`, `core/project-catalog.ts`, `core/blog-catalog.ts` each export a typed array plus a `path()` helper and a `find()` lookup. **Adding one entry to `SERVICES` adds:** a nav dropdown item, a route, a prerendered page, a footer link, a sitemap URL, an `Offer` node in the LocalBusiness JSON-LD, and an option in the contact form's dropdown.

Nothing derived from a catalog may be hand-maintained alongside it. `core/navigation.ts` builds the menu *and* the route table from the same list, so a nav link cannot point at a route that does not exist. `app.routes.ts` keeps a `BUILT_PAGES` list and falls everything else through to `PagePlaceholderComponent`.

### SEO is wired centrally, not per component

`provideSeo()` (in `app.config.ts`) subscribes to router events and calls `SeoService.update(url)`. No page component sets its own metadata, so **a new page cannot ship without it**.

- `seo/page-meta.ts` — path → title, description, share image, OG type, `indexable`. Static pages are a record; detail pages resolve from the catalogs.
- `seo/structured-data.ts` — one JSON-LD `@graph` per page: `LocalBusiness` + `BreadcrumbList` + `Service`/`BlogPosting`.
- `seo.service.ts` — writes title, description, robots, canonical, Open Graph, Twitter, hreflang alternates and the JSON-LD block.

Pages marked `indexable: false` get `noindex`, **no canonical, no hreflang and no JSON-LD**. Unknown paths resolve to noindex because the router's wildcard serves the home page, and a soft duplicate competes with the real one.

### i18n is build-time, not runtime

Two separate builds under `/de/` and `/en/`. There is no runtime JSON and no language state.

- **Source locale is `en`** (the language the code is written in). **Default locale is `de`** (what `/` redirects to). These are deliberately different — do not "fix" it.
- UI chrome uses `i18n` attributes in templates and `$localize` in TS, with explicit `@@ids`. Translations live in `src/locale/messages.de.xlf`.
- The language switcher is a plain `<a href>`, **never `routerLink`** — switching locale is a full page load into a different build. Current locale comes from `LOCALE_ID`, not the URL.
- `core/i18n/locales.ts` holds the locale list and the path maths (`localizedPath` swaps the prefix rather than stacking one).

Workflow for new strings: mark up → `ng extract-i18n` → add the German target to `messages.de.xlf` → build. An id with no translation silently falls back to English.

**Still untranslated:** the three content catalogs. `/de/` pages have German chrome, nav, headings and page titles but English body copy.

### Chrome that is wired once, not per page

- `shared/components/screen-wipe/` is the loading overlay: soap foam a squeegee pushes off the screen. It is prerendered **open**, and the boot wipe is a pure CSS animation, so it clears itself with JavaScript disabled and can never hang. `core/services/route-loading.service.ts` owns all of the timing — the overlay only renders `idle | busy | wiping` — and a navigation under `GRACE_MS` never shows it at all. The splash holds the page for roughly a second, which is LCP you are choosing to spend; `$boot-hold` and `$boot-duration` in its SCSS are the knobs.
- `core/services/scroll.service.ts` is **the only scroll listener in the app** — one `{ passive: true }` handler throttled to one read per frame. The sticky header and the back-to-top button `computed()` off it. Do not add a `(window:scroll)` host binding: Angular registers those non-passive, one per component.
- `shared/components/icon/` renders sprite icons through the selector `i[appIcon]`, so the element stays an `<i>` and every stylesheet rule that sizes or colours an icon through its parent keeps working. The glyph is an `<svg>` of `1em` inheriting `currentColor`.

### Prerendering

`outputMode: "static"` — no Node server, just a static host. 22 routes × 2 locales = **44 prerendered HTML files**. `app.routes.server.ts` supplies `getPrerenderParams` from the catalogs.

Two rules this imposes:

- **Never touch the `document` or `window` globals in code that runs during render.** Inject `DOCUMENT`. An `effect()` runs while prerendering, where no global document exists. This fails as a per-route error while the build still reports success — grep the build output for `ERROR`.
- **Swiper is registered on demand, not in `main.ts`.** `core/swiper-elements.ts` dynamic-imports it the first time a carousel is constructed, so it stays out of the initial bundle and off the prerender path. A component with a `<swiper-container>` has to call `registerSwiperElements()` itself.
- **Swiper carousels carry `ngSkipHydration`.** Swiper clones and reorders slides on init, so prerendered markup can never match and hydration throws NG0500. The slides stay in the HTML for crawlers either way.

### Styles

Tokens in `styles/abstracts/_variables.scss` (measured off the Trice reference template — do not re-guess them) feed `vendors/_bootstrap-overrides.scss`, which sets Bootstrap's variables **before** the Bootstrap imports. The IDE's "Invalid position for @import rule" warning there is expected.

**Bootstrap is imported part by part, not whole.** The site builds its own buttons, cards, forms, nav and overlays, so only `root`, `reboot`, `type`, `containers`, `grid` and the utilities API are pulled in. `$allowed-utilities` in that file is the list of utility groups that exist at all — Bootstrap otherwise generates every group across six breakpoints, which was the largest single block of CSS in the bundle. **A utility outside that list silently does not exist**; add its key before reaching for one.

`styles/main.scss` fixes the layer order: tokens → Bootstrap → base → components. `src/styles.scss` only `@use "main"`.

**Never hardcode a colour or spacing value in a component stylesheet.** Shared card and page-shell styles live in `styles/components/` rather than component files because view encapsulation would otherwise force duplication. `_detail-layout.scss` is the shell behind every catalog detail page: the service, project and post pages all render the `.detail` block and keep only their own extras in their component stylesheet.

### Build pipeline

`prebuild` regenerates `sitemap.xml` from the catalogs and `assets/icons/sprite.svg` from the icons the source uses. `scripts/generate-icon-sprite.mjs` greps `src` for `bi-*` names and pulls those SVGs out of `node_modules/bootstrap-icons`, so **`bi-` stays the icon name prefix even though the font is gone** — it is what makes one grep find every usage. An unknown name fails the build rather than shipping a blank icon. `postbuild` (`scripts/finalize-dist.mjs`) copies `robots.txt` and `sitemap.xml` to the **dist root** — localized builds put them inside `/de/` and `/en/`, where no crawler looks — and writes a `noindex` root page redirecting to `/de/`.

### Hosting contract

The host must provide `301 /` → `/de/` and a per-locale SPA fallback. `scripts/preview.mjs` implements both and is the reference for the production config.

## Backend (not started)

Build it per `project-architecture.md`, with these decisions already settled:

- Port **8081**. `application-dev.yml`, `proxy.conf.json` and `environment.ts` must agree.
- Base package **`com.glanzwerk.api`**, entry point `GlanzwerkApplication.java`. The docs' `com.yourcompany.fieldservices` names are placeholders.
- **Bare DTOs** on success — return `ClientResponse` or `PagedResponse<T>` directly, never a `{ success, message, data }` wrapper. `GlobalExceptionHandler`'s `{ timestamp, status, message, path }` is error-only.
- Controller → Service → Repository, strictly. Controllers never inject repositories and never return JPA entities.
- Schema changes go in Flyway migrations, never `ddl-auto=update`. Add a new `V<n>__*.sql`; don't edit an applied one.
- `/api/v1/...` from day one. §2's unversioned controller tree is not authoritative.
- Stateless JWT via `JwtAuthenticationFilter`; `@PreAuthorize` on controller methods; `BCryptPasswordEncoder`; CORS restricted to the Angular origin.
- The seeded admin account must come from a Flyway seed migration, not hardcoded in Java.
- Files stored by reference (`FileAttachment` with `entityType`/`entityId`/`fileUrl`), never blobs. Validate type and size server-side.
- **Content is bilingual.** Any entity whose text reaches the public site needs a locale dimension, or the German pages will fall back to English.

## Domain

Cleaning, moving and property services. The site's offering is **seven service pillars**: home cleaning, commercial cleaning, moving & relocation, snow & outdoor, emergency 24/7, property maintenance, waste removal.

`project-architecture.md`'s `ProjectType` of CLEANING / BUILDING / PAINTING predates this and does not match. The backend model (client → project → quote → invoice → line items, plus employee → project assignment) still stands.

## Where the docs are out of date

`project-architecture.md` describes an Angular app with NgModules, `CoreModule`/`SharedModule`, NgRx and Karma. The real frontend uses standalone components, zoneless change detection, Vitest, and signals. **The code wins.** Its backend sections are still accurate.

Both planning docs treat SSR/SEO as an out-of-scope extra. SEO is now a primary requirement and prerendering is implemented.

## Known gaps

These are deliberate placeholders, not bugs — check before treating any as real:

- `core/company.ts` — phone, email and address are invented, and now also feed the `LocalBusiness` structured data.
- `core/site.ts` — `SITE.origin` is a guess. Canonicals, hreflang and the sitemap all resolve against it.
- `features/about/stats/` — the four figures are invented.
- **No Impressum or Datenschutzerklärung.** Legally required for a German business site. The contact form's consent checkbox deliberately has no link because the page does not exist.
- The hero play button has no video behind it.
- `src/server.ts`, the `serve:ssr:glanzwerk` script and the `express` dependency are dead under `outputMode: "static"`.
- `features/home/projects/` is dead: nothing renders `<app-projects />` since the home page dropped it, and the projects page uses `shared/components/project-card/` instead.

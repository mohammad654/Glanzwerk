# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

`frontend/` is a working, bilingual, prerendered Angular marketing site with an internal dashboard at `/admin`. `backend/` is a working Spring Boot REST API. The two are connected over `/api/v1`. `docs/` does not exist yet.

**Not everything here is committed.** The whole of `backend/` and `scripts/test_api.py` are untracked — only `frontend/` and the root documents are in git. `.gitignore` has a bare `scripts` line, which ignores *every* directory of that name, so a new file under `frontend/scripts/` is silently ignored too (the existing five stay tracked). Check `git status` before assuming a file you edited can be committed.

The backend used to be a half-ported copy of the "codewithmosh" Spring tutorial: it did not compile (`User` imported a `products` package that was never there), `V1` declared foreign keys to `clients` and `employees` tables it never created, and `V2` was a one-line stub. None of it had ever run, so it was rewritten rather than repaired. The old files are not in the repository.

Planning and source material at the root:

- `project-architecture.md` — the agreed backend/frontend architecture. Still the spec for `backend/`; its Angular sections are now historical (see "Where the docs are out of date").
- `prompt.md` — the original wishlist `project-architecture.md` was derived from. Over-specifies. Ask before pulling extras from it.
- `cleaning and related services.md` — an earlier, broader list of services. Superseded as the offering by the SEO guide's thirteen; inspiration, not a spec.
- `Glanzwerk-Growth-and-SEO-Guide.pdf` — **gitignored, present only on the owner's machine.** It is what the German-first rebuild, the URL plan, the service order and the NAP in `core/company.ts` were taken from. Where it is not available, the comments in `core/routes.ts`, `core/service-catalog.ts` and `core/company.ts` are the record of what it said.
- `images/` — the user's original photos. Already imported and renamed into `frontend/public/assets/images/`; the root copy is a leftover.
- `backend/code.md` — the owner's own scratch notes (Maven commands, XAMPP, tutorial links). Not documentation; leave it alone.
- `Lebenslauf Firma Glanzwerk .pdf` — company background (German). Business context only.
- `.claude/CLAUDE.md` — the working agreement (pair-programming, baby steps). Separate concern; don't merge it into this file.

## Commands

Frontend, from `frontend/`:

```bash
npm start                  # ng serve — GERMAN only, at /, port 4200
npm run start:en           # ng serve — English only, at /
npm run preview            # build both locales + serve at :4300 with / -> /de/

npm run build              # both locales, prerendered, into dist/glanzwerk/browser/
npm test                   # Vitest
npx ng test --watch=false  # single run, for CI or a quick check
npm run icons              # regenerate assets/icons/sprite.svg (runs as prebuild)
npm run sitemap            # regenerate sitemap.xml (runs as postbuild, needs a build first)

npm run i18n:extract       # ng extract-i18n into src/locale/messages.xlf
npm run i18n:check         # re-extract, then fail on a missing or stale German target
```

Backend, from `backend/`:

```bash
./mvnw spring-boot:run     # port 8081, dev profile, Flyway migrates on startup
./mvnw test                # unit tests, no database needed
./mvnw clean verify        # full build
./mvnw test -Dtest=SlotCalendarTest   # single test class
```

Swagger UI is on in the dev profile only, at http://localhost:8081/swagger-ui.html;
`application.yaml` turns `springdoc` off by default so production never exposes it.

The frontend calls `/api/v1` on its own origin. `proxy.conf.json` forwards it to 8081
under `ng serve`, and `scripts/preview.mjs` does the same at :4300 — so **the API has
to be running for anything behind a sign-in to work**, and the preview answers 502
with a reminder when it is not.

Single test file: `npx ng test --watch=false --include='**/seo.spec.ts'`.

End to end, from the repository root, with both of the above running:

```bash
python3 scripts/test_api.py        # every endpoint, then a signed-in browser
python3 scripts/test_api.py --no-serve --quiet   # just the summary and an exit code
```

`scripts/test_api.py` walks every controller, books real appointments, drives the
admin workflow to completion and leaves the result in the dev database as demo data.
It then writes an HTML report, serves it at :4399 and opens it: **the report page
signs the browser in**, because a refresh cookie belongs to a host rather than a port,
so a login proxied through :4399 is a session on :4300. Needs `requests`.

A WARN there is the API's own rate limiter, not a defect — registration is five an
hour per caller, sign-in ten per five minutes per caller and twenty *failed* attempts
per fifteen minutes per account — and the limiter is in-memory, so restarting the API
clears it.

**`npm start` cannot show the language switcher working.** The dev server serves one locale at the root, so there is no `/de/` or `/en/` for the toggle to link to. Use `npm run preview` for anything involving locale URLs, canonicals or hreflang.

## Frontend architecture

Angular 22, **standalone components** (no NgModules), **zoneless**, **Vitest**, 2016 file naming (`app.component.ts`). Bootstrap 5 source SCSS, imported part by part. Icons are an SVG sprite, not a webfont. Swiper web components, loaded on demand. `@angular/ssr` for static prerendering, `@angular/localize` for i18n.

### Content catalogs are the single source of truth

`core/service-catalog.ts`, `core/project-catalog.ts`, `core/blog-catalog.ts` each export a typed array plus a `path()` helper and a `find()` lookup. **Adding one entry to `SERVICES` adds:** a nav dropdown item, a route, a prerendered page, a footer link, a sitemap URL, an `Offer` node in the LocalBusiness JSON-LD, and an option in the contact form's dropdown.

Nothing derived from a catalog may be hand-maintained alongside it. `core/routes.ts` holds every non-catalog path as a `{ de, en }` pair; `core/navigation.ts` builds the menu from it and the catalogs, and `app.routes.ts` builds the route table from those same two sources, so a nav link cannot point at a route that does not exist. Pages that are routed but unwritten (`serviceArea`, `jobs`, `imprint`, `privacy`) are listed in `app.routes.ts` as `placeholder()` routes rendering `PagePlaceholderComponent`, and `PLACEHOLDER_ROUTES` in `seo/page-meta.ts` keeps them out of the index. The wildcard redirects to home.

**A service key is a contract across both halves of the stack.** `SERVICES[].key` in the catalog is the same string as `service_offerings.service_key` in the database — it is what lets a stored appointment show the marketing page's own short title (`core/appointment.ts`, `catalogServiceFor`). Adding a service therefore means a catalog entry *and* a Flyway migration; a key in one and not the other degrades to the server's plain `name`.

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

`npm run i18n:check` re-extracts and then fails on a missing target, a stale one (English changed, German did not) or an orphan. It passes today: 734 ids, all translated.

**The content catalogs are translated too, and that is the whole point.** Every title, summary, paragraph, highlight and meta description in `service-catalog.ts`, `project-catalog.ts` and `blog-catalog.ts` is a `$localize` string with an `@@id`, so `/de/` is a German page end to end — body copy included. Slugs are localized as well (`unterhaltsreinigung-dresden` / `maintenance-cleaning-dresden`). Service *names* in the booking and contact pickers come from the API instead (`service_offerings.name_de` / `name_en`, chosen by `Accept-Language`), which is why `core/api/locale.interceptor.ts` states the build's locale on every call rather than letting the browser's preference decide.

### The API layer

`core/api/api.ts` builds every URL from one base (`API_BASE_URL` in `core/build-env.ts`,
defined at build time, relative by default so there is no CORS preflight and no
cross-site cookie). `core/api/api-error.ts` turns any `HttpErrorResponse` into one
message plus a field map, preferring the server's own sentence — "that employee already
has an appointment at that time" is worth showing.

**Never read `resource.value()` directly.** It throws `ResourceValueError` in the error
state, even with a `defaultValue`, so a template that reads it blanks the page exactly
when the API is unreachable. `core/api/resource.ts`'s `valueOr()` is the only way these
pages read a resource. It falls back **only** on the error state: during a *reload* a
resource still holds its previous value, and handing that back is what keeps a table's
rows on screen through a refresh and stops a half-made form choice being discarded the
moment its options are re-fetched.

`core/auth/` holds the session. The access token lives in a private field, never in
`localStorage`, because web storage is readable by any injected script; what survives a
reload is the HttpOnly refresh cookie, and `AuthService.restore()` (single-flighted)
trades it for a new token. `authInterceptor` attaches the token and retries **once**
through a refresh on a 401 — not on a 403, which no new token fixes, and never on the
auth endpoints themselves.

`provideSessionRestore()` (in `app.config.ts`) runs that restore once per page load, so the
public header and the booking page know about a session the guards never run for.

`auth.guards.ts` holds `adminGuard` and `guestGuard` and nothing else — the booking and
account pages are deliberately unguarded, because arriving at "book an appointment" and
being bounced to a login form with no explanation is worse than being asked to sign in on
the page you wanted. It keeps the wrong screen from appearing and sends people to sign in. It
is **not** the access control: that is `@PreAuthorize` and the URL rules on the API,
which is the only side a browser cannot edit.

### The account forms

The four of them — sign in, register, forgotten password, new password — share three rules.

**A server error is written for a field, not for the top of the form.** The API pins a
failure to a field name (`fieldErrors`), and `isFieldInvalid` in `shared/form-field.ts`
marks that input; the alert above the form is only for a failure that belongs to no field,
so one sentence is never in two places.

**The wording is ours, keyed off the field the API named.** The API answers in English only
and this site is German first, so echoing its prose would put an English line on a German
page. `login.unknownEmail`, `login.wrongPassword`, `register.emailTaken` and
`resetPassword.linkInvalid` are translated here; the server's own sentence stays as the
fallback for anything the form does not recognise. The field name is the contract — see
`InvalidCredentialsException` on the server.

**A server error dies the moment the user edits the form.** Each of these components
subscribes to `form.valueChanges` and clears `failure`. Without it a message describing what
was *sent* sits under a box that has since been corrected, and only another submit can
clear it.

`shared/password-rules.ts` is the password policy — the one the API enforces, character for
character, including the plain `[A-Z]` that does not match `Ä`. The rules are predicates
rather than one regex so `shared/components/password-rules/` can tick each one off as it is
met, and `NEW_PASSWORD_VALIDATORS` is built from the same list, so the checklist cannot read
"all good" while the control is still invalid.

**No public form disables its submit button for being incomplete** — these four or the
booking form. A disabled button answers a click with nothing at all, which reads as a broken
page, and it is what made "Request appointment" look dead. Pressing it marks what is missing
and says so. (The admin reschedule dialog still disables its Save, because the slot picker
is the only thing in it and there is nothing else the button could be waiting for.)

### The admin area

`/admin`, guarded by `adminGuard`, with its own dark shell and no site chrome.
`core/admin.ts` is its page registry — sidebar, routes, titles and SEO meta all derive
from it, so a page cannot ship unlinked. Its data layer is `features/admin/data/*`,
one injectable per feature calling `HttpClient`; there are no abstract repositories any
more, because the demo implementation they existed for is gone.

**Every free-text search goes through `Text.likePattern` on the server**, which escapes
the `%` and `_` the user typed as well as wrapping the term in wildcards; the queries
that take it declare `escape '\'`. Unescaped, a search for `%` was the pattern `%%%` and
matched every row in the table, and `a_b` quietly found `axb`. The parameter is bound
either way, so this was never an injection — it was the search box answering a question
nobody asked. The `query` parameter is also length-capped on each endpoint.

Appointments and enquiries filter and page **on the server**. Services, employees and
clients are small enough to filter in the browser, and say so in a comment where they do.

**The status column is the control that changes the status.** It is a `<select>`
offering only the moves `NEXT_STATUSES` allows from the status the row is in, rather
than a row of buttons in the actions column — the column that shows a thing is the
obvious place to edit it, and a finished or cancelled visit now has a way back out.
The whole row is tinted by that status (`.admin-row--info|success|danger`), so a
cancelled or completed visit is recognisable without reading as far as the badge;
`--neutral` is deliberately untinted, because "requested" is the ordinary state and
tinting every row would leave nothing standing out. `createMutation().run` takes an
`onError` so a refused change puts the control back — otherwise the row would claim a
status the server never accepted while the alert above the table says it did not.

Day-and-time pickers go through `shared/components/slot-picker/`, used by both the
public booking form and the dashboard's reschedule dialog. One implementation, because
both must offer exactly what the server will accept; `variant` only swaps class names
for the dark theme.

Writes go through `createMutation()` (`shared/admin-mutation.ts`), which owns the
pending flag, the failure and the double-submit guard, and then `reload()` the resource
rather than patching a row — the server decides what a record looks like.

### Chrome that is wired once, not per page

- `shared/components/screen-wipe/` is the loading overlay: soap foam a squeegee pushes off the screen. It is prerendered **open**, and the boot wipe is a pure CSS animation, so it clears itself with JavaScript disabled and can never hang. `core/services/route-loading.service.ts` owns all of the timing — the overlay only renders `idle | busy | wiping` — and a navigation under `GRACE_MS` never shows it at all. The splash holds the page for roughly a second, which is LCP you are choosing to spend; `$boot-hold` and `$boot-duration` in its SCSS are the knobs.
- `core/services/scroll.service.ts` is **the only scroll listener in the app** — one `{ passive: true }` handler throttled to one read per frame. The sticky header and the back-to-top button `computed()` off it. Do not add a `(window:scroll)` host binding: Angular registers those non-passive, one per component.
- The **skip link** in `app.component.html` is the first focusable thing on every public page, targeting `main#main-content` (which carries `tabindex="-1"`, or focus would not move). Without it a keyboard user walks the top bar, the logo and a thirteen-item menu with dropdowns before reaching the content, on every page.
- `layout/sidebar-modal/` claims `role="dialog"` and `aria-modal="true"`, and therefore owns the three things those attributes promise: focus moves in on open, `Tab` is held inside, and focus returns to whatever opened it. It also carries `inert` while closed — CSS `visibility: hidden` does take it out of the tab order, but only once its 0.4s transition has finished. It is **not** a native `<dialog>` like `AdminDialogComponent`, which gets all of this from the platform: a modal `<dialog>` is `display: none` until `showModal()`, which has nowhere to slide in from, and this panel is in the prerendered HTML of every page rather than created when it opens.
- `shared/components/icon/` renders sprite icons through the selector `i[appIcon]`, so the element stays an `<i>` and every stylesheet rule that sizes or colours an icon through its parent keeps working. The glyph is an `<svg>` of `1em` inheriting `currentColor`.

### Prerendering

`outputMode: "static"` — no Node server, just a static host. 33 routes × 2 locales = **66 prerendered HTML files**, plus one `index.csr.html` per locale for the client-rendered pages (sign in, register, the two password-reset steps, account, booking, admin). `app.routes.server.ts` needs no `getPrerenderParams`: every path in `app.routes.ts` is already concrete (generated from the catalogs), so it only marks the seven signed-in paths `RenderMode.Client` and prerenders the rest. Prerendering them would publish an empty frame — and once published demo client records baked into the dashboard's static HTML.

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

`prebuild` regenerates `assets/icons/sprite.svg` from the icons the source uses. `scripts/generate-icon-sprite.mjs` greps `src` for `bi-*` names and pulls those SVGs out of `node_modules/bootstrap-icons`, so **`bi-` stays the icon name prefix even though the font is gone** — it is what makes one grep find every usage. An unknown name fails the build rather than shipping a blank icon.

`postbuild` is two steps in order, both writing into the **dist root**, because a localized build leaves nothing there and crawlers fetch `/robots.txt` and `/sitemap.xml` from the domain root:

1. `scripts/finalize-dist.mjs` *generates* `robots.txt` (the disallow paths carry `DEPLOY_BASE`, the sitemap line carries `SITE_ORIGIN`), a `noindex` root `index.html` that redirects to `/de/`, the same page as `404.html`, and `.nojekyll`.
2. `scripts/generate-sitemap.mjs` then reads the **prerendered HTML** — not the catalogs — and takes each page's canonical and hreflang set from what `SeoService` actually wrote, so the sitemap cannot disagree with the site. It follows finalize-dist and must run after a build.

Running `npx ng build` directly skips both hooks.

### Hosting contract

The host must provide three things, all of which `scripts/preview.mjs` implements and is the reference for:

1. `301 /` → `/de/`.
2. A per-locale SPA fallback to **`index.csr.html`** (see "Prerendering" for why not `index.html`).
3. A rewrite of `/api/**` to the Spring API. Without it the frontend's relative base URL resolves to the static host and every call 404s. If the API has to live on another origin instead, define `NG_API_BASE_URL` to its absolute URL at build time **and** add that origin to `glanzwerk.cors.allowed-origins`.

### What CI deploys, and what that deployment cannot do

`.github/workflows/deploy.yml` builds on every push and pull request (`npm ci`, `npm test`, `npm run build`) and deploys to GitHub Pages only from `main`. It passes the two deployment values in twice over — `--base-href` plus `--define NG_DEPLOY_BASE`, and `--define NG_SITE_ORIGIN` — because the base href positions the assets while `core/build-env.ts` feeds the language switcher, canonicals, hreflang, `robots.txt` and the sitemap. Both are set in the workflow's `env:` block and point at the repository sub-path today; changing them there moves the whole site to a real domain.

**Pages satisfies none of the three contract points**, so the deployed site is the marketing half only:

- `/` is a meta-refresh page, not a `301`.
- There is no SPA fallback. `finalize-dist.mjs` writes that same redirect as `404.html` — the only hook Pages offers — so a deep link to a client-rendered path lands on `/de/` instead of `index.csr.html`. **Sign-in, registration, account, booking and `/admin` do not work on Pages.**
- There is no `/api/**` rewrite and no API deployed at all.

Judge anything behind a sign-in with `npm run preview` plus the running API, never against the Pages URL.

## Backend

Spring Boot 3.4 / Java 21, base package `com.glanzwerk.api`, entry point `GlanzwerkApplication`. MySQL via Flyway. Run it with `./mvnw spring-boot:run` from `backend/`; `./mvnw test` for the suite.

Conventions to match rather than re-decide: **Lombok** on entities and services, **Java records** for response DTOs and bean-validated classes for request bodies, and mapping written by hand in the feature's service — MapStruct is on the classpath but `users/UserMapper` is the only mapper, so a new feature follows the majority. `spring-dotenv` is what makes `backend/.env` load at startup. The suite is plain JUnit + Mockito unit tests (fourteen classes, 98 tests, no `@SpringBootTest`), so `./mvnw test` needs no database; end-to-end coverage is `scripts/test_api.py` against a running stack.

`backend/.env` holds `JWT_SECRET`, `DB_USERNAME` and `DB_PASSWORD`. It is gitignored; `backend/.env.example` is the template. The dev profile falls back to an obviously-fake JWT secret so the app starts without one — production has no fallback and refuses to boot without the variable.

### Feature packages, not layers

One package per feature (`auth`, `users`, `clients`, `employees`, `services`, `appointments`, `contact`, `dashboard`), each holding its own entity, repository, DTOs, service and controllers. `common/` holds only what every feature needs: the error shape, the four exception types, `PagedResponse`, `RateLimiter` and `Text`.

Each feature also contributes its own `SecurityRules` bean saying what of itself is public. `SecurityConfig` collects them and ends with `anyRequest().authenticated()`, so **an endpoint nobody wrote a rule for is closed, not open**. Admin controllers additionally carry `@PreAuthorize("hasRole('ADMIN')")`: the URL rule protects the path, the annotation protects the method, and a mistake in one does not open the other.

### What the API guarantees

- **Public registration only ever creates a CLIENT.** `RegisterRequest` has no `role` field at all, so the role is not something the server ignores — it is something the client cannot express. Employee accounts come only from `POST /api/v1/admin/employees`, and not even that can mint an ADMIN.
- **An appointment is free, and there is no price anywhere.** Not on the appointment, not on the service, not in the dashboard's figures. An appointment is a visit to come and look at the job; what the work costs is agreed afterwards, outside this system. The overview counts completed visits where it used to total money.
- **Every appointment is one fixed slot** (`glanzwerk.appointments.slot-minutes`, 60). The service says what is being looked at, not how long looking takes — which is what lets one slot grid serve the whole business. `CreateAppointmentRequest` carries no length and no status.
- **An appointment's client is the token's subject.** No endpoint takes a client id from the caller, which is what makes "my appointments" impossible to point at someone else's.
- **`AppointmentStatus` owns the workflow.** The allowed transitions live on the enum. Confirming requires an assigned employee. `COMPLETED` and `CANCELLED` are no longer dead ends: each reopens to `REQUESTED`, so a mis-click is recoverable without deleting a record of a visit that really happened. Reopening leads to the *start* of the workflow rather than back to the previous state, so the job is re-confirmed and re-assigned deliberately — and because it re-enters `blocking()`, `changeStatus` re-runs the double-booking check first: the slot may have been given away while the visit was off the calendar. That check fires only on a move into a blocking status, never on an ordinary step along the workflow, where the appointment already holds the slot and would collide with itself.
- **Employees have no accounts.** There is no EMPLOYEE role: staff are rows in `employees` with no password and no way to sign in. Only an administrator creates them, and not even that can mint an ADMIN.
- **Bare DTOs on success**, `{ timestamp, status, message, path, fieldErrors? }` on error, and nothing else. The catch-all handler logs the cause and returns a fixed sentence, because a JPA message names tables and columns. That shape holds for the requests the *security filters* turn away too, which never reach `GlobalExceptionHandler`: `common/ApiErrorWriter` is what the entry point and the access-denied handler write, so a 401 and a 403 are not bodyless the way they used to be.
- **Four unauthenticated writes**: `POST /api/v1/contact-requests` (bean validation, a honeypot field and a per-address rate limit), registration, sign-in, and the two halves of a password reset. All of them are rate-limited.
- **A failed sign-in says which half was wrong**, as a `fieldErrors` entry: `email` when no account has the address, `password` when it does. This is a deliberate reversal of the usual advice — it makes the endpoint an account-existence oracle — taken because "email or password is incorrect" sends somebody who never finished registering off to retype a password for an account that does not exist. `InvalidCredentialsException` carries the reasoning; two rate limits bound the cost — ten attempts per five minutes per caller, and twenty *failed* attempts per fifteen minutes per account. The second exists because the first does nothing against a password list spread over many addresses; it is charged only on a failure, and it is checked before the attempt, so a stranger can keep an account out of its own sign-in form for up to fifteen minutes. That is the accepted trade, and `AuthController` says so — the alternative is not bounding online guessing at all. The reset route is not limited against that key, so the real owner always has a way back in. A **deactivated** account is deliberately told neither thing and gets the blunt message.
- **Errors that are one field's fault name that field.** `ConflictException` takes an optional field, so a duplicate email comes back as a 409 whose `fieldErrors.email` lets the form mark the input rather than only showing a sentence above it.

### The slot calendar

`SlotCalendar` is the single authority on when an appointment may be. It answers two
questions that **must** agree, which is why they are one class: what to *offer* a
client (`availability`), and whether to *accept* what they submit
(`requireValidSlot`). `SlotCalendarTest` asserts that agreement directly — every time
the calendar offers also passes the check.

`GET /api/v1/availability` returns only days that have at least one free time, so a
closed day, a fully booked day and a day in the past are **absent rather than
disabled**. The picker renders what it is given and cannot offer a date the server
would refuse.

A slot is free when the team still has room for one more visit:

```
free qualified colleagues  >  visits already promised to nobody in particular
```

The right-hand side is the part that is easy to miss. An **unassigned** appointment is
not spare capacity — the office still has to send somebody — so counting only assigned
ones let the same slot be handed to client after client. The repository's query uses a
**left** join for exactly this reason: `a.employee.id` alone is an implicit inner join
and silently drops every unassigned row. It is deliberately conservative: a pending
visit is assumed to need one of *these* candidates even though a colleague qualified
for something else might take it, because turning away a slot we could have filled is
a smaller failure than promising a visit nobody can make.

One query covers a whole month; the grid is then computed in memory. Asking per day
per slot would be hundreds of round trips.

The window itself is configuration, all under `glanzwerk.appointments`: Monday–Saturday,
`07:00`–`20:00` in hour slots (so 07:00 through 19:00 are offered), two hours' minimum
lead time, 365 days ahead at most, and one request may ask about 62 days. A test that
hardcodes a time instead of reading these will break the day the business changes them.

### Tokens

Access token in the response body, short-lived, held in memory by the SPA. Refresh token in an HttpOnly cookie scoped to `/api/v1/auth`. The `type` claim is what stops a week-long refresh token being replayed as a bearer token; `JwtAuthenticationFilter` accepts `ACCESS` only. `cookie-secure` is false in dev because a `Secure` cookie is never returned over plain-HTTP localhost. `auth/RefreshCookies` builds every session cookie, because three endpoints set them and each attribute is load-bearing.

**A token can be revoked, and `users.token_version` is the only way.** Every token carries that value as a `tv` claim and `AuthService.refresh` refuses one that no longer matches the row, so changing or resetting a password ends every other session. `POST /users/me/change-password` therefore answers **200 with a fresh `SessionResponse`** and a new cookie rather than 204: it has just revoked the caller's own token along with everyone else's, so the session doing the changing has to be re-issued in the same response. See V8.

**A second, deliberately readable cookie sits beside the refresh token.** `glanzwerkSession` carries no credential — only the fact that the refresh cookie exists — because the SPA cannot see an HttpOnly cookie and so could not tell "signed out" from "signed in, token lost to a reload". It asked `/auth/refresh` on *every* page load and collected a 401 for almost every visitor. `AuthService.restore()` now reads the hint first and asks only when there is something to restore. Nothing is ever authorised by it; losing it costs a visitor nothing worse than looking signed out. The optimisation switches itself off when `API_BASE_URL` is absolute, because the hint would then be a cross-site cookie the page cannot read.

### Forgotten passwords

`POST /api/v1/auth/forgot-password` issues a one-time link, `POST /api/v1/auth/reset-password`
redeems it. Both are public, because somebody who cannot sign in has no token to present;
what guards them is the link itself plus the rate limits (three link requests an hour per
address *and* per caller, ten redemptions an hour).

Four things make a stolen or guessed link worthless: the token is 256 bits of
`SecureRandom`; only its SHA-256 is stored, so a dump of the table cannot be turned back
into links; redeeming spends the row; and asking for a new link deletes the account's
outstanding ones, so at most one works at a time. It expires after
`glanzwerk.password-reset.token-validity` (an hour).

**Nothing sends email.** `PasswordResetNotifier` is the seam and
`LoggingPasswordResetNotifier` is the only implementation, so the link is written to the
API's log at WARN and read from the console — a credential in a log file, which is why the
line says so every time. Wiring SMTP is one new class and no change to
`PasswordResetService`. The link's address is configuration, `glanzwerk.password-reset.link-template`
(`PASSWORD_RESET_LINK` in production): the API cannot know what origin the site is served from.

Unlike sign-in, everything *after* the token is deliberately vague — invalid, expired and
already-spent links all answer identically, because the difference would tell whoever holds
a guessed token whether they are getting warmer.

### Database

Flyway only — `ddl-auto: validate`, never `update`. Add a new `V<n>__*.sql`; do not edit an applied one.

- `V1__initial_schema.sql` — the whole schema: users, service_offerings, employees, employee_skills, appointments, contact_requests, password_reset_tokens.
- `V2__seed_admin_and_demo_data.sql` — the admin account and the thirteen services (reference data the API cannot start usefully without), then invented staff, clients, appointments and enquiries so the dashboard is not empty. **The admin password is public, in the repository.** Change it at first sign-in. Delete everything below its "DEMO OPERATIONS" banner before production.

There were eight migrations until the two above replaced them. The six that are gone were the history of getting here — `bookings` renamed to `appointments`, every price column dropped, employee accounts turned into plain records, demo dates moved off Sundays, skills widened so every service had schedulable staff, `password_reset_tokens` added, `users.token_version` added — and that history is now simply how `V1` declares the tables. Nothing in the repository had ever been deployed, so there was no applied checksum to protect. **A database created before the flattening cannot be migrated onto it**: the recorded checksums no longer match. Drop the `glanzwerk` schema and let Flyway build it again.

**The database is MariaDB 10.4** (what XAMPP ships), not MySQL. The two migrations
here only create tables and insert rows, so none of it bites today — but the next
`ALTER` will: 10.4 has no `RENAME COLUMN` or `RENAME INDEX` (10.5.2+), so a column is
renamed with `CHANGE` and an index is dropped and re-added, and a check constraint is
dropped with `DROP CONSTRAINT`, not MySQL's `DROP CHECK`. `V1` says so at the top.

Three modelling decisions worth not re-litigating:

- **There is no `clients` table.** A client is a user with `role = CLIENT`. A second table repeating their name and email would be two homes for one fact. Where the work happens lives on the appointment, because the same client books for different addresses.
- **`employees` is not `users`.** Staff have no login, so they are not accounts. Their email is a contact detail, unique only so the same person is not entered twice, and nullable.
- **`employees.status` has only ACTIVE and ON_LEAVE.** "No longer with us" is `employees.is_active`, and the DTO derives the third display state from it. Storing it twice would be two chances to disagree.

Appointment times are `LocalDateTime` — an appointment is a wall-clock commitment that must not move when the clocks change — while audit columns are `Instant`.

**Nothing may convert an appointment time on the way to the database.** This is easy to break and the symptom is subtle, so both halves are deliberate:

- `hibernate.jdbc.time_zone` is **unset**. Setting it to UTC makes Hibernate convert `LocalDateTime` out of the JVM's zone, which a zone-less value has no business being converted from.
- The datasource URL carries `connectionTimeZone=LOCAL&preserveInstants=false`, Connector/J's no-conversion mode. With `serverTimezone=UTC` instead, the driver converted as well.

With either in place an appointment entered as 07:30 was stored as 06:30, a Flyway seed row written as 09:00 was read back as 10:00, and rows either side of the DST boundary were out by different amounts — so the dashboard, the database and raw SQL all disagreed. The consequence of the fix is that the `Instant` audit columns hold the server's local wall time rather than UTC: a deliberate trade, since appointment times are what the business runs on and `created_at` only has to order rows.

The host must run in the same zone as `glanzwerk.appointments.zone` (default `Europe/Berlin`). That property also drives the `Clock` bean, so the lead-time and opening-hours rules are judged against Dresden's clock even on a container defaulting to UTC.

### Still to build

`FileAttachment` (stored by reference, never as a blob, with type and size validated
server-side). Email delivery for contact requests and appointment confirmations:
`EnquiryNotifier` and `PasswordResetNotifier` are the seams, each with only a logging
implementation, so wiring SMTP is one class per seam and no change to `ContactService` or
`PasswordResetService`. **Password reset is unusable in practice until that happens** — the
link only reaches the API's log. An employee-facing view
of their own round, which needs a way to identify staff who have no accounts.

## Domain

Building cleaning and grounds services in Dresden. The offering is **thirteen services**, ordered by commercial priority (recurring contract work first): maintenance, office, school & daycare, medical & care home, public sector, industrial, stairwell, glass & window, deep & post-construction, winter service, gardening, caretaker, home cleaning. The same thirteen keys are seeded in `V2__seed_admin_and_demo_data.sql`.

The site is built for local search: German-first copy, city in the slug and the page title, and `COMPANY.areaServed` as the ring around Dresden. The source for that plan is a `Glanzwerk-Growth-and-SEO-Guide.pdf` that is **gitignored** (it carries the owner's personal details), so the code's comments are the only record of it in the repository.

`project-architecture.md`'s `ProjectType` of CLEANING / BUILDING / PAINTING predates all of this and matches nothing in the code, and neither does its client → project → quote → invoice model — see "Where the docs are out of date".

## Where the docs are out of date

`project-architecture.md` describes an Angular app with NgModules, `CoreModule`/`SharedModule`, NgRx and Karma. The real frontend uses standalone components, zoneless change detection, Vitest, and signals. **The code wins.**

Its backend sections are no longer a specification either. The implemented API is feature-packaged rather than layer-packaged, has no `clients` table, and models staff as records rather than as accounts. Its quote/invoice/line-item model is **not** simply unbuilt — appointments are free and this system quotes for nothing, so money would arrive as a new concept rather than as the missing half of this one. `FileAttachment` (stored by reference, type and size validated server-side) is still a fair description of something worth building.

Both planning docs treat SSR/SEO as an out-of-scope extra. SEO is now a primary requirement and prerendering is implemented.

## Known gaps

These are deliberate placeholders, not bugs — check before treating any as real:

- `core/company.ts` is **real data now, not placeholders** — the owner's name, the Dresden address, the phone number. It is the single NAP record behind every visible contact detail and the `LocalBusiness` structured data, and local search ranks on it matching the Google Business Profile character for character. Do not "tidy" these values. The one open item is the `TODO`: the email is still a free webmail address.
- `core/site.ts` — `SITE.origin` comes from `SITE_ORIGIN` and defaults to `https://www.glanzwerk.de`, **a domain nobody owns yet**; CI overrides it with the Pages URL. Canonicals, hreflang, Open Graph and the sitemap all resolve against it. Note that `SITE.name` and `COMPANY.name` read `Glanzwork` while the repository, npm package and Java base package read `Glanzwerk`; the user-visible spelling is the one in `company.ts`, so ask before "fixing" either side.
- `features/about/stats/` — the four figures are invented.
- **No Impressum or Datenschutzerklärung.** Legally required for a German business site. The contact form's consent checkbox deliberately has no link because the page does not exist.
- The hero play button has no video behind it.
- `backend/src/main/resources/db/migration/V2__*.sql` seeds an admin whose **password is in the repository** (`admin@glanzwerk.de` / `Glanzwerk!2026`), and the service durations in it are placeholders in the same spirit as `core/company.ts`. Change both before anyone outside localhost can reach the API.
- The second half of `V2__seed_admin_and_demo_data.sql`, below its "DEMO OPERATIONS" banner, is invented staff, clients, appointments and enquiries. Delete it before production.
- The three appointments the demo half of V2 seeds keep the lengths they were given before appointments became a fixed slot (150, 240 and 120 minutes), so `durationMinutes` reports those rather than 60. They normalise to one slot the first time anyone edits them. Deliberate: a record of what was actually arranged is better than rewriting history.
- There is **no employee-facing screen**. Staff have no accounts at all now, which is the intended model — but it means there is nowhere for a cleaner to see their own round. A read-only "my week" view would need a new way to identify them.
- Email notification for contact requests is not wired: `LoggingEnquiryNotifier` writes a log line. The record is always saved first, so nothing is lost — but nobody is told.
- **No mail sender at all, so a password reset link never leaves the server.** `LoggingPasswordResetNotifier` writes it to the API's log at WARN and the flow is finished by copying it out of the console. Everything else about the reset works; this is the one piece missing, and it must not be deployed as it stands.
- Sign-in and the reset request both say when no account has an address, which lets a stranger test addresses one rate-limited attempt at a time. It was asked for deliberately (see "What the API guarantees"); the alternative is one message for both cases.
- `RateLimiter` is in-memory and per process. Behind more than one replica the effective limit is the limit times the replica count, and the per-account failed-login budget is correspondingly looser. It sweeps expired windows once every 256 writes rather than on every call, so the map is bounded without making each rate-limited request walk every key — which it did, and which cost most exactly when the endpoint was under attack.
- Spent and expired `password_reset_tokens` rows are swept hourly by `PasswordResetTokenCleanup`. Nothing else in the schema is garbage-collected; the other tables are all business records.
- The slot capacity check is check-then-write, so two simultaneous requests for the same slot can both pass. The window is milliseconds and the cost is one appointment to move by hand; the fix, if it ever matters, is a lock on the slot rather than a bigger check.
- The frontend's initial bundle sits just over the old 500 kB warning budget, now 560 kB: `HttpClient` and the auth session are in the baseline because the route guards need them before any lazy chunk loads. The 1 MB error budget is untouched. `anyComponentStyle` is 8 kB warning / 10 kB error rather than Angular's 4 kB: the admin shell loads the whole dashboard's control vocabulary as two component stylesheets (`admin-layout.component.scss` plus `admin-controls.scss`, ~12.7 kB together) so that it lazy-loads with the admin chunk instead of weighing down every marketing page. Moving it to `styles/components/` would satisfy the 4 kB budget and ship it to every visitor, which is the wrong trade.

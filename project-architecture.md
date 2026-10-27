# Field Services Web App — Full Project Architecture
**Stack:** Angular + Bootstrap + SASS | Dashboard/Admin UI | Spring Boot | MySQL

---

## 0. Why MySQL

For a cleaning/building/painting business you have relational data with real constraints (clients → projects → quotes → invoices → line items, employees → assignments → time logs). MySQL is the best fit here over MongoDB because:
- Strong relational integrity (foreign keys, transactions) for invoicing/financial data
- Native support for `JSONB` if you ever need flexible fields (e.g., custom service attributes) without giving up relational guarantees
- Excellent full-text search (useful for searching clients/projects) without a separate search engine
- Free, mature, works great with Spring Data JPA / Hibernate

MySQL would also work fine — swap the driver/dialect if you prefer it. MongoDB is not recommended here because invoicing/financial workflows benefit heavily from ACID transactions and relational joins.

---

## 1. High-Level Repository Layout

```
field-services-app/
├── frontend/                  # Angular app
├── dashboard/                 # Admin dashboard shell / reusable UI kit feeding the frontend app
├── backend/                   # Spring Boot API
├── docs/                      # API docs, ERD, architecture notes
├── docker-compose.yml         # Local dev: mysql + backend + frontend
├── .github/workflows/         # CI/CD pipelines
└── README.md
```

Keep frontend, dashboard, and backend as separate top-level folders. The dashboard is not a backend layer; it is the admin presentation layer and design system that the Angular frontend can consume or mirror. Never mix Angular and Spring Boot source trees together.

---

## 2. Backend — Spring Boot

```
backend/
├── pom.xml                                  # Maven build (or build.gradle)
├── Dockerfile
├── src/
│   ├── main/
│   │   ├── java/com/yourcompany/fieldservices/
│   │   │   ├── FieldServicesApplication.java        # @SpringBootApplication entry point
│   │   │   │
│   │   │   ├── config/                               # All configuration beans
│   │   │   │   ├── SecurityConfig.java               # Spring Security filter chain, CORS, JWT filter registration
│   │   │   │   ├── JwtConfig.java                    # JWT secret/expiry properties binding
│   │   │   │   ├── SwaggerConfig.java                # OpenAPI/Swagger docs setup
│   │   │   │   ├── WebConfig.java                    # CORS mappings, interceptors, static resource handlers
│   │   │   │   ├── FileStorageConfig.java             # Upload directory / S3 bucket properties
│   │   │   │   ├── AsyncConfig.java                  # Thread pools for async email/report generation
│   │   │   │   └── PersistenceConfig.java            # JPA auditing, transaction manager
│   │   │   │
│   │   │   ├── security/
│   │   │   │   ├── jwt/
│   │   │   │   │   ├── JwtTokenProvider.java         # Generate/validate/parse JWT
│   │   │   │   │   ├── JwtAuthenticationFilter.java  # Intercepts requests, sets SecurityContext
│   │   │   │   │   └── JwtAuthEntryPoint.java        # Handles 401 responses
│   │   │   │   ├── UserPrincipal.java                # Implements UserDetails
│   │   │   │   ├── CustomUserDetailsService.java     # Loads user by username/email
│   │   │   │   └── RoleBasedAccessControl.java       # @PreAuthorize helper annotations/expressions
│   │   │   │
│   │   │   ├── controller/                           # REST endpoints — thin, delegate to services
│   │   │   │   ├── AuthController.java               # /api/auth/login, /register, /refresh
│   │   │   │   ├── ClientController.java             # /api/clients
│   │   │   │   ├── ProjectController.java            # /api/projects
│   │   │   │   ├── EmployeeController.java           # /api/employees
│   │   │   │   ├── ServiceCatalogController.java     # /api/services
│   │   │   │   ├── QuoteController.java              # /api/quotes
│   │   │   │   ├── InvoiceController.java            # /api/invoices
│   │   │   │   ├── DashboardController.java          # /api/dashboard/analytics
│   │   │   │   ├── FileUploadController.java         # /api/files (images, PDFs)
│   │   │   │   └── UserController.java               # /api/users (admin management)
│   │   │   │
│   │   │   ├── service/                              # Business logic layer
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── ClientService.java
│   │   │   │   ├── ProjectService.java
│   │   │   │   ├── EmployeeService.java
│   │   │   │   ├── ServiceCatalogService.java
│   │   │   │   ├── QuoteService.java
│   │   │   │   ├── InvoiceService.java
│   │   │   │   ├── InvoicePdfGeneratorService.java   # Generates PDF invoices/quotes
│   │   │   │   ├── DashboardAnalyticsService.java    # Aggregates KPIs, revenue, project stats
│   │   │   │   ├── FileStorageService.java           # Save/retrieve files (local disk or S3)
│   │   │   │   ├── EmailService.java                 # Send quote/invoice emails, notifications
│   │   │   │   └── impl/                             # Optional: interface + impl split
│   │   │   │       ├── ClientServiceImpl.java
│   │   │   │       └── ...
│   │   │   │
│   │   │   ├── repository/                           # Spring Data JPA repositories
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── ClientRepository.java
│   │   │   │   ├── ProjectRepository.java
│   │   │   │   ├── EmployeeRepository.java
│   │   │   │   ├── ServiceCatalogRepository.java
│   │   │   │   ├── QuoteRepository.java
│   │   │   │   ├── InvoiceRepository.java
│   │   │   │   ├── InvoiceLineItemRepository.java
│   │   │   │   ├── ProjectAssignmentRepository.java
│   │   │   │   └── FileAttachmentRepository.java
│   │   │   │
│   │   │   ├── model/                                # JPA entities (database-mapped)
│   │   │   │   ├── entity/
│   │   │   │   │   ├── BaseEntity.java               # id, createdAt, updatedAt (MappedSuperclass)
│   │   │   │   │   ├── User.java
│   │   │   │   │   ├── Role.java
│   │   │   │   │   ├── Client.java
│   │   │   │   │   ├── Project.java                  # type: CLEANING/BUILDING/PAINTING
│   │   │   │   │   ├── ProjectAssignment.java         # join entity: employee <-> project
│   │   │   │   │   ├── Employee.java
│   │   │   │   │   ├── ServiceCatalogItem.java        # e.g. "Interior painting per m²"
│   │   │   │   │   ├── Quote.java
│   │   │   │   │   ├── QuoteLineItem.java
│   │   │   │   │   ├── Invoice.java
│   │   │   │   │   ├── InvoiceLineItem.java
│   │   │   │   │   └── FileAttachment.java            # polymorphic: linked to project/quote/invoice
│   │   │   │   └── enums/
│   │   │   │       ├── ProjectType.java               # CLEANING, BUILDING, PAINTING
│   │   │   │       ├── ProjectStatus.java             # PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
│   │   │   │       ├── InvoiceStatus.java             # DRAFT, SENT, PAID, OVERDUE
│   │   │   │       ├── QuoteStatus.java                # DRAFT, SENT, ACCEPTED, REJECTED
│   │   │   │       └── UserRole.java                   # ADMIN, MANAGER, EMPLOYEE
│   │   │   │
│   │   │   ├── dto/                                   # Data Transfer Objects — never expose entities directly
│   │   │   │   ├── request/
│   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   ├── ClientRequest.java
│   │   │   │   │   ├── ProjectRequest.java
│   │   │   │   │   ├── QuoteRequest.java
│   │   │   │   │   └── InvoiceRequest.java
│   │   │   │   └── response/
│   │   │   │       ├── AuthResponse.java              # JWT + user info
│   │   │   │       ├── ClientResponse.java
│   │   │   │       ├── ProjectResponse.java
│   │   │   │       ├── DashboardStatsResponse.java
│   │   │   │       └── PagedResponse.java             # generic pagination wrapper
│   │   │   │
│   │   │   ├── mapper/                                # Entity <-> DTO conversion (MapStruct or manual)
│   │   │   │   ├── ClientMapper.java
│   │   │   │   ├── ProjectMapper.java
│   │   │   │   └── InvoiceMapper.java
│   │   │   │
│   │   │   ├── exception/
│   │   │   │   ├── GlobalExceptionHandler.java        # @ControllerAdvice, consistent error JSON
│   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   ├── DuplicateResourceException.java
│   │   │   │   ├── FileStorageException.java
│   │   │   │   └── ErrorResponse.java
│   │   │   │
│   │   │   ├── validation/                            # Custom validators (e.g., valid file type)
│   │   │   │   └── ValidFileType.java
│   │   │   │
│   │   │   └── util/
│   │   │       ├── DateUtils.java
│   │   │       ├── InvoiceNumberGenerator.java
│   │   │       └── FileUtils.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml                       # base config
│   │       ├── application-dev.yml                    # dev profile (local DB, verbose logging)
│   │       ├── application-prod.yml                   # prod profile (env-var driven secrets)
│   │       ├── application-test.yml                   # test profile (H2 or testcontainers)
│   │       ├── db/migration/                          # Flyway migrations (recommended over ddl-auto)
│   │       │   ├── V1__init_schema.sql
│   │       │   ├── V2__add_quotes_invoices.sql
│   │       │   ├── V3__add_file_attachments.sql
│   │       │   └── V4__seed_roles_and_admin.sql
│   │       ├── static/uploads/                        # only if storing locally in dev
│   │       └── templates/
│   │           ├── invoice-template.html               # For PDF generation (Thymeleaf + wkhtmltopdf/OpenPDF)
│   │           └── quote-template.html
│   │
│   └── test/
│       └── java/com/yourcompany/fieldservices/
│           ├── controller/                            # MockMvc integration tests
│           ├── service/                                # Unit tests w/ Mockito
│           └── repository/                             # @DataJpaTest tests
│
└── uploads/                                            # local dev file storage (gitignored) — use S3/Azure Blob in prod
    ├── invoices/
    ├── quotes/
    └── project-images/
```

### Backend notes

**Layering rule:** Controller → Service → Repository. Controllers never touch repositories directly, and never return entities — always DTOs via a mapper. This is what keeps your API stable even as your DB schema evolves.

**Security setup:**
- Stateless JWT auth. `JwtAuthenticationFilter` runs once per request, reads the `Authorization: Bearer <token>` header, and populates `SecurityContextHolder`.
- Role-based endpoints via `@PreAuthorize("hasRole('ADMIN')")` on controller methods — e.g. only ADMIN/MANAGER can delete invoices, employees can only view their own assigned projects.
- Passwords hashed with `BCryptPasswordEncoder`.
- CORS restricted to your Angular app's origin(s) in `SecurityConfig`/`WebConfig`.

**File uploads (invoices, quotes, project images):**
- `FileUploadController` handles `multipart/form-data`, delegates to `FileStorageService`.
- Store only a path/URL reference in `FileAttachment` entity (`entityType`, `entityId`, `fileUrl`, `fileType`) rather than blobs in the DB.
- For dev: store to local `uploads/` folder. For prod: swap `FileStorageService` implementation to use S3/Azure Blob — keep the interface identical so nothing else in the codebase changes.
- Validate file type/size server-side (`ValidFileType` validator) — don't trust the frontend's `accept=""` attribute alone.

**Database migrations:** Use Flyway (`db/migration/`) instead of `hibernate.ddl-auto=update` in any environment beyond local prototyping. It gives you a reviewable, version-controlled schema history — essential once you have real invoice data you can't afford to lose.

---

## 3. Frontend — Angular

```
frontend/
├── angular.json
├── package.json
├── tsconfig.json
├── proxy.conf.json                         # dev proxy: /api -> http://localhost:8080
├── src/
│   ├── main.ts
│   ├── index.html
│   ├── styles.scss                         # global entry point, imports the SASS architecture below
│   │
│   ├── environments/
│   │   ├── environment.ts                  # dev config (apiUrl: http://localhost:8080/api)
│   │   ├── environment.prod.ts             # prod config (apiUrl: https://api.yourcompany.com/api)
│   │   └── environment.staging.ts
│   │
│   ├── assets/
│   │   ├── images/
│   │   │   ├── logo/
│   │   │   ├── icons/
│   │   │   └── placeholders/               # default avatars, no-image-found
│   │   ├── fonts/
│   │   └── i18n/                           # if you add multi-language later (en.json, nl.json)
│   │
│   └── app/
│       ├── app.module.ts                   # root module — imports CoreModule, SharedModule, AppRoutingModule
│       ├── app-routing.module.ts           # top-level routes, lazy-loaded feature modules
│       ├── app.component.ts/html/scss      # root shell (router-outlet)
│       │
│       ├── core/                           # singleton services, guards, interceptors — imported ONCE in AppModule
│       │   ├── core.module.ts
│       │   ├── guards/
│       │   │   ├── auth.guard.ts           # blocks unauthenticated access
│       │   │   ├── role.guard.ts           # role-based route protection (ADMIN/MANAGER/EMPLOYEE)
│       │   │   └── unsaved-changes.guard.ts
│       │   ├── interceptors/
│       │   │   ├── auth.interceptor.ts     # attaches JWT to outgoing requests
│       │   │   ├── error.interceptor.ts    # global error handling, redirects on 401
│       │   │   └── loading.interceptor.ts  # drives a global loading spinner
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── token-storage.service.ts
│       │   │   └── notification.service.ts # toast/snackbar wrapper
│       │   └── models/
│       │       └── api-response.model.ts   # generic wrapper types (PagedResponse<T>, ApiError)
│       │
│       ├── shared/                         # reusable, stateless building blocks — imported by feature modules
│       │   ├── shared.module.ts
│       │   ├── components/
│       │   │   ├── header/
│       │   │   ├── sidebar/
│       │   │   ├── footer/
│       │   │   ├── loading-spinner/
│       │   │   ├── confirm-dialog/
│       │   │   ├── file-upload/            # reusable drag-drop uploader component
│       │   │   ├── pagination/
│       │   │   ├── data-table/             # generic sortable/filterable table
│       │   │   └── status-badge/           # visual badge for ProjectStatus/InvoiceStatus
│       │   ├── pipes/
│       │   │   ├── currency-format.pipe.ts
│       │   │   └── status-label.pipe.ts
│       │   ├── directives/
│       │   │   └── has-role.directive.ts   # *appHasRole="'ADMIN'" — conditionally show UI
│       │   └── validators/
│       │       └── custom-validators.ts
│       │
│       ├── layout/                         # app shell for authenticated area
│       │   ├── dashboard-layout/
│       │   │   ├── dashboard-layout.component.ts/html/scss
│       │   └── auth-layout/                # centered layout for login/register pages
│       │
│       └── features/                       # one folder per business domain, all lazy-loaded
│           ├── auth/
│           │   ├── auth-routing.module.ts
│           │   ├── auth.module.ts
│           │   ├── login/
│           │   ├── register/
│           │   └── forgot-password/
│           │
│           ├── dashboard/
│           │   ├── dashboard-routing.module.ts
│           │   ├── dashboard.module.ts
│           │   ├── dashboard-home/         # KPI cards, charts (revenue, active projects)
│           │   ├── charts/                 # wrapper components around ng2-charts / Chart.js
│           │   └── services/
│           │       └── dashboard.service.ts
│           │
│           ├── clients/
│           │   ├── clients-routing.module.ts
│           │   ├── clients.module.ts
│           │   ├── client-list/
│           │   ├── client-detail/
│           │   ├── client-form/
│           │   ├── services/
│           │   │   └── client.service.ts
│           │   └── models/
│           │       └── client.model.ts
│           │
│           ├── projects/
│           │   ├── projects-routing.module.ts
│           │   ├── projects.module.ts
│           │   ├── project-list/
│           │   ├── project-detail/
│           │   ├── project-form/
│           │   ├── project-gallery/         # image uploads/viewing per project
│           │   ├── project-assignment/      # assign employees to a project
│           │   ├── services/
│           │   │   └── project.service.ts
│           │   └── models/
│           │       └── project.model.ts
│           │
│           ├── employees/
│           │   ├── employees-routing.module.ts
│           │   ├── employees.module.ts
│           │   ├── employee-list/
│           │   ├── employee-detail/
│           │   ├── employee-form/
│           │   ├── services/
│           │   │   └── employee.service.ts
│           │   └── models/
│           │       └── employee.model.ts
│           │
│           ├── services-catalog/            # named to avoid clashing with Angular "services" term
│           │   ├── services-catalog-routing.module.ts
│           │   ├── services-catalog.module.ts
│           │   ├── service-list/
│           │   ├── service-form/
│           │   ├── services/
│           │   │   └── service-catalog.service.ts
│           │   └── models/
│           │       └── service-item.model.ts
│           │
│           ├── quotes/
│           │   ├── quotes-routing.module.ts
│           │   ├── quotes.module.ts
│           │   ├── quote-list/
│           │   ├── quote-detail/
│           │   ├── quote-form/              # builder: add line items from service catalog
│           │   ├── services/
│           │   │   └── quote.service.ts
│           │   └── models/
│           │       └── quote.model.ts
│           │
│           ├── invoices/
│           │   ├── invoices-routing.module.ts
│           │   ├── invoices.module.ts
│           │   ├── invoice-list/
│           │   ├── invoice-detail/
│           │   ├── invoice-form/
│           │   ├── services/
│           │   │   └── invoice.service.ts
│           │   └── models/
│           │       └── invoice.model.ts
│           │
│           └── settings/
│               ├── settings.module.ts
│               ├── user-profile/
│               ├── company-settings/
│               └── user-management/         # admin: manage staff accounts/roles
│
├── styles/                                  # SASS architecture (imported into styles.scss)
│   ├── abstracts/
│   │   ├── _variables.scss                  # brand colors, spacing scale, breakpoints
│   │   ├── _mixins.scss                     # flex helpers, responsive mixins
│   │   └── _functions.scss
│   ├── base/
│   │   ├── _reset.scss
│   │   ├── _typography.scss
│   │   └── _animations.scss
│   ├── components/
│   │   ├── _buttons.scss
│   │   ├── _cards.scss
│   │   ├── _tables.scss
│   │   ├── _forms.scss
│   │   ├── _badges.scss
│   │   └── _modals.scss
│   ├── layout/
│   │   ├── _header.scss
│   │   ├── _sidebar.scss
│   │   ├── _footer.scss
│   │   └── _dashboard-grid.scss
│   ├── pages/
│   │   ├── _login.scss
│   │   └── _dashboard.scss
│   ├── vendors/
│   │   └── _bootstrap-overrides.scss        # override Bootstrap SASS variables BEFORE importing bootstrap
│   └── main.scss                            # imports everything in the right order
│
└── e2e/                                     # Cypress or Playwright end-to-end tests
```

### Optional dashboard package

If you want to keep the dashboard template separate from the Angular app instead of copying files directly into `frontend/`, document it like this:

```
dashboard/
├── html/                                    # static dashboard prototypes / reference layouts
├── assets/
│   ├── scss/
│   │   ├── abstracts/
│   │   │   └── _variables.scss             # single source of truth for colors, spacing, radii, breakpoints
│   │   ├── vendors/
│   │   │   └── _bootstrap-overrides.scss   # Bootstrap variable overrides before importing Bootstrap
│   │   └── main.scss
│   ├── css/
│   └── js/
└── README.md
```

Use this package as the visual source of truth for the admin UI. Then port the dashboard screens into Angular components under `frontend/src/app/layout` and `frontend/src/app/features/dashboard`. That keeps the dashboard between the raw template layer and the API-backed Angular screens without pretending it is middleware.

### Frontend notes

**Module strategy:** `CoreModule` (singletons: guards, interceptors, auth service) is imported exactly once in `AppModule`. `SharedModule` (dumb/reusable components, pipes, directives) is imported by every feature module. Every feature (`clients`, `projects`, `invoices`, etc.) is its own lazy-loaded module with its own routing file — this keeps initial bundle size small and enforces separation of concerns per domain.

**SASS with Bootstrap:** Import Bootstrap's source SCSS (not the compiled CSS) so you can override its `$variables` (colors, spacing, breakpoints) in `vendors/_bootstrap-overrides.scss` before the `@import "bootstrap"` line. This lets your brand colors flow through every Bootstrap component automatically instead of fighting specificity later.

**Make theme changes easy:** Put all global design tokens in one file such as `styles/abstracts/_variables.scss` or `dashboard/assets/scss/abstracts/_variables.scss`. Define values like `$primary`, `$secondary`, `$body-bg`, `$body-color`, `$border-radius`, `$spacer`, and breakpoint maps there, and reference those variables everywhere else instead of hardcoding colors or spacing in component files. If you also expose the same values as CSS custom properties in `:root`, you can support lighter runtime theme switching later without rewriting the Sass structure.

**Recommended flow for dashboard styling:** Update `_variables.scss` first, import those values into `_bootstrap-overrides.scss`, then compile Bootstrap and your custom dashboard partials from `main.scss`. With that setup, changing one variable updates cards, buttons, sidebar, forms, tables, and dashboard widgets consistently.

**Guards/Interceptors:**
- `auth.guard.ts` — blocks route entry if no valid token.
- `role.guard.ts` — e.g. an EMPLOYEE can't reach `/settings/user-management`.
- `auth.interceptor.ts` — attaches `Authorization: Bearer <token>` to every outgoing HTTP call automatically, so feature services never touch headers manually.
- `error.interceptor.ts` — catches 401 globally, clears the token, redirects to login.

---

## 4. Connecting Dashboard, Frontend, Backend, and Database — Best Practices

1. **Never expose JPA entities in API responses.** Always map to DTOs. This decouples your DB schema from your API contract, so you can change a column name without breaking the Angular app.
2. **Treat the dashboard as a UI layer, not a service layer.** It should render admin workflows and analytics screens, but all real data access still goes through Angular services to Spring Boot APIs.
3. **One typed model per resource on the frontend**, matching the DTO shape exactly (`client.model.ts` mirrors `ClientResponse.java`). Keep these hand-in-sync, or generate the Angular interfaces from your OpenAPI spec (`openapi-generator-cli`) so they never drift.
4. **Centralize the API base URL** in `environment.ts` — never hardcode `http://localhost:8080` inside a service.
5. **Use a dev proxy (`proxy.conf.json`)** so Angular dev server forwards `/api/*` to Spring Boot, avoiding CORS friction locally; configure real CORS rules in `SecurityConfig` for staging/prod.
6. **Consistent error contract.** `GlobalExceptionHandler` on the backend should always return the same JSON error shape (`{ timestamp, status, message, path }`), and `error.interceptor.ts` on the frontend should know how to unwrap it into your `notification.service.ts` toasts.
7. **Pagination contract.** Standardize on Spring's `Page<T>` → a `PagedResponse<T>` DTO → a matching Angular `PagedResponse<T>` interface, used consistently across `client-list`, `project-list`, `invoice-list`, etc.
8. **File uploads:** frontend's `file-upload` shared component posts `multipart/form-data` to `FileUploadController`; backend returns a `FileAttachment` DTO with a URL; frontend stores/display that URL — never store raw file bytes in the Angular app's state.
9. **Environment parity:** `application-dev.yml` / `environment.ts` point to localhost; `application-prod.yml` / `environment.prod.ts` pull DB credentials and API URLs from environment variables / CI secrets, never committed to git.
10. **Versioned API paths** (`/api/v1/...`) from day one — cheap now, saves pain later when you need to evolve the contract without breaking an old mobile client or integration.

---

## 5. Suggested Build Order

1. DB schema + Flyway migrations for `User`, `Client`, `Project`, `Employee` first
2. Auth (JWT) end-to-end (backend + Angular login/guards/interceptor) — everything else depends on this
3. Client + Project CRUD (both layers) — proves out the full stack pattern
4. Service catalog + Quotes (quotes reference catalog items)
5. Invoices (often generated from an accepted quote) + PDF generation
6. File uploads (project images, invoice/quote PDFs)
7. Dashboard analytics last, once there's real data flowing through the other modules to aggregate

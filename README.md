# MACM Studio Website

Engineering-led studio website and interactive project estimator for [macm.lk](https://macm.lk).

The application includes the public studio site, interactive project estimator, persisted lead intake, an invitation-only customer portal, and an administrative project workspace.

## Requirements

- Node.js 22+
- npm
- Docker (optional, for production-style local runs)
- PostgreSQL 14+ for portal, authentication, and lead data

## Local development

```bash
npm install
npm run db:deploy
npm run dev
```

Open `http://localhost:3000`.

For a production build, run:

```bash
npm run typecheck
npm run build
npm start
```

## Database and client access

Copy `.env.example` to `.env.local`, provide a PostgreSQL connection, then apply the committed migration:

```bash
npm run db:validate
npm run db:deploy
```

Use `npm run db:migrate` only while creating new migrations in local development. Production containers run `prisma migrate deploy` before the Next.js server starts and stop if migration deployment fails.

Customers cannot register publicly. An administrator reviews a stored lead in `/admin/leads` and approves it; that transaction creates or activates the customer and prepares a draft project. The customer can then sign in at `/sign-in` using an emailed six-digit code. The first OTP request for an address in `ADMIN_EMAILS` bootstraps its administrator account.

OTP and project-update messages use direct authenticated SMTP. Configure SPF, DKIM, and DMARC for the sender domain. Keep `DATABASE_URL`, `BETTER_AUTH_SECRET`, `ADMIN_EMAILS`, and SMTP variables server-only—never prefix them with `NEXT_PUBLIC_`.

## Contact form delivery

The contact form submits a JSON `POST` request to `/api/lead`. The route validates and rate-limits the request, stores it in PostgreSQL, then forwards the existing payload plus `leadId` to `LEAD_WEBHOOK_URL`.

If n8n is unavailable, the saved enquiry is still accepted. The failure is visible in the admin workspace and can be retried from the lead detail screen.

The `hello@macm.lk` link is a normal `mailto:` link and opens the visitor's mail client; it is separate from the form submission flow.

Set `LEAD_WEBHOOK_URL` to the production n8n webhook:

```env
LEAD_WEBHOOK_URL=https://your-webhook.example/lead
```

If the variable is not set, the lead remains saved with notification status `NOT_ATTEMPTED`.

## Google Analytics

The site uses the Google tag ID in `NEXT_PUBLIC_GOOGLE_TAG_ID` and sends data to
the MACM Studio Analytics web stream in `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Copy
these public values from `.env.example` into your local environment or
deployment settings before building if you want to change the property:

```env
NEXT_PUBLIC_GOOGLE_TAG_ID=GT-578PGM8R
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-82X4D9K6PB
```

The tag is rendered only on the public homepage; it is absent from `/sign-in`, `/portal`, and `/admin`. It records page views and
customer-intent events such as planning a website, locking a project scope,
opening a sample preview, starting or submitting the enquiry form, opening an
FAQ, and clicking contact links. Form names, email addresses, phone numbers,
notes, and webhook payloads are never sent to Analytics.

To verify the setup, open **Reports → Realtime** in Google Analytics, visit the
site in a new browser tab, and then interact with a CTA or the enquiry form.
Use **Admin → Data display → DebugView** when testing with Analytics Debugger.

## GitHub Container Registry

The workflow at `.github/workflows/publish-image.yml` builds the production Docker image and publishes it to GHCR automatically.

- Pushes to `main` publish the `main`, `latest`, and commit-SHA tags.
- Version tags such as `v1.0.0` publish the matching version tag.
- Manual runs are available from the GitHub Actions tab.

The workflow uses the repository-provided `GITHUB_TOKEN`; enable repository Actions and package write permissions if GitHub prompts for them. The resulting image is:

```text
ghcr.io/<github-owner>/<repository>:latest
```

After a successful `main` build and image push, the workflow calls the Dokploy deployment webhook using the GitHub Actions secret `DOKPLOY_WEBHOOK_URL_ONE`. Tag builds and manual runs publish the image but do not trigger the Dokploy application deployment step.

To configure it in GitHub, open **Repository settings → Secrets and variables → Actions → New repository secret**, name it `DOKPLOY_WEBHOOK_URL_ONE`, and paste the Dokploy application webhook URL. Keep the URL secret; anyone who has it may trigger a deployment.

## Production with Docker

```bash
docker compose up -d --build
```

The container exposes port `3000`, deploys committed Prisma migrations before accepting traffic, and then runs the optimized Next.js standalone server. In Dokploy, keep PostgreSQL on the private service network, do not publish port `5432`, point the public domain to the web container on port `3000`, and configure every variable in `.env.example`.

Before deploying a future migration that removes or rewrites data, take a PostgreSQL backup. The initial portal migration is additive.

## Project structure

- `app/page.tsx` — public site route
- `components/studio-site.tsx` — page UI and interactions
- `hooks/usePricingCalculator.ts` — calculator state and milestone math
- `lib/pricing.ts` — typed pricing data and formatting helpers
- `app/api/lead/route.ts` — validated lead submission endpoint
- `app/sign-in` — passwordless client and administrator sign-in
- `app/portal` — customer-owned project views and profile
- `app/admin` — lead, client, project, payment, update, and audit management
- `prisma/schema.prisma` / `prisma/migrations` — database model and committed migration history
- `Dockerfile` / `docker-compose.yml` — standalone production runtime

# MACM Studio Website

Engineering-led studio website and interactive project estimator for [macm.lk](https://macm.lk).

The site includes a responsive service overview, LKR/USD pricing calculator, 10/50/40 milestone breakdown, business inbox add-on, scope handoff, and a lead form backed by `/api/lead`.

## Requirements

- Node.js 22+
- npm
- Docker (optional, for production-style local runs)

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For a production build, run:

```bash
npm run typecheck
npm run build
npm start
```

## Contact form delivery

The contact form submits a JSON `POST` request to `/api/lead`. The route validates the lead, adds a submission timestamp, and forwards the payload to `LEAD_WEBHOOK_URL` when configured. This can be a Discord/Telegram relay, n8n webhook, email automation endpoint, or application API.

The `hello@macm.lk` link is a normal `mailto:` link and opens the visitor's mail client; it is separate from the form submission flow.

Copy `.env.example` to `.env.local` and set `LEAD_WEBHOOK_URL`:

```env
LEAD_WEBHOOK_URL=https://your-webhook.example/lead
```

If the variable is not set, development submissions are written to the server log.

## Google Analytics

The site uses the Google tag ID in `NEXT_PUBLIC_GOOGLE_TAG_ID` and sends data to
the MACM Studio Analytics web stream in `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Copy
these public values from `.env.example` into your local environment or
deployment settings before building if you want to change the property:

```env
NEXT_PUBLIC_GOOGLE_TAG_ID=GT-578PGM8R
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-82X4D9K6PB
```

The tag loads after the page becomes interactive. It records page views and
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

The container exposes port `3000` and uses the optimized Next.js standalone runtime. In Dokploy, point the service domain to port 3000 and set `LEAD_WEBHOOK_URL` in the environment settings.

## Project structure

- `app/page.tsx` — public site route
- `components/studio-site.tsx` — page UI and interactions
- `hooks/usePricingCalculator.ts` — calculator state and milestone math
- `lib/pricing.ts` — typed pricing data and formatting helpers
- `app/api/lead/route.ts` — validated lead submission endpoint
- `Dockerfile` / `docker-compose.yml` — standalone production runtime

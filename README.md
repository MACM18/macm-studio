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

## Lead delivery

Copy `.env.example` to `.env.local` and set `LEAD_WEBHOOK_URL` to an endpoint that accepts the calculator and contact form JSON payload. This can be a Discord/Telegram relay, n8n webhook, or application API.

If the variable is not set, development submissions are written to the server log.

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

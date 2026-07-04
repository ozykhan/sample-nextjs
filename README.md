# sample-app

A tiny **server-side-rendered** Next.js web app that serves as a showcase payload for
[**Piper**](https://github.com/getpiper/piper) — the open-source PaaS that gives you
`git push → live HTTPS URL` on hardware you own (yes, including a Raspberry Pi behind CGNAT).

This repo is **not** part of Piper. It is an app you *deploy with* Piper to demonstrate the
stack end-to-end: a real `Dockerfile`, the `$PORT`-injection contract, Piper's TCP
health-check, and Caddy's in-front TLS.

- **Next.js 15 (App Router, RSC)** — `output: 'standalone'` emits a self-contained Node
  server; no Vercel-only features (`@vercel/*` adapters, edge runtime, `next/image` remote
  loader). Runs identically on any host.
- **Single port** — listens on `$PORT` (default `8080`) bound to `0.0.0.0`, the one port Piper
  routes to. TLS is upstream (Piper's Caddy), so there's no redirect/HSTS/`:443` logic here.
- **SSR** — home and about pages rendered server side via React Server Components.

## Routes

| Method | Path      | Returns                       |
|--------|-----------|-------------------------------|
| `GET`  | `/`       | Home page (SSR HTML)          |
| `GET`  | `/about`  | About page (SSR HTML)         |
| `GET`  | `/health` | `200 OK`, body `ok\n`         |

## Run locally

```bash
make run            # serves 0.0.0.0:8080 (honors $PORT)
curl localhost:8080/health
```

## Deploy with Piper

With [`piperd`](https://github.com/getpiper/piper) running on your box:

```bash
piper create sample-app
piper deploy sample-app --path .

curl http://sample-app.piper.localhost/         # LAN/localhost
# Piper Plan 2 (public HTTPS via your self-hostable relay + DNS-01 wildcard TLS):
curl https://sample-app.<your-domain>/
```

Full recipe + prerequisites: [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Develop

- `make test` — `npm test` (Vitest: unit + integration; integration needs a prior
  `npm run build`, else skips cleanly).
- `make build` — `npm run build` → emits `.next/standalone/server.js`.
- `make cross` — `docker buildx build --platform linux/arm64 .`; proves the Dockerfile builds
  for the Pi's arm64 target.
- `make dev` — `npm run dev`.

Before claiming work is done, run the full CI gate:
`npm run lint && npm run typecheck && npm run build && npm test`, then `make cross`.

Trunk-based: `main` is the only long-lived branch, squash-merged via PR. See
[`CLAUDE.md`](CLAUDE.md) for coding principles and workflow; [`AGENTS.md`](AGENTS.md) for
gotchas; [`docs/plans/`](docs/plans/) for the implementation plan.

## Status

Pre-implementation. Plan: [`docs/plans/2026-07-04-sample-app-ssr.md`](docs/plans/2026-07-04-sample-app-ssr.md).
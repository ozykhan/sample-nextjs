# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and other agents when working in this repository.

## What this is

`sample-app` is a tiny **server-side-rendered** Next.js web application whose purpose is to be a
*showcase payload* for [Piper](https://github.com/getpiper/piper) — the open-source PaaS that
gives you `git push → live HTTPS URL` on hardware you own. It is **not** part of Piper; it is an
app you *deploy with* Piper to prove the stack end-to-end and to serve as a readable example
for contributors and a future hosted-relay landing page.

A single Next.js 15 app (App Router, TypeScript, `output: 'standalone''`) produces one Node
server:

- `sample-app` — an HTTP server that renders HTML server side via React Server Components, with
  a `/health` endpoint Piper can reach during its deploy health-check. The standalone
  `server.js` emitted by `next build` is the one process Piper runs in the container.

## Coding Principles

### 1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.

### 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- If you write 200 lines and it could be 50, rewrite it.

### 3. Surgical Changes
Touch only what you must. Match existing style. Clean up only your own mess.

### 4. Goal-Driven Execution
Define success criteria. Loop until verified.
- Every feature or bugfix starts with a test that fails, then the implementation that makes it pass.

## Development

- **Test-first.** Every route starts with a failing test, then the implementation that makes it
  pass. Route handlers (e.g. `/health`) get a Vitest unit test importing the handler directly;
  pages get an integration test that builds, starts the standalone `server.js` on a random
  port, and `fetch`es — exactly what a deployer sees.
- **Lean dependencies.** Next.js + Vitest only. No Vercel-only features (edge runtime,
  `@vercel/*` adapters, `next/image`'s default remote optimization loader) — the app must run
  identically on any host, not just Vercel. A new dependency must justify its weight against the
  "lean enough for a Pi" ethos.
- **One port, one process.** The server listens on a single port (`$PORT`, default `8080`).
  Piper routes `<app>.piper.localhost` to that one port and (Plan 2) terminates TLS in front of
  it. Do not bake in redirect-to-HTTPS logic, HSTS, or multi-port schemes — Caddy owns that.
- **Healthy on a TCP dial.** Piper's health-check is a TCP dial to the container's published
  port, not an HTTP probe. `/health` exists for humans and future HTTP probes; *accepting a
  connection* is what passes Piper today. Keep the listener up before you do slow work.
- **Bind `0.0.0.0`.** Next's standalone `server.js` defaults `HOSTNAME` to `localhost`, which
  silently breaks Piper's TCP dial inside a container. The Dockerfile and any local standalone
  run must set `HOSTNAME=0.0.0.0`.

## Commands

Shortcuts live in the `Makefile` (parity with Piper's muscle memory):

- `make test` — `npm test` (Vitest: unit + integration). Requires a prior `npm run build` for
  the integration suite to run; without a build it skips cleanly.
- `make build` — `npm run build` → emits `.next/standalone/server.js`.
- `make run` — `npm run start` (or `node .next/standalone/server.js`).
- `make cross` — `docker buildx build --platform linux/arm64 .`; proves the Dockerfile builds
  for the Pi's arm64 target.
- `make dev` — `npm run dev`.

Always run `npm run lint && npm run typecheck && npm run build && npm test`, then `make cross`,
before claiming work is done. `make test` and `make cross` alone do not cover lint, typecheck,
or build.

## Hard constraints

- **Runtime:** Node.js 22 LTS (`.nvmrc` pins `22`). Package manager is npm.
- **No Vercel coupling.** Forbidden: `@vercel/*` adapters, `edge` runtime routes,
  `next/image`'s default remote optimization loader, rewrites/middleware that assume edge
  semantics. `next start` and the standalone `server.js` must run identically on any host.
- **Container port:** `8080` by default. The app must listen on `$PORT` (Piper injects `PORT`
  set to the configured app port; default `8080`) and bind `0.0.0.0`, not `localhost`.
- **Routes are exactly:** `GET /` (home), `GET /about`, `GET /health`.
- **Status strings returned by `/health`:** the endpoint returns `200 OK` with body `ok\n`
  and `Content-Type: text/plain; charset=utf-8` when the process is ready; it must not depend
  on any external resource.
- **No TLS in app.** Caddy (managed by Piper) terminates TLS in front. Never add
  redirect-to-HTTPS, HSTS, or `:443` listeners here — that is Piper's job.

## Commits

One commit per plan task step, conventional-commit style (`feat:`, `test:`, `chore:`).

## Branch workflow

Trunk-based. `main` is the single long-lived branch and is always green/releasable. **Never
commit directly to `main`** — all work goes through a PR. Branch off `main`, named
`<gh-name>/<short-description>`. Open a PR into `main` and squash-merge. Run
`npm run lint && npm run typecheck && npm run build && npm test`, then `make cross`, before
pushing.

## Releases

Releases are **semver git tags** (`v0.1.0`); a release workflow turns them into a multi-arch
container image (linux/amd64 + linux/arm64 via buildx, the latter for the Pi). There is no
native binary, so no per-arch binaries — just the image.
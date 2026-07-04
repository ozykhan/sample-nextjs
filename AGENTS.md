# AGENTS.md

Read `CLAUDE.md` in full first — it is the authoritative source for coding principles,
commands, constraints, and branch/PR workflow. This file only captures high-signal facts an
agent would otherwise get *wrong* that aren't obvious from filenames or `CLAUDE.md`.

- This repo is **a payload, not Piper.** It never imports any Piper SDK and never shells out to
  the `piper` CLI from app code. It is an app *deployed with* Piper to exercise the stack;
  Piper builds its `Dockerfile`, runs the container, and routes to `:8080`. Do not add
  Piper-specific glue here.
- Single package test/run: `npm test` (Vitest); single file
  `npx vitest run tests/health.test.ts`. The integration suite needs a prior
  `npm run build` to actually run — without a build it skips cleanly (so local `npm test` is
  fast; CI builds before testing, see `.github/workflows/verify.yml`).
- Before claiming work is done, run the full CI sequence:
  `npm run lint && npm run typecheck && npm run build && npm test`, then `make cross` (arm64
  buildx). `make test` and `make cross` alone do **not** catch lint, typecheck, or build
  failures — those are separate npm scripts.
- **Health-check semantics:** Piper dials TCP to the container's published port — *accepting a
  connection* passes. `/health` is for humans/future HTTP probes only; do not make it a
  dependency for the listener being "up".
- **Bind `0.0.0.0`, not `localhost`.** Next's standalone `server.js` defaults `HOSTNAME` to
  `localhost`, which silently breaks Piper's TCP dial inside a container. The Dockerfile sets
  `HOSTNAME=0.0.0.0`; any manual standalone run must too.
- **TLS is outsourced.** Caddy (managed by Piper) terminates TLS in front of this app. Never
  add redirect-to-HTTPS, HSTS, or `:443` listeners here — that is Piper's job.
- **One port, `$PORT`.** Default `8080`. Standalone `server.js` reads `PORT` and `HOSTNAME`
  env directly. Do not add a second listener or a metrics port.
- **No Vercel coupling.** Forbidden: `@vercel/*` adapters, `edge` runtime routes,
  `next/image` remote optimization loader, edge middleware semantics. The app must run
  identically on any Node host.
- Don't read env in route components for arbitrary config. The only env the app honors is
  `PORT`/`HOSTNAME` (server start), handled by the standalone `server.js`, not app code. Route
  modules must be pure functions of their request input.
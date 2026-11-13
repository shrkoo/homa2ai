# Homa AI — Base44 Import Handoff

This note is for importing the existing Homa AI repository into a **new Base44 account** through the Base44 "Bring Your Own Project" flow.

## Repository layout

- Repository: `shrkoo/homa2ai`
- Default branch: `main`
- Frontend application source: `extracted/frontend`
- Frontend package manifest: `extracted/frontend/package.json`
- Frontend Vite configuration: `extracted/frontend/vite.config.js`
- Frontend Base44 client: `extracted/frontend/src/api/base44Client.js`
- Cloudflare backend: `extracted/backend` (including Worker source and `wrangler.toml`)

**Important:** the frontend is nested under `extracted/frontend`; the repository root is not the Vite app root. If the importer supports selecting a project/subdirectory, use `extracted/frontend` as the frontend project directory. If it does not support a nested app root, ask Base44 support to confirm the supported import layout before restructuring the repository.

## Preserve the existing architecture

1. Keep the Base44 SDK and Vite plugin dependencies for this import. Do not remove or replace them as part of importing into the new account.
2. Keep the existing Cloudflare Workers, D1 database, KV namespaces, routes, bindings, and secrets unchanged.
3. Do not create a new D1 database, apply the schema again, or deploy Workers during frontend import.
4. Do not copy secrets, tokens, or credential values into repository files or frontend environment variables.
5. Do not merge import-preparation changes into `main` until the imported project has been checked.

## Existing Cloudflare services

The existing deployment is documented as using the Workers `homa-ai-core` and `homa-ai-api`, with the shared D1 database `homa-ai-db`. The existing account resources are the source of truth; import must not recreate them.

## Base44 runtime dependencies

The frontend still contains Base44 SDK integration points. A repository audit dated 2026-09-03 records direct Base44 entity/function/auth usage. Treat those counts as historical audit notes, not as a fresh verified count. Do not attempt a Base44-removal migration for this import.

## Safe import checklist

- [ ] Confirm Base44 BYOP access is enabled for the destination account.
- [ ] Import `shrkoo/homa2ai` from GitHub without changing `main`.
- [ ] Configure the frontend root as `extracted/frontend` if supported.
- [ ] Set only the new Base44 app's required app/runtime configuration in its own environment.
- [ ] Build and preview the frontend before publishing.
- [ ] Verify login, chat, file upload, web search, and Worker API calls.
- [ ] Confirm the app still calls the existing Cloudflare Workers and existing D1-backed APIs.
- [ ] Do not deploy or modify Cloudflare resources as part of the Base44 import.

## Known import limitation

GitHub access and repository preparation do not themselves import the app into Base44. The destination Base44 account must have the BYOP import feature enabled, and the importer must support this repository's nested frontend layout. If either condition is not met, stop and get confirmation from Base44 support rather than restructuring or replacing working services.

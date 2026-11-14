# Agent instructions for Homa AI

## Project layout
- The React/Vite frontend lives in `extracted/frontend`.
- The Cloudflare Worker backend lives in `extracted/backend`.
- The repository root is a workspace containing both; it is not itself the Vite application root.

## Frontend commands
Run frontend commands from `extracted/frontend`:
- Install: `npm install`
- Development preview: `npm run dev -- --host 0.0.0.0`
- Production build: `npm run build`
- Lint: `npm run lint`
- Type check: `npm run typecheck`

There is currently no committed lockfile in the frontend directory. Do not claim a reproducible install or successful build unless the commands have actually been run.

## Backend and data safety
- The production backend is deployed on Cloudflare Workers and uses existing Cloudflare D1/KV resources.
- Do not create, reset, migrate, or delete production databases or storage.
- Do not deploy Workers or modify Cloudflare bindings/secrets without explicit user approval.
- Never write secrets, API keys, access tokens, or credentials into repository files.
- Treat existing Cloudflare resource names and IDs as production configuration; do not replace them with placeholders or new resources.

## Base44 import safety
- Preserve the existing Base44 SDK/plugin and frontend integration while preparing an import into a new Base44 account.
- Do not attempt to remove Base44 dependencies or rewrite authentication/data adapters as part of repository import.
- Keep import preparation on a dedicated branch and do not merge into `main` without explicit approval.
- Before changing the directory layout, confirm that the Base44 importer requires a root-level frontend and that it cannot select `extracted/frontend`.

## Verification
- Separate verified facts from historical markdown reports.
- A successful GitHub commit does not prove that the app builds or runs.
- Test login, chat, file handling, web search, and calls to the existing Cloudflare Worker before publishing any imported app.

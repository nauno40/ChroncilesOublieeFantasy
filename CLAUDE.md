# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A digital companion ("compagnon joueur et meneur de jeu") for the French tabletop RPG **Chroniques Oubliées Fantasy** (COF2, built on the free ORC-licensed ruleset). It serves players (character creation/management with auto-computed stats) and game masters (campaign management + virtual-table tools: combat tracker, dice roller, soundboard, notes). Both share an encyclopedia/compendium of races, classes (profiles), voies (talent paths), capacités, bestiary, equipment, and the full rules text.

**Documentation and comments are in French; entity/class names are mixed French/English.** The authoritative project docs are the four files in `doc/etat_des_lieux/` (`architecture.md`, `backend.md`, `frontend.md`, `roadmap.md`) — read these for project status and goals. There is no README.

## Architecture

Two independent sub-projects orchestrated by Docker Compose. There is no root package manager (the root `package-lock.json` is a stub).

- **`backend/`** — Symfony 7.4 + **API Platform 4.2** REST/JSON-LD API (PHP 8.3, PostgreSQL 15, Doctrine ORM 3).
- **`app/`** — React 19 + TypeScript + Vite 7 SPA (Tailwind CSS v4).

The frontend talks to the backend at `http://localhost:8000/api` (API Platform with Hydra conventions); auth is JWT via LexikJWT.

### Two domains

The data splits into two domains that behave very differently:

1. **Game compendium** — `Race`, `Profile`, `Voie`, `Capability`, `Creature`/`CreatureFamily`/`CreatureVoie`, `Equipment`, `Material`, `Food`, `Lodging`, `Mount`, `HarmfulState`. Static reference data, **publicly readable**, seeded from JSON fixtures. EasyAdmin (`/admin`) is the back-office for these.
2. **Campaign domain** — `User`, `Campaign`, `Quest`, `Clue`, `Session`, `Character`. **JWT-protected and owner-scoped.**

## Backend (`backend/`)

**The API is declarative — driven by `#[ApiResource]` attributes on entities in `src/Entity/`, not by controllers.** To add or change an endpoint, edit the attribute on the entity. `src/Controller/` holds only the EasyAdmin `Admin/` CRUD controllers; `src/ApiResource/` is empty. Serialization groups (e.g. `campaign:read`/`campaign:write`, `character:read/write`, `user:read/create/update`) gate field exposure.

**Auth/authorization is layered and unusual** — `security.yaml`'s `access_control` leaves `^/api` as `PUBLIC_ACCESS` so the compendium stays *readable*, but an intermediate rule restricts compendium **writes** (POST/PUT/PATCH/DELETE on `races|profiles|voies|…`) to `ROLE_ADMIN`. Real enforcement for the campaign domain comes from:
- `src/Doctrine/CurrentUserExtension.php` — a Doctrine query extension that auto-scopes all `Campaign`/`Quest`/`Clue`/`Session` queries to the logged-in user (the others via their `campaign.owner` join).
- Per-operation `security:` expressions on entities: `Campaign`/`Character` item ops check `object.getOwner() == user`; `Quest`/`Clue`/`Session` require `ROLE_USER` (collection) and check `object.getCampaign().getOwner() == user` (item ops + `securityPostDenormalize` on writes).
- `src/State/CampaignStateProcessor.php` (sets owner + `updatedAt` on create) and `src/State/UserPasswordHasher.php` (hashes password on write).

**Fixtures:** a single `src/DataFixtures/AppFixtures.php` (~645 lines) reads JSON from `backend/data/` (auto-detects `/app/data` in Docker vs `../../data` locally) and hydrates the compendium in dependency order. Source data: top-level `*.json` plus per-class files in `data/Profils/` (14) and per-race files in `data/Races/` (8). Helpers `getValue`/`getLabelOrValue` flatten a Drupal-style `[{value,label}]` export shape.

Schema is managed by Doctrine migrations in `backend/migrations/`.

### Backend commands (inside the `backend` container, entrypoint `bin/console`)

```bash
bin/console doctrine:migrations:migrate   # apply schema
bin/console doctrine:fixtures:load        # seed compendium from data/*.json (DESTRUCTIVE: purges tables)
bin/console lexik:jwt:generate-keypair    # REQUIRED on first setup — config/jwt/ ships empty
bin/phpunit                               # API security/authorization test suite (tests/Api/, ~40 tests; needs a test DB — see below)
```

## Frontend (`app/`)

Entry chain `index.html` → `src/main.tsx` → `src/App.tsx`. `App.tsx` is the router + auth root: `<AuthProvider>` → `<BrowserRouter>`, public routes (`/`, `/login`, `/register`) and protected routes nested under `<ProtectedRoute>` → `<Layout>`.

**No Redux/Zustand.** Global state is React Context for auth (`src/context/AuthContext.tsx`); page data is fetched per-component with `useState`/`useEffect`; some UI state persists to `localStorage` (keys prefixed `co_`, e.g. `co_auth_token`, `co_global_notes`).

**Two data-access layers in `src/services/`:**
- `api.ts` (`ApiService`) — low-level fetch wrapper that speaks API Platform/Hydra: sends `Accept: application/ld+json`, follows `hydra:member`/`hydra:view.next` pagination in `getAll`, and inlines `Authorization: Bearer <co_auth_token>` on every request.
- `dataService.ts` (`DataService`) — domain layer over `ApiService` for read-only compendium data (often `?pagination=false&itemsPerPage=500`). Note: weapons vs. armors are split client-side from the single `equipment` collection by `type`.

`src/services/AuthService.ts` + `AuthContext` handle login (`POST /login_check`, LexikJWT) and register (`POST users` then auto-login). `src/utils/campaignService.ts` does campaign CRUD with explicit `mapBackendToFrontend`/`mapFrontendToBackend` translation — it distinguishes temp client UUIDs from real backend integer IDs (`!id.includes('-')`) to choose POST vs PUT and emits API Platform `@id` IRIs for nested children.

**Key pattern — `DynamicDetailsRenderer`** (`src/components/common/DynamicDetailsRenderer.tsx`): a schema-less renderer for the free-form `details` JSON on capacités/voies. It branches on **key-prefix conventions** (`statistiques_*`, `mecaniques_*`, `choix_*`/`options_*`, `note`/`note_speciale`, with a JSON fallback), so new detail keys render without code changes. Used in detail pages (`CapaciteDetail`, `VoieDetail`, etc.), which read `:id` via `useParams`, fetch the entity + related collections, and cross-link with `<Link>`.

**Tailwind is v4 CSS-first** — the theme is declared with `@theme` directly in `src/index.css`; there is **no `tailwind.config.js`** (common gotcha when editing styles).

### Frontend commands (run from `app/`)

```bash
npm run dev       # Vite dev server (port 5173)
npm run build     # tsc -b && vite build (type-checks all tsconfig projects, then bundles)
npm run lint      # eslint . (flat config, typescript-eslint + react-hooks)
npm run preview   # serve production build
```

Tests: `npm test` / `npm run test:run` (Vitest unit tests, e.g. `src/utils/*.test.ts`) and `npm run e2e` (Playwright, `app/e2e/`; run against the running stack via `scripts/e2e.sh`).

## Dev environment (Docker Compose)

`docker compose up` from the repo root starts four services:

| Service    | Port   | Notes |
|------------|--------|-------|
| `database` | 5432   | postgres:15-alpine, db/user `app`, password `!ChangeMe!` |
| `backend`  | (9000) | php:8.3-fpm; mounts `./backend` and `./backend/data` |
| `nginx`    | 8000   | public API entry → serves `backend/public`, API root `http://localhost:8000/api`, Swagger/ReDoc under `/api`, admin at `/admin` |
| `frontend` | 5173   | Vite dev (`npm run dev -- --host`), `VITE_API_URL=http://localhost:8000/api` |

The Dockerfiles are multi-stage/prod-capable (backend Dockerfile sets `APP_ENV=prod`, runs `composer install --no-dev`; frontend uses its `build` target for dev). Compose overrides the backend to `APP_ENV=dev`. `vite.config.ts` uses `usePolling`/`host: true` for container file-watching.

## Setup gotchas

- **JWT keys ship empty** — run `lexik:jwt:generate-keypair` in the backend container before auth will work.
- After first `docker compose up`: run migrations, then fixtures, then generate JWT keys.
- The seeded `admin@example.com` user is a usable login (password `admin`, `ROLE_ADMIN`), hashed by `AppFixtures::loadUsers()`.
- In dev, the backend entrypoint (`backend/docker/dev-entrypoint.sh`) waits for the DB, runs migrations, then auto-creates/updates a test user `test@test.com` / `password` (`ROLE_ADMIN`) via `bin/console app:create-test-user` on every `docker compose up`.

# Eternal Dodjo Desktop

`desktop/` is an **isolated Electron companion** for Eternal Dodjo. It does not replace the Cloudflare Worker application and does not add direct database connectivity from a desktop device.

## Architecture

The desktop client stores only the chosen **HTTPS API origin** locally. It checks that origin through Electron's main process and reaches shared data only through the existing authenticated API.

```text
Eternal Dodjo Desktop
        │ HTTPS + authenticated API session
        ▼
Cloudflare Worker API
        │ server-side database credentials only
        ▼
Neon PostgreSQL
```

> **Security boundary:** the client never receives a `DATABASE_URL`, Neon credentials, Cloudflare token, password, session secret, or raw database port. A future desktop sync feature must be implemented as an authenticated API route in the Worker, not as a direct Neon connection.

## Local development

Install the desktop package from this folder:

```bash
cd desktop
pnpm install --frozen-lockfile
pnpm dev
```

In a second terminal, launch Electron against the Vite server:

```bash
cd desktop
VITE_DEV_SERVER_URL=http://127.0.0.1:5173 pnpm exec electron .
```

The app opens with a `Connection` view. Configure the HTTPS API origin there and run the boundary check. A `401` from `/api/auth/session` is treated as expected: it confirms that the remote API is reachable and still protected by session authentication.

## Build and packaging

```bash
cd desktop
pnpm run typecheck
pnpm run build
pnpm run package:dir
```

For a Linux AppImage, use:

```bash
pnpm run package:linux
```

The packaged artifact is created under `desktop/dist-builder/`.

## Configuration

The renderer keeps a single non-sensitive preference in local storage:

| Key | Purpose | Sensitive data allowed |
|---|---|---|
| `eternal-dodjo.desktop.remote-api-url` | HTTPS origin for the Worker API | No |

The default API origin may be changed at build or launch time with `ETERNAL_DOJO_API_URL`. Outside local development, the Electron main process rejects non-HTTPS origins.

## Next safe capabilities

The desktop shell is intentionally small. The correct next additions are authenticated API-backed functions such as session retrieval, offline drafts that explicitly sync after user confirmation, and desktop notifications issued from server-side reminder state. None of these should create a direct client-to-Neon connection.

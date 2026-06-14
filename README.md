# Local Docker Dev

Spin up the full local Supabase stack + the web app with one command.

## Prerequisites
- Docker (Desktop, Rancher, OrbStack, or Podman with Docker API compat)

## Start

```bash
cp .env.docker.example .env.docker
docker compose -f docker-compose.dev.yml up
```

On first boot, grab the local JWTs printed by `supabase start` and paste them into `.env.docker`:

```bash
docker compose -f docker-compose.dev.yml exec supabase supabase status
```

Restart the `web` service after editing `.env.docker`:

```bash
docker compose -f docker-compose.dev.yml restart web
```

## URLs
- App: http://localhost:8080
- Supabase Studio: http://localhost:54323
- API gateway (REST/Auth/Storage/Realtime): http://localhost:54321
- Inbucket (catches auth emails): http://localhost:54324
- Postgres: `localhost:54322` (user `postgres`, password `postgres`)

## Common tasks

| Task                | Command                                                                   |
| ------------------- | ------------------------------------------------------------------------- |
| Reset DB & re-run migrations | `docker compose -f docker-compose.dev.yml exec supabase supabase db reset` |
| Tail web logs       | `docker compose -f docker-compose.dev.yml logs -f web`                    |
| Stop everything     | `docker compose -f docker-compose.dev.yml down`                           |
| Stop + wipe volumes | `docker compose -f docker-compose.dev.yml down -v`                        |

## Notes
- Uses `network_mode: host`, which is simplest on Linux. On Docker Desktop (macOS/Windows) host networking is now supported but newer; if `web` can't reach `localhost:54321`, switch to a bridged network and use `host.docker.internal`.
- This setup is for local-only development. Plain `npm run dev` against the hosted Lovable Cloud `.env` still works as before — Docker uses a separate `.env.docker`.
- `apps/mobile` (Expo) and `apps/mcp` (Python) are not dockerized; run them on the host as usual.

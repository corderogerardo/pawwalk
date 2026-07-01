# Deploying PawWalk — free tier (Render + Neon)

The backend runs anywhere that can run the Docker image. This is the **$0** path:
the API on **Render**'s free web service, Postgres + **PostGIS** on **Neon**'s
free plan. Live tracking (WebSockets) works on both.

> Everything below the app needs is driven by `PAWWALK_DATABASE_URL` — the same
> code verified locally on SQLite *and* PostGIS runs unchanged on Neon.

---

## 0. One-time prep

- **Commit `uv.lock`.** The Docker build copies it for reproducible installs, and
  it's currently untracked: `git add apps/backend/uv.lock`.

## 1. Database — Neon (free, PostGIS included)

Neon Free is permanent (no card), scales to zero when idle, and includes PostGIS.

**Option A — instant, no signup (72 h, great for a first demo):**
```
npx neon-new --yes
```
Copy the `postgresql://…` URL it prints. Claim it to a free account before 72 h to keep it.

**Option B — a Neon account (durable):** create a project at neon.tech → copy the
**direct** connection string (not the `-pooler` one — Alembic runs DDL). PostGIS
enables itself: migration `0002` runs `CREATE EXTENSION IF NOT EXISTS postgis`.

**Convert the URL to the SQLAlchemy/psycopg form** (add `+psycopg`, keep SSL):
```
postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
→ postgresql+psycopg://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
```
That string is your `PAWWALK_DATABASE_URL`.

## 2. API — Render (free web service, Docker)

1. Push this repo to GitHub.
2. Render → **New → Blueprint** → pick the repo. It reads [`render.yaml`](../render.yaml)
   and creates the `pawwalk-api` Docker service (`rootDir: apps/backend`).
3. Set the two secrets in the dashboard:
   - `PAWWALK_DATABASE_URL` → the Neon string from step 1.
   - `PAWWALK_JWT_SECRET` → Render generates one automatically (leave it).
   - `PAWWALK_CORS_ORIGINS` → optional; only the landing page needs it (native apps don't send `Origin`).
4. Deploy. On boot the app runs `alembic upgrade head`, so the schema **and PostGIS
   objects** are created on Neon automatically — no manual migration step.
5. Check `https://<your-service>.onrender.com/health` → `{"status":"ok"}`.

**Notes**
- Free web service **sleeps after ~15 min idle** (cold start ~1 min); Neon also
  scales to zero. The *first* request after a long idle pays both, then it's instant.
- WebSockets (`/ws/track/...`) work on Render free — no extra config.

## 3. Point the mobile apps at the deployed API

- **iOS** — `APIClient.baseURL` in `apps/ios/PawWalk/Services/APIClient.swift`:
  `https://<your-service>.onrender.com`. (The live-tracking socket derives `wss://`
  from this automatically.)
- **Android** — `API_BASE_URL` in `apps/android/app/build.gradle.kts`:
  `"https://<your-service>.onrender.com"`. (Socket derives `wss://` too.)

Both default to localhost / `10.0.2.2` for local dev against `docker compose up`.

## 4. Verify live tracking end-to-end

Open the app, sign in, book a walk, open **Track live**, and allow location. Your
device's real GPS streams over the socket and draws the route on the HUD. A second
signed-in device on the same booking sees the same live track (walker → owner).

---

## Cost ceiling

Both free tiers are genuinely $0. You'd only pay if you outgrow them: Neon Free is
0.5 GB + 100 compute-hours/mo (a position row is tiny; scale-to-zero means idle =
$0), and Render Free is fine for a demo. Upgrade paths exist on both with no code
change — still just `PAWWALK_DATABASE_URL` + the Render plan.

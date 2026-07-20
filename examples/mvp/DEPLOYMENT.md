# Deploying to Production

This guide takes you from a freshly scaffolded monorepo to a production
deployment with zero CORS pain, zero cookie breakage, and zero infrastructure
surprises — regardless of which backend host you pick.

---

## 1. The Architectural Insight

The entire anti-CORS design rests on one decision: **the browser never talks
directly to the backend.**

When you deploy `apps/web` on Vercel, every `/api/*` request the browser makes
stays on your Vercel domain. Next.js **rewrites** those requests server-side to
the NestJS API running on Railway, Fly.io, or Render. From the browser's
perspective there is only one origin — Vercel.

Because there is no cross-site request:

- There is **no CORS preflight**. The Next.js proxy handles the forwarding
  before CORS policies are even evaluated by the browser.
- The session cookie is **first-party** on your Vercel domain. It is never
  blocked as third-party, never stripped by ITP, and never triggers a CORS
  error.
- The `trustedOrigins` list in Better Auth stays short and explicit.

**On cookies:** the production cookie configuration uses `SameSite=None;
Secure; HttpOnly` as a defensive default. Architecturally, `SameSite=Lax`
would also work because the browser always talks to the Vercel domain
(same-site). We keep `None` as a belt-and-suspenders measure — it costs
nothing and protects against edge cases where a client (mobile app, Postman)
talks directly to the backend URL.

---

## 2. How a Request Flows in Production

```
┌──────────┐      HTTPS       ┌──────────┐   server-side    ┌───────────────────┐      ┌──────────┐
│  Browser │ ───────────────→ │  Vercel  │ ───────────────→ │ Railway / Fly.io   │ ───→ │ Postgres │
│          │   same origin    │          │   proxy rewrite  │ / Render (NestJS)  │      │          │
│  cookie  │ ←─────────────── │  domain  │ ←─────────────── │  WEB_URL=vercel.app│ ←─── │          │
│   stays  │    Set-Cookie    │          │                  │  DATABASE_URL=...  │      │          │
└──────────┘                  └──────────┘                  └───────────────────┘      └──────────┘
     │                              │                                │
     │  sees ONE domain:            │  API_URL=railway.app           │  reads WEB_URL for
     │  myapp.vercel.app            │  rewrites /api/* → backend     │  CORS + trustedOrigins
     │                              │                                │
```

| Step | What happens                                                                              | Which env var                                |
| ---- | ----------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1    | Browser calls `GET https://myapp.vercel.app/api/auth/get-session`                         | (none — same origin)                         |
| 2    | Vercel forwards the request server-side to `https://api.railway.app/api/auth/get-session` | `API_URL` (set on Vercel dashboard)          |
| 3    | NestJS reads the session cookie, validates it against the database                        | `BETTER_AUTH_SECRET`, `DATABASE_URL`         |
| 4    | NestJS returns the response. Set-Cookie header flows back through Vercel to the browser   | `WEB_URL` (for `baseURL` + `trustedOrigins`) |

The critical point: even though the backend lives at `api.railway.app`, the
**Set-Cookie response passes through Vercel**, so the browser pins the cookie
to `myapp.vercel.app` — a first-party, same-site cookie.

---

## 3. Environment Variables Reference

### Backend (set on Railway / Fly.io / Render)

| Variable                                            | How to get it                                        | Notes                                                                    |
| --------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| `WEB_URL`                                           | Copy from Vercel after frontend deploy               | `https://myapp.vercel.app` — see section 8                               |
| `DATABASE_URL`                                      | Auto-injected by the platform                        | Railway / Fly.io / Render inject this when you attach a Postgres service |
| `BETTER_AUTH_SECRET`                                | Generate locally: `openssl rand -base64 32`          | Never reuse your dev secret. Losing this key invalidates all sessions.   |
| `GOOGLE_CLIENT_ID`                                  | Google Cloud Console → APIs & Services → Credentials | Create a separate "production" OAuth client                              |
| `GOOGLE_CLIENT_SECRET`                              | Same as above                                        |                                                                          |
| `GITHUB_CLIENT_ID`                                  | GitHub Settings → Developer settings → OAuth Apps    | Create a separate "production" OAuth App                                 |
| `GITHUB_CLIENT_SECRET`                              | Same as above                                        |                                                                          |
| `EMAIL_FROM`                                        | A verified sender address                            | Resend: verified domain. SMTP: your email address.                       |
| `EMAIL_PROVIDER`                                    | `resend` (recommended) or `smtp`                     | Defaults to `resend` if not set                                          |
| `RESEND_API_KEY`                                    | https://resend.com/api-keys                          | Only needed if `EMAIL_PROVIDER=resend`                                   |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASSWORD` | Your SMTP provider                                   | Only needed if `EMAIL_PROVIDER=smtp`                                     |
| `PORT`                                              | `4000` (or let the platform set it)                  | Most platforms override this automatically                               |

### Frontend (set on Vercel dashboard)

| Variable  | How to get it                  | Notes                                     |
| --------- | ------------------------------ | ----------------------------------------- |
| `API_URL` | Copy from backend after deploy | `https://api.railway.app` — see section 7 |

---

## 4. Backend on Railway

### Prerequisites

- A Railway account (https://railway.app)
- Your repository pushed to GitHub, with `railway.json` at the root

### Steps

**1. Create a new project.**
Dashboard → New Project → Deploy from GitHub repo → select your repository.
Railway detects `railway.json` automatically and uses the Dockerfile builder.

**2. Add a Postgres database.**
Inside your project, click **New** → **Database** → **Add PostgreSQL**.
Railway provisions a Postgres instance and **automatically injects
`DATABASE_URL`** into your service's environment. You don't need to copy or
paste anything.

**3. Set environment variables.**
Click on your service → **Variables** → add every variable from the
[Backend table](#backend-set-on-railway--flyio--render) above. Skip `DATABASE_URL`
(it's already there).

Wait on `WEB_URL` — you won't have the Vercel URL until after section 7.
Set it to any placeholder for now (e.g. `https://placeholder.vercel.app`).
You will update it in section 8.

**4. Deploy.**
Railway builds and deploys automatically on every push. You can also trigger
a manual deploy from the dashboard.

**5. Get the public URL.**
Go to your service → **Settings** → **Domains** → copy the generated
`*.up.railway.app` URL. This is your `API_URL` for Vercel (section 7).

> **Custom domain (optional):** Settings → Domains → Custom Domain. Railway
> auto-provisions TLS. After setting a custom domain, update `API_URL` on
> Vercel and `WEB_URL` on Railway to match.

---

## 5. Backend on Fly.io

### Prerequisites

- A Fly.io account (https://fly.io)
- `flyctl` installed (`brew install flyctl` or https://fly.io/docs/flyctl/install/)
- Your repository pushed to GitHub

### Steps

**1. Launch the app.**

```bash
fly launch
```

`flyctl` detects the existing `fly.toml`. **Do not** let it generate a new
Dockerfile — the one in `apps/api/Dockerfile` is already configured.
Follow the prompts to set an app name and primary region.

**2. Create and attach a Postgres database.**

```bash
fly postgres create
# Follow the prompts. Choose the smallest plan (dev).
fly postgres attach --app <your-api-app-name>
```

The `attach` command **automatically injects `DATABASE_URL`** as a secret on
your API app. You don't need to copy connection strings.

**3. Set secrets.**

```bash
fly secrets set BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
fly secrets set GOOGLE_CLIENT_ID="..."
fly secrets set GOOGLE_CLIENT_SECRET="..."
fly secrets set GITHUB_CLIENT_ID="..."
fly secrets set GITHUB_CLIENT_SECRET="..."
fly secrets set EMAIL_FROM="noreply@yourdomain.com"
fly secrets set EMAIL_PROVIDER="resend"
fly secrets set RESEND_API_KEY="re_..."
```

Wait on `WEB_URL` — set a placeholder for now:

```bash
fly secrets set WEB_URL="https://placeholder.vercel.app"
```

You will update it in section 8.

**4. Deploy.**

```bash
fly deploy
```

Fly.io builds the Docker image and deploys it. The health check (`/api/health`)
confirms the service is healthy before routing traffic.

**5. Get the public URL.**

```bash
fly status
# or
fly open
```

The URL is `https://<app-name>.fly.dev`. This is your `API_URL` for Vercel (section 7).

> **Scale to zero note:** Fly.io's free plan pauses your machine after
> inactivity. The first request after a pause takes a few seconds to wake.
> For production, set `auto_stop_machines = "off"` in `fly.toml`.

---

## 6. Backend on Render

### Prerequisites

- A Render account (https://render.com)
- Your repository pushed to GitHub

### Steps

**1. Create from Blueprint.**
Dashboard → **New** → **Blueprint** → connect your GitHub repository.
Render reads `render.yaml` and presents two services:

| Service | Type                       | What it does                   |
| ------- | -------------------------- | ------------------------------ |
| `api`   | Web Service (Docker)       | Builds and runs the NestJS API |
| `db`    | Private Service (Postgres) | Managed Postgres 16            |

Review the plan and click **Apply**.

**2. Set secrets.**
Click on the `api` web service → **Environment** → add every variable from the
[Backend table](#backend-set-on-railway--flyio--render) marked `sync: false` in
`render.yaml`.

`DATABASE_URL` is already wired — Render auto-provisions it from the `pserv`
service and injects it automatically.

Wait on `WEB_URL` — set it to `https://placeholder.vercel.app` for now. You
will update it in section 8.

**3. Deploy.**
Render builds the Docker image and starts the service. The health check
(`/api/health`) confirms the service is healthy.

**4. Get the public URL.**
The URL is shown on the `api` service page — `https://api-xxxx.onrender.com`.
This is your `API_URL` for Vercel (section 7).

> **Cold start note:** Render's free plan spins down after 15 minutes of
> inactivity. The first request after a cold start takes 30-60 seconds.
> Upgrade to the Starter plan ($7/month) to keep the service always-on.

---

## 7. Frontend on Vercel

### Prerequisites

- A Vercel account (https://vercel.com)
- Your repository pushed to GitHub
- The backend URL from section 4, 5, or 6

### Steps

**1. Import the repository.**
Dashboard → Add New → Project → import your GitHub repository.

**2. Configure the project.**
Vercel detects the monorepo structure. Set these values:

| Setting         | Value                                                                |
| --------------- | -------------------------------------------------------------------- |
| Framework       | Next.js (auto-detected)                                              |
| Root Directory  | `apps/web`                                                           |
| Build Command   | `cd ../.. && pnpm turbo run build --filter=web` (from `vercel.json`) |
| Install Command | `pnpm install --frozen-lockfile`                                     |

**3. Set environment variables.**
In the project settings → Environment Variables, add:

| Name      | Value                                                               |
| --------- | ------------------------------------------------------------------- |
| `API_URL` | The backend URL from section 4/5/6 (e.g. `https://api.railway.app`) |

**4. Deploy.**
Click Deploy. Vercel builds the Next.js app and deploys it.

**5. Get the production URL.**
After deploy, Vercel shows your production domain: `https://myapp.vercel.app`
(or a custom domain if you configured one). **Copy this** — you need it for
the next step.

---

## 8. The Circular Dependency — Wiring WEB_URL Back

Here is the one manual wiring step that every cross-host setup needs:

```
Backend deployed ──→ get backend URL
                            │
Frontend deployed ──→ API_URL = backend URL ──→ get Vercel URL
                                                       │
Backend redeployed ──→ WEB_URL = Vercel URL ◀──────────┘
```

The backend **needs** the Vercel URL for:

- `baseURL` (OAuth callbacks are built from this — they must point to the frontend)
- `trustedOrigins` (only the Vercel domain may drive the auth flow)
- CORS (fallback for direct API clients)

The frontend **needs** the backend URL for:

- Rewrites (`/api/*` → backend)

There is no way around this: the two services form a dependency loop. Here is
the exact sequence:

1. Deploy the backend **first** with a placeholder `WEB_URL`. It will boot
   but OAuth won't work yet (baseURL points to a fake domain).
2. Deploy the frontend **second** with `API_URL` pointing to the real backend.
3. **Go back** to your backend dashboard (Railway / Fly.io / Render), update
   `WEB_URL` with the real Vercel URL from step 2.
4. **Redeploy** the backend. OAuth callbacks now resolve correctly.

> After this one-time wiring in step 3, future deploys of either service
> don't need manual intervention — the env vars persist on each platform.

---

## 9. Updating OAuth Apps for Production

Google and GitHub require the OAuth callback URL to match the domain the
browser sees — which is **Vercel**, not your backend.

### Google Cloud Console

1. Go to APIs & Services → Credentials
2. Edit your production OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   - `https://<your-vercel-domain>/api/auth/callback/google`
4. Keep your localhost URI for development:
   - `http://localhost:3000/api/auth/callback/google`

### GitHub OAuth Apps

1. Go to Settings → Developer settings → OAuth Apps
2. Edit your production OAuth App
3. Under **Authorization callback URL**, set:
   - `https://<your-vercel-domain>/api/auth/callback/github`
4. The development callback (`http://localhost:3000/api/auth/callback/github`)
   can coexist — GitHub only allows one callback URL per app, so create a
   separate OAuth App for local development.

> **Important:** the callback URL points to Vercel, NOT to Railway/Fly.io/Render.
> The Next.js proxy forwards the callback server-side. This is the same
> architecture that keeps cookies first-party.

---

## 10. Vercel Preview Deployments

When you open a pull request, Vercel automatically creates a **preview
deployment** with a unique URL (e.g. `myapp-git-feat-abc123.vercel.app`).

**What works on previews:**

- Sign-in and sign-up with **email/password**.
  The `VERCEL_URL` environment variable is injected automatically on every
  Vercel deployment, and the `trustedOrigins` configuration includes it
  dynamically. Your preview branch can authenticate without CORS errors.

**What does NOT work on previews:**

- **OAuth social logins** (Google, GitHub).

  Each preview deployment has a unique, unpredictable URL. Google and GitHub
  require callback URLs to be registered in advance, and you cannot register
  every preview URL. The OAuth flow will fail with a redirect URI mismatch.

**Workaround:** use email/password authentication for testing on preview
branches. OAuth testing is reserved for the production deployment (or a
staging deployment with a fixed domain). This is not a shortcoming of the
starter — it is a constraint of how OAuth providers validate callback URLs.

---

## 11. Rate Limiting & Redis (Optional)

Authentication endpoints (`/api/auth/sign-in/email`, `/api/auth/sign-up/email`,
`/api/auth/forget-password`, `/api/auth/reset-password`) are rate-limited by
default: **5 attempts per IP per 15-minute sliding window** per endpoint.
Configure via env vars:

```
RATE_LIMIT_MAX=5         # attempts per window per endpoint
RATE_LIMIT_WINDOW=900    # window in seconds (900 = 15 min)
```

### In-Memory (Default)

Rate limit counters are stored in-memory in the Node.js process. This works
for every deployment target (Railway, Fly.io, Render, Docker) and requires
**zero additional dependencies**. Counters are lost on process restart — this
is acceptable for single-instance deployments.

### Redis (Multi-Instance)

For horizontally scaled deployments where multiple API instances need to share
rate limit counters, enable Redis:

1. **Install the optional packages:**

```bash
pnpm add @nest-lab/throttler-storage-redis ioredis --filter api
```

2. **Set the Redis URL:**

```env
REDIS_URL=redis://localhost:6379
```

The application auto-detects `REDIS_URL` at startup and switches from
in-memory to Redis storage. If the variable is set but the packages are
missing, the app logs a warning and falls back to in-memory.

> **Platform-managed Redis:** Railway, Fly.io, and Render all offer managed
> Redis services. Attach one to your API service and set `REDIS_URL` to the
> injected connection string.

### Hot Reload

The rate limiter reads `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW` from
`process.env` on **every request**. You can adjust limits at runtime —
no restart needed. Useful for temporarily tightening limits during an
attack or raising them for a launch event.

### Testing

To verify rate limiting is active:

```bash
# 6 rapid requests should return 200 (1st) ... 200 (5th), then 429.
for i in $(seq 1 6); do
  curl -s -o /dev/null -w "%{http_code}" -X POST \
    http://localhost:4000/api/auth/sign-in/email \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo
done
```

---

## 12. Post-Deployment Checklist

Verify every item before shipping to users:

- [ ] Sign-up with email and password works on the production URL
- [ ] Sign-in with email and password works on the production URL
- [ ] Sign-in with Google works (OAuth callback resolves correctly)
- [ ] Sign-in with GitHub works (OAuth callback resolves correctly)
- [ ] Email verification flow works end-to-end (email sent, link clicked, session active)
- [ ] Password reset flow works end-to-end
- [ ] Refreshing `/dashboard` keeps the user signed in (no redirect to sign-in)
- [ ] Opening the browser console on any page shows **zero CORS errors**
- [ ] `GET https://<backend-url>/api/health` returns `{"status":"ok"}` (HTTP 200)
- [ ] `GET https://<backend-url>/api/health/db` returns `{"status":"ok","db":"connected"}` (HTTP 200)

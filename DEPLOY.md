# Deploy

Two paths. Pick one — they are alternatives, not steps.

| | **A · Vercel + Neon** | **B · VPS + Docker** |
| --- | --- | --- |
| Setup time | ~15 min | ~45 min |
| Cost to start | Free tier | ~5 €/month |
| You manage | Nothing | OS, TLS, backups, updates |
| Good when | You want it live today | You want the data on your own machine |

Path A unless there is a reason. Nothing here locks you in: the app is a plain
Next.js server against a plain Postgres, and moving later is a database dump
and a rebuild.

---

## Before either path

Have these ready:

- **Domain**, with DNS you can edit.
- **`SUPPORT_EMAIL`** — a mailbox someone reads. It goes to suspended users
  and into the legal texts, so it must not be decorative.
- **VAPID keys** for push, if you want it on:
  ```bash
  npx web-push generate-vapid-keys
  ```
- **`CRON_SECRET`** — any long random string:
  ```bash
  openssl rand -hex 32
  ```

The full list with explanations is in `.env.example`. Three are optional and
the app degrades quietly without them: no `CRON_SECRET` and the sweep endpoint
refuses; no VAPID keys and push is simply absent.

---

## A · Vercel + Neon

### 1. Database

Create a project at [neon.tech](https://neon.tech). Copy the **pooled**
connection string — Vercel's functions open a connection per invocation, and
the direct string will exhaust the server under any real traffic.

### 2. Import and configure

Import the repo at [vercel.com/new](https://vercel.com/new), pick the branch,
and set the environment variables before the first deploy:

```
DATABASE_URL                  = postgresql://…  (Neon, pooled)
NEXT_PUBLIC_APP_URL           = https://vibetag.app
SUPPORT_EMAIL                 = destek@vibetag.app
CRON_SECRET                   = <openssl rand -hex 32>
NEXT_PUBLIC_VAPID_PUBLIC_KEY  = <public key>
VAPID_PRIVATE_KEY             = <private key>
VAPID_SUBJECT                 = mailto:destek@vibetag.app
```

`NEXT_PUBLIC_APP_URL` matters more than it looks. Invite links and QR codes
are built from it, and without it they are built from the request host —
which is a Vercel preview domain, not yours.

### 3. Migrate

Migrations do not run themselves. Either add a build command in Vercel:

```
prisma migrate deploy && next build
```

or run it once from your machine against the production database:

```bash
DATABASE_URL="<neon-url>" npx prisma migrate deploy
```

Prefer the build command — then every future release migrates itself.

### 4. Domain

Vercel → Settings → Domains → add `vibetag.app`, then set the DNS records it
shows you. TLS is automatic.

### 5. Nightly fraud sweep

`vercel.json`, committed:

```json
{ "crons": [{ "path": "/api/cron/fraud-sweep", "schedule": "0 3 * * *" }] }
```

Vercel's scheduler sends `GET`; our route is `POST` and wants the secret, so
on Vercel either switch the route to accept `GET` with the
`x-vercel-cron` header, or drive it from an external scheduler with the
`Authorization` header. Simplest for now: leave the cron out and press the
button in the moderation queue weekly.

---

## B · VPS + Docker

Assumes Ubuntu 24.04 and a domain already pointed at the server's IP.

### 1. Server

```bash
ssh root@<ip>
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
adduser --disabled-password --gecos "" vibetag
usermod -aG docker vibetag
```

### 2. Code and configuration

```bash
su - vibetag
git clone https://github.com/ozguryahsii/VibeTag.git app && cd app
git checkout <tag>          # always a tag, never a branch
cp .env.example .env && nano .env
```

Set `DATABASE_URL` to the compose database and `NEXT_PUBLIC_APP_URL` to your
real origin:

```
DATABASE_URL="postgresql://vibetag:<strong-password>@db:5432/vibetag"
NEXT_PUBLIC_APP_URL="https://vibetag.app"
```

Change the password in `docker-compose.yml` to match. The default
`vibetag:vibetag` is for a laptop, not the internet.

### 3. Run

```bash
docker compose up -d db
docker build -t vibetag .
docker run --rm --env-file .env --network app_default vibetag \
  npx prisma migrate deploy
docker run -d --name vibetag-app --restart unless-stopped \
  --env-file .env --network app_default -p 127.0.0.1:3000:3000 vibetag
```

Bound to `127.0.0.1` on purpose — the app is reached through the proxy, never
directly.

### 4. TLS and proxy

```bash
apt install -y caddy
```

`/etc/caddy/Caddyfile`:

```
vibetag.app {
    reverse_proxy 127.0.0.1:3000
}
```

```bash
systemctl reload caddy
```

Caddy obtains and renews the certificate on its own.

### 5. Nightly sweep

`crontab -e`:

```
0 3 * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://vibetag.app/api/cron/fraud-sweep >/dev/null
```

### 6. Backups

The one thing nobody sets up until they need it:

```
0 4 * * * docker exec vibetag-db pg_dump -U vibetag vibetag | gzip > /home/vibetag/backups/$(date +\%F).sql.gz
```

Create `~/backups` first, and copy them somewhere that is not this server.

---

## After deploying — either path

Run these before telling anyone the link exists.

```bash
curl -s https://vibetag.app/api/health          # {"ok":true}
curl -s -o /dev/null -w "%{http_code}\n" https://vibetag.app/    # 200
curl -s -o /dev/null -w "%{http_code}\n" https://vibetag.app/legal/kvkk    # 200

# Must refuse without the secret
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://vibetag.app/api/cron/fraud-sweep   # 403
```

Then in a browser, on a phone:

1. **Register** a new account. It is the only path never exercised by the
   seed, and it is the first thing a stranger will do.
2. **Invite screen** — the link and the QR must show your real domain, not
   `localhost` and not a preview URL. Open the QR with the phone camera.
3. **Rate someone** end to end, and check the score moves.
4. **EN / TR** on two or three screens.
5. **`/moderation`** as an admin, and confirm a non-admin gets a 404.
6. **Push**, if VAPID is configured: Profile → Notifications → turn on, then
   have someone rate you. This is the one thing that cannot be tested
   locally — the browser needs a reachable push service.

### Making yourself an admin

The seed sets `isAdmin` for the demo account, which does not exist in
production. After registering:

```sql
UPDATE "User" SET "isAdmin" = true WHERE username = 'ozguryahsi';
```

### Rolling back

Path A: Vercel → Deployments → the previous one → Promote.

Path B:

```bash
git checkout <previous-tag>
docker build -t vibetag . && docker restart vibetag-app
```

Both roll back *code*. A migration that dropped a column is not undone by
either — restore from the backup. This is why releases are tagged.

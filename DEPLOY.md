# Deploy

Two paths. Pick one — they are alternatives, not steps.

| | **A · Vercel + Neon** | **B · Your own server** |
| --- | --- | --- |
| Setup time | ~15 min | ~45 min |
| Cost to start | Free tier | Whatever the box already costs |
| You manage | Nothing | OS, TLS, backups, updates |
| Good when | You want it live today | You already have a server, or want the data on it |

Path B is written for a machine that is **already running other applications**
and is careful not to disturb them. Nothing here locks you in either way: the
app is a plain Next.js server against a plain Postgres, and moving later is a
database dump and a rebuild.

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
NEXT_PUBLIC_APP_URL           = https://vibetag.net
SUPPORT_EMAIL                 = destek@vibetag.net
CRON_SECRET                   = <openssl rand -hex 32>
NEXT_PUBLIC_VAPID_PUBLIC_KEY  = <public key>
VAPID_PRIVATE_KEY             = <private key>
VAPID_SUBJECT                 = mailto:destek@vibetag.net
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

Vercel → Settings → Domains → add `vibetag.net`, then set the DNS records it
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

## B · Your own server, alongside whatever else runs there

Written for a box that is already serving other applications. The stack keeps
entirely to itself: no system packages, no shared config, no ports fought
over. Everything below is scoped to a compose project called `vibetag`.

### 0. Look before touching anything

Run this first and read the output. It changes what the next steps look like.

```bash
echo "── ports in use ──"
sudo ss -tlnp | grep -E ':(80|443|3000|3100|5432|5433)\b' || echo "  none of interest"

echo "── which proxy ──"
for s in nginx caddy apache2 traefik haproxy; do
  systemctl is-active --quiet $s && echo "  $s (systemd)"
done
docker ps --format '  {{.Names}} → {{.Ports}}' 2>/dev/null | grep -E ':(80|443)->' || true

echo "── docker ──"
docker --version && docker compose version
docker ps --format '  {{.Names}}'
docker network ls --format '  {{.Name}}'
docker volume ls --format '  {{.Name}}' | grep -i vibe || echo "  no vibetag volume yet"

echo "── room ──"
df -h / | tail -1
free -m | head -2
```

Three things matter in that output:

1. **Which reverse proxy** terminates 443. That is the one file we will touch,
   and only to add a server block — never to change an existing one.
2. **Whether 3100 is free.** If not, set `APP_PORT` to something that is.
3. **Whether a `vibetag` container, network or volume already exists.** It
   should not; if it does, we are not starting from where we think.

### 1. Code

```bash
sudo adduser --disabled-password --gecos "" vibetag
sudo usermod -aG docker vibetag
sudo -iu vibetag

git clone https://github.com/ozguryahsii/VibeTag.git app
cd app
git checkout <tag>          # always a tag, never a branch
```

A separate unix user is not ceremony: it keeps this app's files, and anything
that compromises it, away from your other applications.

### 2. Configuration

```bash
cp .env.example .env
nano .env
```

```
NEXT_PUBLIC_APP_URL="https://vibetag.net"
POSTGRES_PASSWORD="<openssl rand -hex 24>"
APP_PORT="3100"                      # whatever the port check said is free
SUPPORT_EMAIL="destek@vibetag.net"
CRON_SECRET="<openssl rand -hex 32>"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."   # npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:destek@vibetag.net"
```

Leave `DATABASE_URL` alone — the compose file overrides it with the internal
address, which is the setting people most often get wrong when copying a dev
file onto a server.

`NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` are compiled into the
build, not read at runtime. Changing either means rebuilding, not restarting.

### 3. Is the proxy a container?

Check before starting:

```bash
docker inspect <proxy-container> \
  -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

If the proxy runs under systemd on the host, skip this — the default setup
publishes on 127.0.0.1 and the proxy reaches it there.

If the proxy is a **container**, it cannot: inside it, `127.0.0.1` is itself.
Widening the app's bind to `0.0.0.0` would work and would also expose it to
the internet directly, past the proxy. Instead put `PROXY_NETWORK` in `.env`
with the network above, and add the overlay to every compose command — the
app joins that network, publishes no host port at all, and the proxy reaches
it as `http://vibetag:3000`.

One thing to check before you do: **service names become DNS aliases on a
shared network.** If another project on that network already has a service
called `vibetag`, rename ours. This is also why ours is not called `app` —
half the compose files in the world have an `app`.

### 4. Build and start

If the machine is tight on memory, give the build somewhere to spill first.
A Next.js build wants 1–2 GB, and an out-of-memory kill on a shared box does
not politely pick your container:

```bash
free -m                                    # under ~2 GB available?
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
```

```bash
docker compose -f docker-compose.prod.yml up -d --build
# proxy in a container? add the overlay to this and every later command:
#   -f docker-compose.prod.yml -f docker-compose.proxy.yml

docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f vibetag     # Ctrl-C to leave
```

Three containers come up in order: the database, then a one-shot `migrate`
that applies pending migrations and exits, then the app. If the migration
fails the app never starts — which is the point.

```bash
docker compose -f docker-compose.prod.yml logs migrate
```

```bash
# host-published setup
curl -s localhost:3100/api/health                                  # {"ok":true}
# proxy-network setup — ask from inside the proxy container
docker exec <proxy-container> wget -qO- http://vibetag:3000/api/health
```

**Connection refused** while the log says `Ready` means the server is
listening on an address you are not asking. Check what it printed:

```bash
docker compose -f docker-compose.prod.yml logs vibetag | grep Local
```

`http://0.0.0.0:3000` is right; a container id there means `HOSTNAME` is
reaching the standalone server, which binds to it.

A **503** from that health check means Next.js is up but the database query
failed. The reason is in `docker compose -f docker-compose.prod.yml logs
vibetag`, tagged `[health]`; to ask Prisma directly:

```bash
docker exec vibetag-vibetag-1 printenv DATABASE_URL
docker exec vibetag-vibetag-1 node -e 'const{PrismaClient}=require("@prisma/client");new PrismaClient().$queryRaw`SELECT 1`.then(r=>console.log("OK",r)).catch(e=>console.error("ERR",e.message))'
```

`Authentication failed` while `migrate` succeeded with the same URL is the
name-collision case: the app is on the shared proxy network as well, and on a
shared network service names are a global namespace. That is why the database
answers to `vibetag-db` rather than `db`. If you see it anyway, check who else
claims the name:

```bash
docker network inspect "$PROXY_NETWORK" -f '{{range .Containers}}{{.Name}} {{end}}'
```

Swap can come back off once the build is done: `sudo swapoff /swapfile &&
sudo rm /swapfile`. Leaving it costs nothing but 2 GB of disk, and saves the
next build.

Nothing is reachable from outside yet — that is the next step, and the only
one that touches shared configuration.

### 5. Reverse proxy

Add a new site. Do not edit the blocks serving your other apps.

**nginx** — `/etc/nginx/sites-available/vibetag.net`:

```nginx
server {
    server_name vibetag.net;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        # Without this the app builds invite links as http:// behind your TLS.
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
    }

    # Profile photos are data URLs today, so a server action can carry one.
    client_max_body_size 6m;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/vibetag.net /etc/nginx/sites-enabled/
sudo nginx -t          # never reload without this passing
sudo systemctl reload nginx
sudo certbot --nginx -d vibetag.net
```

**nginx in a container** — the config is wherever that container mounts it
from, not `/etc/nginx` on the host. Find it with:

```bash
docker inspect <proxy-container> -f '{{range .Mounts}}{{.Source}} → {{.Destination}}
{{end}}'
```

Same server block as above, with one change: `proxy_pass` goes to the
container, since there is no host port.

```nginx
    proxy_pass http://vibetag:3000;
```

Reload without restarting, so the other sites never drop a request:

```bash
docker exec <proxy-container> nginx -t
docker exec <proxy-container> nginx -s reload
```

**Caddy** — append to `/etc/caddy/Caddyfile`:

```
vibetag.net {
    reverse_proxy 127.0.0.1:3100
    request_body { max_size 6MB }
}
```

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy handles the certificate itself; with nginx, certbot does.

**A certbot container that only renews is half a renewal.** The common setup —
`while :; do certbot renew; sleep 12h; done` — writes the new certificate and
stops there. nginx keeps serving the one it loaded at startup, so the change
is invisible until something restarts it, and if nothing does, every site on
that proxy expires on the same day. Renewal has to reload the proxy:

```bash
# in the certbot container's command
certbot renew --deploy-hook "..."      # if it can reach the proxy, or
# on the host, weekly:
docker exec <proxy-container> nginx -s reload
```

A reload is not a restart: existing connections finish, and the other sites
never drop a request. This is shared configuration — agree it with whoever
owns the server before changing it.

### 6. Email (Resend)

Without this, nobody can register: the sign-up code has nowhere to go, and the
verification screen is the only thing a new account can reach.

Two steps at [resend.com](https://resend.com), in this order:

1. **Domains → Add domain.** Resend shows a set of DKIM and SPF records; put
   them in Cloudflare DNS for `vibetag.net` **grey-clouded** (they are TXT and
   MX records, not web traffic). Wait for it to say Verified. An unverified
   domain gets rejected or filed as spam, which for a sign-up code is the same
   as not sending it.
2. **API Keys → Create.** Sending permission is enough.

Then, in `.env` on the server:

```bash
RESEND_API_KEY="re_…"
EMAIL_FROM="Vibe Tag <noreply@vibetag.net>"
```

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.proxy.yml up -d
```

No rebuild — neither variable is baked into the bundle. Check it works by
registering a throwaway account and watching for the code; if nothing arrives,
`/moderation/errors` will have the reason.

### 7. Nightly fraud sweep

As the `vibetag` user, `crontab -e` — not root's crontab, and not a file in
`/etc/cron.d` that another app might also be editing:

```
0 3 * * * curl -fsS -X POST -H "Authorization: Bearer <CRON_SECRET>" https://vibetag.net/api/cron/fraud-sweep >/dev/null
```

### 8. Store billing (App Store / Google Play) — when the apps exist

The server side is ready and dormant: three endpoints that refuse with 503
until these variables are set. There is no web checkout on purpose — plans
are bought in the mobile apps, and until those ship, discount codes and the
admin panel are the ways onto a paid plan.

What the mobile shell will do: finish the purchase with StoreKit / Play
Billing, then `POST /api/store/verify` as the signed-in user with
`{"platform":"APPLE"|"GOOGLE","token":"<originalTransactionId | purchaseToken>"}`.
The server asks the store directly whether that purchase is real and writes
`plan` + `planUntil`. "Restore purchases" is the same call again.

In `.env` on the server:

```bash
# shared guard for both webhook URLs
STORE_WEBHOOK_KEY="<openssl rand -hex 32>"

# Apple — App Store Connect → Users and Access → Integrations → App Store Server API
APPLE_ISSUER_ID="…"
APPLE_KEY_ID="…"
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----"
APPLE_BUNDLE_ID="net.vibetag.app"

# Google — a service account with the Android Publisher scope, invited in Play Console
GOOGLE_PLAY_PACKAGE="net.vibetag.app"
GOOGLE_PLAY_SA_EMAIL="…@….iam.gserviceaccount.com"
GOOGLE_PLAY_SA_KEY="-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----"
```

In the store consoles:

1. Create the subscriptions with **exactly** the product ids in
   `src/lib/store-products.ts` (`net.vibetag.silver.monthly`,
   `net.vibetag.silver.yearly`, `net.vibetag.gold.monthly`,
   `net.vibetag.gold.yearly`) — on both platforms. A purchase with any other
   id verifies fine and grants nothing.
2. App Store Connect → App Information → App Store Server Notifications V2 →
   `https://vibetag.net/api/store/apple?key=<STORE_WEBHOOK_KEY>`
3. Play Console → Monetization setup → Real-time developer notifications →
   a Pub/Sub topic whose push subscription points at
   `https://vibetag.net/api/store/google?key=<STORE_WEBHOOK_KEY>`

Webhooks are treated as pokes: on every event the store's server API is
asked for the authoritative state, so a forged webhook can at worst make us
re-check a subscription. Store-granted plans expire through the same nightly
sweep as everything else.

### 9. Backups

```bash
mkdir -p ~/backups
```

`crontab -e`:

```
0 4 * * * docker exec vibetag-db-1 pg_dump -U vibetag vibetag | gzip > ~/backups/vibetag-$(date +\%F).sql.gz
0 5 * * 0 find ~/backups -name '*.sql.gz' -mtime +30 -delete
```

Check the container name against `docker compose -f docker-compose.prod.yml ps`
first, and copy the dumps somewhere that is not this server.

### Behind Cloudflare

If the DNS record is proxied — `dig +short yourdomain` returns Cloudflare
addresses rather than your server — two things change.

**Certificates.** Cloudflare terminates TLS at its edge, so what the browser
sees is Cloudflare's certificate no matter what the origin has. The origin
still needs one, and which one depends on the SSL/TLS mode:

- **Full (strict)** — the right setting. The origin needs a real certificate.
  Let's Encrypt's HTTP-01 challenge still works through the proxy, but the
  simplest path is to turn the orange cloud grey for a few minutes, issue the
  certificate, then turn it back on.
- **Flexible** — Cloudflare talks to your origin over plain HTTP. Do not use
  it: ratings and passwords would cross the last hop unencrypted.

**The client's real address.** Every request arrives from a Cloudflare IP, so
without `X-Forwarded-For` the app sees one visitor. The proxy config above
forwards it; if your nginx also sets `real_ip_header CF-Connecting-IP` with
`set_real_ip_from` for Cloudflare's ranges, better still.

Also worth setting, in Cloudflare: **Rules → Configuration Rules**, or simply
leave caching alone. Every route here is dynamic and none should be cached;
Cloudflare will not cache HTML by default, so the default is already right.

### Updating later

```bash
sudo -iu vibetag && cd app
git fetch --tags && git checkout <new-tag>
docker compose -f docker-compose.prod.yml up -d --build
```

Migrations apply on start. Nothing else on the server is touched. Docker
keeps every old build layer, so on a tight disk run `docker image prune -f`
after a few releases — it removes untagged layers only, never a running
image.

### Removing it cleanly

```bash
docker compose -f docker-compose.prod.yml down          # keeps the data
docker compose -f docker-compose.prod.yml down -v       # deletes it too
```

Scoped to the `vibetag` project — no other container is affected.

## After deploying — either path

Run these before telling anyone the link exists.

```bash
curl -s https://vibetag.net/api/health                                     # {"ok":true}
curl -s -o /dev/null -w "%{http_code}\n" https://vibetag.net/              # 200
curl -s -o /dev/null -w "%{http_code}\n" https://vibetag.net/legal/kvkk    # 200

# Must refuse without the secret
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://vibetag.net/api/cron/fraud-sweep   # 403
```

On a shared server, also confirm you broke nothing:

```bash
sudo nginx -t                        # or: sudo caddy validate --config /etc/caddy/Caddyfile
docker ps --format '{{.Names}}\t{{.Status}}'
```

Every container that was up before should still be up.

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
sudo -iu vibetag && cd app
git checkout <previous-tag>
docker compose -f docker-compose.prod.yml up -d --build
```

Both roll back *code*. A migration that dropped a column is not undone by
either — restore from the backup. This is why releases are tagged.

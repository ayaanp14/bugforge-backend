# Deploying the API and its database to AWS

One Lightsail instance in **ap-south-1 (Mumbai)** running the API, MySQL,
Redis and Caddy under Docker Compose.

## Why this shape

The old topology was the problem, not the code. Measured from Railway against
the cPanel host on 2026-09-23 (the numbers are in `src/lib/prisma.ts`):

```
TCP round trip ............ 270 ms
SELECT 1 .................. 269 ms
SELECT COUNT(*) Submission  269 ms   <- identical to SELECT 1
opening a connection ...... 1117 ms
```

Server-side execution was a rounding error; every millisecond was wire. Redis
was worse — us-east-1, ~300 ms a hop. Putting all three on one box turns those
into loopback. `/api/billing/me` issues five round trips: ~2.5 s becomes ~5 ms.

Three things rule out anything fancier:

- **Socket.IO** needs real WebSockets (`wss://api.codekairo.com` is pinned in
  the frontend CSP), which rules out Lambda. App Runner is not available on
  the Free plan.
- **One instance only.** `middleware/rate-limit.ts` keeps counters in process
  and says so: *"Move counters to Redis before running more than one
  instance."* Scaling out silently breaks rate limiting.
- **No Judge0 needed.** Production runs `EXECUTOR=paiza,judge0` and Paiza is
  hosted. Self-hosting Judge0 would dominate the bill.

## Cost

| | |
| --- | --- |
| Lightsail `small_3_1` (2 vCPU, 2 GB, 60 GB SSD, 1.5 TB transfer) | **$12/month** |
| Static IP (while attached) | free |
| Snapshots | ~$0.05/GB-month |

The account holds **$100 of credits expiring 2027-03-23**, so this runs ~6
months inside the credits with room to spare. Set a spend limit in AWS
Settings → Billing before going further; on the new AWS experience an
exceeded limit pauses the project, and sudden `AccessDenied` on calls that
used to work is what that looks like.

## Prerequisites

- `aws login --region ap-south-1 --profile default` — grants are short-lived,
  so expect to redo this between sessions.
- The Railway environment variables to hand. **`JWT_SECRET` and
  `PLATFORM_SECRET` must carry over unchanged**: a new `JWT_SECRET` signs out
  every account at once, and `PLATFORM_SECRET` must match what the deployed
  frontend bundle was built with or every signed request is refused.

---

## 1. Provision

```bash
aws lightsail create-key-pair --key-pair-name codekairo-deploy \
  --region ap-south-1 --profile default \
  --query 'privateKeyBase64' --output text > ~/.ssh/codekairo-lightsail.pem
chmod 600 ~/.ssh/codekairo-lightsail.pem     # the key is shown exactly once

aws lightsail create-instances \
  --instance-names codekairo-api \
  --availability-zone ap-south-1a \
  --blueprint-id ubuntu_24_04 \
  --bundle-id small_3_1 \
  --key-pair-name codekairo-deploy \
  --user-data file://cloud-init.sh \
  --region ap-south-1 --profile default

aws lightsail allocate-static-ip --static-ip-name codekairo-ip \
  --region ap-south-1 --profile default
aws lightsail attach-static-ip --static-ip-name codekairo-ip \
  --instance-name codekairo-api --region ap-south-1 --profile default
```

Firewall: 80 and 443 from anywhere (Cloudflare reaches them), 22 from your own
address only.

```bash
aws lightsail put-instance-public-ports --instance-name codekairo-api \
  --port-infos \
    fromPort=80,toPort=80,protocol=TCP \
    fromPort=443,toPort=443,protocol=TCP \
    fromPort=22,toPort=22,protocol=TCP,cidrs=YOUR.IP.HERE/32 \
  --region ap-south-1 --profile default
```

`cloud-init.sh` installs Docker and compose v2, adds a 2 GB swapfile (2 GB of
RAM with MySQL and Node on it has no headroom for a spike), caps container
log growth and turns on unattended security updates.

It deliberately does **not** clone the repository. `bugforge-backend` is
private, and a token in user-data stays readable from the instance metadata
service for the life of the box. Add a read-only **deploy key** on GitHub
instead:

```bash
ssh-keygen -t ed25519 -C codekairo-deploy -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub      # paste into repo -> Settings -> Deploy keys
git clone git@github.com:ayaanp14/bugforge-backend.git ~/codekairo-backend
```

## 2. Cloudflare Origin Certificate

Public TLS is Cloudflare's; this secures Cloudflare → origin, which is what
**Full (strict)** requires.

1. Cloudflare dashboard → SSL/TLS → Origin Server → **Create Certificate**.
2. Hostnames `api.codekairo.com`, RSA, 15 years.
3. Save the certificate as `deploy/certs/origin.pem` and the private key as
   `deploy/certs/origin.key` **on the instance**. Both are gitignored.
4. SSL/TLS → Overview → set encryption mode to **Full (strict)**.

`chmod 600 deploy/certs/origin.key`.

## 3. Environment

```bash
cp deploy/.env.production.example deploy/.env.production
$EDITOR deploy/.env.production     # never commit this
chmod 600 deploy/.env.production
```

`DATABASE_URL` points at the `mysql` compose service, not localhost.
`connection_limit` can be generous now — the old shared host capped the whole
account at 25 connections; this MySQL is ours and allows 60.

## 4. Bring it up

```bash
cd ~/codekairo-backend/deploy
docker compose up -d
docker compose ps
docker compose logs -f api
```

The API image is built by `.github/workflows/build-image.yml` and pulled from
`ghcr.io`, so nothing compiles here. If that workflow has never run — a brand
new repo, or the registry is unreachable — `docker compose up -d --build api`
still works; it is only unsafe once MySQL is live on the same box (see
`deploy.sh`'s header).

Then create the schema:

```bash
docker compose exec -e DATABASE_URL="$DATABASE_URL" api npx prisma db push
```

> `prisma` is a devDependency and is pruned from the runtime image, so schema
> pushes run from a workstation against the instance, or from a one-off
> container that has the dev dependencies. See "Schema changes" below.

## 5. Move the data

The source is Percona 8.0.46, all InnoDB, `lower_case_table_names=0` — which
matters, because the schema is CamelCase (`User`, `TestCase`). `deploy/mysql.cnf`
pins the same value; a server that folded names to lowercase would break every
query.

**Preferred — dump straight onto the instance** (one transfer instead of two).
Needs the instance's static IP added to cPanel → Remote MySQL first:

```bash
docker run --rm mysql:8.4 mysqldump \
  -h 66.116.209.226 -u <user> -p<pass> \
  --single-transaction --quick --no-tablespaces \
  --set-gtid-purged=OFF --routines --triggers --events \
  verto84f_bot | gzip > codekairo-$(date +%F).sql.gz
```

**Fallback — dump on your workstation and upload.** Same command, then:

```bash
scp -i ~/.ssh/codekairo-lightsail.pem codekairo-*.sql.gz ubuntu@<STATIC_IP>:~/
```

Restore either way:

```bash
gunzip -c codekairo-*.sql.gz | docker compose exec -T mysql \
  mysql -u root -p"$MYSQL_ROOT_PASSWORD" codexa
```

Verify before cutting over — these should match the source exactly
(2,991,686 test cases and 598 problems as of 2026-09-23):

```bash
docker compose exec mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" codexa \
  -e "SELECT (SELECT COUNT(*) FROM TestCase) tc, (SELECT COUNT(*) FROM Problem) p, (SELECT COUNT(*) FROM User) u;"
```

Then run the one-per-database backfills, or they are silently skipped forever:

```bash
npx tsx scripts/backfill-bug-slugs.ts --apply
npx tsx scripts/auth-hardening-backfill.ts --apply
npx tsx scripts/seed-roadmap.ts --seed      # "no stages are seeded" at boot otherwise
```

## 6. Cut DNS over

Only after step 5 verifies. In Cloudflare, change the `api` record to an **A**
record pointing at the static IP, **proxied (orange cloud)**.

Check before and after:

```bash
curl -s https://api.codekairo.com/health
curl -si https://api.codekairo.com/api/seo/head?path=/problems/two-sum | head -5
```

WebSockets need no special handling — Caddy proxies the Upgrade handshake, and
Cloudflare passes it through on a proxied record.

**Keep Railway running until this is verified.** Rollback is pointing the DNS
record back; TTL is the only delay.

---

## Operations

**Redeploy after a push**

```bash
~/codekairo-backend/deploy/deploy.sh
```

It fetches, waits for the image CI built for that exact commit, pins it in
`deploy/.env` as `API_IMAGE`, restarts and checks `/health` — and puts the
previous image back by itself if the new one does not answer 200. Caddy holds
connections while `api` restarts, so the outage is the container's boot time.

**Deploy on push (.github/workflows/deploy.yml)**

A push to `main` whose CI passes deploys itself: the Deploy workflow signs in
to AWS with GitHub's OIDC token, sends `deploy/ci-deploy.sh` to the instance
through SSM Run Command, and that runs `deploy.sh` — which waits for the
image, checks `/health` and rolls back on its own. No polling, no inbound
port, no stored credential. The run's log in the Actions tab carries the
instance's output. A push that changes `prisma/schema.prisma` is refused
(the run goes red): apply the schema, then run `deploy.sh` by hand. The
Actions tab's "Run workflow" button on Deploy redeploys `main` on demand.

Set up once, in the AWS console (ap-south-1):

1. **Instance role** — IAM → Roles → Create role → AWS service, EC2 → attach
   `AmazonSSMManagedInstanceCore` → name it `codekairo-ec2-ssm`. Then EC2 →
   the instance → Actions → Security → Modify IAM role → pick it. The SSM
   agent that ships in Canonical's Ubuntu AMI registers within a few minutes
   (`sudo snap restart amazon-ssm-agent` if it does not).
2. **GitHub as an identity provider** — IAM → Identity providers → Add →
   OpenID Connect, URL `https://token.actions.githubusercontent.com`,
   audience `sts.amazonaws.com`.
3. **The deploy role** — IAM → Roles → Create role → Custom trust policy →
   paste `deploy/aws/github-deploy-trust.json` → no managed policies → name
   it `codekairo-github-deploy`. Then on the role, Add permissions → Create
   inline policy → JSON → paste `deploy/aws/github-deploy-policy.json`.
   The trust admits only this repo's `main`; the policy allows SendCommand
   on this one instance and nothing else.

Rolling back later is one line: set `API_IMAGE` in `deploy/.env` to an older
`sha-…` tag and `docker compose up -d api`. Every deployed image is kept
locally for a week.

**Logs**

```bash
docker compose logs -f api
docker compose logs --tail 100 caddy
docker compose exec mysql tail -f /var/lib/mysql/slow.log   # >500 ms
```

**Backups.** Snapshots are the backup story on this architecture — there is no
managed PITR. Automate them:

```bash
aws lightsail enable-add-on --resource-name codekairo-api \
  --add-on-request addOnType=AutoSnapshot,autoSnapshotAddOnRequest={snapshotTimeOfDay=20:00} \
  --region ap-south-1 --profile default
```

20:00 UTC is 01:30 IST — after the quiet hours for an India-facing product.
A logical dump alongside it is cheap insurance:

```bash
docker compose exec -T mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" \
  --single-transaction --quick codexa | gzip > ~/backups/codexa-$(date +%F).sql.gz
```

**Schema changes.** `prisma db push` needs the CLI, which the runtime image
does not carry. Run it from a workstation with `DATABASE_URL` pointed at the
instance (open 3306 to your IP only, briefly), or:

```bash
docker compose run --rm --entrypoint sh api -c "npm i prisma --no-save && npx prisma db push"
```

**Memory.** 2 GB with a 768 MB buffer pool and Node alongside is deliberate but
not roomy. Watch it:

```bash
free -h && docker stats --no-stream
```

If MySQL is being OOM-killed, lower `innodb_buffer_pool_size` in
`deploy/mysql.cnf` before reaching for a bigger bundle — `medium_3_1` doubles
the bill to $24/month and would outrun the credits.

## What this does not do

- **No horizontal scaling.** See the rate-limiter note above. Moving those
  counters to Redis is the prerequisite, and Redis is now local, so it is a
  much smaller job than it was.
- **No managed failover.** One box. If it dies, you restore a snapshot.
- **No blind deploys.** CI builds the image; the box pulls it, either when a
  human runs `deploy/deploy.sh` or when the Deploy workflow does after CI
  passes — and a bad image still cannot take the site down on its own,
  because `deploy.sh` rolls back when `/health` fails.

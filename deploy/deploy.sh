#!/usr/bin/env bash
# One-command deploy: pull, rebuild, restart, verify -- and roll back on its
# own if the new build does not come up healthy.
#
#   ~/codekairo-backend/deploy/deploy.sh
#
# Deliberately not triggered by a push. Pushing runs CI and stops there; a
# deploy is a decision someone makes, so a bad merge cannot take the site down
# on its own.
#
# The rollback matters because this builds on the machine that is serving
# traffic. If the image is broken, or the build gets OOM-killed on a 2 GB box,
# the previous image is retagged and restarted rather than leaving the site
# down while someone reads a stack trace.

set -uo pipefail

cd "$(dirname "$0")/.."
REPO_DIR="$(pwd)"
cd deploy

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
health() {
  curl -sk --max-time 10 --resolve api.codekairo.com:443:127.0.0.1 \
    -H 'CF-Connecting-IP: 127.0.0.1' -o /dev/null -w '%{http_code}' \
    https://api.codekairo.com/health 2>/dev/null || echo 000
}

say "1/6  current state"
echo "  running commit : $(cd "$REPO_DIR" && git log --oneline -1)"
echo "  health now     : HTTP $(health)"

say "2/6  fetching"
cd "$REPO_DIR"
BEFORE="$(git rev-parse HEAD)"
if ! git pull --ff-only origin main; then
  echo "  pull failed (local changes on the box?). Nothing deployed."
  exit 1
fi
AFTER="$(git rev-parse HEAD)"

if [ "$BEFORE" = "$AFTER" ]; then
  echo "  already up to date -- rebuilding anyway in case the image is behind the code"
else
  echo
  echo "  changes coming in:"
  git log --oneline "$BEFORE..$AFTER" | sed 's/^/    /'
  echo
  echo "  files touched:"
  git diff --stat "$BEFORE..$AFTER" | tail -15 | sed 's/^/    /'
fi

# A schema change needs `prisma db push` and this script will not do that for
# you -- it is not something to run unattended against production data.
if ! git diff --quiet "$BEFORE..$AFTER" -- prisma/schema.prisma 2>/dev/null; then
  say "!!  prisma/schema.prisma changed"
  echo "  This deploy does NOT apply schema changes. Run the db push yourself"
  echo "  (deploy/README.md) before or after, whichever the change needs."
fi

cd deploy

say "3/6  remembering the current image, so a failure can be undone"
OLD_IMAGE="$(docker compose images -q api 2>/dev/null | head -1)"
if [ -n "$OLD_IMAGE" ]; then
  docker tag "$OLD_IMAGE" codekairo-api:rollback
  echo "  tagged codekairo-api:rollback -> ${OLD_IMAGE:0:12}"
else
  echo "  no current image found; rollback will not be available"
fi

say "4/6  building"
if ! docker compose build api; then
  echo
  echo "  BUILD FAILED. Nothing was restarted; the old container is still serving."
  echo "  health: HTTP $(health)"
  exit 1
fi

say "5/6  restarting"
docker compose up -d api

say "6/6  verifying"
ok=""
for i in $(seq 1 20); do
  sleep 5
  code="$(health)"
  echo "  attempt $i: HTTP $code"
  if [ "$code" = "200" ]; then ok=yes; break; fi
done

if [ -n "$ok" ]; then
  echo
  echo "  DEPLOYED: $(cd "$REPO_DIR" && git log --oneline -1)"
  docker compose ps --format 'table {{.Service}}\t{{.Status}}'
  # Only drop the rollback tag once the new build has proved itself.
  docker rmi codekairo-api:rollback >/dev/null 2>&1
  exit 0
fi

say "FAILED to come up healthy -- rolling back"
if docker image inspect codekairo-api:rollback >/dev/null 2>&1; then
  # Point the compose service at the previous image and restart it.
  docker tag codekairo-api:rollback "$(docker compose images -q api | head -1)" 2>/dev/null
  docker compose up -d --no-build api
  sleep 15
  echo "  health after rollback: HTTP $(health)"
  echo "  the code in $REPO_DIR is still the NEW commit; the running image is the old one."
  echo "  fix forward, then run this script again."
else
  echo "  no rollback image available. Recent logs:"
  docker compose logs --tail 40 api
fi
exit 1

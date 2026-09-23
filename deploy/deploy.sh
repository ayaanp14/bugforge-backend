#!/usr/bin/env bash
# One-command deploy: fetch, pull the image CI already built, restart, verify --
# and roll back on its own if the new image does not come up healthy.
#
#   ~/codekairo-backend/deploy/deploy.sh
#
# Deliberately not triggered by a push. Pushing runs CI and stops there; a
# deploy is a decision someone makes, so a bad merge cannot take the site down
# on its own.
#
# Nothing is compiled here any more. The image is built by
# .github/workflows/build-image.yml, because `docker compose build` on this box
# peaked high enough to push InnoDB's buffer pool into swap -- measured
# 2026-09-23, mysqld sat at 826 MB swapped and a COUNT went from p50 1.92 ms to
# p95 69.35 ms while a build ran. The long comment in deploy/mysql.cnf has the
# rest of that story.
#
# The image is pinned by commit sha in deploy/.env (API_IMAGE), not floated on
# :latest. That matters more than it looks: a reboot, a watchdog restart and a
# bare `docker compose up -d` then all bring back exactly what was deployed and
# verified, instead of silently picking up whatever CI pushed since. It also
# makes a rollback one line of that file rather than an image-retagging dance.

set -uo pipefail

cd "$(dirname "$0")/.."
REPO_DIR="$(pwd)"
cd deploy
DEPLOY_DIR="$(pwd)"
ENV_FILE="$DEPLOY_DIR/.env"

# Derived from the git remote rather than written out, so this cannot drift
# from the workflow's ${{ github.repository }}. GHCR paths must be lowercase.
ORIGIN="$(git -C "$REPO_DIR" remote get-url origin 2>/dev/null)"
SLUG="$(printf '%s' "$ORIGIN" | sed -E 's#^git@github\.com:##; s#^https?://github\.com/##; s#\.git$##' | tr '[:upper:]' '[:lower:]')"
if [ -z "$SLUG" ]; then
  echo "could not work out the GitHub repo from '$ORIGIN'; set REGISTRY_IMAGE by hand." >&2
  exit 1
fi
REGISTRY_IMAGE="${REGISTRY_IMAGE:-ghcr.io/$SLUG}"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
health() {
  curl -sk --max-time 10 --resolve api.codekairo.com:443:127.0.0.1 \
    -H 'CF-Connecting-IP: 127.0.0.1' -o /dev/null -w '%{http_code}' \
    https://api.codekairo.com/health 2>/dev/null || echo 000
}

current_image() {
  if [ -f "$ENV_FILE" ] && grep -q '^API_IMAGE=' "$ENV_FILE"; then
    grep '^API_IMAGE=' "$ENV_FILE" | head -1 | cut -d= -f2-
    return
  fi
  # Nothing pinned yet (first deploy after the CI switch): fall back to whatever
  # the running container was started from.
  local cid
  cid="$(docker compose ps -q api 2>/dev/null | head -1)"
  [ -n "$cid" ] && docker inspect --format '{{.Config.Image}}' "$cid" 2>/dev/null
}

pin_image() {
  touch "$ENV_FILE"
  if grep -q '^API_IMAGE=' "$ENV_FILE"; then
    sed -i "s|^API_IMAGE=.*|API_IMAGE=$1|" "$ENV_FILE"
  else
    printf 'API_IMAGE=%s\n' "$1" >> "$ENV_FILE"
  fi
}

say "1/6  current state"
echo "  running commit : $(git -C "$REPO_DIR" log --oneline -1)"
OLD_IMAGE="$(current_image)"
echo "  running image  : ${OLD_IMAGE:-<none pinned>}"
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
  echo "  already up to date -- redeploying anyway in case the running image is behind the code"
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

cd "$DEPLOY_DIR"

say "3/6  resolving the image for $(git -C "$REPO_DIR" rev-parse --short HEAD)"
# The workflow tags with `type=sha,format=long`, i.e. github.sha -- the TIP of
# the push that triggered it, not whichever commit inside that push touched
# src/. So the tag to want is always HEAD's; the only question is whether a
# build is coming for it.
#
# And it often is not: the workflow is path-filtered, so a push carrying only
# deploy/, README or compose changes publishes nothing at all, and HEAD's tag
# will never exist. Waiting for it burns the full timeout for nothing --
# 28e7264, 2026-09-23: a deploy/-only commit, with the correct image already
# running the whole time.
#
# Keep this list in step with `paths:` in .github/workflows/build-image.yml.
IMAGE_PATHS=(src prisma content package.json package-lock.json tsconfig.json Dockerfile .dockerignore .github/workflows/build-image.yml)
EXPECT_BUILD=""
if [ "$BEFORE" != "$AFTER" ] && ! git -C "$REPO_DIR" diff --quiet "$BEFORE..$AFTER" -- "${IMAGE_PATHS[@]}" 2>/dev/null; then
  EXPECT_BUILD=yes
fi

TARGET="$REGISTRY_IMAGE:sha-$AFTER"
echo "  want: $TARGET"
[ -n "$EXPECT_BUILD" ] || echo "  (nothing in this pull changes the image, so no build is coming)"

# CI takes a few minutes on the arm64 runner. Wait for it only when a build is
# actually coming; give up quickly otherwise.
DEADLINE=$(( $(date +%s) + 600 ))
PULLED=""
while :; do
  if OUT="$(docker pull "$TARGET" 2>&1)"; then
    PULLED=yes
    echo "  pulled $TARGET"
    break
  fi

  case "$OUT" in
    *denied*|*unauthorized*|*authentication*)
      echo
      echo "  The registry refused this box."
      echo "  Either make the package public (GitHub > the repo > Packages >"
      echo "  bugforge-backend > Package settings > Change visibility), or log in:"
      echo "    echo <a PAT with read:packages> | docker login ghcr.io -u <you> --password-stdin"
      echo "  Nothing was restarted; the old container is still serving."
      exit 1
      ;;
  esac

  if [ -z "$EXPECT_BUILD" ] || [ "$(date +%s)" -ge "$DEADLINE" ]; then
    break
  fi
  echo "  not published yet -- waiting for the build ($(( (DEADLINE - $(date +%s)) / 60 )) min left)"
  sleep 20
done

if [ -z "$PULLED" ]; then
  if [ -n "$EXPECT_BUILD" ]; then
    echo
    echo "  Gave up waiting for $TARGET."
    echo "  Check the run: https://github.com/$SLUG/actions/workflows/build-image.yml"
    echo "  Nothing was restarted; the old container is still serving."
    exit 1
  fi
  # A GHCR blip is no reason to drop back a version when the box already holds
  # exactly the image it asked for.
  if docker image inspect "$TARGET" >/dev/null 2>&1; then
    echo "  registry would not serve it, but $TARGET is already on this box"
  else
    # HEAD has no tag of its own, so walk back for the newest ancestor that
    # does. The registry is the only authority on which pushes actually built
    # -- re-deriving the path filter here would only be a second copy of it to
    # keep in step -- so ask it, newest first, and stop at the first hit.
    echo "  no image for HEAD; looking back for the newest one that was built"
    for sha in $(git -C "$REPO_DIR" rev-list --first-parent -n 40 HEAD); do
      [ "$sha" = "$AFTER" ] && continue
      if docker pull "$REGISTRY_IMAGE:sha-$sha" >/dev/null 2>&1; then
        TARGET="$REGISTRY_IMAGE:sha-$sha"
        PULLED=yes
        echo "  built at: $(git -C "$REPO_DIR" log --oneline -1 "$sha")"
        echo "  pulled $TARGET"
        break
      fi
    done
  fi

  if [ -z "$PULLED" ] && ! docker image inspect "$TARGET" >/dev/null 2>&1; then
    # Nothing published within reach. Still worth restarting, since compose
    # files, .env or mysql.cnf may have changed -- but on the same image.
    TARGET="${OLD_IMAGE:-$REGISTRY_IMAGE:latest}"
    echo "  nothing published in the last 40 commits; keeping $TARGET"
  fi
fi

say "4/6  pinning it"
pin_image "$TARGET"
echo "  deploy/.env now says API_IMAGE=$TARGET"
[ -n "$OLD_IMAGE" ] && echo "  (rolls back to ${OLD_IMAGE})"

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
  echo "  DEPLOYED: $(git -C "$REPO_DIR" log --oneline -1)"
  echo "  image:    $TARGET"
  docker compose ps --format 'table {{.Service}}\t{{.Status}}'
  # Keep the last few images for a rollback that does not need the network;
  # drop the rest so /var/lib/docker does not grow on a 20 GB disk.
  docker image prune -f --filter 'until=168h' >/dev/null 2>&1
  exit 0
fi

say "FAILED to come up healthy -- rolling back"
if [ -n "$OLD_IMAGE" ] && docker image inspect "$OLD_IMAGE" >/dev/null 2>&1; then
  pin_image "$OLD_IMAGE"
  docker compose up -d api
  sleep 15
  echo "  health after rollback: HTTP $(health)"
  echo "  running image: $OLD_IMAGE"
  echo "  the code in $REPO_DIR is still the NEW commit; the running image is the old one."
  echo "  fix forward, then run this script again."
else
  echo "  no previous image available locally. Recent logs:"
  docker compose logs --tail 40 api
fi
exit 1

#!/usr/bin/env bash
# One-command deploy: fetch, pull the image CI already built, restart, verify --
# and roll back on its own if the new image does not come up healthy.
#
#   ~/codekairo-backend/deploy/deploy.sh
#
# Run by hand, or by .github/workflows/deploy.yml (through SSM and
# ci-deploy.sh) once CI has passed on a push to main -- that path refuses a
# schema change, which stays a decision someone makes. Either way a bad image
# cannot take the site down on its own: step 6 below rolls back when /health
# does not come up.
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

say "3/6  resolving the image"

# Do not try to predict the tag. Two facts make that unreliable:
#
#   - CI tags with `type=sha,format=long`, i.e. github.sha -- the TIP of the
#     push that triggered the build, not whichever commit inside it touched
#     src/. A push carrying a src/ commit and a deploy/ commit publishes one
#     image, named after the deploy/ commit.
#   - the workflow is path-filtered, so a push of only deploy/, README or
#     compose changes publishes nothing at all.
#
# And a box that is several pushes behind sees one range spanning all of them,
# with no way to tell where one push ended and the next began. Every rule of
# the form "the tag will be X" gets this wrong somewhere, and being wrong costs
# ten minutes of polling for a tag that was never coming (28e7264 and d9ef186,
# 2026-09-23, both with the correct image already on the box).
#
# So ask the registry which ancestor it actually has, then ask git the only
# question that matters: has anything that goes *into* the image changed since
# that commit? If not, that image is this code, whatever it happens to be
# named, and there is nothing to wait for.
#
# Keep this list in step with `paths:` in .github/workflows/build-image.yml.
IMAGE_PATHS=(src prisma content package.json package-lock.json tsconfig.json Dockerfile .dockerignore .github/workflows/build-image.yml)

# Pull attempted once, output kept so the caller can tell "no such tag" from
# "the registry will not talk to this box".
PULL_OUT=""
try_pull() {
  PULL_OUT="$(docker pull "$1" 2>&1)"
}

# Newest ancestor of HEAD the registry has an image for, left in BASE. Usually
# HEAD itself, in which case this is a single call.
#
# It reports through a global rather than stdout so that the caller does not
# have to run it in `$(...)`: inside a command substitution the refusal notice
# below would be captured instead of printed, and its `exit 1` would end only
# the subshell, leaving the script to carry on with the error text as BASE.
BASE=""
find_newest_published() {
  local sha
  for sha in $(git -C "$REPO_DIR" rev-list --first-parent -n 40 HEAD); do
    if try_pull "$REGISTRY_IMAGE:sha-$sha"; then
      BASE="$sha"
      return 0
    fi
    case "$PULL_OUT" in
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
  done
  return 1
}

# Is that image current for this checkout?
image_is_current() {
  git -C "$REPO_DIR" diff --quiet "$1..$AFTER" -- "${IMAGE_PATHS[@]}" 2>/dev/null
}

TARGET=""
find_newest_published || BASE=""

if [ -n "$BASE" ] && image_is_current "$BASE"; then
  TARGET="$REGISTRY_IMAGE:sha-$BASE"
  if [ "$BASE" = "$AFTER" ]; then
    echo "  $TARGET"
  else
    echo "  HEAD has no image of its own -- nothing in it changes the image."
    echo "  current image is the one built at $(git -C "$REPO_DIR" log --oneline -1 "$BASE")"
    echo "  $TARGET"
  fi
else
  # The image lags the code, so a build is on its way (or has failed). That
  # build will be tagged with HEAD, because HEAD is the tip of the push that
  # started it. CI takes a few minutes on the arm64 runner.
  if [ -n "$BASE" ]; then
    echo "  newest published image is from $(git -C "$REPO_DIR" log --oneline -1 "$BASE"),"
    echo "  and the image has changed since -- waiting for CI to publish HEAD's"
  else
    echo "  nothing published within the last 40 commits -- waiting for CI"
  fi
  WANT="$REGISTRY_IMAGE:sha-$AFTER"
  echo "  want: $WANT"
  DEADLINE=$(( $(date +%s) + 600 ))
  while :; do
    if try_pull "$WANT"; then
      TARGET="$WANT"
      echo "  pulled $TARGET"
      break
    fi
    if [ "$(date +%s)" -ge "$DEADLINE" ]; then break; fi
    echo "  not published yet -- waiting for the build ($(( (DEADLINE - $(date +%s)) / 60 )) min left)"
    sleep 20
  done

  if [ -z "$TARGET" ]; then
    echo
    echo "  Gave up waiting for $WANT."
    echo "  Check the run: https://github.com/$SLUG/actions/workflows/build-image.yml"
    echo "  Nothing was restarted; the old container is still serving."
    exit 1
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

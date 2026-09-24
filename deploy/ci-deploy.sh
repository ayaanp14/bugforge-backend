#!/usr/bin/env bash
# The server half of deploy-on-push. .github/workflows/deploy.yml runs this
# through AWS Systems Manager (Run Command) once CI has passed on main; SSM
# starts it as root and it drops to ubuntu, who owns the checkout and is in the
# docker group -- the same user a human runs deploy.sh as.
#
# The workflow does not call this file in place: it fetches main and runs
# `git show origin/main:deploy/ci-deploy.sh`, so the version that runs is
# always the one being deployed, including the very first time, when the
# checkout on the box does not have this file yet.
#
# Event-driven on purpose. The first cut polled GitHub from cron every two
# minutes (720 no-op checks a day); this runs only when a push to main has
# passed its tests, and needs no inbound port and no stored credential --
# GitHub signs in to AWS with a short-lived OIDC token scoped to this repo's
# main branch and to SendCommand on this one instance.
#
# What it refuses to do unattended: a push that changes prisma/schema.prisma.
# `db push` against production data is a decision (deploy.sh only warns about
# it). The workflow then fails red so the change is not silently skipped; run
# the db push and then deploy/deploy.sh by hand.

set -uo pipefail

if [ "$(id -un)" != "ubuntu" ]; then
  exec sudo -u ubuntu -H bash "$0" "$@"
fi

REPO_DIR="$HOME/codekairo-backend"

git -C "$REPO_DIR" fetch -q origin main || { echo "git fetch failed"; exit 1; }
HEAD_SHA="$(git -C "$REPO_DIR" rev-parse HEAD)"
NEW_SHA="$(git -C "$REPO_DIR" rev-parse origin/main)"

if [ "$HEAD_SHA" = "$NEW_SHA" ]; then
  # A CI run for an older push finishing after a newer one was deployed.
  echo "Already running $(git -C "$REPO_DIR" log --oneline -1) -- nothing to do."
  exit 0
fi

if ! git -C "$REPO_DIR" diff --quiet "$HEAD_SHA" "$NEW_SHA" -- prisma/schema.prisma; then
  echo "NOT DEPLOYED: prisma/schema.prisma changed between"
  echo "  $(git -C "$REPO_DIR" log --oneline -1 "$HEAD_SHA")"
  echo "  $(git -C "$REPO_DIR" log --oneline -1 "$NEW_SHA")"
  echo "Apply the schema (deploy/README.md, 'Schema changes'), then run deploy/deploy.sh by hand."
  exit 2
fi

# deploy.sh pulls, waits for CI's image, restarts, verifies /health and rolls
# back on its own; its exit code is the verdict the workflow reports.
exec "$REPO_DIR/deploy/deploy.sh"

#!/usr/bin/env bash
# Deploys main by itself: runs from cron every two minutes and hands a new
# commit to deploy.sh once CI has passed on it.
#
#   crontab: */2 * * * * $HOME/codekairo-backend/deploy/auto-deploy.sh
#   log:     ~/backups/autodeploy.log
#
# Pull, not push. The alternative was a GitHub Actions job that SSHes in or
# calls SSM, which needs port 22 open to GitHub's runner ranges or an IAM
# role + OIDC trust + a registered SSM agent. Asking GitHub "is there
# anything new?" from the box needs no inbound port and no credential: the
# repo and its check runs are public, and deploy.sh already does the hard
# part (waits for CI's image, verifies /health, rolls back on failure).
#
# What it will NOT deploy unattended, leaving it for a human with deploy.sh:
#   - a commit whose "Typecheck & test" check failed -- the image build does
#     not run the tests, so an image existing proves nothing about them;
#   - a range that changes prisma/schema.prisma -- `db push` against
#     production data is a decision, not a cron job (deploy.sh says the same).
# A refused commit is remembered so it is logged once, not every two minutes;
# the next push is looked at afresh.

set -uo pipefail

cd "$(dirname "$0")/.."
REPO_DIR="$(pwd)"
LOG="$HOME/backups/autodeploy.log"
SKIPPED="$HOME/.autodeploy-skipped"
CHECK_NAME="Typecheck & test"
CHECK_QUERY="Typecheck%20%26%20test"   # CHECK_NAME, URL-encoded
mkdir -p "$(dirname "$LOG")"

say() { printf '%s %s\n' "$(date -Is)" "$*" >> "$LOG"; }

# A deploy can wait up to ten minutes for CI's image; the next tick must not
# start a second one on top of it.
exec 9>/tmp/codekairo-autodeploy.lock
flock -n 9 || exit 0

git -C "$REPO_DIR" fetch -q origin main 2>/dev/null || exit 0
HEAD_SHA="$(git -C "$REPO_DIR" rev-parse HEAD)"
NEW_SHA="$(git -C "$REPO_DIR" rev-parse origin/main)"
[ "$HEAD_SHA" = "$NEW_SHA" ] && exit 0
[ "$(cat "$SKIPPED" 2>/dev/null)" = "$NEW_SHA" ] && exit 0

short="$(git -C "$REPO_DIR" log --oneline -1 "$NEW_SHA")"

if ! git -C "$REPO_DIR" diff --quiet "$HEAD_SHA" "$NEW_SHA" -- prisma/schema.prisma; then
  say "SKIPPED $short -- prisma/schema.prisma changed; run the db push, then deploy/deploy.sh by hand"
  echo "$NEW_SHA" > "$SKIPPED"
  exit 0
fi

# CI's verdict on exactly this commit. Unauthenticated calls get 60 an hour;
# this asks only while a new commit is waiting, at most 30 times an hour.
conclusion="$(curl -s --max-time 15 -H 'Accept: application/vnd.github+json' \
  "https://api.github.com/repos/ayaanp14/bugforge-backend/commits/$NEW_SHA/check-runs?check_name=$CHECK_QUERY" \
  | python3 -c '
import json, sys
try:
    runs = json.load(sys.stdin).get("check_runs", [])
except Exception:
    runs = []
if not runs:
    print("pending")
else:
    run = runs[0]
    print(run.get("conclusion") or "pending" if run.get("status") == "completed" else "pending")
' 2>/dev/null)"

case "$conclusion" in
  success) ;;
  pending|"") exit 0 ;;   # CI still running (or GitHub unreachable) -- ask again next tick
  *)
    say "SKIPPED $short -- CI \"$CHECK_NAME\" concluded: $conclusion"
    echo "$NEW_SHA" > "$SKIPPED"
    exit 0
    ;;
esac

say "DEPLOYING $short"
if "$REPO_DIR/deploy/deploy.sh" >> "$LOG" 2>&1; then
  say "DEPLOYED $short"
else
  # deploy.sh has already rolled back (or never restarted anything). Usually
  # HEAD now equals origin/main so this commit is not retried; if the pull
  # itself failed (a force-push, local edits on the box) it would be retried
  # every tick, so remember it either way. The next push is looked at afresh.
  echo "$NEW_SHA" > "$SKIPPED"
  say "FAILED $short -- see the deploy.sh output above; the previous image is serving"
fi

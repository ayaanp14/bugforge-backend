#!/usr/bin/env bash
# Local health watchdog. Runs from cron every five minutes.
#
# The CloudWatch alarms cover the infrastructure — a dead host gets recovered,
# an unreachable instance gets rebooted. Neither notices the failure mode that
# actually happens to application containers: the process is alive, the port is
# open, and every request comes back 500 because the database connection pool
# is wedged or the event loop is stuck. Nothing upstream can see that; only
# something asking the app a real question can.
#
# Self-healing is deliberately conservative — one restart of the API container,
# never the database, and only after three consecutive failures. A restart loop
# against a genuinely broken dependency turns a degraded service into a down
# one, and MySQL restarting under load is how you lose a transaction.

set -uo pipefail

cd "$(dirname "$0")"
LOG="$HOME/backups/watchdog.log"
STATE="$HOME/.watchdog-fails"
FAIL_THRESHOLD=3
DISK_WARN_PCT=85
MEM_WARN_MB=120

say() { printf '%s %s\n' "$(date -Is)" "$*" >> "$LOG"; }

# ── is the API actually answering, not merely listening? ────────────────
code="$(curl -sk --max-time 10 --resolve api.codekairo.com:443:127.0.0.1 \
         -H 'CF-Connecting-IP: 127.0.0.1' \
         -o /dev/null -w '%{http_code}' \
         https://api.codekairo.com/health 2>/dev/null || echo 000)"

fails=$(cat "$STATE" 2>/dev/null || echo 0)

if [ "$code" = "200" ]; then
  # Only log the recovery, not every healthy tick — otherwise the log is
  # noise and nobody reads it when it matters.
  [ "$fails" -gt 0 ] && say "RECOVERED after $fails failed check(s)"
  echo 0 > "$STATE"
else
  fails=$((fails + 1))
  echo "$fails" > "$STATE"
  say "health check failed (HTTP $code), consecutive=$fails"

  if [ "$fails" -ge "$FAIL_THRESHOLD" ]; then
    say "restarting the api container after $fails consecutive failures"
    docker compose restart api >> "$LOG" 2>&1
    echo 0 > "$STATE"
    sleep 20
    after="$(curl -sk --max-time 10 --resolve api.codekairo.com:443:127.0.0.1 \
             -H 'CF-Connecting-IP: 127.0.0.1' -o /dev/null -w '%{http_code}' \
             https://api.codekairo.com/health 2>/dev/null || echo 000)"
    say "post-restart health: HTTP $after"
  fi
fi

# ── capacity, logged only when it matters ───────────────────────────────
disk=$(df --output=pcent / | tail -1 | tr -dc '0-9')
# Images are pulled now, not built, so they accumulate one per deploy instead
# of being rebuilt over the same layers. `docker image prune -a` is the first
# thing to reach for; deploy.sh already drops anything older than a week.
[ "$disk" -ge "$DISK_WARN_PCT" ] && say "DISK at ${disk}% — docker image prune -a, or grow the volume"

mem=$(free -m | awk '/^Mem:/{print $7}')
[ "$mem" -le "$MEM_WARN_MB" ] && say "MEMORY only ${mem} MB available"

# ── containers that exited and did not come back ────────────────────────
for svc in api mysql redis caddy; do
  state=$(docker compose ps -a --format '{{.Service}} {{.State}}' 2>/dev/null | awk -v s="$svc" '$1==s{print $2}')
  case "$state" in
    running|"") ;;
    *) say "container $svc is '$state'" ;;
  esac
done

# Keep the log from becoming the thing that fills the disk.
if [ -f "$LOG" ] && [ "$(stat -c %s "$LOG")" -gt 5242880 ]; then
  tail -2000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi

#!/usr/bin/env bash
# Append one line of resource facts to a CSV, from cron every 15 minutes.
#
# The watchdog already shouts when a threshold is crossed. This is the other
# half: a trend. "Is it slower than last week" and "how fast is swap growing"
# are questions a threshold alarm cannot answer, and they are exactly the
# questions this box raises -- 1.8 GB of RAM against a database that grew 84%
# in one afternoon.
#
# CloudWatch could hold this, but its agent wants ~50 MB of the RAM being
# measured, which on this box is a real cost. A CSV is free.

set -uo pipefail
cd "$(dirname "$0")"

CSV="$HOME/backups/resources.csv"
mkdir -p "$(dirname "$CSV")"

if [ ! -f "$CSV" ]; then
  echo "ts,mem_used_mb,mem_avail_mb,swap_mb,mysqld_rss_mb,mysqld_swap_mb,disk_pct,api_mb,mysql_mb,redis_mb,caddy_mb,db_mb,pool_reads,pool_requests,load1" > "$CSV"
fi

TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

read -r MEM_USED MEM_AVAIL <<< "$(free -m | awk '/^Mem:/{print $3, $7}')"
SWAP="$(free -m | awk '/^Swap:/{print $3}')"
DISK="$(df --output=pcent / | tail -1 | tr -dc '0-9')"
LOAD1="$(awk '{print $1}' /proc/loadavg)"

# The single most important pair on this box: how much of MySQL is in RAM, and
# how much the kernel has pushed to disk. A rising mysqld_swap_mb is the
# warning that precedes the API feeling slow.
MYPID="$(pgrep -f mysqld | head -1)"
if [ -n "$MYPID" ]; then
  MY_RSS=$(awk '/^VmRSS:/{print int($2/1024)}' "/proc/$MYPID/status" 2>/dev/null || echo 0)
  MY_SWAP=$(awk '/^VmSwap:/{print int($2/1024)}' "/proc/$MYPID/status" 2>/dev/null || echo 0)
else
  MY_RSS=0
  MY_SWAP=0
fi

# docker stats prints "188.2MiB / 1.792GiB". Only the first field is this
# container's usage -- testing the whole line for GiB matches the LIMIT and
# multiplies every value by 1024.
STATS="$(docker stats --no-stream --format '{{.Name}} {{.MemUsage}}' 2>/dev/null)"
cmem() {
  printf '%s\n' "$STATS" | awk -v n="codekairo-$1-1" '
    $1 == n {
      u = $2
      g = (u ~ /GiB/)
      sub(/MiB|GiB|KiB|B$/, "", u)
      v = u + 0
      if (g) v *= 1024
      printf "%d", v
    }'
}
API_MB="$(cmem api)";     [ -z "$API_MB" ]   && API_MB=0
MYSQL_MB="$(cmem mysql)"; [ -z "$MYSQL_MB" ] && MYSQL_MB=0
REDIS_MB="$(cmem redis)"; [ -z "$REDIS_MB" ] && REDIS_MB=0
CADDY_MB="$(cmem caddy)"; [ -z "$CADDY_MB" ] && CADDY_MB=0

ROOT_PW="$(grep -E '^MYSQL_ROOT_PASSWORD=' .env 2>/dev/null | cut -d= -f2-)"
q() { docker compose exec -T -e MYSQL_PWD="$ROOT_PW" mysql mysql -u root -N -B -e "$1" 2>/dev/null | tr -d '\r'; }

DB_MB="$(q "SELECT ROUND(SUM(DATA_LENGTH+INDEX_LENGTH)/1024/1024) FROM information_schema.TABLES WHERE TABLE_SCHEMA='codexa';")"
[ -z "$DB_MB" ] && DB_MB=0

# Cumulative counters. The useful figure is the delta between two rows of this
# CSV, not the absolute value: a widening gap between them is the buffer pool
# missing more often, which is the thing to catch before anyone reports it.
POOL_READS="$(q "SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Innodb_buffer_pool_reads';")"
POOL_REQS="$(q "SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Innodb_buffer_pool_read_requests';")"
[ -z "$POOL_READS" ] && POOL_READS=0
[ -z "$POOL_REQS" ] && POOL_REQS=0

echo "$TS,$MEM_USED,$MEM_AVAIL,$SWAP,$MY_RSS,$MY_SWAP,$DISK,$API_MB,$MYSQL_MB,$REDIS_MB,$CADDY_MB,$DB_MB,$POOL_READS,$POOL_REQS,$LOAD1" >> "$CSV"

# Keep a fortnight at 15-minute resolution; the header always survives.
if [ "$(wc -l < "$CSV")" -gt 1400 ]; then
  { head -1 "$CSV"; tail -1340 "$CSV"; } > "$CSV.tmp" && mv "$CSV.tmp" "$CSV"
fi

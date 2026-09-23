#!/usr/bin/env bash
# Nightly logical backup of the production database.
#
# This architecture has no managed point-in-time recovery — one box, one MySQL.
# A nightly dump plus the EBS snapshot is the whole recovery story, so it runs
# unattended and shouts in the log if it ever produces a truncated file.
#
# Installed as a cron job at 20:00 UTC (01:30 IST — after the quiet hours for
# an India-facing product). See deploy/README.md.
set -euo pipefail

cd "$(dirname "$0")"
BACKUP_DIR="$HOME/backups"
KEEP_DAYS=7
mkdir -p "$BACKUP_DIR"

STAMP="$(date -u +%Y%m%d-%H%M)"
OUT="$BACKUP_DIR/codexa-${STAMP}.sql.gz"

ROOT_PW="$(grep -E '^MYSQL_ROOT_PASSWORD=' .env | cut -d= -f2-)"

# --single-transaction keeps this consistent without locking, so the API is
# unaffected while it runs.
docker compose exec -T -e MYSQL_PWD="$ROOT_PW" mysql \
  mysqldump -u root \
    --single-transaction --quick --no-tablespaces \
    --set-gtid-purged=OFF --default-character-set=utf8mb4 \
    codexa \
  | gzip -1 > "$OUT"

# A backup nobody checked is not a backup. mysqldump writes this as its last
# line; without it the file is truncated and must not be allowed to rotate a
# good one out.
if ! gunzip -c "$OUT" | tail -5 | grep -q "Dump completed"; then
  echo "$(date -Is) BACKUP FAILED (truncated): $OUT" >&2
  rm -f "$OUT"
  exit 1
fi

SIZE="$(du -h "$OUT" | cut -f1)"
echo "$(date -Is) backup ok: $OUT ($SIZE)"

# Only prune once a good dump is on disk.
find "$BACKUP_DIR" -name 'codexa-*.sql.gz' -mtime "+${KEEP_DAYS}" -delete
echo "$(date -Is) retained: $(ls -1 "$BACKUP_DIR"/codexa-*.sql.gz 2>/dev/null | wc -l) dumps"

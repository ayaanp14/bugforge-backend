#!/usr/bin/env bash
#
# Interactive, echo-free entry of the production secrets.
#
# Secret values are read with `read -rs`, so nothing appears on screen, nothing
# lands in shell history, and nothing is passed as a command argument (which
# would be readable from /proc by any other process on the box). They go
# straight into deploy/.env.production, which is mode 600.
#
#   bash ~/codekairo-backend/deploy/set-secrets.sh
#
# Re-runnable: pressing Enter at any prompt keeps whatever is already there,
# so a second pass can fill in only what was missed.

set -euo pipefail

ENV_FILE="$HOME/codekairo-backend/deploy/.env.production"
[ -f "$ENV_FILE" ] || { echo "missing $ENV_FILE"; exit 1; }

PAIRS="$(mktemp)"
chmod 600 "$PAIRS"
# The temp file holds plaintext for the life of this script; make sure it
# cannot survive a Ctrl-C.
trap 'shred -u "$PAIRS" 2>/dev/null || rm -f "$PAIRS"' EXIT INT TERM

# Values are base64'd on the way to the merge step so a newline, a quote or a
# shell metacharacter inside a key cannot corrupt the file.
put() { printf '%s %s\n' "$1" "$(printf '%s' "$2" | base64 -w0)" >> "$PAIRS"; }

# Secrets: hidden as you type.
ask() {
  local key="$1" hint="$2" val=""
  printf '\n  %s\n  %s\n  paste (hidden), or Enter to keep current: ' "$key" "$hint"
  read -rs val
  printf '\n'
  if [ -n "$val" ]; then
    put "$key" "$val"
    printf '    captured, %d characters\n' "${#val}"
  else
    printf '    kept current value\n'
  fi
}

# Non-secrets: client IDs, addresses, model names. Shown as you type, because
# hiding a value you may need to eyeball for typos helps nobody.
ask_plain() {
  local key="$1" hint="$2" val=""
  printf '\n  %s\n  %s\n  > ' "$key" "$hint"
  read -r val
  if [ -n "$val" ]; then
    put "$key" "$val"
  else
    printf '    kept current value\n'
  fi
}

echo "================================================================"
echo " CodeKairo - production secrets"
echo " Nothing you type here is displayed, logged, or sent anywhere."
echo "================================================================"

# ── generated here, never transmitted ───────────────────────────────────
# The old value was the literal placeholder committed to the repo. 64
# alphanumeric characters; every existing session is invalidated once when
# this changes, which at today's account count is cheap.
# Opt-in, because this script is meant to be re-runnable. Rotating
# JWT_SECRET invalidates every session on the platform, so a later pass that
# only fixes one API key must not sign the whole userbase out as a side effect.
printf "
  Regenerate JWT_SECRET? Every signed-in account is logged out once.
  [y/N]: "
read -r jwt_answer
case "${jwt_answer:-n}" in
  [Yy]*)
    JWT_NEW="$(openssl rand -base64 64 | tr -dc 'A-Za-z0-9' | head -c 64)"
    put JWT_SECRET "$JWT_NEW"
    echo "    regenerated on this machine (64 chars)"
    ;;
  *)
    echo "    kept the current JWT_SECRET"
    ;;
esac

# ── rotated third-party keys ────────────────────────────────────────────
ask NVIDIA_API_KEY        "written interviews + the site assistant (billable)"
ask GEMINI_API_KEY        "voice interview tokens (billable)"
ask BREVO_API_KEY         "outbound mail - OTP codes, reminders"
ask GITHUB_SECRET         "GitHub OAuth app secret"
ask GOOGLE_CLIENT_SECRET  "Google OAuth client secret"
ask CASHFREE_SECRET_KEY   "Cashfree secret (test keys - Enter to skip is fine)"

# ── account-specific, not secret ────────────────────────────────────────
# Prompted rather than hardcoded: this script lives in the repo, and these are
# your account's identifiers, not the project's.
ask_plain GITHUB_ID          "GitHub OAuth client ID (rotation does not change it)"
ask_plain GOOGLE_CLIENT_ID   "Google OAuth client ID (rotation does not change it)"
ask_plain CASHFREE_APP_ID    "Cashfree app id"
ask_plain CASHFREE_ENV       "sandbox or production - must match the keys above"
ask_plain NVIDIA_BASE_URL    "e.g. https://integrate.api.nvidia.com/v1"
ask_plain INTERVIEW_MODEL    "e.g. nvidia/nemotron-3-super-120b-a12b"
ask_plain MAIL_REPLY_TO      "the published support inbox"
ask_plain OWNER_EMAILS       "comma-separated; these accounts bypass every quota"
ask_plain ADMIN_EMAIL        "extra admin-panel address, or Enter to skip"
ask_plain PLATFORM_SECRET    "KEEP THE CURRENT VALUE - changing it needs a matching frontend build (Phase 2)"

# ── settings corrected on the way across ────────────────────────────────
# NODE_ENV was "development" on Railway, which is a production misconfiguration.
put NODE_ENV production
# Wandbox shut down on 2026-09-05, so "paiza,wandbox" had a dead fallback.
# There is no Judge0 on this box, so Paiza is the whole chain.
put EXECUTOR paiza
put STUDY_EXECUTOR paiza
put EMAIL_VERIFICATION on
put FRONTEND_URL https://codekairo.com
put BACKEND_PUBLIC_URL https://api.codekairo.com
# Both now live in this compose project, not us-east-1 and not a shared host.
put REDIS_URL redis://redis:6379

python3 - "$ENV_FILE" "$PAIRS" <<'PY'
import base64, sys, os, re

env_path, pairs_path = sys.argv[1], sys.argv[2]

updates = {}
with open(pairs_path) as fh:
    for line in fh:
        line = line.strip()
        if not line:
            continue
        key, b64 = line.split(" ", 1)
        updates[key] = base64.b64decode(b64).decode()

# Variables the Railway environment carried that nothing in this codebase
# reads. Firebase was removed deliberately; `connection_limit` belongs inside
# DATABASE_URL and does nothing as a variable of its own.
DEAD = {"FIREBASE_API_KEY", "GTWY_PAUTHKEY", "connection_limit"}

out, seen = [], set()
with open(env_path) as fh:
    for line in fh:
        m = re.match(r'^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=', line)
        if not m:
            out.append(line)
            continue
        key = m.group(1)
        if key in DEAD:
            continue
        if key in updates:
            out.append('%s="%s"\n' % (key, updates[key]))
            seen.add(key)
        else:
            out.append(line)

missing = [k for k in updates if k not in seen]
if missing:
    out.append("\n# added by set-secrets.sh\n")
    for k in missing:
        out.append('%s="%s"\n' % (k, updates[k]))

tmp = env_path + ".tmp"
with open(tmp, "w") as fh:
    fh.writelines(out)
os.chmod(tmp, 0o600)
os.replace(tmp, env_path)
print("\n  wrote %d values into %s" % (len(updates), os.path.basename(env_path)))
PY

echo
echo "================================================================"
echo " Result - secret values masked"
echo "================================================================"
python3 - "$ENV_FILE" <<'PY'
import re, sys
SECRET = re.compile(r'SECRET|KEY|PASSWORD|TOKEN|DATABASE_URL|REDIS_URL', re.I)
for line in open(sys.argv[1]):
    m = re.match(r'^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?(.*?)"?\s*$', line)
    if not m:
        continue
    key, val = m.group(1), m.group(2)
    if not val:
        print("  %-26s EMPTY" % key)
    elif SECRET.search(key):
        print("  %-26s set (%d chars)" % (key, len(val)))
    else:
        print("  %-26s %s" % (key, val))
PY
echo
echo "Anything still EMPTY that you need? Re-run this script."

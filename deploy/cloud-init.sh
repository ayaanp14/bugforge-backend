#!/usr/bin/env bash
# Lightsail user-data: runs once, as root, on first boot.
#
# Deliberately does NOT clone the repository. bugforge-backend is private, and
# baking a token into user-data would leave the credential readable from the
# instance metadata service for the life of the box. The clone is a manual
# step with a read-only GitHub deploy key — see deploy/README.md.

set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg git

# ── Docker, from Docker's own repository ────────────────────────────────
# Ubuntu's packaged docker.io lags badly and ships no compose v2 plugin.
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

systemctl enable --now docker
usermod -aG docker ubuntu

# ── Swap ────────────────────────────────────────────────────────────────
# Lightsail images ship without any. 2 GB of RAM has to hold a 768 MB InnoDB
# buffer pool, Node, Redis and Caddy; without swap the first spike — a
# `docker compose build`, or a content seed writing ~3M TestCase rows — gets
# MySQL or the API OOM-killed instead of merely slowed down.
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Swap is the safety net, not the working set: only reach for it under real
# pressure, and do not let the kernel evict MySQL's pool cache to fill it.
sysctl -w vm.swappiness=10
sysctl -w vm.vfs_cache_pressure=50
cat > /etc/sysctl.d/99-codekairo.conf <<'EOF'
vm.swappiness=10
vm.vfs_cache_pressure=50
EOF

# ── Log rotation ────────────────────────────────────────────────────────
# Container stdout is unbounded by default and a 60 GB disk fills quietly.
cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "20m", "max-file": "5" }
}
EOF
systemctl restart docker

# ── Unattended security updates ─────────────────────────────────────────
apt-get install -y unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades

mkdir -p /home/ubuntu/backups
chown -R ubuntu:ubuntu /home/ubuntu/backups

echo "cloud-init finished at $(date -Is)" > /var/log/codekairo-cloud-init.done

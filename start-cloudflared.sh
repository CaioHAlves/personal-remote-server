#!/data/data/com.termux/files/usr/bin/bash

PROOT_ROOT="/data/data/com.termux/files/home/.proot-fs"
RESOLV_CONF="/data/data/com.termux/files/home/.proot-fs/etc/resolv.conf"
CERT_PEM="/data/data/com.termux/files/usr/etc/tls/cert.pem"
TLS_DIR="/data/data/com.termux/files/usr/etc/tls"
LOG_FILE="/data/data/com.termux/files/home/cloudflared.log"

# Garantir que resolv.conf existe
if [ ! -f "$RESOLV_CONF" ]; then
    mkdir -p "$PROOT_ROOT/etc"
    echo -e "nameserver 8.8.8.8\nnameserver 8.8.4.4" > "$RESOLV_CONF"
fi

# Matar processos anteriores
pkill -f "cloudflared tunnel" 2>/dev/null
sleep 1

# Iniciar sshd se nao estiver rodando
sv up sshd 2>/dev/null || sshd 2>/dev/null

# Iniciar cloudflared com proot
echo "[$(date)] Starting Cloudflare Tunnel via proot..."
proot \
    -b "$RESOLV_CONF:/etc/resolv.conf" \
    -b "$CERT_PEM:/etc/ssl/certs/ca-certificates.crt" \
    -b "$TLS_DIR:/etc/ssl/certs" \
    cloudflared tunnel --url tcp://localhost:8022 >> "$LOG_FILE" 2>&1 &

echo "[$(date)] Cloudflared started in background (PID: $!)"

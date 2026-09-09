#!/data/data/com.termux/usr/bin/bash

# Iniciar sshd se nao estiver rodando
sv up sshd 2>/dev/null || sshd 2>/dev/null

echo "[$(date)] Starting Bore tunnel (port 8022)..."
bore local 8022 --to bore.pub 2>&1

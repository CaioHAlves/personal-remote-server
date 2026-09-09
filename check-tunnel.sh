#!/data/data/com.termux/files/usr/bin/bash

echo "=== Status dos Servicos ==="
echo ""

# Verificar SSH
if ps aux | grep -q "sshd -D"; then
    echo "[OK] SSH Server rodando na porta 8022"
else
    echo "[!] SSH Server PARADO - iniciando..."
    sv up sshd 2>/dev/null || sshd 2>/dev/null
fi

# Verificar cloudflared
if ps aux | grep -q "cloudflared tunnel"; then
    echo "[OK] Cloudflare Tunnel rodando"
else
    echo "[!] Cloudflare Tunnel PARADO"
fi

echo ""

# Tentar pegar URL do tunnel
URL=$(grep -o "[a-z0-9-]*\.trycloudflare\.com" ~/cloudflared.log 2>/dev/null | tail -1)

if [ -n "$URL" ]; then
    echo "=== URL PUBLICO DO TUNNEL ==="
    echo "$URL"
    echo ""
    echo "=== COMO CONECTAR POR SSH ==="
    echo "De outro dispositivo, rode:"
    echo "  ssh com.termux@$URL -p 22"
    echo ""
    echo "Ou abra um terminal SSH client e conecte em:"
    echo "  Host: $URL"
    echo "  Port: 22"
    echo "  User: com.termux"
    echo "  Pass: termux123"
else
    echo "URL do tunnel nao encontrada no log."
    echo "Verifique: cat ~/cloudflared.log"
fi

echo ""
echo "=== Para reiniciar os servicos ==="
echo "  bash ~/.termux/boot/start-ssh-ngrok.sh"

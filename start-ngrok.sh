#!/data/data/com.termux/files/usr/bin/bash

# Script para iniciar ngrok e mostrar o URL de conexao
echo "=== Iniciando Ngrok Tunnel para SSH ==="
echo "Porta SSH: 8022"
echo ""

# Matar ngrok existente
pkill -f "ngrok tcp" 2>/dev/null

# Iniciar ngrok em background
ngrok tcp 8022 --log=stdout --log-format=logfmt > ~/ngrok.log 2>&1 &
NGROK_PID=$!

echo "Ngrok PID: $NGROK_PID"
echo "Aguardando conexao..."
sleep 3

# Tentar pegar o URL publico
URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$URL" ]; then
    echo ""
    echo "=== URL PUBLICO DO NGROK ==="
    echo "$URL"
    echo ""
    echo "=== COMO CONECTAR ==="
    echo "De outro dispositivo, rode:"
    echo "  ssh com.termux@$URL"
    echo "  (porta: 22)"
    echo ""
    echo "Ou use o IP direto do tunnel:"
    HOST=$(echo $URL | sed 's|tcp://||' | cut -d: -f1)
    PORT=$(echo $URL | sed 's|tcp://||' | cut -d: -f2)
    echo "  ssh com.termux@$HOST -p $PORT"
else
    echo "Aguardando URL... verifique com: curl http://127.0.0.1:4040/api/tunnels"
fi

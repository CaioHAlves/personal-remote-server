#!/data/data/com.termux/usr/bin/bash

# ============================================
#   Termux Remote - Auto Start
#   Inicia todos os servicos automaticamente
# ============================================

# Esperar Termux inicializar completamente
sleep 3

# Verificar se ja esta rodando
if pgrep -f "ttyd -p 7681" > /dev/null 2>&1; then
    exit 0
fi

# Ativar wake lock para manter Termux ativo
termux-wake-lock 2>/dev/null

# Iniciar servicos
bash ~/start.sh start > /dev/null 2>&1 &

# Iniciar monitor keep-alive
sleep 10
bash ~/keepalive-monitor.sh start > /dev/null 2>&1 &

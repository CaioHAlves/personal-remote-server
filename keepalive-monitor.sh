#!/data/data/com.termux/usr/bin/bash

# ============================================
#   Termux Remote - Keep Alive Monitor
#   Verifica e reinicia servicos automaticamente
# ============================================

LOG_FILE="$HOME/keepalive.log"
CHECK_INTERVAL=60  # segundos entre cada verificacao
MAX_LOG_SIZE=102400  # 100KB

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

rotate_log() {
    if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null) -gt $MAX_LOG_SIZE ]; then
        mv "$LOG_FILE" "$LOG_FILE.old"
        log "Log rotacionado"
    fi
}

check_process() {
    local name="$1"
    if pgrep -f "$name" > /dev/null 2>&1; then
        return 0
    fi
    return 1
}

check_tunnel() {
    local log_file="$1"
    local service_name="$2"
    
    if [ ! -f "$log_file" ]; then
        return 1
    fi
    
    # Verificar se tem URL valida
    local url=$(grep -o 'https://[^ ]*\.serveousercontent\.com' "$log_file" 2>/dev/null | tail -1)
    if [ -z "$url" ]; then
        return 1
    fi
    
    # Verificar se nao expirou
    if grep -q "expired" "$log_file" 2>/dev/null; then
        return 1
    fi
    
    return 0
}

restart_services() {
    log "Reiniciando servicos..."
    bash ~/start.sh restart >> /dev/null 2>&1
    sleep 10
    log "Servicos reiniciados"
}

monitor_loop() {
    while true; do
        rotate_log
        
        # Verificar ttyd
        if ! check_process "ttyd -p 7681"; then
            log "ttyd parado - reiniciando"
            restart_services
            sleep $CHECK_INTERVAL
            continue
        fi
        
        # Verificar servidor de arquivos
        if ! check_process "node.*simple-file-server"; then
            log "Servidor de arquivos parado - reiniciando"
            restart_services
            sleep $CHECK_INTERVAL
            continue
        fi
        
        # Verificar tunnel terminal
        if ! check_tunnel "$HOME/tunnel-terminal.log" "terminal"; then
            log "Tunnel terminal expirado/parado - reiniciando"
            restart_services
            sleep $CHECK_INTERVAL
            continue
        fi
        
        # Verificar tunnel arquivos
        if ! check_tunnel "$HOME/tunnel-files.log" "files"; then
            log "Tunnel files expirado/parado - reiniciando"
            restart_services
            sleep $CHECK_INTERVAL
            continue
        fi
        
        sleep $CHECK_INTERVAL
    done
}

# Iniciar monitoramento
case "${1:-start}" in
    start)
        if pgrep -f "keepalive-monitor.sh" > /dev/null 2>&1; then
            echo -e "${YELLOW}[!] Monitor ja esta rodando${NC}"
            exit 0
        fi
        
        echo -e "${GREEN}[OK]${NC} Iniciando monitor keep-alive..."
        log "Monitor keep-alive iniciado"
        
        # Iniciar em background
        nohup bash "$0" run > /dev/null 2>&1 &
        echo -e "${GREEN}[OK]${NC} Monitor rodando em background (PID: $!)"
        echo -e "    Logs em: $LOG_FILE"
        ;;
    stop)
        pkill -f "keepalive-monitor.sh" 2>/dev/null
        log "Monitor keep-alive parado"
        echo -e "${GREEN}[OK]${NC} Monitor parado"
        ;;
    run)
        echo -e "${GREEN}[OK]${NC} Monitor keep-alive ativo"
        monitor_loop
        ;;
    status)
        if pgrep -f "keepalive-monitor.sh" > /dev/null 2>&1; then
            echo -e "${GREEN}[ATIVO]${NC} Monitor keep-alive rodando"
            echo "Logs recentes:"
            tail -5 "$LOG_FILE" 2>/dev/null || echo "  Nenhum log"
        else
            echo -e "${RED}[INATIVO]${NC} Monitor keep-alive parado"
        fi
        ;;
    *)
        echo "Uso: $0 {start|stop|status}"
        exit 1
        ;;
esac

#!/data/data/com.termux/usr/bin/bash

# ============================================
#   Termux Remote Access - Start Script
#   by github.com/CaioHAlves
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_banner() {
    echo ""
    echo -e "${CYAN}  ╔═══════════════════════════════════════╗${NC}"
    echo -e "${CYAN}  ║      TERMUX REMOTE ACCESS             ║${NC}"
    echo -e "${CYAN}  ║  Terminal + Gerenciador de Arquivos   ║${NC}"
    echo -e "${CYAN}  ╚═══════════════════════════════════════╝${NC}"
    echo ""
}

print_ok() { echo -e "  ${GREEN}[OK]${NC} $1"; }
print_warn() { echo -e "  ${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "  ${RED}[ERRO]${NC} $1"; }

# Verificar se e Termux
if [ ! -d "/data/data/com.termux" ]; then
    echo -e "${RED}[ERRO]${NC} Este script so funciona no Termux!"
    exit 1
fi

# Matar processos anteriores
stop_services() {
    pkill -f "ttyd -p 7681" 2>/dev/null || true
    pkill -f "filebrowser -p 8080" 2>/dev/null || true
    pkill -f "cloudflared tunnel" 2>/dev/null || true
    sleep 1
}

# Verificar dependencias
check_deps() {
    local ok=true
    command -v ttyd &> /dev/null || { print_error "ttyd nao encontrado. Rode: pkg install ttyd"; ok=false; }
    command -v cloudflared &> /dev/null || { print_error "cloudflared nao encontrado. Rode: bash install.sh"; ok=false; }
    command -v filebrowser &> /dev/null || { print_warn "filebrowser nao encontrado. Gerenciador de arquivos desabilitado."; }
    $ok || exit 1
}

# Iniciar ttyd (terminal)
start_ttyd() {
    nohup ttyd -p 7681 -W bash > /dev/null 2>&1 &
    print_ok "ttyd rodando (porta 7681)"
}

# Iniciar filebrowser (arquivos)
start_filebrowser() {
    if command -v filebrowser &> /dev/null; then
        nohup filebrowser -p 8080 -r ~ --noauth --address 127.0.0.1 > /dev/null 2>&1 &
        print_ok "filebrowser rodando (porta 8080)"
        HAS_FILES=true
    else
        HAS_FILES=false
    fi
}

# Iniciar tunnels
start_tunnels() {
    nohup cloudflared tunnel --url http://localhost:7681 > ~/tunnel-terminal.log 2>&1 &
    print_ok "tunnel do terminal criado"

    if [ "$HAS_FILES" = true ]; then
        nohup cloudflared tunnel --url http://localhost:8080 > ~/tunnel-files.log 2>&1 &
        print_ok "tunnel dos arquivos criado"
    fi
}

# Mostrar URLs
show_urls() {
    sleep 8

    TERMINAL_URL=$(grep -o "[a-z0-9-]*\.trycloudflare\.com" ~/tunnel-terminal.log 2>/dev/null | tail -1)
    FILES_URL=""
    if [ "$HAS_FILES" = true ]; then
        FILES_URL=$(grep -o "[a-z0-9-]*\.trycloudflare\.com" ~/tunnel-files.log 2>/dev/null | tail -1)
    fi

    echo ""
    echo -e "${BOLD}  ═══════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${GREEN}Abra essas URLs no navegador do seu computador:${NC}"
    echo ""

    if [ -n "$TERMINAL_URL" ]; then
        echo -e "  ${BOLD}TERMINAL:${NC}"
        echo -e "  ${YELLOW}https://$TERMINAL_URL${NC}"
        echo ""
    fi

    if [ -n "$FILES_URL" ]; then
        echo -e "  ${BOLD}ARQUIVOS:${NC}"
        echo -e "  ${YELLOW}https://$FILES_URL${NC}"
        echo ""
    fi

    echo -e "${BOLD}  ═══════════════════════════════════════${NC}"
    echo ""
    echo -e "  Comandos uteis:"
    echo -e "    ${CYAN}tunnel${NC}       - ver URL do terminal"
    echo -e "    ${CYAN}tunnelfiles${NC}  - ver URL dos arquivos"
    echo -e "    ${CYAN}stopremote${NC}   - parar tudo"
    echo ""
}

# Parar tudo
stop_all() {
    echo -e "\n${YELLOW}Parando todos os servicos...${NC}"
    pkill -f "ttyd -p 7681" 2>/dev/null || true
    pkill -f "filebrowser -p 8080" 2>/dev/null || true
    pkill -f "cloudflared tunnel" 2>/dev/null || true
    print_ok "Todos os servicos parados."
}

# Status
show_status() {
    echo -e "\n${CYAN}Status dos servicos:${NC}"
    echo ""

    if pgrep -f "ttyd -p 7681" > /dev/null 2>&1; then
        echo -e "  ${GREEN}[RODANDO]${NC} ttyd (porta 7681)"
    else
        echo -e "  ${RED}[PARADO]${NC}  ttyd"
    fi

    if pgrep -f "filebrowser -p 8080" > /dev/null 2>&1; then
        echo -e "  ${GREEN}[RODANDO]${NC} filebrowser (porta 8080)"
    else
        echo -e "  ${RED}[PARADO]${NC}  filebrowser"
    fi

    if pgrep -f "cloudflared tunnel" > /dev/null 2>&1; then
        echo -e "  ${GREEN}[RODANDO]${NC} cloudflared"
    else
        echo -e "  ${RED}[PARADO]${NC}  cloudflared"
    fi

    echo ""

    TERMINAL_URL=$(grep -o "[a-z0-9-]*\.trycloudflare\.com" ~/tunnel-terminal.log 2>/dev/null | tail -1)
    FILES_URL=$(grep -o "[a-z0-9-]*\.trycloudflare\.com" ~/tunnel-files.log 2>/dev/null | tail -1)

    [ -n "$TERMINAL_URL" ] && echo -e "  Terminal:  ${YELLOW}https://$TERMINAL_URL${NC}"
    [ -n "$FILES_URL" ] && echo -e "  Arquivos:  ${YELLOW}https://$FILES_URL${NC}"
    echo ""
}

# Main
case "${1:-start}" in
    start)
        print_banner
        stop_services
        check_deps
        echo ""
        start_ttyd
        start_filebrowser
        start_tunnels
        show_urls
        ;;
    stop)
        stop_all
        ;;
    restart)
        stop_all
        sleep 2
        print_banner
        stop_services
        echo ""
        start_ttyd
        start_filebrowser
        start_tunnels
        show_urls
        ;;
    status)
        show_status
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac

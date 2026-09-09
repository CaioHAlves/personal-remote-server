#!/data/data/com.termux/usr/bin/bash

# ============================================
#   Termux Remote Access - Start Script
#   by github.com/user
# ============================================

set -e

# Cores para o terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_banner() {
    echo -e "${CYAN}"
    echo "  ╔═══════════════════════════════════════╗"
    echo "  ║      TERMUX REMOTE ACCESS             ║"
    echo "  ║  Terminal + Gerenciador de Arquivos   ║"
    echo "  ╚═══════════════════════════════════════╝"
    echo -e "${NC}"
}

print_ok() {
    echo -e "  ${GREEN}[OK]${NC} $1"
}

print_warn() {
    echo -e "  ${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "  ${RED}[ERRO]${NC} $1"
}

# Verificar se esta rodando no Termux
if [ -d "/data/data/com.termux" ]; then
    IS_TERMUX=true
else
    IS_TERMUX=false
fi

# Matar processos anteriores
stop_services() {
    echo -e "\n${YELLOW}Parando servicos anteriores...${NC}"
    pkill -f "ttyd -p 7681" 2>/dev/null || true
    pkill -f "filebrowser -p 8080" 2>/dev/null || true
    pkill -f "cloudflared tunnel" 2>/dev/null || true
    sleep 1
}

# Iniciar ttyd
start_ttyd() {
    if command -v ttyd &> /dev/null; then
        nohup ttyd -p 7681 -W bash > /dev/null 2>&1 &
        print_ok "ttyd iniciado (porta 7681)"
    else
        print_error "ttyd nao encontrado. Instale com: pkg install ttyd"
        exit 1
    fi
}

# Iniciar filebrowser
start_filebrowser() {
    if command -v filebrowser &> /dev/null; then
        nohup filebrowser -p 8080 -r ~ --noauth --address 127.0.0.1 > /dev/null 2>&1 &
        print_ok "filebrowser iniciado (porta 8080)"
    else
        print_warn "filebrowser nao encontrado. Pulando gerenciador de arquivos."
    fi
}

# Iniciar cloudflared
start_cloudflared() {
    if command -v cloudflared &> /dev/null; then
        # Tunnel para terminal
        nohup cloudflared tunnel --url http://localhost:7681 > /tmp/tunnel-terminal.log 2>&1 &
        print_ok "tunnel-terminal iniciado"

        # Tunnel para filebrowser
        if command -v filebrowser &> /dev/null; then
            nohup cloudflared tunnel --url http://localhost:8080 > /tmp/tunnel-files.log 2>&1 &
            print_ok "tunnel-files iniciado"
        fi
    else
        print_error "cloudflared nao encontrado."
        print_warn "Instale com:"
        echo "  curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o \$PREFIX/bin/cloudflared"
        echo "  chmod +x \$PREFIX/bin/cloudflared"
        exit 1
    fi
}

# Pegar URLs
get_urls() {
    sleep 8

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
    echo -e "${GREEN}  URLs PUBLICAS:${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"

    TERMINAL_URL=$(grep -o "[a-z0-9-]*\.trycloudflare\.com" /tmp/tunnel-terminal.log 2>/dev/null | tail -1)
    FILES_URL=$(grep -o "[a-z0-9-]*\.trycloudflare\.com" /tmp/tunnel-files.log 2>/dev/null | tail -1)

    if [ -n "$TERMINAL_URL" ]; then
        echo ""
        echo -e "  ${GREEN}Terminal:${NC}"
        echo -e "  ${YELLOW}https://$TERMINAL_URL${NC}"
    fi

    if [ -n "$FILES_URL" ]; then
        echo ""
        echo -e "  ${GREEN}Arquivos:${NC}"
        echo -e "  ${YELLOW}https://$FILES_URL${NC}"
    fi

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
    echo ""
    echo -e "  Abra as URLs acima no navegador do seu computador."
    echo -e "  Use ${YELLOW}tunnel${NC} para ver a URL atual a qualquer momento."
    echo ""
}

# Funcao para parar tudo
stop_all() {
    echo -e "\n${YELLOW}Parando todos os servicos...${NC}"
    pkill -f "ttyd -p 7681" 2>/dev/null || true
    pkill -f "filebrowser -p 8080" 2>/dev/null || true
    pkill -f "cloudflared tunnel" 2>/dev/null || true
    print_ok "Todos os servicos parados."
}

# Main
case "${1:-start}" in
    start)
        print_banner
        stop_services
        echo ""
        start_ttyd
        start_filebrowser
        start_cloudflared
        get_urls
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
        start_cloudflared
        get_urls
        ;;
    status)
        echo -e "\n${CYAN}Status dos servicos:${NC}"
        ps aux | grep -E "ttyd|filebrowser|cloudflared" | grep -v grep || echo "  Nenhum servico rodando."
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac

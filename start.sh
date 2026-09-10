#!/data/data/com.termux/usr/bin/bash

# ============================================
#   Termux Remote Access - Start Script
#   by CaioHAlves
# ============================================

set -e

# ============================================
#   Configuracao
# ============================================
FILE_SERVER_PASS="${FILE_SERVER_PASS:-}"

if [ -z "$FILE_SERVER_PASS" ] && [ -t 0 ]; then
    echo -e "\n  \033[0;36mDefina uma senha para o servidor de arquivos:\033[0m"
    read -s -p "  Senha (Enter p/ sem senha): " FILE_SERVER_PASS
    echo ""
    if [ -n "$FILE_SERVER_PASS" ]; then
        echo -e "  \033[0;32mSenha definida!\033[0m"
    else
        echo -e "  \033[1;33m[!] Servidor sem senha - qualquer pessoa pode acessar!\033[0m"
    fi
fi
export FILE_SERVER_PASS

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_banner() {
    echo -e "${CYAN}"
    echo "  ╔═══════════════════════════════════════╗"
    echo "  ║      TERMUX REMOTE ACCESS             ║"
    echo "  ║  Terminal + Gerenciador de Arquivos   ║"
    echo "  ╚═══════════════════════════════════════╝"
    echo -e "${NC}"
}

print_ok()   { echo -e "  ${GREEN}[OK]${NC} $1"; }
print_warn() { echo -e "  ${YELLOW}[!]${NC} $1"; }
print_error(){ echo -e "  ${RED}[ERRO]${NC} $1"; }

# Matar processos anteriores
stop_services() {
    echo -e "\n${YELLOW}Parando servicos anteriores...${NC}"
    pkill -f "ttyd -p 7681" 2>/dev/null || true
    pkill -f "node.*simple-file-server" 2>/dev/null || true
    pkill -f "node.*reverse-proxy" 2>/dev/null || true
    pkill -f "ssh.*localhost.run" 2>/dev/null || true
    sleep 1
}

# Iniciar ttyd (terminal local)
start_ttyd() {
    if command -v ttyd &> /dev/null; then
        nohup ttyd -p 7681 -W bash > /dev/null 2>&1 &
        print_ok "ttyd iniciado (porta 7681)"
    else
        print_warn "ttyd nao encontrado. Terminal desabilitado."
    fi
}

# Iniciar servidor de arquivos
start_fileserver() {
    if [ -f ~/simple-file-server.js ]; then
        nohup node ~/simple-file-server.js > /dev/null 2>&1 &
        print_ok "servidor de arquivos iniciado (porta 8080)"
    else
        print_warn "simple-file-server.js nao encontrado."
    fi
}

# Iniciar reverse proxy (une terminal + arquivos)
start_proxy() {
    if [ -f ~/reverse-proxy.js ]; then
        nohup node ~/reverse-proxy.js > /dev/null 2>&1 &
        print_ok "reverse proxy iniciado (porta 80)"
    fi
}

# Tunnel para o proxy
start_tunnel() {
    if command -v ssh &> /dev/null; then
        nohup ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 \
            -R 80:localhost:9090 nokey@localhost.run > ~/tunnel.log 2>&1 &
        print_ok "tunnel iniciado (localhost.run)"
    else
        print_warn "ssh nao encontrado. Tunnel desabilitado."
    fi
}

# Pegar URLs
get_urls() {
    sleep 8

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
    echo -e "${GREEN}  URLs PUBLICAS:${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"

    BASE_URL=$(grep -o 'https://[^ ]*\.lhr\.life' ~/tunnel.log 2>/dev/null | tail -1)

    if [ -n "$BASE_URL" ]; then
        echo ""
        echo -e "  ${GREEN}Gerenciador de Arquivos:${NC}"
        echo -e "  ${YELLOW}$BASE_URL/${NC}"
        echo ""
        echo -e "  ${GREEN}Terminal Web:${NC}"
        echo -e "  ${YELLOW}$BASE_URL/terminal${NC}"
    else
        echo ""
        echo -e "  ${RED}Tunnel: aguardando URL...${NC}"
    fi

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
    echo ""
    echo -e "  Abra as URLs acima no navegador do seu computador."
    echo -e "  Use ${YELLOW}tunnel${NC} para ver as URLs atuais."
    echo ""
}

# Monitor de tunnel
monitor_tunnel() {
    while true; do
        sleep 30
        if ! pgrep -f "ssh.*localhost.run" > /dev/null 2>&1; then
            print_warn "Tunnel caiu, reconectando..."
            nohup ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 \
                -R 80:localhost:9090 nokey@localhost.run > ~/tunnel.log 2>&1 &
            sleep 5
            NEW_URL=$(grep -o 'https://[^ ]*\.lhr\.life' ~/tunnel.log 2>/dev/null | tail -1)
            if [ -n "$NEW_URL" ]; then
                print_ok "Tunnel reconectado!"
            fi
        fi
    done
}

# Ver URLs atuais
show_urls() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
    echo -e "${GREEN}  URLs ATUAIS:${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
    
    BASE_URL=$(grep -o 'https://[^ ]*\.lhr\.life' ~/tunnel.log 2>/dev/null | tail -1)
    
    if [ -n "$BASE_URL" ]; then
        echo -e "\n  ${GREEN}Gerenciador de Arquivos:${NC}"
        echo -e "  ${YELLOW}$BASE_URL/${NC}"
        echo -e "\n  ${GREEN}Terminal Web:${NC}"
        echo -e "  ${YELLOW}$BASE_URL/terminal${NC}"
    fi
    
    [ -z "$BASE_URL" ] && echo -e "\n  ${RED}Tunnel offline${NC}"
    echo ""
}

# Parar tudo
stop_all() {
    echo -e "\n${YELLOW}Parando todos os servicos...${NC}"
    pkill -f "ttyd -p 7681" 2>/dev/null || true
    pkill -f "node.*simple-file-server" 2>/dev/null || true
    pkill -f "node.*reverse-proxy" 2>/dev/null || true
    pkill -f "ssh.*localhost.run" 2>/dev/null || true
    pkill -f "monitor_tunnel" 2>/dev/null || true
    print_ok "Todos os servicos parados."
}

# Main
case "${1:-start}" in
    start)
        print_banner
        stop_services
        echo ""
        start_ttyd
        start_fileserver
        start_proxy
        start_tunnel
        get_urls
        monitor_tunnel &
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
        start_fileserver
        start_proxy
        start_tunnel
        get_urls
        monitor_tunnel &
        ;;
    status)
        echo -e "\n${CYAN}Status dos servicos:${NC}"
        ps aux | grep -E "ttyd|node.*file|node.*proxy|ssh.*localhost" | grep -v grep || echo "  Nenhum servico rodando."
        show_urls
        ;;
    tunnel|urls)
        show_urls
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|tunnel}"
        exit 1
        ;;
esac

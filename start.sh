#!/data/data/com.termux/usr/bin/bash

# ============================================
#   Termux Remote Access - Start Script
#   by github.com/user
# ============================================

set -e

# ============================================
#   Configuracao
# ============================================
# Senha do servidor de arquivos (deixe vazio para desabilitar auth)
FILE_SERVER_PASS="${FILE_SERVER_PASS:-}"

# Se no tiver senha configurada, pedir ao usuario
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
    pkill -f "node.*simple-file-server" 2>/dev/null || true
    pkill -f "ssh.*serveo.net" 2>/dev/null || true
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

# Iniciar servidor de arquivos
start_fileserver() {
    if [ -f ~/simple-file-server.js ]; then
        nohup node ~/simple-file-server.js > /dev/null 2>&1 &
        print_ok "servidor de arquivos iniciado (porta 8080)"
    else
        print_warn "simple-file-server.js nao encontrado. Gerenciador de arquivos desabilitado."
    fi
}

# Iniciar tunnels via SSH/serveo
start_tunnels() {
    if command -v ssh &> /dev/null; then
        # Tunnel para terminal
        nohup ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -R 80:localhost:7681 serveo.net > ~/tunnel-terminal.log 2>&1 &
        print_ok "tunnel-terminal iniciado"

        # Tunnel para arquivos
        if [ -f ~/simple-file-server.js ]; then
            nohup ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -R 80:localhost:8080 serveo.net > ~/tunnel-files.log 2>&1 &
            print_ok "tunnel-files iniciado"
        fi
    else
        print_error "ssh nao encontrado."
        print_warn "Instale com: pkg install openssh"
        exit 1
    fi
}

# Pegar URLs
get_urls() {
    sleep 6

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
    echo -e "${GREEN}  URLs PUBLICAS:${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"

    TERMINAL_URL=$(grep -o 'https://[^ ]*\.serveousercontent\.com' ~/tunnel-terminal.log 2>/dev/null | tail -1)
    FILES_URL=$(grep -o 'https://[^ ]*\.serveousercontent\.com' ~/tunnel-files.log 2>/dev/null | tail -1)

    if [ -n "$TERMINAL_URL" ]; then
        echo ""
        echo -e "  ${GREEN}Terminal:${NC}"
        echo -e "  ${YELLOW}$TERMINAL_URL${NC}"
    fi

    if [ -n "$FILES_URL" ]; then
        echo ""
        echo -e "  ${GREEN}Arquivos:${NC}"
        echo -e "  ${YELLOW}$FILES_URL${NC}"
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
    pkill -f "node.*simple-file-server" 2>/dev/null || true
    pkill -f "ssh.*serveo.net" 2>/dev/null || true
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
        start_tunnels
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
        start_fileserver
        start_tunnels
        get_urls
        ;;
    status)
        echo -e "\n${CYAN}Status dos servicos:${NC}"
        ps aux | grep -E "ttyd|node.*file|ssh.*serveo" | grep -v grep || echo "  Nenhum servico rodando."
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac

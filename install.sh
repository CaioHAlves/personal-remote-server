#!/data/data/com.termux/usr/bin/bash

# ============================================
#   Termux Remote Access - Install Script
#   by github.com/user
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║   INSTALANDO TERMUX REMOTE ACCESS     ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se e Termux
if [ ! -d "/data/data/com.termux" ]; then
    echo -e "${RED}[ERRO]${NC} Este script so funciona no Termux!"
    exit 1
fi

echo -e "${YELLOW}[1/5]${NC} Atualizando pacotes..."
pkg update -y && pkg upgrade -y

echo -e "${YELLOW}[2/5]${NC} Instalando dependencias..."
pkg install -y nodejs proot curl git

echo -e "${YELLOW}[3/5]${NC} Instalando ttyd..."
pkg install -y ttyd

echo -e "${YELLOW}[4/5]${NC} Instalando cloudflared..."
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o $PREFIX/bin/cloudflared
chmod +x $PREFIX/bin/cloudflared

echo -e "${YELLOW}[5/5]${NC} Instalando filebrowser..."
curl -fsSL https://github.com/filebrowser/filebrowser/releases/latest/download/linux-arm64-filebrowser.tar.gz -o ~/fb.tar.gz
tar -xzf ~/fb.tar.gz -C $PREFIX/bin/ filebrowser
chmod +x $PREFIX/bin/filebrowser
rm -f ~/fb.tar.gz

# Baixar script de inicio
echo -e "\n${YELLOW}Baixando script de inicio...${NC}"
mkdir -p ~/termux-remote
curl -fsSL https://raw.githubusercontent.com/CaioHAlves/termux-remote/main/start.sh -o ~/termux-remote/start.sh
chmod +x ~/termux-remote/start.sh

# Adicionar aliases ao .bashrc
if ! grep -q "termux-remote" ~/.bashrc 2>/dev/null; then
    echo "" >> ~/.bashrc
    echo "# Termux Remote Access aliases" >> ~/.bashrc
    echo 'alias remote="bash ~/termux-remote/start.sh start"' >> ~/.bashrc
    echo 'alias stopremote="bash ~/termux-remote/start.sh stop"' >> ~/.bashrc
    echo 'alias restartremote="bash ~/termux-remote/start.sh restart"' >> ~/.bashrc
    echo 'alias tunnel="grep -o '"'"'[a-z0-9-]*\.trycloudflare\.com'"'"' ~/tunnel-terminal.log 2>/dev/null | tail -1"' >> ~/.bashrc
    echo 'alias tunnelfiles="grep -o '"'"'[a-z0-9-]*\.trycloudflare\.com'"'"' ~/tunnel-files.log 2>/dev/null | tail -1"' >> ~/.bashrc
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  INSTALACAO CONCLUIDA!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "  Para iniciar, rode:"
echo -e "  ${YELLOW}bash ~/termux-remote/start.sh${NC}"
echo ""
echo -e "  Ou use o alias:"
echo -e "  ${YELLOW}remote${NC}"
echo ""
echo -e "  Para parar:"
echo -e "  ${YELLOW}stopremote${NC}"
echo ""

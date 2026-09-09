# :iphone: Termux Remote Access

### Acesse o terminal e os arquivos do seu celular Android de qualquer computador!

---

## :thinking: O que e isso?

Seu celular Android tem um terminal poderoso escondido. Esse projeto **desbloqueia** ele e permite que voce acesse de qualquer navegador web, como se estivesse sentado na frente dele.

Voce pode:
- :computer: Digitar comandos no terminal (igual um hacker dos filmes!)
- :open_file_folder: Gerenciar arquivos (criar pastas, mover, editar, excluir)
- :globe_with_meridians: Acessar de qualquer lugar do mundo

---

## :gear: Como funciona?

```
Seu Celular (Termux)          Internet           Seu Computador
+-------------------+    +----------------+    +-------------------+
|                   |    |                |    |                   |
|  terminal (bash)  |--->|    Serveo      |--->|  Navegador Web    |
|  arquivos         |    |   (SSH tunel)  |    |  (Chrome, etc)    |
|                   |    |                |    |                   |
+-------------------+    +----------------+    +-------------------+
     porta 7681              URL publica          voce digita aqui!
     porta 8080
```

---

## :rocket: Instalacao rapida

### 1. Instalar o Termux

Baixe pelo [F-Droid](https://f-droid.org/pt-BR/packages/com.termux/) (NAO use o da Play Store).

### 2. Rodar o install

Abra o Termux e cole:

```bash
pkg update -y && pkg upgrade -y
pkg install -y nodejs proot curl git openssh
pkg install -y ttyd
curl -fsSL https://github.com/filebrowser/filebrowser/releases/latest/download/linux-arm64-filebrowser.tar.gz -o ~/fb.tar.gz
tar -xzf ~/fb.tar.gz -C $PREFIX/bin/ filebrowser
chmod +x $PREFIX/bin/filebrowser
git clone https://github.com/CaioHAlves/personal-remote-server.git ~/termux-remote
```

### 3. Iniciar

```bash
bash ~/termux-remote/start.sh
```

O script vai mostrar **duas URLs**. Abra ambas no navegador do computador!

---

## :bulb: COMO ACESSAR (passo a passo)

Quando voce roda `bash start.sh`, o script mostra **duas URLs**:

```
  ═══════════════════════════════════════

  Abra essas URLs no navegador do seu computador:

  TERMINAL:
  https://abc-xyz-123.serveousercontent.com

  ARQUIVOS:
  https://def-uvw-456.serveousercontent.com

  ═══════════════════════════════════════
```

### Passo 1: Copie a URL do TERMINAL

Cole no navegador. Voce vera o terminal do Termux. Pode digitar comandos normalmente!

### Passo 2: Copie a URL dos ARQUIVOS

Cole em outra aba do navegador. Voce vera os arquivos do celular numa interface bonita.

### Passo 3: Pronto!

Agora voce tem:
- Uma aba com o **terminal** (para digitar comandos)
- Outra aba com os **arquivos** (para gerenciar pastas e arquivos)

---

## :wrench: Comandos uteis

| Comando | O que faz |
|---------|-----------|
| `bash ~/termux-remote/start.sh` | Inicia tudo e mostra as URLs |
| `bash ~/termux-remote/start.sh stop` | Para todos os servicos |
| `bash ~/termux-remote/start.sh restart` | Reinicia tudo |
| `bash ~/termux-remote/start.sh status` | Mostra servicos rodando |
| `tunnel` | Mostra a URL atual do terminal |
| `tunnelfiles` | Mostra a URL do gerenciador de arquivos |

---

## :electric_plug: Portas utilizadas

| Servico | Porta | O que e |
|---------|:-----:|---------|
| ttyd | 7681 | Terminal web |
| filebrowser | 8080 | Gerenciador de arquivos |
| SSH | 8022 | Acesso SSH tradicional |

---

## :robot: Arquivos do projeto

```
termux-remote/
├── start.sh              # Script principal - inicia tudo
├── install.sh            # Script de instalacao automatica
├── README.md             # Este arquivo
├── .gitignore            # Arquivos ignorados pelo git
├── remote-server.js      # Servidor Node.js (proxy)
├── landing.js            # Pagina de inicio
├── start-cloudflared.sh  # Script para cloudflared
├── check-tunnel.sh       # Verifica status do tunnel
├── dns-forwarder.js      # Encaminhador DNS
├── tcp-tunnel.js         # Tunnel TCP (experimental)
├── start-ngrok.sh        # Script para ngrok
└── start-bore.sh         # Script para bore
```

---

## :bulb: Dicas

### :key: Adicionar senha no filebrowser

```bash
filebrowser -p 8080 -r ~ --username admin --password su_senha_aqui
```

### :repeat: Manter rodando depois de fechar o Termux

1. Abra o Termux
2. Digite `termux-wake-lock`
3. Pronto! O Termux nao vai mais dormir

### :arrows_counterclockwise: URLs mudaram?

Sim! A cada reinicio, novas URLs sao geradas. Para ver a URL atual:

```bash
tunnel      # URL do terminal
tunnelfiles # URL dos arquivos
```

---

## :bug: Problemas comuns

| Problema | Solucao |
|----------|---------|
| "conexao recusada" | Rode `bash ~/termux-remote/start.sh status` para verificar |
| Terminal nao digita | Recarregue a pagina (F5) |
| URL nao abre | Verifique a conexao com a internet |
| Script nao roda | Execute `pkg update -y` e tente de novo |

---

## :shield: Seguranca

- :warning: O filebrowser **nao tem senha** por padrao. Adicione uma!
- :warning: O terminal da acesso total ao celular. Nao compartilhe as URLs!
- :lock: As conexoes sao criptografadas pelo SSH

---

## :test_tube: O que funciona e o que nao

| Ferramenta | Funcionou? | Motivo |
|-----------|:----------:|--------|
| ttyd | :white_check_mark: | Terminal web perfeito |
| filebrowser | :white_check_mark: | Gerenciador de arquivos funcional |
| serveo (SSH) | :white_check_mark: | Tuneis gratuitos via SSH |
| cloudflared | :x: | Problemas de DNS no Termux |
| ngrok | :x: | Versao gratuita nao suporta TCP |
| bore | :x: | Servidor inacessivel |

---

## :heart: Creditos

- [ttyd](https://github.com/nicm/ttyd) - Terminal compartilhado via web
- [filebrowser](https://github.com/filebrowser/filebrowser) - Gerenciador de arquivos
- [serveo.net](https://serveo.net) - Tuneis SSH gratuitos
- [Termux](https://termux.dev/) - O terminal para Android

---

Feito com :heart: por [CaioHAlves](https://github.com/CaioHAlves)

## :page_facing_up: Licenca

MIT - Faca o que quiser! :tada:

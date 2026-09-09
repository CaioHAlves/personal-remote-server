# :iphone: Termux Remote Access

### Transforme seu celular Android num servidor acessivel de qualquer computador do mundo!

---

## :thinking: O que e isso?

Imagine que voce tem um computador poderoso no seu celular Android. Esse projeto permite que voce **acesse esse computador de qualquer navegador web**, como se estivesse sentado na frente dele.

Voce pode:
- :computer: Digitar comandos no terminal (igual um hacker dos filmes!)
- :open_file_folder: Gerenciar arquivos (criar pastas, mover, editar, excluir)
- :globe_with_meridians: Acessar de qualquer lugar do mundo

**Nao precisa de root, nem de computador ligado, nem de nada complicado!**

---

## :gear: Como funciona?

```
Seu Celular (Termux)          Internet           Seu Computador
+-------------------+    +----------------+    +-------------------+
|                   |    |                |    |                   |
|  terminal (bash)  |--->|   Cloudflare   |--->|  Navegador Web    |
|  arquivos         |    |   (tunel)      |    |  (Chrome, etc)    |
|                   |    |                |    |                   |
+-------------------+    +----------------+    +-------------------+
     porta 7681              URL publica          voce digita aqui!
     porta 8080
```

**Passo a passo:**

1. :fire: O **ttyd** compartilha o terminal do celular via WebSocket
2. :open_file_folder: O **filebrowser** mostra os arquivos numa interface bonita
3. :shield: O **cloudflared** cria um tunel seguro entre o celular e a Cloudflare
4. :star: A Cloudflare te da uma URL publica tipo `nome-cool.trycloudflare.com`
5. :tada: Voce abre essa URL no navegador do computador e pronto!

---

## :package: O que voce precisa

| Item | Onde achar | Obrigatorio? |
|------|-----------|:------------:|
| :iphone: Celular com Android | Loja de aplicativos | Sim |
| :package: Termux | [F-Droid](https://f-droid.org/pt-BR/packages/com.termux/) | Sim |
| :electric_plug: Conexao com a internet | Qualquer WiFi ou dados | Sim |
| :computer: Computador com navegador | Qualquer um | Sim |

---

## :rocket: Instalacao (passo a passo)

### Passo 1: Instalar o Termux

Baixe o Termux pelo [F-Droid](https://f-droid.org/pt-BR/packages/com.termux/) (NAO use o da Play Store, ele e antigo e nao funciona).

### Passo 2: Instalar as ferramentas

Abra o Termux e cole esses comandos **um por um**:

```bash
# Atualizar tudo primeiro
pkg update -y && pkg upgrade -y
```

```bash
# Instalar as dependencias basicas
pkg install -y nodejs proot curl git
```

```bash
# Instalar o ttyd (terminal web)
pkg install -y ttyd
```

```bash
# Baixar o cloudflared (tunel da Cloudflare)
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o $PREFIX/bin/cloudflared
chmod +x $PREFIX/bin/cloudflared
```

```bash
# Baixar o filebrowser (gerenciador de arquivos)
curl -fsSL https://github.com/filebrowser/filebrowser/releases/latest/download/linux-arm64-filebrowser.tar.gz -o /tmp/fb.tar.gz
tar -xzf /tmp/fb.tar.gz -C $PREFIX/bin/ filebrowser
chmod +x $PREFIX/bin/filebrowser
```

### Passo 3: Baixar os arquivos do projeto

```bash
# Clonar o repositorio
cd ~
git clone https://github.com/CaioHAlves/personal-remote-server.git termux-remote
cd termux-remote
```

### Passo 4: Iniciar

```bash
bash start.sh
```

**Pronto!** O script vai mostrar as URLs publicas. Copie e cole no navegador do computador!

---

## :wrench: Comandos uteis

| Comando | O que faz |
|---------|-----------|
| `bash start.sh` | Inicia tudo e mostra as URLs |
| `bash start.sh stop` | Para todos os servicos |
| `bash start.sh restart` | Reinicia tudo |
| `bash start.sh status` | Mostra servicos rodando |
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
│
├── --- Arquivos auxiliares ---
├── remote-server.js      # Servidor Node.js (proxy reverso)
├── landing.js            # Pagina de inicio simples
├── start-cloudflared.sh  # Script para iniciar cloudflared
├── check-tunnel.sh       # Verifica status do tunnel
├── dns-forwarder.js      # Encaminhador DNS
├── tcp-tunnel.js         # Tunnel TCP (experimental)
├── start-ngrok.sh        # Script para ngrok
└── start-bore.sh         # Script para bore
```

---

## :bulb: Dicas

### :key: Adicionar senha no filebrowser

Por padrao, o gerenciador de arquivos nao tem senha. Para adicionar:

```bash
filebrowser -p 8080 -r ~ --username admin --password su_senha_aqui
```

### :repeat: Manter rodando depois de fechar o Termux

O Termux pode fechar em background. Para evitar isso:

1. Abra o Termux
2. Digite `termux-wake-lock`
3. Pronto! O Termux nao vai mais dormir

### :arrows_counterclockwise: URLs mudaram?

Sim! A cada reinicio, a Cloudflare gera URLs novas. Para ver a URL atual:

```bash
tunnel      # URL do terminal
tunnelfiles # URL dos arquivos
```

---

## :bug: Problemas comuns

| Problema | Solucao |
|----------|---------|
| "conexao recusada" | Verifique se o script esta rodando com `bash start.sh status` |
| Terminal nao digita | Recarregue a pagina (F5) |
| URL nao abre | Verifique a conexao com a internet |
| Script nao roda | Execute `pkg update -y` e tente de novo |
| cloudflared nao inicia | Verifique se esta instalado: `cloudflared --version` |

---

## :shield: Seguranca

- :warning: O filebrowser **nao tem senha** por padrao. Adicione uma!
- :warning: O terminal da acesso total ao celular. Nao compartilhe as URLs!
- :lock: As conexoes sao criptografadas pela Cloudflare
- :iphone: Rode isso apenas no seu celular pessoal

---

## :test_tube: O que foi testado e funcionou

| Ferramenta | Funcionou? | Notas |
|-----------|:----------:|-------|
| ttyd | :white_check_mark: | Terminal web perfeito |
| filebrowser | :white_check_mark: | Gerenciador de arquivos funcional |
| cloudflared | :white_check_mark: | Tuneis gratuitos sem conta |
| Node.js proxy | :x: | WebSocket com problemas via cloudflare |

## :x: O que NAO funcionou

| Ferramenta | Motivo |
|-----------|--------|
| ngrok | Versao gratuita nao suporta TCP |
| bore | Servidor bore.pub inacessivel |
| code-server | Nao funciona no Android (dependencias nativas) |
| serveo.net | Nao suporta encaminhamento de portas |
| localhost.run | Apenas HTTP, nao TCP |

---

## :heart: Creditos

- [ttyd](https://github.com/nicm/ttyd) - Terminal compartilhado via web
- [filebrowser](https://github.com/filebrowser/filebrowser) - Gerenciador de arquivos
- [cloudflared](https://github.com/cloudflare/cloudflared) - Tuneis da Cloudflare
- [Termux](https://termux.dev/) - O terminal para Android

---

Feito com :heart: por [CaioHAlves](https://github.com/CaioHAlves)

## :page_facing_up: Licenca

MIT - Faca o que quiser! :tada:

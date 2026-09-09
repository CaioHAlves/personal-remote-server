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

## :gear: Como funciona? (explicacao simples)

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
2 :open_file_folder: O **filebrowser** mostra os arquivos numa interface bonita
3 :shield: O **cloudflared** cria um tunel seguro entre o celular e a Cloudflare
4 :star: A Cloudflare te da uma URL publica tipo `nome-cool.trycloudflare.com`
5 :tada: Voce abre essa URL no navegador do computador e pronto!

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
# Criar a pasta do projeto
mkdir -p ~/termux-remote
cd ~/termux-remote
```

Copie os arquivos `start.sh` e `README.md` para a pasta `~/termux-remote`.

### Passo 4: Dar permissao e rodar

```bash
chmod +x ~/termux-remote/start.sh
bash ~/termux-remote/start.sh
```

**Pronto!** O script vai mostrar as URLs publicas. Copie e cole no navegador do computador!

---

## :wrench: Comandos uteis

| Comando | O que faz |
|---------|-----------|
| `bash ~/termux-remote/start.sh` | Inicia tudo e mostra as URLs |
| `tunnel` | Mostra a URL atual do terminal |
| `stopremote` | Para todos os servicos |

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
 start.sh        # Script principal que inicia tudo
 README.md       # Este arquivo que voce esta lendo
```

---

## :bulb: Dicas

### :key: Adicionar senha no filebrowser

Por padrao, o gerenciador de arquivos nao tem senha. Para adicionar:

```bash
filebrowser -p 8080 -r ~ --username admin --password su senha
```

### :repeat: Manter rodando depois de fechar o Termux

O Termux pode fechar em background. Para evitar isso:

1. Abra o Termux
2. Digite `termux-wake-lock`
3. Pronto! O Termux nao vai mais dormir

### :arrows_counterclockwise: URLs mudaram?

Sim! A cada reinicio, a Cloudflare gera URLs novas. Para ver a URL atual:

```bash
tunnel    # URL do terminal
```

---

## :bug: Problemas comuns

| Problema | Solucao |
|----------|---------|
| " conexao recusada" | Verifique se o script esta rodando |
| Terminal nao digita | Recarregue a pagina (F5) |
| URL nao abre | Verifique a conexao com a internet |
| Script nao roda | Execute `pkg update -y` e tente de novo |

---

## :shield: Seguranca

- :warning: O filebrowser **nao tem senha** por padrao. Adicione uma!
- :warning: O terminal da acesso total ao celular. Nao compartilhe as URLs!
- :lock: As conexoes sao criptografadas pela Cloudflare
- :iphone: Rode isso apenas no seu celular pessoal

---

## :heart: Creditos

- [ttyd](https://github.com/nicm/ttyd) - Terminal compartilhado via web
- [filebrowser](https://github.com/filebrowser/filebrowser) - Gerenciador de arquivos
- [cloudflared](https://github.com/cloudflare/cloudflared) - Tuneis da Cloudflare
- [Termux](https://termux.dev/) - O terminal para Android

---

Feito com :heart: por [CaioHAlves](https://github.com/CaioHAlves)

## :page_facing_up: Licença

MIT - Faca o que quiser! :tada:

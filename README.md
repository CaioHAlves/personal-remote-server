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

## :sparkles: Funcionalidades

### Gerenciador de Arquivos (Simple File Server)

| Funcionalidade | Descricao |
|----------------|-----------|
| :art: **3 Modos de Visualizacao** | Lista, Grade ou Icones Pequenos |
| :globe_with_meridians: **Upload** | Arraste arquivos ou clique para enviar |
| :arrow_down: **Download** | Baixe arquivos individuais ou em lote (ZIP) |
| :pencil2: **Edicao** | Edite arquivos de texto direto no navegador |
| :warning: **Renomear** | Renomeie arquivos e pastas com um clique |
| :wastebasket: **Excluir** | Delete arquivos com confirmacao de seguranca |
| :closed_lock_with_key: **Senha** | Protegido por senha (configuravel) |
| :iphone: **Info do Sistema** | Mostra armazenamento, bateria e RAM |
| :battery: **Storage Bar** | Barra de progresso do armazenamento |
| :battery: **Memoria** | Uso de RAM em tempo real |

### Visualizacoes

| Modo | Quando usar |
|------|-------------|
| **Lista** | Ver muitos arquivos com detalhes (tamanho, data) |
| **Grade** | Ver imagens/videos como galeria |
| **Icones** | Navegar rapido em muitas pastas |

---

## :thinking: Como funciona?

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
pkg install -y nodejs proot curl git zip
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

### Passo 3: Baixar os arquivos do projeto

```bash
# Criar a pasta do projeto
mkdir -p ~/termux-remote
cd ~/termux-remote
```

Copie os arquivos `start.sh` e `simple-file-server.js` para a pasta `~/termux-remote`.

### Passo 4: Dar permissao e rodar

```bash
chmod +x ~/termux-remote/start.sh
bash ~/termux-remote/start.sh
```

**Pronto!** O script vai:
1. Pedir uma senha para o gerenciador de arquivos
2. Iniciar os servicos
3. Mostrar as URLs publicas

Copie e cole no navegador do computador!

---

## :wrench: Comandos uteis

| Comando | O que faz |
|---------|-----------|
| `bash ~/termux-remote/start.sh` | Inicia tudo e mostra as URLs |
| `bash ~/termux-remote/start.sh stop` | Para todos os servicos |
| `bash ~/termux-remote/start.sh restart` | Reinicia tudo |
| `bash ~/termux-remote/start.sh status` | Mostra status dos servicos |
| `tunnel` | Mostra a URL atual do terminal |

---

## :gear: Configuracao

### Senha do Servidor

Ao iniciar, o script pede uma senha. Para definir via variavel de ambiente:

```bash
export FILE_SERVER_PASS="minha_senha"
bash ~/termux-remote/start.sh
```

### Portas

| Servico | Porta | O que e |
|---------|:-----:|---------|
| ttyd | 7681 | Terminal web |
| file server | 8080 | Gerenciador de arquivos |
| SSH | 8022 | Acesso SSH tradicional |

### Mudar a porta do servidor de arquivos

```bash
export FILE_SERVER_PORT=9090
bash ~/termux-remote/start.sh
```

---

## :bulb: Dicas

### Manter rodando depois de fechar o Termux

O Termux pode fechar em background. Para evitar isso:

1. Abra o Termux
2. Digite `termux-wake-lock`
3. Pronto! O Termux nao vai mais dormir

### URLs mudaram?

Sim! A cada reinicio, a Cloudflare gera URLs novas. Para ver a URL atual:

```bash
tunnel    # URL do terminal
```

### Gerenciador de arquivos sem senha

Se preferir sem autenticacao, deixe vazio quando o script pedir a senha.

---

## :bug: Problemas comuns

| Problema | Solucao |
|----------|---------|
| "conexao recusada" | Verifique se o script esta rodando |
| Terminal nao digita | Recarregue a pagina (F5) |
| URL nao abre | Verifique a conexao com a internet |
| Script nao roda | Execute `pkg update -y` e tente de novo |
| Upload nao funciona | Verifique se o arquivo nao e muito grande (>100MB) |
| Senha esquecida | Reinicie o script e defina uma nova senha |

---

## :shield: Seguranca

- :lock: Senha obrigatoria por padrao
- :warning: O terminal da acesso total ao celular. Nao compartilhe as URLs!
- :lock: As conexoes sao criptografadas pela Cloudflare
- :iphone: Rode isso apenas no seu celular pessoal
- :key: Sessoes expiram apos 24 horas

---

## :page_facing_up: API Endpoints

| Endpoint | Metodo | Descricao |
|----------|--------|-----------|
| `/api/system` | GET | Info de storage, bateria, RAM |
| `/api/auth` | POST | Autenticacao com senha |
| `/api/rename` | POST | Renomear arquivo/pasta |
| `/api/delete` | POST | Excluir arquivo(s) |
| `/api/mkdir` | POST | Criar pasta |
| `/api/upload` | POST | Upload de arquivos |
| `/api/edit` | POST | Salvar edicao de arquivo |
| `/api/zip` | GET | Download multiplos arquivos como ZIP |

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

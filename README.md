# Termux Remote Access

### Transforme seu celular Android num servidor acessivel de qualquer computador do mundo!

---

## O que e isso?

Imagine que voce tem um computador poderoso no seu celular Android. Esse projeto permite que voce **acesse esse computador de qualquer navegador web**, como se estivesse sentado na frente dele.

Voce pode:
- Digitar comandos no terminal (igual um hacker dos filmes!)
- Gerenciar arquivos (criar pastas, mover, editar, excluir)
- Acessar de qualquer lugar do mundo

**Nao precisa de root, nem de computador ligado, nem de nada complicado!**

---

## Funcionalidades

### Gerenciador de Arquivos

| Funcionalidade | Descricao |
|----------------|-----------|
| **3 Modos de Visualizacao** | Lista, Grade ou Icones Pequenos |
| **Upload** | Arraste arquivos ou clique para enviar |
| **Download** | Baixe arquivos individuais ou em lote (ZIP) |
| **Edicao** | Edite arquivos de texto direto no navegador |
| **Renomear** | Renomeie arquivos e pastas com um clique |
| **Excluir** | Delete arquivos com confirmacao de seguranca |
| **Criar Pasta** | Crie novas pastas direto no navegador |
| **Senha** | Protegido por senha (configuravel) |
| **Info do Sistema** | Mostra armazenamento, bateria e RAM |

### Terminal Web

- Terminal completo via navegador
- Suporte a WebSocket para interacao em tempo real
- Acesso via `/terminal` na mesma URL

### Visualizacoes

| Modo | Quando usar |
|------|-------------|
| **Lista** | Ver muitos arquivos com detalhes (tamanho, data) |
| **Grade** | Ver imagens/videos como galeria |
| **Icones** | Navegar rapido em muitas pastas |

---

## Como funciona?

```
Seu Celular (Termux)          Internet           Seu Computador
+-------------------+    +----------------+    +-------------------+
|                   |    |                |    |                   |
|  ttyd (terminal)  |--->|  localhost.run  |--->|  Navegador Web    |
|  file server      |    |   (tunel SSH)  |    |  (Chrome, etc)    |
|  reverse proxy    |    |                |    |                   |
|                   |    |                |    |                   |
+-------------------+    +----------------+    +-------------------+
     porta 7681              URL publica          voce digita aqui!
     porta 8080              (lhr.life)
     porta 9090
```

**Passo a passo:**

1. O **ttyd** compartilha o terminal do celular via WebSocket
2. O **simple-file-server** mostra os arquivos numa interface bonita
3. O **reverse-proxy** combina terminal e arquivos numa unica porta
4. O **localhost.run** cria um tunel SSH gratuito e estavel
5. Voce recebe uma URL tipo `abc.lhr.life` que funciona enquanto o celular estiver ligado
6. Voce abre essa URL no navegador do computador e pronto!

**URLs:**
- Arquivos: `https://URL/`
- Terminal: `https://URL/terminal`

---

## O que voce precisa

| Item | Onde achar | Obrigatorio? |
|------|-----------|:------------:|
| Celular com Android | Loja de aplicativos | Sim |
| Termux | [F-Droid](https://f-droid.org/pt-BR/packages/com.termux/) | Sim |
| Conexao com a internet | Qualquer WiFi ou dados | Sim |
| Computador com navegador | Qualquer um | Sim |

---

## Instalacao (passo a passo)

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
pkg install -y nodejs ttyd ssh curl git zip
```

### Passo 3: Baixar os arquivos do projeto

```bash
# Clonar o repositorio
git clone https://github.com/CaioHAlves/personal-remote-server.git
cd personal-remote-server
```

Ou baixe os arquivos manualmente:
- `simple-file-server.js`
- `reverse-proxy.js`
- `start.sh`

### Passo 4: Dar permissao e rodar

```bash
chmod +x start.sh
bash start.sh
```

**Pronto!** O script vai:
1. Pedir uma senha para o gerenciador de arquivos
2. Iniciar todos os servicos (ttyd, file server, reverse proxy)
3. Criar o tunel com localhost.run
4. Mostrar as URLs publicas

Copie e cole no navegador do computador!

---

## Comandos uteis

| Comando | O que faz |
|---------|-----------|
| `bash ~/start.sh` | Inicia tudo e mostra as URLs |
| `bash ~/start.sh stop` | Para todos os servicos |
| `bash ~/start.sh restart` | Reinicia tudo |
| `bash ~/start.sh status` | Mostra status e URLs atuais |
| `tunnel` | Mostra as URLs atuais |
| `stopremote` | Para todos os servicos rapidamente |

---

## Configuracao

### Senha do Servidor

Ao iniciar, o script pede uma senha. Para definir via variavel de ambiente:

```bash
export FILE_SERVER_PASS="minha_senha"
bash ~/start.sh
```

Ou na mesma linha:

```bash
FILE_SERVER_PASS=minha123 bash ~/start.sh
```

### Portas

| Servico | Porta | O que e |
|---------|:-----:|---------|
| ttyd | 7681 | Terminal web |
| file server | 8080 | Gerenciador de arquivos |
| reverse proxy | 9090 | Combina tudo (terminal + arquivos) |
| localhost.run | SSH | Tuneis para internet |

---

## Dicas

### Manter rodando depois de fechar o Termux

O Termux pode fechar em background. Para evitar isso:

1. Abra o Termux
2. Digite `termux-wake-lock`
3. Pronto! O Termux nao vai mais dormir

### URLs mudaram?

Sim! A cada reinicio, o localhost.run gera URLs novas. Para ver a URL atual:

```bash
tunnel
```

### Gerenciador de arquivos sem senha

Se preferir sem autenticacao, aperte Enter quando o script pedir a senha.

---

## Arquitetura

```
+-----------------+
|   ttyd :7681    |---+
+-----------------+   |
                      |   +------------------+
+-----------------+   +-->| reverse-proxy    |--> localhost.run --> Internet
| file-server:8080|---+   |    :9090         |
+-----------------+       +------------------+
```

O **reverse-proxy.js** e responsavel por:
- Rota `/terminal` e `/terminal/*` -> encaminha para o ttyd (incluindo WebSocket)
- Todas as outras rotas -> encaminha para o file server
- Gerencia conexoes WebSocket para o terminal funcionar corretamente

---

## Problemas comuns

| Problema | Solucao |
|----------|---------|
| "conexao recusada" | Verifique se o script esta rodando |
| Terminal pagina preta | O reverse proxy precisa estar ativo; reinicie com `bash ~/start.sh restart` |
| URL nao abre | Verifique a conexao com a internet |
| Script nao roda | Execute `pkg update -y` e tente de novo |
| Upload nao funciona | Verifique se o arquivo nao e muito grande (>100MB) |
| Senha esquecida | Reinicie o script e defina uma nova senha |
| Terminal nao responde | Recarregue a pagina (F5) |

---

## Seguranca

- Senha obrigatoria por padrao
- O terminal da acesso total ao celular. Nao compartilhe as URLs!
- Conexoes criptografadas via SSH (localhost.run)
- Rode isso apenas no seu celular pessoal
- Sessoes expiram apos 24 horas

---

## API Endpoints

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

## Creditos

- [ttyd](https://github.com/nicm/ttyd) - Terminal compartilhado via web
- [localhost.run](https://localhost.run/) - Tuneis SSH gratuitos e estaveis
- [Termux](https://termux.dev/) - O terminal para Android

---

Feito por [CaioHAlves](https://github.com/CaioHAlves)

## Licenca

MIT

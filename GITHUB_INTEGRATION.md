# 🔗 Como Vincular o App ao GitHub

## O Que é GitHub?

GitHub é como um "cofre na nuvem" onde você guarda todo o código do seu app. É útil para:
- 📦 Fazer backup do código
- 👥 Trabalhar em equipe
- 📝 Ver o histórico de mudanças
- 🚀 Facilitar deploy em outros servidores

---

## Método 1: Usar a Interface do Manus (Mais Fácil)

### Passo a Passo

1. **Abra o painel do seu projeto**
   - Vá para a interface do Manus
   - Clique no seu projeto "centertaxi-platform"

2. **Acesse as Configurações**
   - Clique no ícone de engrenagem (⚙️) ou "Settings"
   - Procure a seção "GitHub"

3. **Conecte sua conta GitHub**
   - Clique em "Connect GitHub"
   - Faça login na sua conta GitHub
   - Autorize o Manus a acessar seus repositórios

4. **Exporte o código**
   - Escolha o nome do repositório (exemplo: `centertaxi-app`)
   - Escolha se será **Público** ou **Privado** (recomendo Privado)
   - Clique em "Export to GitHub"

5. **Pronto!** 🎉
   - Seu código agora está no GitHub
   - URL será algo como: `https://github.com/seu-usuario/centertaxi-app`

---

## Método 2: Usar o Terminal (Mais Avançado)

Se você tem acesso ao terminal do Manus ou quer fazer manualmente:

### 1. Criar Repositório no GitHub

1. Acesse [github.com](https://github.com)
2. Clique no botão **"New"** (verde) ou no "+" no canto superior direito
3. Escolha **"New repository"**
4. Preencha:
   - **Repository name:** `centertaxi-app`
   - **Description:** "Plataforma de mobilidade urbana CenterTáxi"
   - **Visibility:** Private (recomendado)
5. **NÃO** marque "Initialize with README"
6. Clique em **"Create repository"**

### 2. Conectar o Projeto ao GitHub

No terminal do Manus, execute:

```bash
cd /home/ubuntu/centertaxi-platform

# Inicializar git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Fazer o primeiro commit
git commit -m "Initial commit - CenterTáxi MVP"

# Conectar ao repositório remoto (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/centertaxi-app.git

# Enviar o código para o GitHub
git branch -M main
git push -u origin main
```

### 3. Autenticação

O GitHub vai pedir autenticação. Você tem 2 opções:

**Opção A: Personal Access Token (Recomendado)**

1. Vá em GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Clique em "Generate new token (classic)"
3. Dê um nome: "Manus CenterTáxi"
4. Marque os scopes: `repo` (todos os sub-itens)
5. Clique em "Generate token"
6. **COPIE O TOKEN** (você só verá uma vez!)
7. Use o token como senha quando o git pedir

**Opção B: GitHub CLI**

```bash
# Instalar GitHub CLI (já está instalado no Manus)
gh auth login

# Siga as instruções na tela
```

---

## Atualizações Futuras

Sempre que fizer mudanças no código e quiser enviar para o GitHub:

```bash
cd /home/ubuntu/centertaxi-platform

# Ver o que mudou
git status

# Adicionar as mudanças
git add .

# Fazer commit com mensagem descritiva
git commit -m "Adiciona autenticação Apple"

# Enviar para o GitHub
git push
```

---

## Estrutura Recomendada

Seu repositório no GitHub ficará assim:

```
centertaxi-app/
├── client/              # Frontend (React)
│   ├── src/
│   ├── public/
│   └── index.html
├── server/              # Backend (Express + tRPC)
│   ├── routers.ts
│   ├── db.ts
│   └── _core/
├── drizzle/             # Banco de dados
│   └── schema.ts
├── package.json
├── README_MVP.md        # Documentação completa
├── GUIA_SIMPLES.md      # Guia para usuários
└── todo.md              # Lista de tarefas
```

---

## Benefícios de Usar GitHub

### 1. Backup Automático
- Seu código está seguro na nuvem
- Nunca perca seu trabalho

### 2. Histórico Completo
- Veja todas as mudanças que fez
- Volte para versões antigas se precisar

### 3. Trabalho em Equipe
- Convide desenvolvedores para colaborar
- Cada um trabalha em sua própria branch

### 4. Deploy Facilitado
- Conecte com Vercel, Netlify, Railway
- Deploy automático a cada push

### 5. Documentação
- README.md aparece na página principal
- Outros desenvolvedores entendem o projeto

---

## Boas Práticas

### Mensagens de Commit Claras

❌ **Ruim:**
```bash
git commit -m "fix"
git commit -m "mudanças"
git commit -m "aaa"
```

✅ **Bom:**
```bash
git commit -m "Adiciona autenticação Apple"
git commit -m "Corrige bug no cálculo de preço"
git commit -m "Melhora layout da página do motorista"
```

### Arquivo .gitignore

Certifique-se de ter um `.gitignore` para não enviar arquivos desnecessários:

```
# Dependências
node_modules/
.pnpm-store/

# Ambiente
.env
.env.local

# Build
dist/
build/

# Logs
*.log

# Sistema
.DS_Store
Thumbs.db
```

### Branches

Para funcionalidades grandes, crie branches:

```bash
# Criar nova branch
git checkout -b feature/pagamento-pix

# Trabalhar na branch
git add .
git commit -m "Implementa pagamento PIX"

# Voltar para main e fazer merge
git checkout main
git merge feature/pagamento-pix

# Enviar tudo
git push
```

---

## Problemas Comuns

### "Permission denied"
- Verifique se você tem permissão no repositório
- Use Personal Access Token em vez de senha

### "Repository not found"
- Verifique se a URL está correta
- Verifique se o repositório existe no GitHub

### "Conflict"
- Acontece quando há mudanças conflitantes
- Resolva manualmente e faça commit

---

## Links Úteis

- 📚 [Documentação GitHub](https://docs.github.com)
- 🎓 [GitHub Learning Lab](https://lab.github.com)
- 💬 [GitHub Community](https://github.community)

---

**Pronto! Agora seu código está seguro no GitHub! 🎉**

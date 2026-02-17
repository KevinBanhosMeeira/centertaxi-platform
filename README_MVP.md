# CenterTáxi MVP - Plataforma de Mobilidade Urbana

## Visão Geral

O **CenterTáxi MVP** é uma plataforma de mobilidade urbana completa, desenvolvida para conectar passageiros e motoristas de forma eficiente e segura. O sistema foi construído como um Progressive Web App (PWA) instalável, oferecendo experiência mobile-first com possibilidade de download via APK.

## Funcionalidades Implementadas

### 🔐 Autenticação e Perfis
- Login via OAuth Google (Manus)
- Seleção de perfil no primeiro acesso (Passageiro ou Motorista)
- Cadastro simplificado com nome e telefone
- Redirecionamento automático baseado no perfil do usuário

### 🚗 Interface do Passageiro
- **Mapa em tempo real** com geolocalização automática
- **Solicitação de corrida** com autocomplete de endereços
- **Cálculo automático** de distância e preço (R$ 3,50/km)
- **Visualização da rota** no mapa antes de confirmar
- **Acompanhamento em tempo real** do status da corrida
- **Cancelamento de corrida** (quando permitido)
- **Histórico completo** de corridas realizadas

### 🚕 Interface do Motorista
- **Lista de corridas disponíveis** com atualização automática
- **Detalhes completos** de cada solicitação (origem, destino, distância, preço)
- **Aceitar corridas** com um clique
- **Controles de status** (Iniciar → Finalizar corrida)
- **Histórico de corridas** com estatísticas de ganhos
- **Atualização automática de localização** (a cada 10 segundos)

### 🗺️ Google Maps Integration
- Mapa interativo com proxy de autenticação automático
- Autocomplete de endereços (Places API)
- Cálculo de rotas e distâncias (Directions API)
- Visualização de rotas no mapa
- Geolocalização do usuário

### 📊 Painel Administrativo
- **Dashboard com estatísticas** (usuários, corridas ativas, concluídas)
- **Gestão de usuários** (passageiros, motoristas, admins)
- **Gestão de corridas** (todas as corridas com detalhes completos)
- **Visualização em tempo real** de corridas ativas

### ⚡ Sistema de Matching
- Matching manual: motoristas veem e aceitam corridas
- Atualização em tempo real via polling (5 segundos)
- Validação de corridas ativas (1 corrida por vez)
- Estados de corrida: Solicitada → Aceita → Em Andamento → Concluída/Cancelada

## Arquitetura Técnica

### Stack Tecnológico
- **Frontend**: React 19 + Tailwind CSS 4
- **Backend**: Node.js + Express + tRPC 11
- **Banco de Dados**: MySQL/TiDB
- **Autenticação**: Manus OAuth
- **Mapas**: Google Maps API (via proxy Manus)
- **Tipagem**: TypeScript end-to-end

### Estrutura do Banco de Dados

#### Tabela `users`
```sql
- id (int, PK)
- openId (varchar, unique)
- name (text)
- email (varchar)
- phone (varchar)
- role (enum: passenger, driver, admin)
- profileCompleted (int: 0 ou 1)
- createdAt, updatedAt, lastSignedIn (timestamp)
```

#### Tabela `rides`
```sql
- id (int, PK)
- passengerId (int, FK → users.id)
- driverId (int, FK → users.id, nullable)
- status (enum: requested, accepted, in_progress, completed, cancelled)
- originAddress, destinationAddress (text)
- originLat, originLng, destinationLat, destinationLng (varchar)
- distanceKm, priceEstimate, finalPrice (varchar)
- createdAt, acceptedAt, startedAt, completedAt, cancelledAt (timestamp)
```

#### Tabela `driverLocations`
```sql
- id (int, PK)
- driverId (int, FK → users.id)
- lat, lng (varchar)
- updatedAt (timestamp)
```

## Como Usar

### 1. Acesso Inicial
1. Acesse a URL do app: `https://[seu-dominio].manus.space`
2. Clique em **"Entrar"** e faça login com Google
3. Complete seu perfil escolhendo: **Passageiro** ou **Motorista**

### 2. Como Passageiro

#### Solicitar uma Corrida
1. Na tela inicial, clique em **"Solicitar corrida"**
2. Digite o **endereço de origem** (ou use sua localização atual)
3. Digite o **endereço de destino**
4. Veja a **rota no mapa** e o **preço estimado**
5. Clique em **"Confirmar corrida"**

#### Acompanhar a Corrida
- Após solicitar, você verá o status em tempo real:
  - **Procurando motorista...** (aguardando aceitação)
  - **Motorista a caminho** (corrida aceita)
  - **Em andamento** (corrida iniciada)
  - **Concluída** (corrida finalizada)

#### Cancelar uma Corrida
- Você pode cancelar enquanto o status for "Procurando motorista" ou "Motorista a caminho"
- Clique no ícone **X** no card da corrida ativa

#### Ver Histórico
- Clique em **"Histórico"** no menu superior
- Veja todas as suas corridas passadas com detalhes

### 3. Como Motorista

#### Aceitar uma Corrida
1. Na tela inicial, veja a **lista de corridas disponíveis**
2. Cada corrida mostra: origem, destino, distância e preço
3. Clique em **"Aceitar corrida"** na corrida desejada

#### Gerenciar a Corrida
1. Após aceitar, veja os detalhes completos
2. Clique em **"Iniciar corrida"** quando chegar ao passageiro
3. Clique em **"Finalizar corrida"** ao chegar no destino

#### Ver Histórico e Ganhos
- Clique em **"Histórico"** no menu superior
- Veja suas estatísticas:
  - Total de corridas concluídas
  - Total ganho (soma de todas as corridas)

### 4. Como Administrador

#### Acessar o Painel
- Após login, você será redirecionado automaticamente para `/admin`

#### Visualizar Estatísticas
- Dashboard mostra:
  - Total de usuários
  - Total de passageiros
  - Total de motoristas
  - Corridas ativas

#### Gerenciar Usuários e Corridas
- Aba **"Corridas"**: veja todas as corridas (ativas e concluídas)
- Aba **"Usuários"**: veja todos os usuários cadastrados

## Instalação como PWA

### Android (Chrome/Edge)
1. Acesse o app no navegador
2. Toque no menu (⋮) → **"Adicionar à tela inicial"**
3. Confirme a instalação
4. O app será instalado como um aplicativo nativo

### iOS (Safari)
1. Acesse o app no Safari
2. Toque no botão de compartilhar (□↑)
3. Role e toque em **"Adicionar à Tela de Início"**
4. Confirme a instalação

### Desktop (Chrome/Edge)
1. Acesse o app no navegador
2. Clique no ícone de instalação na barra de endereço
3. Confirme a instalação
4. O app será instalado como aplicativo standalone

## Geração de APK

Para gerar um APK instalável para Android:

### Opção 1: PWABuilder (Recomendado)
1. Acesse [PWABuilder.com](https://www.pwabuilder.com/)
2. Cole a URL do seu app: `https://[seu-dominio].manus.space`
3. Clique em **"Start"**
4. Escolha **"Android"** → **"Generate"**
5. Baixe o APK gerado
6. Instale no Android (ative "Fontes desconhecidas" nas configurações)

### Opção 2: Bubblewrap CLI
```bash
# Instalar Bubblewrap
npm install -g @bubblewrap/cli

# Inicializar projeto
bubblewrap init --manifest https://[seu-dominio].manus.space/manifest.json

# Gerar APK
bubblewrap build

# APK estará em: ./app-release-signed.apk
```

## Próximos Passos (Roadmap)

### Fase 2 - Melhorias
- [ ] WebSocket para atualizações em tempo real (substituir polling)
- [ ] Chat in-app entre passageiro e motorista
- [ ] Sistema de avaliações (rating)
- [ ] Notificações push
- [ ] Integração com WhatsApp
- [ ] Pagamento PIX com split automático
- [ ] Chat com IA por voz
- [ ] Previsão de tempo e sugestões inteligentes
- [ ] Sistema white-label multi-tenancy

### Fase 3 - Escalabilidade
- [ ] Pricing dinâmico
- [ ] Circuit breakers e resiliência
- [ ] Cache distribuído
- [ ] Logs e monitoramento avançado
- [ ] Feature flags
- [ ] A/B testing

## Tecnologias e Integrações

### APIs Utilizadas
- **Manus OAuth**: Autenticação de usuários
- **Google Maps API**: Mapas, rotas, autocomplete
- **Manus Forge API**: LLM, storage, notificações (preparado para futuro)

### Segurança
- Autenticação via OAuth 2.0
- Tokens JWT para sessões
- Validação de roles em todas as procedures
- Proteção contra CSRF
- HTTPS obrigatório

### Performance
- Polling otimizado (3-5 segundos)
- Lazy loading de componentes
- Otimização de imagens
- Cache de rotas do Google Maps
- Queries otimizadas no banco

## Suporte e Contato

Para dúvidas, sugestões ou suporte:
- Email: atendimento@centertaxi.app
- Website: [centertaxi.com.br](https://centertaxi.com.br)

---

**Desenvolvido com ❤️ pela equipe CenterTáxi**

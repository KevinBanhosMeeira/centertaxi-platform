# CenterTáxi MVP - Lista de Funcionalidades

## Banco de Dados e Modelos
- [x] Estender schema de usuários com role (passenger/driver/admin) e campos específicos
- [x] Criar tabela de corridas (rides) com status e relacionamentos
- [x] Criar tabela de localizações (locations) para tracking em tempo real
- [x] Criar tabela de histórico de corridas
- [x] Configurar relacionamentos entre tabelas

## Autenticação e Perfis
- [x] Implementar autenticação via email/senha
- [x] Integrar OAuth Google
- [x] Criar fluxo de seleção de perfil (passageiro/motorista) no primeiro login
- [x] Adicionar validação de perfil em procedures protegidas
- [x] Criar página de perfil do usuário

## Interface Passageiro
- [x] Criar página inicial do passageiro com mapa
- [x] Implementar formulário de solicitação de corrida (origem/destino)
- [x] Mostrar preço estimado antes de confirmar
- [x] Exibir status da corrida em tempo real
- [x] Mostrar localização do motorista no mapa
- [x] Adicionar botão de cancelar corrida
- [x] Criar histórico de corridas do passageiro

## Interface Motorista
- [x] Criar página inicial do motorista com lista de solicitações
- [x] Implementar botão de aceitar/rejeitar corrida
- [x] Mostrar detalhes da corrida aceita
- [x] Adicionar controles de status (iniciar/finalizar corrida)
- [ ] Exibir rota no mapa (usando Google Maps)
- [x] Criar histórico de corridas do motorista

## Google Maps e Geolocalização
- [x] Integrar componente Map com Google Maps
- [x] Implementar geolocalização do usuário
- [x] Adicionar autocomplete de endereços
- [x] Calcular distância entre origem e destino
- [x] Calcular preço baseado em tarifa fixa por km
- [x] Exibir rota no mapa

## Sistema de Matching e Tempo Real
- [x] Criar procedure para solicitar corrida
- [x] Criar procedure para listar corridas disponíveis (motoristas)
- [x] Criar procedure para aceitar corrida
- [x] Implementar atualização de status da corrida
- [x] Adicionar polling para atualizações em tempo real
- [ ] Implementar sistema de notificações básico (futuro)

## Painel Administrativo
- [x] Criar layout de dashboard para admin
- [x] Listar todos os usuários (passageiros e motoristas)
- [x] Listar corridas ativas e concluídas
- [ ] Adicionar filtros e busca (futuro)
- [x] Mostrar estatísticas básicas (total de corridas, usuários)

## PWA e Mobile
- [x] Configurar manifest.json para PWA
- [ ] Adicionar service worker para cache (opcional para MVP)
- [x] Otimizar layout para mobile-first
- [x] Testar instalação como PWA
- [ ] Gerar APK para Android (via PWABuilder ou similar)

## Testes e Entrega
- [x] Testar fluxo completo passageiro → motorista
- [x] Testar autenticação e seleção de perfil
- [x] Testar cálculo de preço e matching
- [ ] Criar documentação de uso
- [ ] Criar checkpoint final
- [ ] Preparar instruções de instalação do APK

## Novas Melhorias Solicitadas
- [ ] Adicionar autenticação via Apple ID (requer Apple Developer Account - $99/ano)
- [x] Criar guia simplificado de acesso (explicação para criança de 8 anos)
- [x] Configurar integração com GitHub
- [x] Preparar instruções específicas para instalação no iOS

## Correções de Bugs
- [x] Corrigir erro "Cannot update a component while rendering" no CompleteProfile
- [x] Melhorar navegação entre interfaces (passageiro, motorista, admin)

## Melhorias de Acesso
- [x] Separar completamente acesso ao painel admin do app passageiro/motorista
- [x] Remover redirecionamento automático para /admin
- [x] Admin acessa /admin manualmente, usuários normais usam o app

## Correções de Erros Maps
- [x] Corrigir erro "Map container not found" na home
- [x] Corrigir erro "Google Maps API included multiple times"

## Correção Map Container
- [x] Adicionar verificação robusta de existência do container antes de inicializar Map

## Correções de Queries e Map
- [x] Corrigir queries retornando undefined (devem retornar null)
- [x] Prevenir Map de tentar carregar na home

## Implementação do Logo
- [x] Copiar logo CenterTáxi para o projeto
- [x] Substituir ícones genéricos pelo logo em todas as telas

## Redesign Interface Passageiro
- [x] Refatorar página Passenger para mapa em tela cheia
- [x] Adicionar campo de busca de destino na parte inferior
- [x] Seguir layout do white-label (mapa fullscreen + bottom sheet)

## Correção de Navegação
- [x] Corrigir botões "Acessar como Passageiro" e "Acessar como Motorista" que não estão navegando

## Investigação Navegação
- [x] Investigar por que botões ainda não estão navegando
- [x] Verificar se há redirecionamento conflitante
- [x] Aplicar correção definitiva

## Ajuste Layout Passageiro
- [x] Mover card "Procurando motorista" para bottom sheet
- [x] Adicionar saudação "Boa noite/dia/tarde, [Nome]"
- [x] Adicionar campo "Buscar destino" com ícone de lupa
- [x] Adicionar botão de calendário para agendar
- [x] Adicionar lista de locais recentes/favoritos

## Refatoração Tela Passageiro - 2 Estados
- [x] Criar Tela 1 (SEM corrida): mapa + bottom sheet com busca de destino
- [x] Mostrar nome correto do usuário logado na saudação
- [x] Ao selecionar destino: mostrar rota no mapa com Google Directions
- [x] Criar Tela 2 (COM corrida ativa): mapa com rota + bottom sheet "Procurando motorista"
- [x] Separar claramente os 2 estados (antes e depois de solicitar corrida)

## Visualização Motorista no Mapa
- [x] Adicionar marker do carro do motorista no mapa
- [x] Mostrar rota do motorista até o passageiro quando corrida for aceita
- [x] Atualizar posição do motorista em tempo real (polling a cada 3 segundos)
- [x] Adicionar marker do passageiro (localização atual)

## Correção do Mapa - Layout
- [x] Corrigir mapa que fica "dançando" acima da localização do usuário
- [x] Separação clara e definida entre mapa e bottom sheet
- [x] Garantir que logo do Google Maps fique visível no rodapé do mapa
- [x] Centralizar mapa corretamente na localização do usuário

## Barra de Navegação Inferior (Mobile)
- [x] Implementar bottom navigation com 3 abas
- [x] Aba "Início" - tela principal do passageiro com mapa
- [x] Aba "Atividade" - histórico de corridas realizadas
- [x] Aba "Conta" - perfil e configurações do usuário

## Agendamento de Corridas
- [x] Adicionar funcionalidade de agendamento de corridas
- [x] Implementar seletor de data e hora
- [x] Integrar agendamento no fluxo de solicitação de corrida
- [x] Adicionar campos scheduledAt e isScheduled no schema do banco
- [x] Atualizar endpoint de request ride para suportar agendamento
- [x] Testes vitest passando (8/8)

## Correções PWA Android
- [x] Investigar e corrigir problema de telas não carregando no Android
- [x] Verificar console errors no Android (erros de query do banco - não afetam PWA)
- [x] Testar compatibilidade de rotas e navegação no PWA

## Atualização de Ícones e Splash Screen
- [x] Gerar ícones PWA em múltiplos tamanhos (192x192, 512x512, etc) a partir do logo CenterTáxi
- [x] Criar splash screen com logo CenterTáxi (formato 16:9) em 9 tamanhos diferentes
- [x] Atualizar manifest.json com novos ícones e cores da marca (#003DA5)
- [x] Atualizar favicon (16x16, 32x32)
- [x] Adicionar apple-touch-icon (180x180)
- [x] Adicionar meta tags para iOS splash screens (10 tamanhos diferentes de telas)
- [x] Atualizar theme-color para azul da marca (#003DA5)
- [x] Adicionar meta tags apple-mobile-web-app

## Melhorias Visuais do Mapa - Marcadores e Rota
- [x] Adicionar marcador de origem (Ponto A) mostrando localização atual do usuário (círculo azul #003DA5 com letra A)
- [x] Adicionar marcador de destino (Ponto B) quando usuário digitar o endereço (círculo vermelho #E63946 com letra B)
- [x] Traçar rota no mapa mostrando o menor caminho entre origem e destino (linha vermelha)
- [x] Garantir que ambos os marcadores sejam visíveis simultaneamente no mapa (fitBounds com padding)

## Histórico de Endereços Recentes
- [ ] Criar tabela no banco para armazenar histórico de endereços por usuário
- [ ] Criar endpoint tRPC para salvar endereço no histórico
- [ ] Criar endpoint tRPC para buscar últimos 5 endereços do usuário
- [ ] Atualizar interface do passageiro para mostrar endereços recentes
- [ ] Salvar endereço automaticamente quando usuário seleciona um destino
- [ ] Permitir clicar em endereço recente para preencher campo de destino
- [ ] Escrever testes para funcionalidade de histórico

## Substituição de Ícone PWA - Logo Oficial
- [x] Gerar icon-192.png usando logo oficial CenterTáxi (fundo cinza claro #E8E8E8)
- [x] Gerar icon-512.png usando logo oficial CenterTáxi (fundo cinza claro #E8E8E8)
- [x] Atualizar apple-touch-icon (180x180) com logo oficial
- [x] Atualizar favicons (16x16, 32x32) com logo oficial
- [x] Manter theme_color azul (#003DA5) - cor principal da marca
- [x] Atualizar background_color para #E8E8E8 (cor de fundo do logo)

## Sistema de Avaliação Pós-Corrida
- [x] Criar tabela ratings no banco (rideId, passengerId, driverId, rating 1-5, comment, createdAt)
- [x] Criar endpoint tRPC para salvar avaliação (ratings.create)
- [x] Criar endpoint tRPC para buscar avaliações de um motorista (ratings.getDriverRatings)
- [x] Criar endpoint tRPC para verificar se corrida foi avaliada (ratings.checkRideRated)
- [x] Criar modal de avaliação com estrelas clicáveis (1-5) e hover effect
- [x] Adicionar campo de comentário opcional no modal (500 caracteres)
- [x] Exibir modal automaticamente quando corrida for finalizada
- [x] Escrever testes para funcionalidade de avaliação (14/16 testes passando)

## Customização do Design do Google Maps
- [x] Remover POIs (Points of Interest) - propagandas, estabelecimentos comerciais reduzidos drasticamente
- [x] Aplicar estilo minimalista similar ao Uber
- [x] Usar cores neutras (cinza claro #f5f5f5 para ruas, #fafafa para fundo)
- [x] Ocultar labels desnecessários via visibility: off em todos os tipos de POI
- [x] Manter apenas informações essenciais (ruas principais, água em #c9e6f2, parques)
- [x] Destacar apenas a rota e os marcadores de origem/destino
- [x] Desabilitar POIs clicáveis (clickableIcons: false)
- [x] Aumentar zoom padrão para 17 para reduzir POIs visíveis


---

# 🚀 ROADMAP DE REESTRUTURAÇÃO - PLATAFORMA COMPLETA

Ver detalhes completos em `ROADMAP.md`

## Fase 1: Estrutura de Domains (Backend)
- [ ] Criar server/domains/ com subpastas (auth, users, drivers, rides, payments, notifications, ai, admin, tenant)
- [ ] Cada domain com router.ts, service.ts, repository.ts, types.ts
- [ ] Integrar todos os domains no routers.ts principal

## Fase 2: Banco Multi-Tenant
- [ ] Criar tabela tenants (nome, logo, cores, cidade)
- [ ] Criar tabela tenant_settings
- [ ] Criar tabela vehicles (motoristas)
- [ ] Criar tabela ride_events (log de eventos)
- [ ] Adicionar tenant_id em users, drivers, rides

## Fase 3: Ride State Machine
- [ ] Implementar estados: REQUESTED → MATCHING → OFFERED → ACCEPTED → DRIVER_EN_ROUTE → DRIVER_ARRIVED → IN_PROGRESS → COMPLETED / CANCELED
- [ ] Validar transições entre estados
- [ ] Registrar eventos em ride_events
- [ ] Notificar passageiro e motorista em cada transição

## Fase 4: Sistema Realtime (WebSocket)
- [ ] Criar server/realtime/ com websocket.ts, events.ts, handlers.ts
- [ ] Implementar eventos: ride:offered, ride:accepted, ride:status_changed, driver:location_update, notification:new
- [ ] Implementar rooms por ride, driver, passenger

## Fase 5: Aplicativo do Motorista
- [ ] Reestruturar frontend: client/src/driver/
- [ ] Login / Cadastro motorista
- [ ] Toggle Online/Offline
- [ ] Receber ofertas de corrida (realtime)
- [ ] Aceitar / Recusar corrida
- [ ] Navegar até passageiro (mapa com rota)
- [ ] Botões: Cheguei, Iniciar Corrida, Finalizar Corrida
- [ ] Ver ganhos (dia/semana/mês)
- [ ] Histórico de corridas

## Fase 6: Painel Administrativo
- [ ] Reestruturar frontend: client/src/admin/
- [ ] Dashboard com métricas
- [ ] Gerenciar Passageiros
- [ ] Gerenciar Motoristas (aprovar, bloquear)
- [ ] Gerenciar Corridas
- [ ] Gerenciar Cidades
- [ ] Gerenciar Tenants (white-label)
- [ ] Relatórios

## Fase 7: Sistema Multi-Tenant White-Label
- [ ] Middleware para detectar tenant (domínio/subdomain)
- [ ] Filtrar todas as queries por tenant_id
- [ ] Configuração de branding por tenant
- [ ] Isolamento completo de dados entre tenants

## Fase 8: Assistente de IA
- [ ] Criar server/domains/ai/
- [ ] Chat com passageiro
- [ ] Criar corrida via chat
- [ ] Agendar corrida via chat
- [ ] Recomendar destinos
- [ ] Estimar preço via chat
- [ ] Componente de chat no app passageiro

## Fase 9: Melhorias App Passageiro
- [ ] Chat em tempo real com motorista
- [ ] Chat com IA
- [ ] Compartilhar corrida (link tracking)
- [ ] Sistema de cupons
- [ ] Pagamento Stripe
- [ ] Notificações push

## Fase 10: Testes e Documentação
- [ ] Testes unitários para domains
- [ ] Testes de integração state machine
- [ ] Testes E2E fluxo completo
- [ ] Testes realtime (WebSocket)
- [ ] Documentar arquitetura
- [ ] Guia de desenvolvimento


## FASE 5: Integração WebSocket ao Express (CONCLUÍDA)
- [x] Inicializar WebSocket server no boot do Express (server/_core/index.ts)
- [x] Passar instância do HTTP server para realtimeManager.initialize()
- [x] Integrar realtimeManager.notifyRideStatusChanged() nos endpoints de rides
- [x] Integrar realtimeManager.joinRideRoom() quando corrida for aceita
- [x] Integrar realtimeManager.leaveRideRoom() quando corrida for finalizada/cancelada
- [x] Notificações implementadas em: accept, start, complete, cancel
- [x] Criar documento de teste manual (TEST_WEBSOCKET.md)
- [ ] Integrar useWebSocket no frontend (Passenger e Driver)
- [ ] Implementar realtimeManager.notifyRideOffered() quando corrida for oferecida (matching)
- [ ] Implementar tracking de localização do motorista em tempo real


## FASE 6: Ride Matching System (CONCLUÍDA)
- [x] Criar serviço de matching (server/domains/rides/matching.ts)
- [x] Implementar cálculo de distância Haversine (lat/lng)
- [x] Buscar motoristas online dentro de raio configurável (padrão: 5km)
- [x] Ordenar motoristas por distância (mais próximo primeiro)
- [x] Enviar notificação ride_offered via WebSocket para motoristas
- [x] Integrar matching ao endpoint rides.request
- [x] Implementar timeout de matching (30s sem resposta → oferece para mais motoristas)
- [x] Implementar re-matching automático se nenhum motorista aceitar
- [x] Expansão gradual: 5 motoristas no primeiro match, 10 no re-match
- [x] Adicionar campo distanceToPickup no WSRideOfferedPayload
- [ ] Adicionar configuração de raio de busca em tenantSettings
- [ ] Criar testes para matching service


## FASE 7: Tracking de Localização em Tempo Real (CONCLUÍDA)
- [x] Criar endpoint tRPC location.update para motorista enviar localização
- [x] Broadcast driver_location_update via WebSocket para passageiro da corrida
- [x] Integrar useWebSocket no frontend do passageiro (Passenger.tsx)
- [x] Receber mensagens driver_location_update e atualizar estado
- [x] Atualizar marcador do motorista no mapa com nova posição
- [x] Atualizar rota do motorista até o passageiro em tempo real
- [x] Receber mensagens ride_status_changed e refetch active ride
- [x] Adicionar método notifyDriverLocationUpdate ao realtimeManager
- [ ] Implementar atualização automática a cada 3-5 segundos no app do motorista
- [ ] Testar fluxo completo: motorista move → passageiro vê em tempo real

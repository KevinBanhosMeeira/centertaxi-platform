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

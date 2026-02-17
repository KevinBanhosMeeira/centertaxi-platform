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

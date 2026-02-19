# CenterTáxi Platform - Roadmap de Reestruturação

## Visão Geral

Transformar o sistema atual em uma **plataforma completa de ride-sharing white-label** com:

1. ✅ Aplicativo Passageiro (já existente, será evoluído)
2. 🔄 Aplicativo Motorista (será criado)
3. 🔄 Painel Administrativo (será criado)
4. 🔄 API Backend modular com domains
5. 🔄 Sistema realtime (WebSocket)
6. 🔄 Sistema multi-tenant white-label
7. 🔄 Assistente de IA integrado às corridas

---

## Fase 1: Estrutura de Pastas e Domains

### Backend - server/domains/

```
server/
├── domains/
│   ├── auth/
│   │   ├── router.ts
│   │   ├── service.ts
│   │   ├── repository.ts
│   │   └── types.ts
│   ├── users/
│   ├── drivers/
│   ├── rides/
│   ├── payments/
│   ├── notifications/
│   ├── ai/
│   ├── admin/
│   └── tenant/
├── realtime/
│   ├── websocket.ts
│   ├── events.ts
│   └── handlers.ts
├── _core/ (já existe)
└── routers.ts (integra todos os domains)
```

### Frontend - client/src/

```
client/src/
├── passenger/ (evolução do atual)
│   ├── pages/
│   ├── components/
│   └── hooks/
├── driver/ (novo)
│   ├── pages/
│   ├── components/
│   └── hooks/
├── admin/ (novo)
│   ├── pages/
│   ├── components/
│   └── hooks/
└── shared/
    ├── components/
    ├── hooks/
    └── utils/
```

---

## Fase 2: Banco de Dados Multi-Tenant

### Novas Tabelas

- [ ] `tenants` - Dados do tenant (nome, logo, cores, cidade)
- [ ] `tenant_settings` - Configurações específicas por tenant
- [ ] `vehicles` - Veículos dos motoristas (placa, modelo, cor, ano)
- [ ] `ride_events` - Log de eventos da corrida (timestamps, estado, localização)
- [ ] Atualizar `drivers` com campos adicionais (vehicle_id, status, rating_avg)
- [ ] Atualizar `rides` com tenant_id e campos de state machine
- [ ] Atualizar `users` com tenant_id

### Migrations

- [ ] Criar migration para tenants
- [ ] Criar migration para vehicles
- [ ] Criar migration para ride_events
- [ ] Atualizar migrations existentes com tenant_id

---

## Fase 3: Ride State Machine

### Estados

```
REQUESTED → MATCHING → OFFERED → ACCEPTED → DRIVER_EN_ROUTE → 
DRIVER_ARRIVED → IN_PROGRESS → COMPLETED
                                    ↓
                                CANCELED
```

### Transições Válidas

- [ ] Implementar validação de transições
- [ ] Criar eventos para cada transição
- [ ] Registrar eventos em ride_events
- [ ] Notificar passageiro e motorista em cada transição

---

## Fase 4: Sistema Realtime (WebSocket)

### Eventos

- [ ] `ride:offered` - Oferta de corrida para motorista
- [ ] `ride:accepted` - Corrida aceita por motorista
- [ ] `ride:status_changed` - Mudança de status da corrida
- [ ] `driver:location_update` - Atualização de localização do motorista
- [ ] `notification:new` - Nova notificação

### Rooms

- [ ] `ride:{rideId}` - Room específica da corrida
- [ ] `driver:{driverId}` - Room específica do motorista
- [ ] `passenger:{passengerId}` - Room específica do passageiro

---

## Fase 5: Aplicativo do Motorista

### Funcionalidades

- [ ] Login / Cadastro
- [ ] Toggle Online/Offline
- [ ] Receber ofertas de corrida (realtime)
- [ ] Aceitar / Recusar corrida
- [ ] Ver detalhes da corrida (origem, destino, passageiro)
- [ ] Navegar até passageiro (mapa com rota)
- [ ] Botão "Cheguei" (DRIVER_ARRIVED)
- [ ] Botão "Iniciar Corrida" (IN_PROGRESS)
- [ ] Botão "Finalizar Corrida" (COMPLETED)
- [ ] Ver ganhos do dia/semana/mês
- [ ] Histórico de corridas
- [ ] Perfil e configurações

---

## Fase 6: Painel Administrativo

### Funcionalidades

- [ ] Dashboard com métricas (corridas ativas, motoristas online, receita)
- [ ] Gerenciar Passageiros (listar, editar, bloquear)
- [ ] Gerenciar Motoristas (listar, aprovar, bloquear, ver documentos)
- [ ] Gerenciar Corridas (listar, ver detalhes, cancelar)
- [ ] Gerenciar Cidades (adicionar, editar, definir áreas de cobertura)
- [ ] Gerenciar Tenants (criar, editar, configurar branding)
- [ ] Relatórios (corridas por período, receita, motoristas mais ativos)
- [ ] Configurações globais

---

## Fase 7: Sistema Multi-Tenant White-Label

### Implementação

- [ ] Middleware para detectar tenant (por domínio ou subdomain)
- [ ] Filtrar todas as queries por tenant_id
- [ ] Configuração de branding por tenant (logo, cores, nome)
- [ ] Isolamento completo de dados entre tenants
- [ ] Painel admin para criar e gerenciar tenants

---

## Fase 8: Assistente de IA

### Capacidades

- [ ] Chat com passageiro (responder perguntas sobre corridas)
- [ ] Criar corrida via chat ("Quero ir para o Shopping Eldorado")
- [ ] Agendar corrida via chat ("Agende uma corrida para amanhã às 14h")
- [ ] Recomendar destinos populares
- [ ] Estimar preço e tempo antes de solicitar
- [ ] Responder perguntas sobre histórico ("Quanto gastei em corridas este mês?")

### Integração

- [ ] Endpoint tRPC `ai.chat` (recebe mensagem, retorna resposta)
- [ ] Função `createRideFromChat` (IA pode criar ride diretamente)
- [ ] Componente de chat no app do passageiro
- [ ] Histórico de conversas

---

## Fase 9: Melhorias no App do Passageiro

### Novas Funcionalidades

- [ ] Chat em tempo real com motorista durante corrida
- [ ] Chat com IA para criar corridas
- [ ] Compartilhar corrida em tempo real (link de tracking)
- [ ] Sistema de cupons de desconto
- [ ] Pagamento integrado (Stripe)
- [ ] Notificações push (motorista aceitou, chegou, etc)

---

## Fase 10: Testes e Documentação

### Testes

- [ ] Testes unitários para todos os domains
- [ ] Testes de integração para state machine
- [ ] Testes E2E para fluxo completo de corrida
- [ ] Testes de realtime (WebSocket)

### Documentação

- [ ] Documentar arquitetura de domains
- [ ] Documentar state machine e transições
- [ ] Documentar eventos realtime
- [ ] Documentar sistema multi-tenant
- [ ] Criar guia de desenvolvimento

---

## Compatibilidade

**IMPORTANTE:** Não remover nada existente. Apenas expandir e evoluir.

- ✅ Manter rotas atuais funcionando
- ✅ Manter componentes atuais funcionando
- ✅ Manter banco de dados compatível (migrations aditivas)
- ✅ Manter tRPC routers atuais

---

## Priorização

### Alta Prioridade (MVP)

1. Estrutura de domains no backend
2. Ride State Machine
3. Aplicativo do Motorista (básico)
4. Sistema Realtime (WebSocket)

### Média Prioridade

5. Painel Administrativo
6. Assistente de IA
7. Multi-Tenant

### Baixa Prioridade

8. Melhorias avançadas
9. Relatórios complexos
10. Integrações externas

---

## Timeline Estimado

- **Fase 1-2:** Estrutura e banco (2-3 dias)
- **Fase 3-4:** State Machine e Realtime (3-4 dias)
- **Fase 5:** App Motorista (4-5 dias)
- **Fase 6:** Painel Admin (3-4 dias)
- **Fase 7:** Multi-Tenant (2-3 dias)
- **Fase 8:** Assistente IA (2-3 dias)
- **Fase 9-10:** Testes e Docs (2-3 dias)

**Total:** 18-25 dias de desenvolvimento

---

## Status Atual

✅ = Concluído | 🔄 = Em andamento | ⏳ = Planejado

- ✅ App Passageiro (básico)
- ✅ Mapa com marcadores e rota
- ✅ Sistema de avaliação
- ✅ Histórico de endereços
- ⏳ Estrutura de domains
- ⏳ Ride State Machine
- ⏳ Sistema Realtime
- ⏳ App Motorista
- ⏳ Painel Admin
- ⏳ Multi-Tenant
- ⏳ Assistente IA

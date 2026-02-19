# CenterTáxi Platform - Arquitetura

## Visão Geral

Plataforma completa de ride-sharing white-label com suporte a múltiplos tenants, sistema realtime via WebSocket, e arquitetura modular baseada em domains.

---

## Estrutura de Pastas

```
centertaxi-platform/
├── client/                    # Frontend React 19 + Vite + Tailwind 4
│   └── src/
│       ├── passenger/         # App do Passageiro
│       │   ├── pages/
│       │   ├── components/
│       │   └── hooks/
│       ├── driver/            # App do Motorista (em desenvolvimento)
│       │   ├── pages/
│       │   ├── components/
│       │   └── hooks/
│       ├── admin/             # Painel Admin (em desenvolvimento)
│       │   ├── pages/
│       │   ├── components/
│       │   └── hooks/
│       └── shared/            # Componentes e hooks compartilhados
│           ├── components/
│           ├── hooks/
│           └── utils/
│
├── server/                    # Backend Express 4 + tRPC 11
│   ├── domains/               # Domains modulares
│   │   ├── auth/
│   │   ├── users/
│   │   ├── drivers/
│   │   ├── rides/             # ✅ Implementado
│   │   │   ├── types.ts       # Schemas Zod
│   │   │   ├── repository.ts  # Acesso ao banco
│   │   │   ├── service.ts     # Lógica de negócio
│   │   │   └── router.ts      # Endpoints tRPC
│   │   ├── payments/
│   │   ├── notifications/
│   │   ├── ai/
│   │   ├── admin/
│   │   └── tenant/
│   ├── realtime/              # Sistema WebSocket
│   │   ├── types.ts           # ✅ Types de mensagens WS
│   │   └── websocket.ts       # ✅ WebSocket Server Manager
│   ├── _core/                 # Framework plumbing (OAuth, context, etc)
│   ├── db.ts                  # Query helpers
│   └── routers.ts             # tRPC routers (legado, será migrado)
│
├── shared/                    # Código compartilhado entre client e server
│   └── ride-state-machine.ts # ✅ State machine com validação de transições
│
└── drizzle/                   # Schema e migrações do banco
    └── schema.ts              # ✅ Tabelas multi-tenant
```

---

## Banco de Dados (MySQL/TiDB)

### Tabelas Implementadas

#### **users** (expandida)
- `tenantId` - Multi-tenant support
- `driverStatus` - offline | online | busy
- `ratingAvg` - Média de avaliações
- `ratingCount` - Total de avaliações

#### **rides** (expandida)
- `tenantId` - Multi-tenant support
- `status` - 9 estados: requested → matching → offered → accepted → driver_en_route → driver_arrived → in_progress → completed/cancelled

#### **tenants** (nova)
- Suporte white-label
- Configuração de cores, logo, cidade

#### **tenantSettings** (nova)
- Tarifas configuráveis por tenant
- Comissão da plataforma
- Raio de busca de motoristas

#### **vehicles** (nova)
- Veículos dos motoristas
- Placa, marca, modelo, ano, cor

#### **rideEvents** (nova)
- Audit log de transições de estado
- Registra quem triggou, localização, metadata

---

## Ride State Machine

### Estados Válidos

```
requested      → Passageiro solicitou corrida
matching       → Sistema buscando motoristas disponíveis
offered        → Corrida oferecida a motorista(s) específico(s)
accepted       → Motorista aceitou a corrida
driver_en_route → Motorista a caminho do passageiro
driver_arrived → Motorista chegou no local de embarque
in_progress    → Corrida em andamento
completed      → Corrida finalizada com sucesso
cancelled      → Corrida cancelada
```

### Transições Válidas

- `requested` → `matching`, `cancelled`
- `matching` → `offered`, `cancelled`
- `offered` → `accepted`, `matching` (se motorista rejeitar), `cancelled`
- `accepted` → `driver_en_route`, `cancelled`
- `driver_en_route` → `driver_arrived`, `cancelled`
- `driver_arrived` → `in_progress`, `cancelled`
- `in_progress` → `completed`, `cancelled`
- `completed` → (terminal)
- `cancelled` → (terminal)

### Validação

Todas as transições são validadas pela função `isValidTransition()` no service layer. Tentativas de transições inválidas retornam erro `BAD_REQUEST`.

---

## Sistema Realtime (WebSocket)

### Arquitetura

- **Servidor**: `ws://localhost:3000/ws` (ou `wss://` em produção)
- **Protocolo**: JSON messages com tipo + payload + timestamp
- **Rooms**: Cada corrida tem uma "sala" com passageiro + motorista

### Tipos de Mensagens

1. **auth** - Autenticação inicial (userId + role)
2. **ride_offered** - Notifica motorista sobre nova corrida
3. **ride_accepted** - Notifica passageiro que motorista aceitou
4. **ride_status_changed** - Atualiza status da corrida em tempo real
5. **driver_location_update** - Posição do motorista (streaming)
6. **passenger_location_update** - Posição do passageiro
7. **driver_online/offline** - Status de disponibilidade
8. **ping/pong** - Heartbeat
9. **error** - Mensagens de erro

### Fluxo de Conexão

1. Cliente conecta via WebSocket
2. Envia mensagem `auth` com userId e role
3. Servidor autentica e armazena conexão
4. Cliente entra em "ride room" quando corrida é aceita
5. Recebe updates em tempo real até corrida finalizar

### React Hook

```typescript
const { isConnected, sendTyped } = useWebSocket({
  userId: user.id,
  role: "passenger",
  onMessage: (msg) => {
    if (msg.type === "ride_status_changed") {
      // Atualizar UI
    }
  },
});

// Enviar localização
sendTyped("driver_location_update", { lat, lng, rideId });
```

---

## Domains Pattern

### Estrutura de um Domain

Cada domain segue o padrão:

```
domain/
├── types.ts       # Schemas Zod para validação de input
├── repository.ts  # Acesso ao banco (queries SQL via Drizzle)
├── service.ts     # Lógica de negócio (validações, state machine)
└── router.ts      # Endpoints tRPC (procedures)
```

### Exemplo: Rides Domain

**types.ts** - Define schemas Zod:
```typescript
export const createRideSchema = z.object({
  originAddress: z.string().min(1),
  destinationAddress: z.string().min(1),
  // ...
});
```

**repository.ts** - Funções de acesso ao banco:
```typescript
export async function createRide(data: InsertRide) {
  const db = await getDb();
  const [ride] = await db.insert(rides).values(data);
  return ride;
}
```

**service.ts** - Lógica de negócio:
```typescript
export async function updateRideStatus(userId, input) {
  // Valida transição de estado
  if (!isValidTransition(currentStatus, newStatus)) {
    throw new TRPCError({ code: "BAD_REQUEST" });
  }
  // Atualiza banco
  await repository.updateRideStatus(input.rideId, newStatus);
  // Registra evento
  await repository.createRideEvent({...});
}
```

**router.ts** - Endpoints tRPC:
```typescript
export const ridesRouter = router({
  create: protectedProcedure
    .input(createRideSchema)
    .mutation(async ({ ctx, input }) => {
      return await service.createRide(ctx.user.id, input);
    }),
});
```

---

## Multi-Tenant White-Label

### Conceito

Cada tenant (operadora de táxi) tem:
- Slug único (URL-friendly): `centertaxi`, `radiotaxi`, etc
- Branding: logo, cores primária/secundária
- Configurações: tarifas, comissão, raio de busca
- Usuários e corridas isolados

### Implementação

- Todas as queries filtram por `tenantId`
- Frontend carrega configurações do tenant no boot
- Cores e logo aplicados dinamicamente via CSS variables

---

## Próximas Fases (Roadmap)

### Fase 5: Reestruturar Frontend
- Migrar código atual para `client/src/passenger/`
- Criar App do Motorista (`client/src/driver/`)
- Criar Painel Admin (`client/src/admin/`)

### Fase 6: Implementar Domains Restantes
- auth, users, drivers, payments, notifications, ai, admin, tenant

### Fase 7: Integrar WebSocket ao Express
- Inicializar WebSocket server no boot
- Triggerar notificações nos endpoints tRPC

### Fase 8: Assistente de IA
- Chat integrado às corridas
- Sugestões de rotas, preços, motoristas

### Fase 9: Testes e Documentação
- Testes unitários para todos os domains
- Documentação de API (tRPC + WebSocket)

---

## Stack Tecnológico

### Frontend
- **React 19** - UI library
- **Vite 7** - Build tool
- **Tailwind CSS 4** - Styling
- **tRPC 11** - Type-safe API client
- **Wouter** - Routing
- **shadcn/ui** - Component library

### Backend
- **Node.js 22** - Runtime
- **Express 4** - HTTP server
- **tRPC 11** - Type-safe API
- **Drizzle ORM** - Database ORM
- **ws** - WebSocket library
- **Zod** - Schema validation

### Database
- **MySQL/TiDB** - Relational database

### DevOps
- **pnpm** - Package manager
- **TypeScript** - Type safety
- **Vitest** - Testing framework

---

## Convenções de Código

### Naming
- **Arquivos**: camelCase (`rideService.ts`)
- **Componentes React**: PascalCase (`PassengerDashboard.tsx`)
- **Funções**: camelCase (`createRide()`)
- **Types/Interfaces**: PascalCase (`RideStatus`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_RECONNECT_ATTEMPTS`)

### Imports
- Sempre use absolute imports para shared: `import { RideStatus } from "../../../shared/ride-state-machine"`
- Use relative imports dentro do mesmo domain

### Error Handling
- Use `TRPCError` para erros de API
- Códigos: `NOT_FOUND`, `BAD_REQUEST`, `FORBIDDEN`, `UNAUTHORIZED`

---

## Status da Implementação

✅ **Completo**
- Estrutura de pastas (domains + apps)
- Schema multi-tenant
- Ride State Machine
- Rides Domain (types, repository, service, router)
- WebSocket Server Manager
- React Hook useWebSocket
- Migração do banco (0005_quiet_talos.sql)

🚧 **Em Desenvolvimento**
- Integração WebSocket ↔ Express
- App do Motorista
- Painel Admin
- Domains restantes
- Assistente de IA

📋 **Planejado**
- Testes unitários completos
- Documentação de API
- Deploy em produção
- Monitoramento e logs

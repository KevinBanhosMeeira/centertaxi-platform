# Teste Manual - WebSocket Realtime

## Objetivo
Validar que as notificações em tempo real funcionam corretamente quando corridas mudam de status.

---

## Pré-requisitos

1. Servidor rodando: `pnpm dev`
2. WebSocket inicializado (verificar logs): `[WebSocket] Realtime server initialized`
3. Dois navegadores/abas:
   - **Aba 1**: Passageiro
   - **Aba 2**: Motorista

---

## Fluxo de Teste

### 1. Conectar WebSocket (Frontend)

**Passageiro** (Aba 1):
```typescript
const { isConnected } = useWebSocket({
  userId: passengerId,
  role: "passenger",
  onMessage: (msg) => {
    console.log("[Passageiro] Mensagem recebida:", msg);
    if (msg.type === "ride_status_changed") {
      // Atualizar UI
      refetch(); // Recarregar corrida ativa
    }
  },
});
```

**Motorista** (Aba 2):
```typescript
const { isConnected } = useWebSocket({
  userId: driverId,
  role: "driver",
  onMessage: (msg) => {
    console.log("[Motorista] Mensagem recebida:", msg);
    if (msg.type === "ride_status_changed") {
      // Atualizar UI
      refetch(); // Recarregar corrida ativa
    }
  },
});
```

---

### 2. Solicitar Corrida (Passageiro)

**Ação**: Passageiro solicita corrida

**Backend**:
```typescript
// rides.request mutation
const ride = await db.createRide({...});
// Status: "requested"
```

**Esperado**:
- Corrida criada com status `requested`
- Nenhuma notificação WebSocket (ainda não há motorista)

---

### 3. Aceitar Corrida (Motorista)

**Ação**: Motorista aceita corrida

**Backend**:
```typescript
// rides.accept mutation
await db.updateRideStatus(rideId, "accepted", driverId);

// Notificação WebSocket
realtimeManager.notifyRideStatusChanged(rideId, {
  rideId,
  oldStatus: "requested",
  newStatus: "accepted",
  driverId,
});

// Join ride room
realtimeManager.joinRideRoom(rideId, driverId, "driver");
realtimeManager.joinRideRoom(rideId, passengerId, "passenger");
```

**Esperado**:
- ✅ Passageiro recebe mensagem WebSocket:
  ```json
  {
    "type": "ride_status_changed",
    "payload": {
      "rideId": 123,
      "oldStatus": "requested",
      "newStatus": "accepted",
      "driverId": 456
    },
    "timestamp": 1708374000000
  }
  ```
- ✅ UI do passageiro atualiza mostrando "Motorista a caminho"
- ✅ Ambos entram na ride room

---

### 4. Iniciar Corrida (Motorista)

**Ação**: Motorista clica em "Iniciar Corrida"

**Backend**:
```typescript
// rides.start mutation
await db.updateRideStatus(rideId, "in_progress");

// Notificação WebSocket
realtimeManager.notifyRideStatusChanged(rideId, {
  rideId,
  oldStatus: "accepted",
  newStatus: "in_progress",
  driverId,
});
```

**Esperado**:
- ✅ Passageiro recebe mensagem WebSocket com status `in_progress`
- ✅ UI do passageiro atualiza mostrando "Corrida em andamento"

---

### 5. Finalizar Corrida (Motorista)

**Ação**: Motorista clica em "Finalizar Corrida"

**Backend**:
```typescript
// rides.complete mutation
await db.updateRideStatus(rideId, "completed");

// Notificação WebSocket
realtimeManager.notifyRideStatusChanged(rideId, {
  rideId,
  oldStatus: "in_progress",
  newStatus: "completed",
  driverId,
});

// Leave ride room
realtimeManager.leaveRideRoom(rideId, driverId, "driver");
realtimeManager.leaveRideRoom(rideId, passengerId, "passenger");
```

**Esperado**:
- ✅ Passageiro recebe mensagem WebSocket com status `completed`
- ✅ UI do passageiro mostra modal de avaliação
- ✅ Ambos saem da ride room

---

### 6. Cancelar Corrida (Passageiro)

**Ação**: Passageiro cancela corrida aceita

**Backend**:
```typescript
// rides.cancel mutation
await db.updateRideStatus(rideId, "cancelled");

// Notificação WebSocket (se corrida foi aceita)
if (ride.status === "accepted" && ride.driverId) {
  realtimeManager.notifyRideStatusChanged(rideId, {
    rideId,
    oldStatus: "accepted",
    newStatus: "cancelled",
    passengerId,
  });
  
  // Leave ride room
  realtimeManager.leaveRideRoom(rideId, passengerId, "passenger");
  realtimeManager.leaveRideRoom(rideId, ride.driverId, "driver");
}
```

**Esperado**:
- ✅ Motorista recebe mensagem WebSocket com status `cancelled`
- ✅ UI do motorista volta para lista de corridas disponíveis
- ✅ Ambos saem da ride room

---

## Verificar Logs

### Backend (server logs)
```bash
tail -f .manus-logs/devserver.log | grep WebSocket
```

**Esperado**:
```
[WebSocket] New connection
[WebSocket] Client authenticated: userId=123, role=passenger
[WebSocket] Client authenticated: userId=456, role=driver
[WebSocket] passenger 123 joined ride room 789
[WebSocket] driver 456 joined ride room 789
[WebSocket] Ride 789 status changed: requested -> accepted
[WebSocket] Ride 789 status changed: accepted -> in_progress
[WebSocket] Ride 789 status changed: in_progress -> completed
[WebSocket] passenger 123 left ride room 789
[WebSocket] driver 456 left ride room 789
[WebSocket] Connection closed
```

### Frontend (browser console)
```javascript
// Passageiro
[Passageiro] Mensagem recebida: { type: "ride_status_changed", payload: {...} }

// Motorista
[Motorista] Mensagem recebida: { type: "ride_status_changed", payload: {...} }
```

---

## Checklist de Validação

- [ ] WebSocket server inicializa no boot do Express
- [ ] Passageiro consegue conectar ao WebSocket
- [ ] Motorista consegue conectar ao WebSocket
- [ ] Passageiro recebe notificação quando motorista aceita
- [ ] Passageiro recebe notificação quando motorista inicia corrida
- [ ] Passageiro recebe notificação quando motorista finaliza corrida
- [ ] Motorista recebe notificação quando passageiro cancela
- [ ] Ride rooms são criadas quando corrida é aceita
- [ ] Ride rooms são destruídas quando corrida finaliza/cancela
- [ ] Auto-reconnect funciona quando conexão cai

---

## Próximos Passos

1. **Integrar useWebSocket no frontend** - Adicionar hook nas páginas Passenger e Driver
2. **Atualizar UI automaticamente** - Usar `refetch()` do tRPC quando receber notificação
3. **Tracking de localização** - Enviar `driver_location_update` a cada 3 segundos
4. **Notificações de ofertas** - Implementar `ride_offered` quando matching encontrar motoristas

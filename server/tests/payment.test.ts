import { describe, it, expect } from 'vitest';
import { appRouter } from '../routers/root'; // Seu root router
import { createContext } from '../trpc'; // Contexto mock

describe('Payment Router', () => {
  it('should add payment method', async () => {
    const ctx = await createContext({ /* mock session */ });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.payment.addMethod({ type: 'PIX', token: 'mock_token' });
    expect(result).toHaveProperty('id');
  });

  // Adicione mais testes para payRide (mock MP SDK)
});

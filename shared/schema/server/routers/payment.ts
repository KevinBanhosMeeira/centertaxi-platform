import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { db } from '../db'; // Seu db Drizzle
import { TRPCError } from '@trpc/server';
import MercadoPago, { Payment } from 'mercadopago'; // SDK
import { payments, paymentMethods } from '../../shared/schema/payment';
import { rides } from '../../shared/schema/ride';
import { drivers } from '../../shared/schema/driver'; // Assuma schema de drivers; ajuste se em users

// Config inicial (pode colocar em um init file)
const mpPlatformToken = process.env.MERCADO_PAGO_PLATFORM_TOKEN!;

export const paymentRouter = router({
  addMethod: protectedProcedure
    .input(z.object({
      type: z.enum(['CARD', 'PIX', 'APPLE_PAY', 'GOOGLE_PAY']),
      token: z.string(), // Token gerado no frontend via MP SDK
    }))
    .mutation(async ({ input, ctx }) => {
      const newMethod = await db.insert(paymentMethods).values({
        userId: ctx.session.userId, // De auth Manus
        type: input.type,
        token: input.token,
        isDefault: true, // Lógica simples; melhore se precisar de múltiplos
      }).returning();
      return newMethod;
    }),

  payRide: protectedProcedure
    .input(z.object({
      rideId: z.string().uuid(),
      methodId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const ride = await db.query.rides.findFirst({ where: { id: input.rideId, passengerId: ctx.session.userId } });
      if (!ride) throw new TRPCError({ code: 'NOT_FOUND', message: 'Corrida não encontrada' });

      const method = await db.query.paymentMethods.findFirst({ where: { id: input.methodId, userId: ctx.session.userId } });
      if (!method) throw new TRPCError({ code: 'NOT_FOUND', message: 'Método de pagamento não encontrado' });

      const driver = await db.query.drivers.findFirst({ where: { id: ride.driverId } });
      if (!driver?.mpAccessToken) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Motorista sem conta Mercado Pago' });

      const amount = ride.priceEstimate; // Em reais, do cálculo de tarifa
      const platformFee = amount * 0.15; // 15% para CenterTaxi

      const client = new MercadoPago({ accessToken: driver.mpAccessToken }); // Token do motorista para split
      const payment = new Payment(client);

      const body = {
        transaction_amount: amount,
        description: `Corrida CenterTaxi #${ride.id}`,
        payment_method_id: method.type.toLowerCase(), // Ajuste: 'pix', 'card', etc.
        token: method.token, // Para cartão/Apple/Google; para PIX, use prefs se needed
        payer: { email: ctx.session.email || 'passageiro@centertaxi.com' },
        application_fee: platformFee, // Split: plataforma recebe isso diretamente
      };

      try {
        const mpResponse = await payment.create(body);
        const newPayment = await db.insert(payments).values({
          rideId: input.rideId,
          amount: Math.floor(amount * 100), // Centavos
          status: mpResponse.status === 'approved' ? 'PAID' : 'PENDING',
          method: method.type,
          gatewayId: mpResponse.id.toString(),
        }).returning();

        // Atualize ride status para COMPLETED se PAID (integre com WebSocket)
        if (newPayment[0].status === 'PAID') {
          await db.update(rides).set({ status: 'COMPLETED' }).where({ id: input.rideId });
          // Emita evento WS aqui se já tiver o emitter
        }

        return {
          status: mpResponse.status,
          qrCode: method.type === 'PIX' ? mpResponse.point_of_interaction?.transaction_data?.qr_code : null,
          qrCodeBase64: method.type === 'PIX' ? mpResponse.point_of_interaction?.transaction_data?.qr_code_base64 : null,
        };
      } catch (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Falha no pagamento: ' + (error as Error).message });
      }
    }),

  listMethods: protectedProcedure
    .query(async ({ ctx }) => {
      return db.query.paymentMethods.findMany({ where: { userId: ctx.session.userId } });
    }),
});

// Adicione ao root router em server/routers/root.ts: .merge('payment.', paymentRouter)

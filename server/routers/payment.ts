import { z } from 'zod';
import { protectedProcedure, router } from '../trpc'; // Ajuste o caminho se o trpc.ts estiver em outro lugar
import { db } from '../db'; // Seu Drizzle db
import { TRPCError } from '@trpc/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { payments, paymentMethods } from '../../shared/schema/payment';
import { rides } from '../../shared/schema/ride'; // Ajuste se o path for diferente
// Assuma que drivers tem mpAccessToken (adicione no schema de drivers se necessário)

const mpPlatformToken = process.env.MERCADO_PAGO_PLATFORM_TOKEN; // Coloque no .env depois

export const paymentRouter = router({
  // Adicionar método de pagamento (ex: token do PIX ou cartão)
  addMethod: protectedProcedure
    .input(z.object({
      type: z.enum(['CARD', 'PIX', 'APPLE_PAY', 'GOOGLE_PAY']),
      token: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const newMethod = await db.insert(paymentMethods).values({
        userId: ctx.session.userId,
        type: input.type,
        token: input.token,
        isDefault: true,
      }).returning();

      return newMethod[0];
    }),

  // Listar métodos do usuário logado
  listMethods: protectedProcedure.query(async ({ ctx }) => {
    return db.query.paymentMethods.findMany({
      where: (methods, { eq }) => eq(methods.userId, ctx.session.userId),
    });
  }),

  // Pagar uma corrida (com split)
  payRide: protectedProcedure
    .input(z.object({
      rideId: z.string().uuid(),
      methodId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Busca a corrida (só do passageiro logado)
      const ride = await db.query.rides.findFirst({
        where: (r, { and, eq }) => and(
          eq(r.id, input.rideId),
          eq(r.passengerId, ctx.session.userId)
        ),
      });
      if (!ride) throw new TRPCError({ code: 'NOT_FOUND', message: 'Corrida não encontrada' });

      // Busca o método de pagamento
      const method = await db.query.paymentMethods.findFirst({
        where: (m, { and, eq }) => and(
          eq(m.id, input.methodId),
          eq(m.userId, ctx.session.userId)
        ),
      });
      if (!method) throw new TRPCError({ code: 'NOT_FOUND', message: 'Método não encontrado' });

      // Busca o motorista (precisa ter mpAccessToken)
      // Se drivers estiver em outra tabela, ajuste o query
      const driver = await db.query.drivers.findFirst({ where: (d, { eq }) => eq(d.id, ride.driverId) });
      if (!driver?.mpAccessToken) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Motorista sem conta Mercado Pago configurada' });

      const amount = ride.priceEstimate; // Valor em reais da tarifa calculada
      const platformFee = amount * 0.15; // 15% para CenterTaxi

      const client = new MercadoPagoConfig({ accessToken: driver.mpAccessToken });
      const payment = new Payment(client);

      const body: any = {
        transaction_amount: amount,
        description: `Corrida CenterTaxi #${ride.id}`,
        payment_method_id: method.type === 'PIX' ? 'pix' : 'card', // Ajuste para outros
        payer: { email: ctx.session.email || 'no-email@centertaxi.com' },
        application_fee: platformFee, // Split nativo: plataforma recebe isso
      };

      if (method.type !== 'PIX') {
        body.token = method.token; // Para cartão/Apple/Google Pay
      }

      try {
        const mpResponse = await payment.create({ body });

        const newPayment = await db.insert(payments).values({
          rideId: input.rideId,
          amount: Math.floor(amount * 100), // centavos
          status: mpResponse.status === 'approved' ? 'PAID' : 'PENDING',
          method: method.type,
          gatewayId: mpResponse.id.toString(),
        }).returning();

        // Se pago, atualiza status da corrida (opcional)
        if (newPayment[0].status === 'PAID') {
          await db.update(rides).set({ status: 'COMPLETED' }).where({ id: input.rideId });
        }

        return {
          status: mpResponse.status,
          qrCode: method.type === 'PIX' ? mpResponse.point_of_interaction?.transaction_data?.qr_code : null,
          qrCodeBase64: method.type === 'PIX' ? mpResponse.point_of_interaction?.transaction_data?.qr_code_base64 : null,
        };
      } catch (err: any) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Pagamento falhou: ${err.message}` });
      }
    }),
});

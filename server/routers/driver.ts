import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { db } from '../db';
import { drivers } from '../../shared/schema/drivers';
import { TRPCError } from '@trpc/server';

export const driverRouter = router({
  toggleOnline: protectedProcedure
    .input(z.object({ isOnline: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const driver = await db.query.drivers.findFirst({ where: { id: ctx.session.userId } });
      if (!driver) throw new TRPCError({ code: 'NOT_FOUND' });
      await db.update(drivers).set({ isOnline: input.isOnline }).where({ id: ctx.session.userId });
      return { success: true, isOnline: input.isOnline };
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return db.query.drivers.findFirst({ where: { id: ctx.session.userId } });
  }),

  // Futuro: acceptRide, updateLocation via WS etc.
});

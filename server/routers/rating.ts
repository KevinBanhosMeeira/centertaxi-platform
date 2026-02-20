import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { db } from '../db';
import { ratings } from '../../shared/schema/rating';
import { TRPCError } from '@trpc/server';

export const ratingRouter = router({
  create: protectedProcedure
    .input(z.object({
      rideId: z.string().uuid(),
      toUserId: z.string().uuid(),
      score: z.number().min(1).max(5),
      comment: z.string().optional(),
      type: z.enum(['PASSENGER_TO_DRIVER', 'DRIVER_TO_PASSENGER']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verifique se ride existe e usuário pode avaliar
      const ride = await db.query.rides.findFirst({ where: { id: input.rideId } });
      if (!ride || ride.status !== 'COMPLETED') throw new TRPCError({ code: 'BAD_REQUEST' });

      const rating = await db.insert(ratings).values({
        rideId: input.rideId,
        fromUserId: ctx.session.userId,
        toUserId: input.toUserId,
        score: input.score,
        comment: input.comment,
        type: input.type,
      }).returning();

      return rating[0];
    }),

  getReputation: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      const avg = await db.query.ratings.findMany({
        where: { toUserId: input.userId },
        columns: { score: true },
      });
      const average = avg.length > 0 ? avg.reduce((sum, r) => sum + r.score, 0) / avg.length : 0;
      return { average, count: avg.length };
    }),
});

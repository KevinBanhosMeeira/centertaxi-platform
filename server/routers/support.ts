import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { db } from '../db';
import { supportTickets } from '../../shared/schema/support_ticket';
import { TRPCError } from '@trpc/server';

export const supportRouter = router({
  create: protectedProcedure
    .input(z.object({
      subject: z.string().min(1),
      description: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await db.insert(supportTickets).values({
        userId: ctx.session.userId,
        subject: input.subject,
        description: input.description,
      }).returning();
      return ticket[0];
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return db.query.supportTickets.findMany({
      where: (t, { eq }) => eq(t.userId, ctx.session.userId),
    });
  }),
});

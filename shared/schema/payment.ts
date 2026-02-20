import { pgTable, uuid, text, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user'; // Importe o schema existente de users
import { rides } from './ride'; // Importe o schema existente de rides

export const paymentMethodTypeEnum = pgEnum('payment_method_type', ['CARD', 'PIX', 'APPLE_PAY', 'GOOGLE_PAY']);

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  type: paymentMethodTypeEnum('type').notNull(),
  token: text('token').notNull(), // Tokenizado pelo Mercado Pago
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'PAID', 'FAILED', 'REFUNDED']);

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  rideId: uuid('ride_id').notNull().references(() => rides.id),
  amount: integer('amount').notNull(), // Em centavos (ex: 5000 para R$50,00)
  status: paymentStatusEnum('status').default('PENDING').notNull(),
  method: paymentMethodTypeEnum('method').notNull(),
  gatewayId: text('gateway_id'), // ID da transação no Mercado Pago
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  user: one(users, { fields: [paymentMethods.userId], references: [users.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  ride: one(rides, { fields: [payments.rideId], references: [rides.id] }),
}));

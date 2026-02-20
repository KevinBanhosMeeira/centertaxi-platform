import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { users } from './user';

export const drivers = pgTable('drivers', {
  id: uuid('id').primaryKey().defaultRandom().references(() => users.id),
  vehicleModel: text('vehicle_model').notNull(),
  vehiclePlate: text('vehicle_plate').notNull(),
  licenseNumber: text('license_number').notNull(),
  mpAccessToken: text('mp_access_token'), // Para split pagamentos
  isOnline: boolean('is_online').default(false),
  ratingAvg: integer('rating_avg').default(0),
  ratingCount: integer('rating_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

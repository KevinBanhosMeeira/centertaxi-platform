import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { rides } from './ride';
import { users } from './user';

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  rideId: uuid('ride_id').references(() => rides.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

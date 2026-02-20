import { pgTable, uuid, integer, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user';
import { rides } from './ride';

export const ratingTypeEnum = pgEnum('rating_type', ['PASSENGER_TO_DRIVER', 'DRIVER_TO_PASSENGER']);

export const ratings = pgTable('ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  rideId: uuid('ride_id').notNull().references(() => rides.id),
  fromUserId: uuid('from_user_id').notNull().references(() => users.id),
  toUserId: uuid('to_user_id').notNull().references(() => users.id),
  type: ratingTypeEnum('type').notNull(),
  score: integer('score').notNull(), // 1 a 5
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ratingsRelations = relations(ratings, ({ one }) => ({
  ride: one(rides, { fields: [ratings.rideId], references: [rides.id] }),
  fromUser: one(users, { fields: [ratings.fromUserId], references: [users.id] }),
  toUser: one(users, { fields: [ratings.toUserId], references: [users.id] }),
}));

ALTER TABLE `rides` ADD `scheduledAt` timestamp;--> statement-breakpoint
ALTER TABLE `rides` ADD `isScheduled` int DEFAULT 0 NOT NULL;
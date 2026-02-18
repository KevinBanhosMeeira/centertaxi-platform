CREATE TABLE `addressHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`address` text NOT NULL,
	`lat` varchar(20) NOT NULL,
	`lng` varchar(20) NOT NULL,
	`placeId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `addressHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `addressHistory` ADD CONSTRAINT `addressHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
CREATE TABLE `driverLocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`driverId` int NOT NULL,
	`lat` varchar(20) NOT NULL,
	`lng` varchar(20) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `driverLocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`passengerId` int NOT NULL,
	`driverId` int,
	`status` enum('requested','accepted','in_progress','completed','cancelled') NOT NULL DEFAULT 'requested',
	`originAddress` text NOT NULL,
	`originLat` varchar(20) NOT NULL,
	`originLng` varchar(20) NOT NULL,
	`destinationAddress` text NOT NULL,
	`destinationLat` varchar(20) NOT NULL,
	`destinationLng` varchar(20) NOT NULL,
	`distanceKm` varchar(10),
	`priceEstimate` varchar(10),
	`finalPrice` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`cancelledAt` timestamp,
	CONSTRAINT `rides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('passenger','driver','admin') NOT NULL DEFAULT 'passenger';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `profileCompleted` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `driverLocations` ADD CONSTRAINT `driverLocations_driverId_users_id_fk` FOREIGN KEY (`driverId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rides` ADD CONSTRAINT `rides_passengerId_users_id_fk` FOREIGN KEY (`passengerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rides` ADD CONSTRAINT `rides_driverId_users_id_fk` FOREIGN KEY (`driverId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
CREATE TABLE `rideEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rideId` int NOT NULL,
	`fromStatus` varchar(50),
	`toStatus` varchar(50) NOT NULL,
	`triggeredBy` int,
	`lat` varchar(20),
	`lng` varchar(20),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rideEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenantSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`baseFare` varchar(10) NOT NULL DEFAULT '5.00',
	`pricePerKm` varchar(10) NOT NULL DEFAULT '2.50',
	`pricePerMinute` varchar(10) NOT NULL DEFAULT '0.50',
	`minimumFare` varchar(10) NOT NULL DEFAULT '10.00',
	`commissionPercent` int NOT NULL DEFAULT 20,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`maxSearchRadiusKm` int NOT NULL DEFAULT 10,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenantSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`logo` text,
	`primaryColor` varchar(7) NOT NULL DEFAULT '#003DA5',
	`secondaryColor` varchar(7) NOT NULL DEFAULT '#E63946',
	`city` varchar(255) NOT NULL,
	`state` varchar(2),
	`country` varchar(2) NOT NULL DEFAULT 'BR',
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`driverId` int NOT NULL,
	`tenantId` int NOT NULL,
	`plate` varchar(20) NOT NULL,
	`brand` varchar(100) NOT NULL,
	`model` varchar(100) NOT NULL,
	`year` int NOT NULL,
	`color` varchar(50) NOT NULL,
	`seats` int NOT NULL DEFAULT 4,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `rides` MODIFY COLUMN `status` enum('requested','matching','offered','accepted','driver_en_route','driver_arrived','in_progress','completed','cancelled') NOT NULL DEFAULT 'requested';--> statement-breakpoint
ALTER TABLE `rides` ADD `tenantId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `tenantId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `driverStatus` enum('offline','online','busy') DEFAULT 'offline';--> statement-breakpoint
ALTER TABLE `users` ADD `ratingAvg` varchar(5);--> statement-breakpoint
ALTER TABLE `users` ADD `ratingCount` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `rideEvents` ADD CONSTRAINT `rideEvents_rideId_rides_id_fk` FOREIGN KEY (`rideId`) REFERENCES `rides`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rideEvents` ADD CONSTRAINT `rideEvents_triggeredBy_users_id_fk` FOREIGN KEY (`triggeredBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenantSettings` ADD CONSTRAINT `tenantSettings_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_driverId_users_id_fk` FOREIGN KEY (`driverId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;
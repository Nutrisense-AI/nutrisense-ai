CREATE TABLE `anonymous_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionToken` varchar(128) NOT NULL,
	`scanCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anonymous_usage_id` PRIMARY KEY(`id`),
	CONSTRAINT `anonymous_usage_sessionToken_unique` UNIQUE(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionToken` varchar(128),
	`scanId` int,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scanId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`quantity` varchar(128),
	`calories` float,
	`protein` float,
	`carbs` float,
	`fat` float,
	`fiber` float,
	`sodium` float,
	`sugar` float,
	`vitaminC` float,
	`calcium` float,
	`iron` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meal_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_scans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionToken` varchar(128),
	`imageUrl` text NOT NULL,
	`imageKey` text NOT NULL,
	`mealName` varchar(255),
	`totalCalories` float,
	`totalProtein` float,
	`totalCarbs` float,
	`totalFat` float,
	`totalFiber` float,
	`analysisJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meal_scans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`isPremium` boolean NOT NULL DEFAULT false,
	`stripeCustomerId` varchar(128),
	`stripePaymentIntentId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);

CREATE TABLE `user_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`calorieGoal` float DEFAULT 2000,
	`proteinGoal` float DEFAULT 150,
	`carbsGoal` float DEFAULT 250,
	`fatGoal` float DEFAULT 65,
	`fiberGoal` float DEFAULT 25,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_goals_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_goals_userId_unique` UNIQUE(`userId`)
);

CREATE TABLE `roleplay_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`persona` varchar(64) NOT NULL,
	`transcript` json NOT NULL,
	`scorecard` json,
	`compliancePass` boolean,
	`totalScore` int,
	`result` varchar(16),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roleplay_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`completedModules` json NOT NULL,
	`completedQuizzes` json NOT NULL,
	`completedAssignments` json NOT NULL,
	`assignmentsData` json NOT NULL,
	`safetyCompleted` boolean NOT NULL DEFAULT false,
	`passedFinalTest` boolean NOT NULL DEFAULT false,
	`finalTestScore` int,
	`shift1DebriefData` json,
	`supervisorReleased` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `training_progress_userId_unique` UNIQUE(`userId`)
);

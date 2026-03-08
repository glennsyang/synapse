PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`task_number` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`due_date` text,
	`state` text DEFAULT 'new' NOT NULL,
	`priority` integer NOT NULL,
	`tags` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_tasks`(
	"id",
	"user_id",
	"task_number",
	"title",
	"description",
	"due_date",
	"state",
	"priority",
	"tags",
	"created_at",
	"updated_at",
	"completed_at"
)
SELECT
	"id",
	"user_id",
	ROW_NUMBER() OVER (ORDER BY "created_at", "id") AS "task_number",
	"title",
	"description",
	"due_date",
	"state",
	"priority",
	"tags",
	"created_at",
	"updated_at",
	"completed_at"
FROM `tasks`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;--> statement-breakpoint
CREATE UNIQUE INDEX `tasks_task_number_unique` ON `tasks` (`task_number`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
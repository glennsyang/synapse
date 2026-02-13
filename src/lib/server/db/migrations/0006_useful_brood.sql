PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_todo_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`cadence` text,
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
INSERT INTO `__new_todo_items`("id", "user_id", "title", "description", "cadence", "due_date", "state", "priority", "tags", "created_at", "updated_at", "completed_at") SELECT "id", "user_id", "title", "description", "cadence", "due_date", "state", "priority", "tags", "created_at", "updated_at", "completed_at" FROM `todo_items`;--> statement-breakpoint
DROP TABLE `todo_items`;--> statement-breakpoint
ALTER TABLE `__new_todo_items` RENAME TO `todo_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
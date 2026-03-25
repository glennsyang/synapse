CREATE TABLE `mood_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`mood` text NOT NULL,
	`custom_mood` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mood_logs_user_date_idx` ON `mood_logs` (`user_id`,`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `mood_logs_user_date_unique_idx` ON `mood_logs` (`user_id`,`date`);
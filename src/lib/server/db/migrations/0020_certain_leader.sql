CREATE TABLE `visit_status_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`recent_to_overdue_days` integer NOT NULL,
	`overdue_to_critical_days` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `visit_status_settings_user_id_unique` ON `visit_status_settings` (`user_id`);
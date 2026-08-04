CREATE TABLE `dashboard_goal_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`meditation_weekly_goal` integer NOT NULL,
	`workout_green_threshold` integer NOT NULL,
	`workout_amber_threshold` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dashboard_goal_settings_user_id_unique` ON `dashboard_goal_settings` (`user_id`);
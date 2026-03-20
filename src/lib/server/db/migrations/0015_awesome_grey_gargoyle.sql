ALTER TABLE `tasks` ADD `sort_order` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
WITH ordered_tasks AS (
	SELECT
		`id`,
		ROW_NUMBER() OVER (
			PARTITION BY `user_id`, `state`
			ORDER BY `priority`, `due_date`, `task_number`
		) - 1 AS `next_sort_order`
	FROM `tasks`
)
UPDATE `tasks`
SET `sort_order` = (
	SELECT `next_sort_order`
	FROM ordered_tasks
	WHERE ordered_tasks.`id` = `tasks`.`id`
);--> statement-breakpoint
CREATE INDEX `tasks_user_state_sort_idx` ON `tasks` (`user_id`,`state`,`sort_order`);
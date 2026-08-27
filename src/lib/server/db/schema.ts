import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { generateId } from './utils';

// ============================================================================
// Better-Auth Tables (Managed by better-auth)
// Reference: https://www.better-auth.com/docs/adapters/drizzle
// ============================================================================

export const user = sqliteTable('user', {
	id: text('id').primaryKey().$defaultFn(generateId),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull().default(false),
	image: text('image'),
	role: text('role').notNull().default('user'),
	banned: integer('banned', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('createdAt', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updatedAt', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	createdAt: integer('createdAt', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updatedAt', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}));

export const account = sqliteTable(
	'account',
	{
		id: text('id').primaryKey().$defaultFn(generateId),
		userId: text('userId')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accountId: text('accountId').notNull(),
		providerId: text('providerId').notNull(),
		// Scopes account identity by issuer (e.g. "local:credential"), required by
		// better-auth 1.7+. All accounts here are credential accounts, so the
		// default backfills existing rows correctly with no data migration needed.
		issuer: text('issuer').notNull().default('local:credential'),
		accessToken: text('accessToken'),
		refreshToken: text('refreshToken'),
		accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
		refreshTokenUpdatedAt: integer('refreshTokenUpdatedAt', { mode: 'timestamp' }),
		scope: text('scope'),
		idToken: text('idToken'),
		password: text('password'),
		createdAt: integer('createdAt', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer('updatedAt', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [uniqueIndex('account_issuer_accountId_idx').on(table.issuer, table.accountId)]
);

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	})
}));

export const verification = sqliteTable('verification', {
	id: text('id').primaryKey().$defaultFn(generateId),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
	createdAt: integer('createdAt', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updatedAt', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// ============================================================================
// Application Tables
// ============================================================================

/**
 * Email Notifications
 * Tracks sent email notifications to prevent duplicates and enable audit trail
 */
export const emailNotifications = sqliteTable('email_notifications', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	notificationType: text('notification_type').notNull(), // 'workout_reminder' | 'meditation_reminder' | 'visit_warning' | 'daily_agenda_digest'
	entityId: text('entity_id'), // ID of related entity (workout_reminder, meditation_schedule, or person)
	sentAt: text('sent_at').notNull(), // ISO 8601 timestamp
	emailSubject: text('email_subject').notNull(),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const emailNotificationsRelations = relations(emailNotifications, ({ one }) => ({
	user: one(user, {
		fields: [emailNotifications.userId],
		references: [user.id]
	})
}));

/**
 * Journal Entries
 * Daily journal entries with optional metadata (location, weather)
 */
export const journalEntries = sqliteTable('journal_entries', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	date: text('date').notNull(), // YYYY-MM-DD format
	content: text('content').notNull(),
	location: text('location'), // Optional location string
	weather: text('weather'), // Optional weather JSON object
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
	user: one(user, {
		fields: [journalEntries.userId],
		references: [user.id]
	})
}));

/**
 * Mood Logs
 * One mood record per user per Pacific day for analytics and lightweight reflection.
 */
export const moodLogs = sqliteTable(
	'mood_logs',
	{
		id: text('id').primaryKey().$defaultFn(generateId),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		date: text('date').notNull(),
		mood: text('mood').notNull(),
		customMood: text('custom_mood'),
		notes: text('notes'),
		createdAt: text('created_at')
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
		updatedAt: text('updated_at')
			.notNull()
			.$defaultFn(() => new Date().toISOString())
	},
	(table) => [
		index('mood_logs_user_date_idx').on(table.userId, table.date),
		uniqueIndex('mood_logs_user_date_unique_idx').on(table.userId, table.date)
	]
);

export const moodLogsRelations = relations(moodLogs, ({ one }) => ({
	user: one(user, {
		fields: [moodLogs.userId],
		references: [user.id]
	})
}));

/**
 * Tasks
 * Kanban-focused task items with priority, state, and tags
 */
export const tasks = sqliteTable(
	'tasks',
	{
		id: text('id').primaryKey().$defaultFn(generateId),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		taskNumber: integer('task_number').notNull().unique(),
		title: text('title').notNull(),
		description: text('description'),
		dueDate: text('due_date'), // Optional YYYY-MM-DD
		state: text('state').notNull().default('new'), // 'new' | 'in_progress' | 'on_hold' | 'blocked' | 'done'
		sortOrder: integer('sort_order').notNull().default(0),
		priority: integer('priority').notNull(), // 1-4 (1=highest, required)
		tags: text('tags'), // JSON array of strings
		createdAt: text('created_at')
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
		updatedAt: text('updated_at')
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
		completedAt: text('completed_at') // ISO timestamp when state changed to 'done'
	},
	(table) => [index('tasks_user_state_sort_idx').on(table.userId, table.state, table.sortOrder)]
);

export const tasksRelations = relations(tasks, ({ one }) => ({
	user: one(user, {
		fields: [tasks.userId],
		references: [user.id]
	})
}));

/**
 * Daily Agenda Templates
 * Versioned recurring default agenda items so historical weeks remain accurate when defaults change.
 */
export const dailyAgendaTemplates = sqliteTable(
	'daily_agenda_templates',
	{
		id: text('id').primaryKey().$defaultFn(generateId),
		templateGroupId: text('template_group_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		sortOrder: integer('sort_order').notNull().default(0),
		daysOfWeek: text('days_of_week').notNull().default('[0,1,2,3,4,5,6]'),
		startsOn: text('starts_on').notNull(), // YYYY-MM-DD
		endsOn: text('ends_on'), // YYYY-MM-DD
		createdAt: text('created_at')
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
		updatedAt: text('updated_at')
			.notNull()
			.$defaultFn(() => new Date().toISOString())
	},
	(table) => [
		index('daily_agenda_templates_user_range_idx').on(table.userId, table.startsOn, table.endsOn),
		index('daily_agenda_templates_group_idx').on(table.templateGroupId)
	]
);

export const dailyAgendaTemplatesRelations = relations(dailyAgendaTemplates, ({ many, one }) => ({
	user: one(user, {
		fields: [dailyAgendaTemplates.userId],
		references: [user.id]
	}),
	entries: many(dailyAgendaEntries)
}));

/**
 * Daily Agenda Entries
 * Per-day agenda items with completion state for default and custom checklist rows.
 */
export const dailyAgendaEntries = sqliteTable(
	'daily_agenda_entries',
	{
		id: text('id').primaryKey().$defaultFn(generateId),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		templateId: text('template_id').references(() => dailyAgendaTemplates.id, {
			onDelete: 'set null'
		}),
		templateGroupId: text('template_group_id'),
		date: text('date').notNull(), // YYYY-MM-DD
		title: text('title').notNull(),
		sourceType: text('source_type').notNull().default('default'), // 'default' | 'custom'
		sortOrder: integer('sort_order').notNull().default(0),
		completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
		completedAt: text('completed_at'),
		createdAt: text('created_at')
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
		updatedAt: text('updated_at')
			.notNull()
			.$defaultFn(() => new Date().toISOString())
	},
	(table) => [
		index('daily_agenda_entries_user_date_idx').on(table.userId, table.date),
		index('daily_agenda_entries_group_date_idx').on(table.templateGroupId, table.date),
		uniqueIndex('daily_agenda_entries_default_unique_idx').on(
			table.userId,
			table.templateGroupId,
			table.date
		)
	]
);

export const dailyAgendaEntriesRelations = relations(dailyAgendaEntries, ({ one }) => ({
	user: one(user, {
		fields: [dailyAgendaEntries.userId],
		references: [user.id]
	}),
	template: one(dailyAgendaTemplates, {
		fields: [dailyAgendaEntries.templateId],
		references: [dailyAgendaTemplates.id]
	})
}));

// ============================================================================
// Fitness & Nutrition Tables
// ============================================================================

/**
 * Weight Entries
 * Weight tracking records for trend analysis
 */
export const weightEntries = sqliteTable('weight_entries', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	date: text('date').notNull(), // YYYY-MM-DD
	time: text('time'), // Optional HH:MM
	weightLbs: integer('weight_lbs').notNull(),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const weightEntriesRelations = relations(weightEntries, ({ one }) => ({
	user: one(user, {
		fields: [weightEntries.userId],
		references: [user.id]
	})
}));

/**
 * Goal Weights
 * Target weight goals for users
 */
export const goalWeights = sqliteTable('goal_weights', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: 'cascade' }),
	targetWeightLbs: integer('target_weight_lbs').notNull(),
	setDate: text('set_date').notNull(), // YYYY-MM-DD
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const goalWeightsRelations = relations(goalWeights, ({ one }) => ({
	user: one(user, {
		fields: [goalWeights.userId],
		references: [user.id]
	})
}));

/**
 * Workout Logs
 * Exercise session records
 */
export const workoutLogs = sqliteTable('workout_logs', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	date: text('date').notNull(), // YYYY-MM-DD
	time: text('time'), // Optional HH:MM
	type: text('type').notNull(), // 'strength' | 'cardio' | 'hiit' | 'walk' | 'stretch' | 'other'
	durationMinutes: integer('duration_minutes'),
	steps: integer('steps'), // For walk workouts
	notes: text('notes'),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const workoutLogsRelations = relations(workoutLogs, ({ one, many }) => ({
	user: one(user, {
		fields: [workoutLogs.userId],
		references: [user.id]
	}),
	exercises: many(workoutExercises)
}));

/**
 * Workout Exercises
 * Individual exercises within a strength workout
 */
export const workoutExercises = sqliteTable('workout_exercises', {
	id: text('id').primaryKey().$defaultFn(generateId),
	workoutLogId: text('workout_log_id')
		.notNull()
		.references(() => workoutLogs.id, { onDelete: 'cascade' }),
	exerciseName: text('exercise_name').notNull(),
	sets: integer('sets'),
	reps: integer('reps'),
	weightLbs: integer('weight_lbs'),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const workoutExercisesRelations = relations(workoutExercises, ({ one }) => ({
	workoutLog: one(workoutLogs, {
		fields: [workoutExercises.workoutLogId],
		references: [workoutLogs.id]
	})
}));

/**
 * Meal Logs
 * Meal records with calorie tracking
 */
export const mealLogs = sqliteTable('meal_logs', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	date: text('date').notNull(), // YYYY-MM-DD
	timeOfDay: text('time_of_day').notNull(), // 'breakfast' | 'lunch' | 'dinner' | 'snack'
	description: text('description').notNull(),
	caloriesEstimate: integer('calories_estimate'),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const mealLogsRelations = relations(mealLogs, ({ one }) => ({
	user: one(user, {
		fields: [mealLogs.userId],
		references: [user.id]
	})
}));

/**
 * Daily Calorie Targets
 * Daily calorie goals for users
 */
export const dailyCalorieTargets = sqliteTable('daily_calorie_targets', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: 'cascade' }),
	targetCalories: integer('target_calories').notNull(),
	setDate: text('set_date').notNull(), // YYYY-MM-DD
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const dailyCalorieTargetsRelations = relations(dailyCalorieTargets, ({ one }) => ({
	user: one(user, {
		fields: [dailyCalorieTargets.userId],
		references: [user.id]
	})
}));

/**
 * Workout Reminders
 * Scheduled workout reminder notifications
 */
export const workoutReminders = sqliteTable('workout_reminders', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	workoutType: text('workout_type').notNull(), // 'strength' | 'cardio' | 'hiit' | 'walk' | 'stretch' | 'other'
	cadence: text('cadence').notNull(), // 'daily' | 'weekly'
	daysOfWeek: text('days_of_week'), // JSON array of day numbers (0-6, 0=Sunday)
	time: text('time').notNull(), // HH:MM
	enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const workoutRemindersRelations = relations(workoutReminders, ({ one }) => ({
	user: one(user, {
		fields: [workoutReminders.userId],
		references: [user.id]
	})
}));

/**
 * Meditation Routines
 * Predefined or user-created meditation routines
 */
export const meditationRoutines = sqliteTable('meditation_routines', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description'),
	linkUrl: text('link_url').notNull(),
	durationMinutes: integer('duration_minutes').notNull(),
	moodTags: text('mood_tags').notNull(), // JSON array: ["Anxious", "Focused", etc.]
	isPredefined: integer('is_predefined', { mode: 'boolean' }).notNull().default(false),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const meditationRoutinesRelations = relations(meditationRoutines, ({ one, many }) => ({
	user: one(user, {
		fields: [meditationRoutines.userId],
		references: [user.id]
	}),
	schedules: many(meditationSchedules),
	sessions: many(meditationSessions)
}));

/**
 * Meditation Schedules
 * Recurring meditation reminder schedules
 */
export const meditationSchedules = sqliteTable('meditation_schedules', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	routineId: text('routine_id')
		.notNull()
		.references(() => meditationRoutines.id, { onDelete: 'cascade' }),
	cadence: text('cadence').notNull(), // 'daily' | 'weekly' | 'custom'
	daysOfWeek: text('days_of_week'), // JSON array of day numbers (0-6, 0=Sunday)
	time: text('time').notNull(), // HH:MM
	enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const meditationSchedulesRelations = relations(meditationSchedules, ({ one }) => ({
	user: one(user, {
		fields: [meditationSchedules.userId],
		references: [user.id]
	}),
	routine: one(meditationRoutines, {
		fields: [meditationSchedules.routineId],
		references: [meditationRoutines.id]
	})
}));

/**
 * Meditation Sessions
 * Completed meditation session logs
 */
export const meditationSessions = sqliteTable('meditation_sessions', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	routineId: text('routine_id')
		.notNull()
		.references(() => meditationRoutines.id, { onDelete: 'cascade' }),
	completedAt: text('completed_at').notNull(),
	preMoodRating: integer('pre_mood_rating'), // 1-5 pre-meditation mood
	moodRating: integer('mood_rating'), // 1-5 post-meditation mood
	notes: text('notes'),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const meditationSessionsRelations = relations(meditationSessions, ({ one }) => ({
	user: one(user, {
		fields: [meditationSessions.userId],
		references: [user.id]
	}),
	routine: one(meditationRoutines, {
		fields: [meditationSessions.routineId],
		references: [meditationRoutines.id]
	})
}));

/**
 * People
 * People to track visits for
 */
export const people = sqliteTable('people', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	isExempt: integer('is_exempt', { mode: 'boolean' }).notNull().default(false),
	isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
	archivedAt: text('archived_at'),
	scheduledVisitDate: text('scheduled_visit_date'),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const peopleRelations = relations(people, ({ one, many }) => ({
	user: one(user, {
		fields: [people.userId],
		references: [user.id]
	}),
	visits: many(visits)
}));

/**
 * Visits
 * Visit records with companions and follow-up tracking
 */
export const visits = sqliteTable('visits', {
	id: text('id').primaryKey().$defaultFn(generateId),
	personId: text('person_id')
		.notNull()
		.references(() => people.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	date: text('date').notNull(),
	time: text('time'),
	companions: text('companions'), // JSON array of companion names
	notes: text('notes'),
	followUpDate: text('follow_up_date'),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const visitsRelations = relations(visits, ({ one }) => ({
	person: one(people, {
		fields: [visits.personId],
		references: [people.id]
	}),
	user: one(user, {
		fields: [visits.userId],
		references: [user.id]
	})
}));

/**
 * Visit Status Settings
 * Per-user thresholds for visit status transitions.
 */
export const visitStatusSettings = sqliteTable('visit_status_settings', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: 'cascade' }),
	recentToOverdueDays: integer('recent_to_overdue_days').notNull(),
	overdueToCriticalDays: integer('overdue_to_critical_days').notNull(),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const visitStatusSettingsRelations = relations(visitStatusSettings, ({ one }) => ({
	user: one(user, {
		fields: [visitStatusSettings.userId],
		references: [user.id]
	})
}));

/**
 * Dashboard Goal Settings
 * Per-user thresholds for dashboard widget goals (meditation weekly goal,
 * workout pace thresholds over a trailing 4-week window).
 */
export const dashboardGoalSettings = sqliteTable('dashboard_goal_settings', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: 'cascade' }),
	meditationWeeklyGoal: integer('meditation_weekly_goal').notNull(),
	workoutGreenThreshold: integer('workout_green_threshold').notNull(),
	workoutAmberThreshold: integer('workout_amber_threshold').notNull(),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const dashboardGoalSettingsRelations = relations(dashboardGoalSettings, ({ one }) => ({
	user: one(user, {
		fields: [dashboardGoalSettings.userId],
		references: [user.id]
	})
}));

// ============================================================================
// External API Tables
// ============================================================================

/**
 * API Keys
 * Mirrors the field set required by the `@better-auth/api-key` plugin's `apikey` model.
 * Table name and every field name below must match the plugin's expectations exactly,
 * since it queries this table by these names via the drizzle adapter's schema map in auth.ts.
 */
export const apiKey = sqliteTable('apikey', {
	id: text('id').primaryKey().$defaultFn(generateId),
	configId: text('config_id').notNull().default('default'),
	name: text('name'),
	start: text('start'),
	prefix: text('prefix'),
	key: text('key').notNull().unique(),
	referenceId: text('reference_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	refillInterval: integer('refill_interval'),
	refillAmount: integer('refill_amount'),
	lastRefillAt: integer('last_refill_at', { mode: 'timestamp' }),
	enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
	rateLimitEnabled: integer('rate_limit_enabled', { mode: 'boolean' }).notNull().default(true),
	rateLimitTimeWindow: integer('rate_limit_time_window'),
	rateLimitMax: integer('rate_limit_max'),
	requestCount: integer('request_count').notNull().default(0),
	remaining: integer('remaining'),
	lastRequest: integer('last_request', { mode: 'timestamp' }),
	expiresAt: integer('expires_at', { mode: 'timestamp' }),
	permissions: text('permissions'),
	metadata: text('metadata'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
	user: one(user, {
		fields: [apiKey.referenceId],
		references: [user.id]
	})
}));

/**
 * API Audit Log
 * Records which API key performed a write and what happened, for traceability of
 * external/programmatic activity against the app's data.
 */
export const apiAuditLog = sqliteTable('api_audit_log', {
	id: text('id').primaryKey().$defaultFn(generateId),
	// Deliberately no FK to apiKey.id: the audit trail must survive a key being revoked
	// (deleted), which is exactly the moment someone is most likely to want to review it.
	apiKeyId: text('api_key_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	method: text('method').notNull(),
	path: text('path').notNull(),
	action: text('action').notNull(),
	statusCode: integer('status_code').notNull(),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const apiAuditLogRelations = relations(apiAuditLog, ({ one }) => ({
	user: one(user, {
		fields: [apiAuditLog.userId],
		references: [user.id]
	})
}));

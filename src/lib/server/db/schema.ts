import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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

export const account = sqliteTable('account', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accountId: text('accountId').notNull(),
	providerId: text('providerId').notNull(),
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
});

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
	notificationType: text('notification_type').notNull(), // 'workout_reminder' | 'meditation_reminder' | 'visit_warning'
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
 * Daily journal entries with optional metadata (tags, location, weather)
 */
export const journalEntries = sqliteTable('journal_entries', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	date: text('date').notNull(), // YYYY-MM-DD format
	content: text('content').notNull(),
	tags: text('tags'), // JSON array of strings
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
 * Tasks
 * Kanban-focused task items with priority, state, and tags
 */
export const tasks = sqliteTable('tasks', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description'),
	dueDate: text('due_date'), // Optional YYYY-MM-DD
	state: text('state').notNull().default('new'), // 'new' | 'in_progress' | 'on_hold' | 'blocked' | 'done'
	priority: integer('priority').notNull(), // 1-4 (1=highest, required)
	tags: text('tags'), // JSON array of strings
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	completedAt: text('completed_at') // ISO timestamp when state changed to 'done'
});

export const tasksRelations = relations(tasks, ({ one }) => ({
	user: one(user, {
		fields: [tasks.userId],
		references: [user.id]
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
	type: text('type').notNull(), // 'strength' | 'cardio' | 'yoga' | 'other'
	durationMinutes: integer('duration_minutes'),
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
	workoutType: text('workout_type').notNull(), // 'strength' | 'cardio' | 'yoga' | 'other'
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

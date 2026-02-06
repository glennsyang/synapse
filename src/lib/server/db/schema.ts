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
 * Projects
 * Organizational containers for todos
 */
export const projects = sqliteTable('projects', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	color: text('color'), // Optional hex color (e.g., "#3B82F6")
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
	user: one(user, {
		fields: [projects.userId],
		references: [user.id]
	}),
	todoItems: many(todoItems)
}));

/**
 * TodoItems
 * Tasks with cadence, project assignment, and rich metadata
 */
export const todoItems = sqliteTable('todo_items', {
	id: text('id').primaryKey().$defaultFn(generateId),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
	title: text('title').notNull(),
	description: text('description'),
	cadence: text('cadence').notNull(), // 'daily' | 'weekly' | 'monthly'
	dueDate: text('due_date'), // Optional YYYY-MM-DD
	state: text('state').notNull().default('new'), // 'new' | 'in_progress' | 'blocked' | 'done'
	priority: integer('priority').notNull().default(2), // 1-4 (1=highest)
	tags: text('tags'), // JSON array of strings
	subSteps: text('sub_steps'), // JSON array of {title: string, completed: boolean}
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	completedAt: text('completed_at') // ISO timestamp when state changed to 'done'
});

export const todoItemsRelations = relations(todoItems, ({ one }) => ({
	user: one(user, {
		fields: [todoItems.userId],
		references: [user.id]
	}),
	project: one(projects, {
		fields: [todoItems.projectId],
		references: [projects.id]
	})
}));

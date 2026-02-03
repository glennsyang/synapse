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

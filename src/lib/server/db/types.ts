import type { SessionWithImpersonatedBy } from 'better-auth/plugins';

import type { emailNotifications, journalEntries, session, tasks, user } from './schema';

export type User = typeof user.$inferSelect;

export type Session = typeof session.$inferSelect;

export type UserWithSessions = User & {
	sessions: SessionWithImpersonatedBy[];
};

export type EmailNotification = typeof emailNotifications.$inferSelect;

export type JournalEntry = typeof journalEntries.$inferSelect;

export type Task = typeof tasks.$inferSelect;

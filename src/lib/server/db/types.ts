import type { SessionWithImpersonatedBy } from 'better-auth/plugins';

import type { emailNotifications, session, user } from './schema';

export type User = typeof user.$inferSelect;

export type Session = typeof session.$inferSelect;

export type UserWithSessions = User & {
	sessions: SessionWithImpersonatedBy[];
};

export type emailNotifications = typeof emailNotifications.$inferSelect;

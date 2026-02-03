# Authentication API Contract

**Feature**: Synapse Second-Brain App  
**Date**: 2026-02-02 (Updated with Better-Auth)

## Overview

Authentication uses **Better-Auth** framework with email/password provider and email verification via Resend. Better-auth automatically creates API routes at `/api/auth/*` and manages sessions via secure HTTP-only cookies.

**Key Features**:

- Email/password authentication (no OAuth providers)
- Email verification flow
- Password reset flow
- Session management with Drizzle adapter
- Auto-generated endpoints at `/api/auth/*`

---

## Better-Auth Configuration

```typescript
// src/lib/server/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'sqlite'
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, url }) => {
			await sendPasswordResetEmail(user.email, url);
		}
	},
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			await sendVerificationEmail(user.email, url);
		},
		sendOnSignUp: true
	},
	trustedOrigins: ['http://localhost:5173', 'https://synapse.fly.dev']
});

export type Session = typeof auth.$Infer.Session;
```

---

## Auto-Generated Endpoints

Better-auth automatically creates these endpoints (no manual implementation needed):

### POST `/api/auth/sign-up`

Register new user with email/password.

**Request Body** (JSON):

```typescript
{
	email: string;
	password: string;
	name: string;
}
```

**Success Response** (HTTP 200):

```typescript
{
  user: {
    id: string;        // UUID
    email: string;
    name: string;
    emailVerified: false;
    createdAt: number;
    updatedAt: number;
  },
  session: null  // No session until email verified
}
```

**Error Response** (HTTP 400):

```typescript
{
	error: 'Email already in use' | 'Password too weak';
}
```

**Side Effects**:

- User record created in `user` table (managed by better-auth)
- Verification token created in `verification` table
- Verification email sent via Resend with verification link

---

### POST `/api/auth/sign-in/email`

Sign in with email/password.

**Request Body** (JSON):

```typescript
{
	email: string;
	password: string;
}
```

**Success Response** (HTTP 200):

```typescript
{
  user: {
    id: string;        // UUID
    email: string;
    name: string;
    emailVerified: boolean;
    createdAt: number;
    updatedAt: number;
  },
  session: {
    id: string;        // UUID
    userId: string;
    expiresAt: number;
    token: string;     // Session token (also set as HTTP-only cookie)
  }
}
```

**Set-Cookie Header**:

```
better-auth.session_token=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
```

**Error Response** (HTTP 401):

```typescript
{
	error: 'Invalid email or password' | 'Email not verified';
}
```

---

### POST `/api/auth/sign-out`

Sign out and destroy session.

**Request**: Requires session cookie

**Success Response** (HTTP 200):

```typescript
{
	success: true;
}
```

**Set-Cookie Header**:

```
better-auth.session_token=; Max-Age=0
```

---

### POST `/api/auth/verify-email`

Verify email with token from verification email.

**Request Body** (JSON):

```typescript
{
	token: string; // From verification email URL
}
```

**Success Response** (HTTP 200):

```typescript
{
  user: {
    id: string;
    email: string;
    emailVerified: true;
    // ... other fields
  },
  session: {
    // Session created after verification
  }
}
```

**Error Response** (HTTP 400):

```typescript
{
	error: 'Invalid or expired token';
}
```

---

### POST `/api/auth/forgot-password`

Request password reset email.

**Request Body** (JSON):

```typescript
{
	email: string;
}
```

**Success Response** (HTTP 200):

```typescript
{
  success: true,
  message: "If that email exists, a reset link has been sent"
}
```

**Side Effects**:

- Password reset token created in `verification` table
- Password reset email sent via Resend with reset link

**Note**: Always returns success to prevent email enumeration

---

### POST `/api/auth/reset-password`

Reset password with token from reset email.

**Request Body** (JSON):

```typescript
{
	token: string; // From password reset email URL
	newPassword: string;
}
```

**Success Response** (HTTP 200):

```typescript
{
  success: true,
  message: "Password reset successfully"
}
```

**Error Response** (HTTP 400):

```typescript
{
	error: 'Invalid or expired token' | 'Password too weak';
}
```

---

### GET `/api/auth/session`

Get current session and user.

**Request**: Requires session cookie

**Success Response** (HTTP 200):

```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
  },
  session: {
    id: string;
    expiresAt: number;
  }
}
```

**Unauthenticated Response** (HTTP 401):

```typescript
{
  user: null,
  session: null
}
```

---

## SvelteKit Integration

### Server Hooks

```typescript
// src/hooks.server.ts
import { auth } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Better-auth automatically handles /api/auth/* routes
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.session = session?.session ?? null;
	event.locals.user = session?.user ?? null;

	return resolve(event);
};
```

### Protected Layout

```typescript
// src/routes/(app)/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user || !locals.user.emailVerified) {
		throw redirect(303, '/login');
	}

	return {
		user: {
			id: locals.user.id,
			email: locals.user.email,
			name: locals.user.name
		}
	};
};
```

### Client-Side Auth Actions

```typescript
// src/lib/client/auth.ts
import { authClient } from 'better-auth/client';

export const client = authClient({
	baseURL: 'http://localhost:5173' // Or production URL
});

// Usage in +page.svelte
export async function signUp(email: string, password: string, name: string) {
	const { data, error } = await client.signUp.email({
		email,
		password,
		name
	});

	if (error) {
		console.error(error.message);
		return null;
	}

	return data;
}

export async function signIn(email: string, password: string) {
	const { data, error } = await client.signIn.email({
		email,
		password
	});

	if (error) {
		console.error(error.message);
		return null;
	}

	return data;
}

export async function signOut() {
	await client.signOut();
	window.location.href = '/login';
}
```

---

## Email Templates (Resend)

### Verification Email

```typescript
// src/lib/server/email/verify.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, verificationUrl: string) {
	await resend.emails.send({
		from: 'Synapse <noreply@synapse.app>',
		to: email,
		subject: 'Verify your email address',
		html: `
      <h1>Welcome to Synapse!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `
	});
}
```

### Password Reset Email

```typescript
// src/lib/server/email/reset.ts
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
	await resend.emails.send({
		from: 'Synapse <noreply@synapse.app>',
		to: email,
		subject: 'Reset your password',
		html: `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
	});
}
```

---

## Routes

### `/verify-email`

SvelteKit page to handle email verification callback.

```typescript
// src/routes/verify-email/+page.server.ts
import { auth } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		return { error: 'Missing verification token' };
	}

	const result = await auth.api.verifyEmail({
		body: { token }
	});

	if (result.error) {
		return { error: result.error.message };
	}

	throw redirect(303, '/journal?verified=true');
};
```

### `/reset-password`

SvelteKit page to handle password reset.

```typescript
// src/routes/reset-password/+page.server.ts
import { auth } from '$lib/server/auth';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

const schema = z.object({
	token: z.string(),
	newPassword: z.string().min(8)
});

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod(schema));

		if (!form.valid) return fail(400, { form });

		const result = await auth.api.resetPassword({
			body: {
				token: form.data.token,
				newPassword: form.data.newPassword
			}
		});

		if (result.error) {
			return fail(400, { form, message: result.error.message });
		}

		return redirect(303, '/login?reset=true');
	}
};
```

---

## Security Features

- [x] Passwords hashed with secure algorithm (better-auth handles)
- [x] Session tokens secure and random
- [x] Cookies: HttpOnly, Secure, SameSite=Lax
- [x] CSRF protection via SvelteKit built-in
- [x] Email verification required before access
- [x] Password reset with time-limited tokens
- [x] Session expiry (7 days default, configurable)
- [ ] Rate limiting (add middleware in future)

---

## Example Flows

### Registration + Verification

1. User visits `/register`
2. Fills form: email, password, name
3. Client calls `client.signUp.email()` → POST `/api/auth/sign-up`
4. Better-auth creates user with `emailVerified: false`
5. Verification email sent via Resend with token URL
6. User clicks link → GET `/verify-email?token=xyz`
7. Server calls `auth.api.verifyEmail()` → POST `/api/auth/verify-email`
8. User marked as verified, session created
9. Redirect to `/journal?verified=true`

### Login

1. User visits `/login`
2. Fills form: email, password
3. Client calls `client.signIn.email()` → POST `/api/auth/sign-in/email`
4. Better-auth verifies credentials, creates session
5. Session cookie set automatically
6. Client redirects to `/journal`

### Password Reset

1. User visits `/login` → clicks "Forgot password?"
2. Visits `/forgot-password`, enters email
3. Client calls `client.forgetPassword()` → POST `/api/auth/forgot-password`
4. Better-auth creates reset token, sends email via Resend
5. User clicks link → GET `/reset-password?token=xyz`
6. User enters new password → POST `/reset-password`
7. Server calls `auth.api.resetPassword()`
8. Password updated, redirect to `/login?reset=true`

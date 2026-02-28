import { error, redirect } from '@sveltejs/kit';

type RedirectStatusCode = 300 | 301 | 302 | 303 | 307 | 308;

type MissingEntityBehavior =
	| {
			type: 'redirect';
			to: string;
			status?: RedirectStatusCode;
	  }
	| {
			type: 'error';
			message: string;
			status?: number;
	  };

export async function getOwnedEntityOrThrow<TEntity>(
	findEntity: () => Promise<TEntity | undefined>,
	behavior: MissingEntityBehavior
): Promise<TEntity> {
	const entity = await findEntity();

	if (!entity) {
		if (behavior.type === 'redirect') {
			throw redirect(behavior.status ?? 303, behavior.to);
		}

		throw error(behavior.status ?? 404, behavior.message);
	}

	return entity;
}

export async function getOwnedEntityOrNull<TEntity>(
	findEntity: () => Promise<TEntity | undefined>
): Promise<TEntity | null> {
	const entity = await findEntity();

	if (!entity) {
		return null;
	}

	return entity;
}

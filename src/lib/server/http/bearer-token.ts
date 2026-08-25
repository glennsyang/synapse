export type BearerTokenFailureReason = 'missing_header' | 'invalid_scheme' | 'malformed_header';

export type BearerTokenResult =
	| { token: string; reason?: undefined }
	| { token?: undefined; reason: BearerTokenFailureReason };

/**
 * Parses an `Authorization: Bearer <token>` header. Only ever reads the header string passed
 * in — never a query string or any other request field — so callers that rely on this to keep
 * secrets out of URLs/logs can't accidentally widen that guarantee.
 */
export function parseBearerToken(header: string | null): BearerTokenResult {
	if (header === null) {
		return { reason: 'missing_header' };
	}

	const parts = header.split(' ');
	if (parts.length !== 2) {
		return { reason: 'malformed_header' };
	}

	if (parts[0] !== 'Bearer') {
		return { reason: 'invalid_scheme' };
	}

	const token = parts[1];
	if (token.length === 0) {
		return { reason: 'malformed_header' };
	}

	return { token };
}

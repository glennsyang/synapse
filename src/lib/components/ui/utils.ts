import type { WithoutChildren } from '$lib/utils';

export { cn } from '$lib/utils';
export type { WithoutChildren } from '$lib/utils';

export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, 'child'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

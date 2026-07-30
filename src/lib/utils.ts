// Compatibility re-export for shadcn-svelte's generated components, which import
// `cn` and its companion types directly from `$lib/utils` (see `src/lib/utils/ui.ts`
// for the actual implementations).
export {
	cn,
	type WithElementRef,
	type WithoutChild,
	type WithoutChildren,
	type WithoutChildrenOrChild
} from './utils/ui';

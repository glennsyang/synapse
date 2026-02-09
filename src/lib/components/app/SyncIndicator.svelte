<script lang="ts">
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import WifiOffIcon from '@lucide/svelte/icons/wifi-off';
	import { toast } from 'svelte-sonner';

	import { getCacheStats, getUnsyncedRecords, markAsSynced } from '$lib/client/offline-db';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { onlineState } from '$lib/utils/online-state.svelte';

	let isSyncing = $state(false);
	let lastSyncAt = $state<Date | null>(null);
	let unsyncedCount = $state(0);
	let autoSyncEnabled = $state(true);
	let autoSyncInterval: ReturnType<typeof setInterval> | null = null;

	// Load unsynced count on mount
	$effect(() => {
		loadUnsyncedCount();
	});

	// Auto-sync when coming back online
	$effect(() => {
		if (onlineState.isOnline && unsyncedCount > 0 && autoSyncEnabled) {
			// Wait a bit after coming online to avoid immediate sync
			setTimeout(() => {
				if (onlineState.isOnline) {
					performSync();
				}
			}, 2000);
		}
	});

	// Set up auto-sync interval (every 5 minutes)
	$effect(() => {
		if (autoSyncEnabled && onlineState.isOnline) {
			autoSyncInterval = setInterval(
				() => {
					if (unsyncedCount > 0) {
						performSync();
					}
				},
				5 * 60 * 1000
			); // 5 minutes
		}

		return () => {
			if (autoSyncInterval) {
				clearInterval(autoSyncInterval);
			}
		};
	});

	async function loadUnsyncedCount() {
		try {
			const stats = await getCacheStats();
			unsyncedCount = stats.unsynced;
		} catch (error) {
			console.error('Failed to load unsynced count:', error);
		}
	}

	async function performSync() {
		if (isSyncing || !onlineState.isOnline) {
			return;
		}

		isSyncing = true;

		try {
			const unsyncedRecords = await getUnsyncedRecords();

			if (unsyncedRecords.length === 0) {
				toast.info('Already up to date');
				isSyncing = false;
				return;
			}

			// Build sync request
			const syncRequest = {
				lastSyncAt: lastSyncAt?.toISOString() || null,
				changes: unsyncedRecords.map((record) => ({
					tableName: record.tableName,
					recordId: record.id,
					operation: record.operation,
					data: record.data,
					updatedAt: new Date(record.timestamp).toISOString()
				}))
			};

			// Call sync endpoint
			const response = await fetch('/api/sync', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(syncRequest)
			});

			if (!response.ok) {
				throw new Error(`Sync failed: ${response.statusText}`);
			}

			const syncResponse = await response.json();

			// Mark synced records
			for (const record of unsyncedRecords) {
				await markAsSynced(record.tableName, record.id);
			}

			// Update state
			lastSyncAt = new Date(syncResponse.syncedAt);
			await loadUnsyncedCount();

			// Show notifications
			if (syncResponse.conflicts.length > 0) {
				toast.warning(
					`Synced with ${syncResponse.conflicts.length} conflicts (server version kept)`
				);
			} else if (syncResponse.errors.length > 0) {
				toast.error(`Sync completed with ${syncResponse.errors.length} errors`);
			} else {
				toast.success('Sync completed successfully');
			}
		} catch (error) {
			console.error('Sync error:', error);
			toast.error('Sync failed. Will retry later.');
		} finally {
			isSyncing = false;
		}
	}

	function handleSyncClick() {
		if (!onlineState.isOnline) {
			toast.error('Cannot sync while offline');
			return;
		}
		performSync();
	}
</script>

<div class="flex items-center gap-2">
	{#if onlineState.isOffline}
		<Tooltip.Root>
			<Tooltip.Trigger>
				<Badge variant="destructive" class="gap-1">
					<WifiOffIcon class="h-3 w-3" />
					Offline
				</Badge>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<p>You're offline. Changes will sync when you're back online.</p>
			</Tooltip.Content>
		</Tooltip.Root>
	{/if}

	{#if unsyncedCount > 0}
		<Tooltip.Root>
			<Tooltip.Trigger>
				<Badge variant="secondary" class="gap-1">
					{unsyncedCount} unsynced
				</Badge>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<p>{unsyncedCount} changes waiting to sync</p>
			</Tooltip.Content>
		</Tooltip.Root>
	{/if}

	<Tooltip.Root>
		<Tooltip.Trigger>
			<Button
				variant="ghost"
				size="icon"
				onclick={handleSyncClick}
				disabled={isSyncing || onlineState.isOffline}
			>
				<RefreshCwIcon class={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
				<span class="sr-only">Sync</span>
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>
				{#if isSyncing}
					Syncing...
				{:else if onlineState.isOffline}
					Offline - cannot sync
				{:else if lastSyncAt}
					Last synced: {lastSyncAt.toLocaleTimeString()}
				{:else}
					Click to sync
				{/if}
			</p>
		</Tooltip.Content>
	</Tooltip.Root>
</div>

<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import type { User } from '$lib/types';

	let { users }: { users: User[] } = $props();
</script>

<div class="overflow-x-auto rounded-xl border">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Email</Table.Head>
				<Table.Head>Name</Table.Head>
				<Table.Head>Role</Table.Head>
				<Table.Head>Status</Table.Head>
				<Table.Head>Created Date</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#if users.length === 0}
				<Table.Row>
					<Table.Cell colspan={5} class="text-muted-foreground text-center"
						>No users found.</Table.Cell
					>
				</Table.Row>
			{:else}
				{#each users as user (user.id)}
					<Table.Row>
						<Table.Cell>{user.email}</Table.Cell>
						<Table.Cell>{user.name}</Table.Cell>
						<Table.Cell>
							<Badge variant={user.role === 'admin' ? 'default' : 'outline'}>{user.role}</Badge>
						</Table.Cell>
						<Table.Cell>
							<Badge variant={user.banned ? 'destructive' : 'secondary'}>
								{user.banned ? 'Banned' : 'Active'}
							</Badge>
						</Table.Cell>
						<Table.Cell>{new Date(user.createdAt).toLocaleDateString()}</Table.Cell>
					</Table.Row>
				{/each}
			{/if}
		</Table.Body>
	</Table.Root>
</div>

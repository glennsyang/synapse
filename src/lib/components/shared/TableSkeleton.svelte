<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	interface Props {
		rows?: number;
		cols?: number;
	}

	let { rows = 5, cols = 4 }: Props = $props();
</script>

<div class="rounded-md border">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				{#each Array(cols) as _, i (i)}
					<Table.Head> <Skeleton class="h-4 w-24" /> </Table.Head>
				{/each}
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each Array(rows) as _, rowIndex (rowIndex)}
				<Table.Row>
					{#each Array(cols) as _, colIndex (colIndex)}
						<Table.Cell> <Skeleton class="h-4 w-full" /> </Table.Cell>
					{/each}
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

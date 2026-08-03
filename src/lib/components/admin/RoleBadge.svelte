<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	let { role }: { role: string } = $props();
</script>

<Badge variant={role === 'admin' ? 'destructive' : 'outline'}>{role}</Badge>

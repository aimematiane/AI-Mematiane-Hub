<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { FolderOpen, User, Calendar, Activity, Search, Filter } from '@lucide/svelte';

	let { data } = $props();

	let logs = $state([]);
	let searchQuery = $state('');
	let actionFilter = $state('all');
	let entityFilter = $state('all');

	$effect(() => {
		logs = data.logs || [];
	});

	function formatDate(date) {
		return new Date(date).toLocaleString('en-US', {
			month: 'short', day: 'numeric', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
	}

	const filteredLogs = $derived(() => {
		return logs.filter(log => {
			const matchesSearch = !searchQuery ||
				log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(log.user?.display_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
				(log.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase());
			const matchesAction = actionFilter === 'all' || log.action === actionFilter;
			const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
			return matchesSearch && matchesAction && matchesEntity;
		});
	});

	const actionColors = {
		create: 'bg-emerald-500/20 text-emerald-400',
		update: 'bg-blue-500/20 text-blue-400',
		delete: 'bg-rose-500/20 text-rose-400',
		login: 'bg-amber-500/20 text-amber-400',
		logout: 'bg-surface-700 text-surface-400'
	};

	const uniqueActions = $derived([...new Set(logs.map(l => l.action))]);
	const uniqueEntities = $derived([...new Set(logs.map(l => l.entity_type))]);
</script>

<SeoHead title="Audit Logs" noindex={true} />

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold text-white flex items-center gap-3">
				<FolderOpen size={24} class="text-accent-400" />
				Audit Logs
			</h1>
			<p class="text-surface-400 mt-1">Track all administrative actions</p>
		</div>
	</div>

	<!-- Filters -->
	<div class="flex flex-col sm:flex-row gap-4 mb-6">
		<div class="flex-1 relative">
			<Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search by action or user..."
				class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-900 border border-surface-800 text-white placeholder-surface-500 text-sm"
			/>
		</div>
		<select
			bind:value={actionFilter}
			class="px-4 py-2.5 rounded-xl bg-surface-900 border border-surface-800 text-white text-sm"
		>
			<option value="all">All Actions</option>
			{#each uniqueActions as action}
				<option value={action}>{action}</option>
			{/each}
		</select>
		<select
			bind:value={entityFilter}
			class="px-4 py-2.5 rounded-xl bg-surface-900 border border-surface-800 text-white text-sm"
		>
			<option value="all">All Entities</option>
			{#each uniqueEntities as entity}
				<option value={entity}>{entity}</option>
			{/each}
		</select>
	</div>

	<!-- Logs Table -->
	<div class="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
		{#if filteredLogs().length > 0}
			<table class="w-full">
				<thead class="bg-surface-800">
					<tr>
						<th class="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Time</th>
						<th class="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">User</th>
						<th class="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Action</th>
						<th class="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Entity</th>
						<th class="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">IP</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-800">
					{#each filteredLogs() as log}
						<tr class="hover:bg-surface-800/50 transition-colors">
							<td class="px-6 py-4 text-sm text-surface-400">
								<div class="flex items-center gap-1.5">
									<Calendar size={14} />
									{formatDate(log.created_at)}
								</div>
							</td>
							<td class="px-6 py-4">
								<div class="flex items-center gap-2">
									<User size={14} class="text-surface-500" />
									<div>
										<p class="text-sm text-white">{log.user?.display_name || 'Unknown'}</p>
										<p class="text-xs text-surface-500">{log.user?.email}</p>
									</div>
								</div>
							</td>
							<td class="px-6 py-4">
								<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium {actionColors[log.action] || 'bg-surface-700 text-surface-400'}">
									<Activity size={12} />
									{log.action}
								</span>
							</td>
							<td class="px-6 py-4">
								<div>
									<span class="text-sm text-white">{log.entity_type}</span>
									{#if log.entity_id}
										<p class="text-xs text-surface-500 font-mono">{log.entity_id}</p>
									{/if}
								</div>
							</td>
							<td class="px-6 py-4 text-sm text-surface-500 font-mono">
								{log.ip_address || '-'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<div class="p-12 text-center">
				<FolderOpen size={48} class="text-surface-700 mx-auto mb-4" />
				<h3 class="text-lg font-medium text-white mb-2">No logs found</h3>
				<p class="text-surface-400 text-sm">Try adjusting your search or filters.</p>
			</div>
		{/if}
	</div>
</div>

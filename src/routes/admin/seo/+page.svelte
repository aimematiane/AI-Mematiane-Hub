<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { BarChart3, AlertCircle, Check, Edit, ExternalLink } from '@lucide/svelte';

	let { data } = $props();

	let activeTab = $state('posts');
	let searchQuery = $state('');

	const tabs = [
		{ id: 'posts', label: 'Blog Posts', data: data.content.posts },
		{ id: 'news', label: 'News', data: data.content.news },
		{ id: 'tools', label: 'AI Tools', data: data.content.tools },
		{ id: 'pages', label: 'Pages', data: data.content.pages }
	];

	const currentTab = $derived(tabs.find(t => t.id === activeTab));

	const filteredItems = $derived(() => {
		if (!currentTab()) return [];
		return currentTab().data.filter(item => {
			return !searchQuery || item.title?.toLowerCase().includes(searchQuery.toLowerCase());
		});
	});

	function checkSeoStatus(item) {
		const issues = [];
		if (!item.meta_title) issues.push('Missing meta title');
		else if (item.meta_title.length > 60) issues.push('Meta title too long');
		if (!item.meta_description) issues.push('Missing meta description');
		else if (item.meta_description.length > 160) issues.push('Meta description too long');
		return issues;
	}

	function getSeoScore(item) {
		const issues = checkSeoStatus(item);
		if (issues.length === 0) return { score: 100, color: 'emerald' };
		if (issues.length === 1) return { score: 70, color: 'amber' };
		return { score: 40, color: 'rose' };
	}
</script>

<SeoHead title="SEO Management" noindex={true} />

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-white flex items-center gap-3">
			<BarChart3 size={24} class="text-accent-400" />
			SEO Management
		</h1>
		<p class="text-surface-400 mt-1">Review and optimize meta data for all content</p>
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
		{#each tabs as tab}
			{@const missing = tab.data.filter(item => !item.meta_title || !item.meta_description).length}
			<button
				onclick={() => activeTab = tab.id}
				class="p-4 rounded-xl border transition-all {activeTab === tab.id ? 'bg-surface-800 border-surface-600' : 'bg-surface-900 border-surface-800 hover:border-surface-700'}"
			>
				<p class="text-sm text-surface-400">{tab.label}</p>
				<p class="text-2xl font-bold text-white mt-1">{tab.data.length}</p>
				{#if missing > 0}
					<p class="text-xs text-amber-400 mt-1">{missing} need SEO</p>
				{:else}
					<p class="text-xs text-emerald-400 mt-1">All optimized</p>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Tabs & Search -->
	<div class="flex flex-col sm:flex-row gap-4 mb-6">
		<div class="flex gap-2 flex-wrap">
			{#each tabs as tab}
				<button
					onclick={() => activeTab = tab.id}
					class="px-4 py-2 rounded-xl text-sm font-medium transition-all {activeTab === tab.id ? 'bg-accent-500 text-white' : 'bg-surface-900 text-surface-400 hover:text-white'}"
				>
					{tab.label}
				</button>
			{/each}
		</div>
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search..."
			class="flex-1 px-4 py-2 rounded-xl bg-surface-900 border border-surface-800 text-white placeholder-surface-500 text-sm"
		/>
	</div>

	<!-- Content Table -->
	<div class="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
		{#if filteredItems().length > 0}
			<table class="w-full">
				<thead class="bg-surface-800">
					<tr>
						<th class="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase">Title</th>
						<th class="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase">Meta Title</th>
						<th class="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase">Meta Description</th>
						<th class="text-center px-6 py-3 text-xs font-medium text-surface-400 uppercase">Score</th>
						<th class="text-right px-6 py-3 text-xs font-medium text-surface-400 uppercase">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-800">
					{#each filteredItems() as item}
						{@const seo = getSeoScore(item)}
						<tr class="hover:bg-surface-800/50">
							<td class="px-6 py-4">
								<div>
									<a href="/admin/{activeTab}/{item.id}" class="font-medium text-white hover:text-accent-400">{item.title || item.name}</a>
									<p class="text-xs text-surface-500">/{item.slug}</p>
								</div>
							</td>
							<td class="px-6 py-4">
								{#if item.meta_title}
									<span class="text-sm text-surface-300">{item.meta_title}</span>
									<span class="text-xs text-surface-500 ml-2">({item.meta_title.length})</span>
								{:else}
									<span class="text-sm text-surface-500 italic">Not set</span>
								{/if}
							</td>
							<td class="px-6 py-4">
								{#if item.meta_description}
									<span class="text-sm text-surface-300 line-clamp-2">{item.meta_description}</span>
									<span class="text-xs text-surface-500 ml-1">({item.meta_description.length})</span>
								{:else}
									<span class="text-sm text-surface-500 italic">Not set</span>
								{/if}
							</td>
							<td class="px-6 py-4 text-center">
								<span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-{seo.color}-500/20 text-{seo.color}-400 font-bold">
									{seo.score}
								</span>
							</td>
							<td class="px-6 py-4">
								<div class="flex items-center justify-end gap-2">
									<a href="/admin/{activeTab}/{item.id}" class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white">
										<Edit size={16} />
									</a>
									<a href="/{activeTab === 'tools' ? 'ai-tools' : activeTab}/{item.slug}" target="_blank" class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white">
										<ExternalLink size={16} />
									</a>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<div class="p-12 text-center">
				<BarChart3 size={48} class="text-surface-700 mx-auto mb-4" />
				<p class="text-surface-400">No content found</p>
			</div>
		{/if}
	</div>
</div>

<script>
	import { invalidateAll } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { BarChart3, AlertCircle, Check, Edit, ExternalLink, X, Save } from '@lucide/svelte';
	import { submitAction } from '$lib/utils/adminFetch.js';

	let { data } = $props();

	let activeTab = $state('posts');
	let searchQuery = $state('');
	let editingItem = $state(null);
	let editForm = $state({ meta_title: '', meta_description: '' });
	let saving = $state(false);
	let message = $state('');

	const tabs = $derived([
		{ id: 'posts', label: 'Blog Posts', data: data.content.posts, editPath: '/admin/posts', publicPath: '/blog' },
		{ id: 'news', label: 'News', data: data.content.news, editPath: '/admin/news', publicPath: '/news' },
		{ id: 'tools', label: 'AI Tools', data: data.content.tools, editPath: '/admin/ai-tools', publicPath: '/ai-tools', nameField: 'name' },
		{ id: 'pages', label: 'Pages', data: data.content.pages, editPath: '/admin/pages', publicPath: '/pages' }
	]);

	const currentTab = $derived(tabs.find(t => t.id === activeTab));

	const filteredItems = $derived.by(() => {
		if (!currentTab) return [];
		return currentTab.data.filter(item => {
			const title = item.title || item.name || '';
			return !searchQuery || title.toLowerCase().includes(searchQuery.toLowerCase());
		});
	});

	function itemTitle(item) {
		return item.title || item.name || 'Untitled';
	}

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

	function openEdit(item) {
		editingItem = item;
		editForm = {
			meta_title: item.meta_title || '',
			meta_description: item.meta_description || ''
		};
	}

	async function saveMeta() {
		if (!editingItem) return;
		saving = true;
		message = '';
		try {
			const formData = new FormData();
			formData.append('type', activeTab);
			formData.append('id', editingItem.id);
			formData.append('meta_title', editForm.meta_title);
			formData.append('meta_description', editForm.meta_description);
			await submitAction('updateMeta', formData, '/admin/seo');
			editingItem = null;
			message = 'SEO metadata saved.';
			await invalidateAll();
		} catch (err) {
			message = err.message || 'Failed to save SEO data.';
		}
		saving = false;
	}

	function publicUrl(item) {
		const base = currentTab?.publicPath || '';
		return `${base}/${item.slug}`;
	}
</script>

<SeoHead title="SEO Management" noindex={true} />

<div class="p-6 lg:p-8">
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-white flex items-center gap-3">
			<BarChart3 size={24} class="text-accent-400" />
			SEO Management
		</h1>
		<p class="text-surface-400 mt-1">Edit meta titles and descriptions for all content</p>
	</div>

	{#if message}
		<div class="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
			<Check size={16} /> {message}
		</div>
	{/if}

	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
		{#each tabs as tab}
			{@const missing = tab.data.filter(item => !item.meta_title || !item.meta_description).length}
			<button type="button" onclick={() => activeTab = tab.id} class="p-4 rounded-xl border text-left transition-all {activeTab === tab.id ? 'bg-surface-800 border-surface-600' : 'bg-surface-900 border-surface-800 hover:border-surface-700'}">
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

	<div class="flex flex-col sm:flex-row gap-4 mb-6">
		<div class="flex gap-2 flex-wrap">
			{#each tabs as tab}
				<button type="button" onclick={() => activeTab = tab.id} class="px-4 py-2 rounded-xl text-sm font-medium {activeTab === tab.id ? 'bg-accent-500 text-white' : 'bg-surface-900 text-surface-400 hover:text-white'}">
					{tab.label}
				</button>
			{/each}
		</div>
		<input type="text" bind:value={searchQuery} placeholder="Search..." class="flex-1 px-4 py-2 rounded-xl bg-surface-900 border border-surface-800 text-white text-sm" />
	</div>

	<div class="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
		{#if filteredItems.length > 0}
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
					{#each filteredItems as item}
						{@const seo = getSeoScore(item)}
						<tr class="hover:bg-surface-800/50">
							<td class="px-6 py-4">
								<p class="font-medium text-white">{itemTitle(item)}</p>
								<p class="text-xs text-surface-500">{publicUrl(item)}</p>
							</td>
							<td class="px-6 py-4 text-sm text-surface-300">{item.meta_title || '—'}</td>
							<td class="px-6 py-4 text-sm text-surface-300 line-clamp-2">{item.meta_description || '—'}</td>
							<td class="px-6 py-4 text-center">
								<span class="inline-flex w-10 h-10 items-center justify-center rounded-full font-bold
									{seo.score >= 100 ? 'text-emerald-400 bg-emerald-500/20' : seo.score >= 70 ? 'text-amber-400 bg-amber-500/20' : 'text-rose-400 bg-rose-500/20'}">
									{seo.score}
								</span>
							</td>
							<td class="px-6 py-4">
								<div class="flex items-center justify-end gap-2">
									<button type="button" onclick={() => openEdit(item)} class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white" aria-label="Edit SEO">
										<Edit size={16} />
									</button>
									<a href={publicUrl(item)} target="_blank" class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white">
										<ExternalLink size={16} />
									</a>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<div class="p-12 text-center text-surface-400">No content found</div>
		{/if}
	</div>
</div>

{#if editingItem}
	<div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" role="presentation" onclick={(e) => { if (e.target === e.currentTarget) editingItem = null; }}>
		<div class="bg-surface-900 border border-surface-700 rounded-2xl p-6 w-full max-w-lg" role="dialog" aria-modal="true">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold text-white">Edit SEO — {itemTitle(editingItem)}</h3>
				<button type="button" onclick={() => editingItem = null} class="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400"><X size={18} /></button>
			</div>
			<div class="space-y-4">
				<div>
					<label for="seo-meta-title" class="block text-sm text-surface-300 mb-1">Meta Title <span class="text-surface-500">({editForm.meta_title.length}/60)</span></label>
					<input id="seo-meta-title" type="text" bind:value={editForm.meta_title} maxlength="120" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
				<div>
					<label for="seo-meta-desc" class="block text-sm text-surface-300 mb-1">Meta Description <span class="text-surface-500">({editForm.meta_description.length}/160)</span></label>
					<textarea id="seo-meta-desc" bind:value={editForm.meta_description} rows="4" maxlength="320" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm resize-none"></textarea>
				</div>
			</div>
			<div class="flex justify-end gap-3 mt-6">
				<button type="button" onclick={() => editingItem = null} class="px-4 py-2 rounded-xl bg-surface-800 text-surface-300 text-sm">Cancel</button>
				<button type="button" onclick={saveMeta} disabled={saving} class="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white text-sm">
					<Save size={16} /> {saving ? 'Saving...' : 'Save SEO'}
				</button>
			</div>
		</div>
	</div>
{/if}

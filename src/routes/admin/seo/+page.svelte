<script>
	import { invalidateAll } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { SITE_URL } from '$lib/config/site.js';
	import { BarChart3, Check, Edit, ExternalLink, X, Save, AlertTriangle, Image, Link, Search, ShieldCheck, ListChecks } from '@lucide/svelte';
	import { submitAction } from '$lib/utils/adminFetch.js';

	let { data } = $props();

	let activeTab = $state('posts');
	let searchQuery = $state('');
	let detailItem = $state(null);
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

	const selectedItem = $derived(detailItem || filteredItems[0] || null);

	function itemTitle(item) {
		return item.title || item.name || 'Untitled';
	}

	function selectTab(tabId) {
		activeTab = tabId;
		detailItem = null;
		searchQuery = '';
	}

	function metaTitle(item) {
		return item?.meta_title || itemTitle(item);
	}

	function metaDescription(item) {
		return item?.meta_description || '';
	}

	function imageUrl(item) {
		return item?.cover_image_url || item?.image_url || '';
	}

	function isIndexable(item) {
		if (!item) return false;
		return activeTab === 'tools' || item.is_published === true;
	}

	function isInSitemap(item) {
		return isIndexable(item);
	}

	function canonicalUrl(item) {
		return `${SITE_URL}${publicUrl(item)}`;
	}

	function checklist(item) {
		if (!item) return [];
		const title = metaTitle(item);
		const description = metaDescription(item);
		const image = imageUrl(item);
		return [
			{
				label: isIndexable(item) ? 'Indexable' : 'Noindex / unpublished',
				ok: isIndexable(item),
				help: isIndexable(item) ? 'Public pages can be crawled.' : 'Publish this item before expecting search traffic.'
			},
			{
				label: isInSitemap(item) ? 'In sitemap' : 'Missing from sitemap',
				ok: isInSitemap(item),
				help: isInSitemap(item) ? 'This URL is included in sitemap.xml.' : 'Unpublished content is excluded from sitemap.xml.'
			},
			{
				label: `Title length ${title.length}/60`,
				ok: title.length > 0 && title.length <= 60,
				help: title.length ? 'Recommended maximum is 60 characters.' : 'Add a title.'
			},
			{
				label: `Description length ${description.length}/160`,
				ok: description.length >= 70 && description.length <= 160,
				help: description.length ? 'Aim for 70 to 160 characters.' : 'Add a meta description.'
			},
			{
				label: image ? 'Open Graph image set' : 'Missing OG image',
				ok: !!image,
				help: image ? 'Shares can use a rich preview image.' : 'Add a cover/image for stronger social previews.'
			},
			{
				label: 'Canonical URL ready',
				ok: !!item.slug,
				help: canonicalUrl(item)
			}
		];
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
		const checks = checklist(item);
		const passed = checks.filter(check => check.ok).length;
		const score = checks.length ? Math.round((passed / checks.length) * 100) : 0;
		if (score >= 85) return { score, color: 'emerald' };
		if (score >= 60) return { score, color: 'amber' };
		return { score, color: 'rose' };
	}

	function openEdit(item) {
		detailItem = item;
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
			<button type="button" onclick={() => selectTab(tab.id)} class="p-4 rounded-xl border text-left transition-all {activeTab === tab.id ? 'bg-surface-800 border-surface-600' : 'bg-surface-900 border-surface-800 hover:border-surface-700'}">
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
				<button type="button" onclick={() => selectTab(tab.id)} class="px-4 py-2 rounded-xl text-sm font-medium {activeTab === tab.id ? 'bg-accent-500 text-white' : 'bg-surface-900 text-surface-400 hover:text-white'}">
					{tab.label}
				</button>
			{/each}
		</div>
		<input type="text" bind:value={searchQuery} placeholder="Search..." class="flex-1 px-4 py-2 rounded-xl bg-surface-900 border border-surface-800 text-white text-sm" />
	</div>

	<div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
		<div class="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
			{#if filteredItems.length > 0}
			<div class="overflow-x-auto">
			<table class="w-full min-w-[820px]">
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
						<tr class="hover:bg-surface-800/50 {selectedItem?.id === item.id ? 'bg-surface-800/70' : ''}">
							<td class="px-6 py-4">
								<p class="font-medium text-white">{itemTitle(item)}</p>
								<p class="text-xs text-surface-500">{publicUrl(item)}</p>
							</td>
							<td class="px-6 py-4 text-sm text-surface-300">{metaTitle(item) || '—'}</td>
							<td class="px-6 py-4 text-sm text-surface-300 line-clamp-2">{item.meta_description || '—'}</td>
							<td class="px-6 py-4 text-center">
								<span class="inline-flex w-10 h-10 items-center justify-center rounded-full font-bold
									{seo.score >= 100 ? 'text-emerald-400 bg-emerald-500/20' : seo.score >= 70 ? 'text-amber-400 bg-amber-500/20' : 'text-rose-400 bg-rose-500/20'}">
									{seo.score}
								</span>
							</td>
							<td class="px-6 py-4">
								<div class="flex items-center justify-end gap-2">
									<button type="button" onclick={() => detailItem = item} class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white" aria-label="View SEO checklist">
										<ListChecks size={16} />
									</button>
									<button type="button" onclick={() => openEdit(item)} class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white" aria-label="Edit SEO">
										<Edit size={16} />
									</button>
									<a href={publicUrl(item)} target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white" aria-label="Open public page">
										<ExternalLink size={16} />
									</a>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			</div>
			{:else}
				<div class="p-12 text-center text-surface-400">No content found</div>
			{/if}
		</div>

		<aside class="bg-surface-900 border border-surface-800 rounded-2xl p-5 xl:sticky xl:top-6">
			{#if selectedItem}
				{@const checks = checklist(selectedItem)}
				{@const seo = getSeoScore(selectedItem)}
				<div class="flex items-start justify-between gap-4 mb-5">
					<div class="min-w-0">
						<p class="text-xs uppercase tracking-wide text-surface-500 mb-1">SEO checklist</p>
						<h2 class="text-lg font-semibold text-white truncate">{itemTitle(selectedItem)}</h2>
						<p class="text-xs text-surface-500 truncate">{publicUrl(selectedItem)}</p>
					</div>
					<span class="inline-flex w-12 h-12 shrink-0 items-center justify-center rounded-full font-bold
						{seo.score >= 85 ? 'text-emerald-400 bg-emerald-500/20' : seo.score >= 60 ? 'text-amber-400 bg-amber-500/20' : 'text-rose-400 bg-rose-500/20'}">
						{seo.score}
					</span>
				</div>

				<div class="space-y-3 mb-6">
					{#each checks as check}
						<div class="flex items-start gap-3 rounded-xl border {check.ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'} p-3">
							<span class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full {check.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}">
								{#if check.ok}
									<Check size={13} />
								{:else}
									<AlertTriangle size={13} />
								{/if}
							</span>
							<div class="min-w-0">
								<p class="text-sm font-medium {check.ok ? 'text-emerald-300' : 'text-amber-300'}">{check.label}</p>
								<p class="text-xs text-surface-500 break-words">{check.help}</p>
							</div>
						</div>
					{/each}
				</div>

				<div class="space-y-4">
					<div>
						<div class="flex items-center gap-2 text-sm font-medium text-white mb-2">
							<Link size={15} class="text-accent-400" />
							Canonical URL
						</div>
						<a href={publicUrl(selectedItem)} target="_blank" rel="noopener noreferrer" class="block rounded-xl bg-surface-950 border border-surface-800 px-3 py-2 text-xs text-accent-300 break-all hover:text-accent-200">
							{canonicalUrl(selectedItem)}
						</a>
					</div>

					<div>
						<div class="flex items-center gap-2 text-sm font-medium text-white mb-2">
							<Image size={15} class="text-accent-400" />
							Open Graph image
						</div>
						{#if imageUrl(selectedItem)}
							<div class="aspect-[16/9] overflow-hidden rounded-xl border border-surface-800 bg-surface-950">
								<img src={imageUrl(selectedItem)} alt="" class="h-full w-full object-cover" loading="lazy" />
							</div>
						{:else}
							<div class="rounded-xl border border-dashed border-surface-700 bg-surface-950 px-4 py-6 text-center text-sm text-surface-500">
								No image configured
							</div>
						{/if}
					</div>

					<div>
						<div class="flex items-center gap-2 text-sm font-medium text-white mb-2">
							<Search size={15} class="text-accent-400" />
							Google snippet preview
						</div>
						<div class="rounded-xl bg-white px-4 py-3 text-left">
							<p class="text-xs text-[#202124] truncate">{canonicalUrl(selectedItem)}</p>
							<p class="text-lg leading-snug text-[#1a0dab] truncate">{metaTitle(selectedItem)}</p>
							<p class="text-sm leading-relaxed text-[#4d5156] line-clamp-3">
								{metaDescription(selectedItem) || 'Add a meta description to control this preview text.'}
							</p>
						</div>
					</div>

					<div class="flex gap-2">
						<button type="button" onclick={() => openEdit(selectedItem)} class="flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm">
							<Edit size={15} />
							Edit SEO
						</button>
						<a href={publicUrl(selectedItem)} target="_blank" rel="noopener noreferrer" class="flex items-center justify-center px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-200">
							<ExternalLink size={15} />
						</a>
					</div>
				</div>
			{:else}
				<div class="py-12 text-center text-surface-500">
					<ShieldCheck size={32} class="mx-auto mb-3 text-surface-600" />
					<p class="text-sm">Select content to review its SEO checklist.</p>
				</div>
			{/if}
		</aside>
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

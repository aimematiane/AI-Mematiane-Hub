<script>
	import { invalidateAll } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { Navigation, ExternalLink, Eye, EyeOff, FileText, Info } from '@lucide/svelte';
	import { submitAction } from '$lib/utils/adminFetch.js';

	let { data } = $props();

	let pages = $state([]);
	let message = $state('');
	let savingId = $state(null);

	$effect(() => {
		pages = structuredClone(data.pages || []);
	});

	async function togglePageMenu(page) {
		savingId = page.id;
		message = '';
		const next = !page.show_in_menu;
		try {
			const formData = new FormData();
			formData.append('id', page.id);
			formData.append('show_in_menu', String(next));
			await submitAction('togglePageMenu', formData, '/admin/navigation');
			pages = pages.map(p => p.id === page.id ? { ...p, show_in_menu: next } : p);
			message = next ? `"${page.title}" added to navigation.` : `"${page.title}" removed from navigation.`;
			await invalidateAll();
		} catch (err) {
			message = err.message || 'Failed to update navigation.';
		}
		savingId = null;
	}
</script>

<SeoHead title="Navigation Management" noindex={true} />

<div class="p-6 lg:p-8 max-w-5xl">
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-white flex items-center gap-3">
			<Navigation size={24} class="text-accent-400" />
			Navigation
		</h1>
		<p class="text-surface-400 mt-1">Control what appears in the site header menu</p>
	</div>

	<div class="mb-6 p-4 rounded-xl bg-accent-500/10 border border-accent-500/20 flex gap-3 text-sm text-accent-200">
		<Info size={18} class="shrink-0 mt-0.5" />
		<p>Core links (AI Showcase, News, Blog) are always visible. Toggle CMS pages below to add them to the menu. Edit page content under <a href="/admin/pages" class="underline hover:text-white">Pages</a>.</p>
	</div>

	{#if message}
		<div class="mb-6 p-3 rounded-xl bg-surface-800 border border-surface-700 text-sm text-surface-200">{message}</div>
	{/if}

	<section class="mb-8">
		<h2 class="text-lg font-semibold text-white mb-4">Core Links (always shown)</h2>
		<div class="space-y-2">
			{#each data.staticLinks as link}
				<div class="flex items-center justify-between p-4 rounded-xl bg-surface-900 border border-surface-800">
					<div>
						<p class="font-medium text-white">{link.label}</p>
						<p class="text-xs text-surface-500">{link.description}</p>
					</div>
					<div class="flex items-center gap-3">
						<code class="text-xs text-surface-400 bg-surface-950 px-2 py-1 rounded">{link.href}</code>
						<a href={link.href} target="_blank" class="p-2 rounded-lg hover:bg-surface-800 text-surface-400"><ExternalLink size={16} /></a>
						<span class="text-xs text-emerald-400 font-medium px-2 py-1 rounded bg-emerald-500/10">Fixed</span>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section>
		<h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
			<FileText size={18} />
			CMS Pages in Menu
		</h2>

		{#if pages.length > 0}
			<div class="space-y-2">
				{#each pages as page}
					<div class="flex items-center justify-between p-4 rounded-xl bg-surface-900 border border-surface-800 {page.show_in_menu ? 'border-accent-500/30' : ''}">
						<div class="min-w-0">
							<p class="font-medium text-white truncate">{page.title}</p>
							<p class="text-xs text-surface-500">/pages/{page.slug} · {page.is_published ? 'Published' : 'Draft'}</p>
						</div>
						<div class="flex items-center gap-2 shrink-0">
							<a href="/pages/{page.slug}" target="_blank" class="p-2 rounded-lg hover:bg-surface-800 text-surface-400"><ExternalLink size={16} /></a>
							<a href="/admin/pages/{page.id}" class="text-xs text-accent-400 hover:text-accent-300 px-2">Edit</a>
							<button
								type="button"
								disabled={savingId === page.id || !page.is_published}
								onclick={() => togglePageMenu(page)}
								class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 {page.show_in_menu ? 'bg-accent-500/20 text-accent-300' : 'bg-surface-800 text-surface-400 hover:text-white'}"
								title={page.is_published ? '' : 'Publish the page first'}
							>
								{#if page.show_in_menu}<Eye size={14} />{:else}<EyeOff size={14} />{/if}
								{page.show_in_menu ? 'In menu' : 'Hidden'}
							</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-surface-500 text-sm">No pages yet. <a href="/admin/pages" class="text-accent-400 hover:underline">Create a page</a> first.</p>
		{/if}
	</section>
</div>

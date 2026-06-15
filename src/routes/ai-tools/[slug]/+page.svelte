<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import ShareButtons from '$lib/components/ShareButtons.svelte';
	import { ExternalLink, Play, Star, Bookmark, BookmarkCheck, Link } from '@lucide/svelte';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { renderMarkdown } from '$lib/utils/marked';

	let { data } = $props();
	const client = getSupabaseBrowserClient();
	let isBookmarked = $state(false);

	$effect(() => {
		if (data.tool) {
			client.auth.getUser().then(({ data: { user } }) => {
				if (user) {
					client.from('bookmarks')
						.select('id')
						.eq('user_id', user.id)
						.eq('item_type', 'ai_tool')
						.eq('item_id', data.tool.id)
						.single()
						.then(({ data: bm }) => { isBookmarked = !!bm; });
				}
			});
		}
	});

	async function toggleBookmark() {
		const { data: { user } } = await client.auth.getUser();
		if (!user) return window.location.href = '/auth/login';

		if (isBookmarked) {
			await client.from('bookmarks').delete().eq('user_id', user.id).eq('item_type', 'ai_tool').eq('item_id', data.tool.id);
		} else {
			await client.from('bookmarks').insert({ user_id: user.id, item_type: 'ai_tool', item_id: data.tool.id });
		}
		isBookmarked = !isBookmarked;
	}

	const tool = $derived(data.tool);
</script>

{#if tool}
	<SeoHead
		title={tool.name}
		description={tool.description}
		image={tool.image_url || ''}
		url="/ai-tools/{tool.slug}"
		type="website"
		tags={[tool.category, ...(tool.tags || [])]}
	/>

	<section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
		<Breadcrumbs items={[
			{ label: 'Home', href: '/' },
			{ label: 'AI Showcase', href: '/ai-tools' },
			{ label: tool.name }
		]} />

		{#if tool.image_url}
			<div class="aspect-video rounded-2xl overflow-hidden bg-surface-800 mb-8">
				<img src={tool.image_url} alt={tool.name} class="w-full h-full object-cover" />
			</div>
		{/if}

		<div class="flex items-start justify-between gap-4 mb-4">
			<h1 class="text-3xl sm:text-4xl font-bold text-white">{tool.name}</h1>
			<button onclick={toggleBookmark} class="shrink-0 p-2 rounded-lg hover:bg-surface-800 transition-colors" aria-label="Toggle bookmark">
				{#if isBookmarked}
					<BookmarkCheck size={22} class="text-accent-400" />
				{:else}
					<Bookmark size={22} class="text-surface-500" />
				{/if}
			</button>
		</div>

		<div class="flex items-center gap-3 mb-6 flex-wrap">
			<CategoryBadge category={tool.category} size="md" />
			{#if tool.is_featured}
				<span class="inline-flex items-center gap-1 text-sm text-amber-400"><Star size={14} fill="currentColor" /> Featured</span>
			{/if}
			{#if tool.tags?.length > 0}
				{#each tool.tags as tag}
					<span class="text-xs text-surface-500 bg-surface-800 px-2 py-1 rounded">{tag}</span>
				{/each}
			{/if}
		</div>

		<div class="flex items-center gap-3 mb-8 flex-wrap">
			{#if tool.website_url}
				<a href={tool.website_url} target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm transition-colors">
					<ExternalLink size={14} />
					Visit Website
				</a>
			{/if}
			{#if tool.demo_url}
				<a href={tool.demo_url} target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200 text-sm transition-colors border border-surface-700">
					<Play size={14} />
					Try Demo
				</a>
			{/if}
			{#if tool.github_url}
				<a href={tool.github_url} target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 text-sm transition-colors border border-surface-700">
					<ExternalLink size={14} />
					GitHub
				</a>
			{/if}
			{#if tool.paper_url}
				<a href={tool.paper_url} target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 text-sm transition-colors border border-surface-700">
					<ExternalLink size={14} />
					Research Paper
				</a>
			{/if}
			{#if tool.pricing}
				<span class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-800 text-surface-200 text-sm border border-surface-700">
					{tool.pricing}
				</span>
			{/if}
			<ShareButtons title={tool.name} url="/ai-tools/{tool.slug}" description={tool.description} />
		</div>

		{#if tool.long_description}
			<div class="md-content prose max-w-none text-surface-300 leading-relaxed">
				{@html renderMarkdown(tool.long_description)}
			</div>
		{:else}
			<p class="text-surface-400 leading-relaxed">{tool.description}</p>
		{/if}

		{#if tool.attachments && tool.attachments.length > 0}
			<div class="mt-10 pt-8 border-t border-surface-800">
				<h3 class="text-lg font-semibold text-white mb-6">Attachments</h3>
				<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
					{#each tool.attachments as url}
						<a href={url} target="_blank" rel="noopener noreferrer" class="group relative aspect-square rounded-lg overflow-hidden bg-surface-800 hover:bg-surface-700 transition-colors border border-surface-700 hover:border-surface-600">
							<img src={url} alt="Attachment" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
							<div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
								<ExternalLink size={24} class="text-white" />
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</section>
{:else}
	<section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
		<h1 class="text-2xl font-bold text-white mb-2">Tool Not Found</h1>
		<p class="text-surface-400">The AI tool you're looking for doesn't exist.</p>
	</section>
{/if}

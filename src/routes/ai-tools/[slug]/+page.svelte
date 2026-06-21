<script>
	import { goto } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import ShareButtons from '$lib/components/ShareButtons.svelte';
	import CommentsSection from '$lib/components/CommentsSection.svelte';
	import { ExternalLink, Play, Star, Bookmark, BookmarkCheck, Heart } from '@lucide/svelte';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { renderMarkdown } from '$lib/utils/marked';
	import { optimizeImageUrl } from '$lib/utils/image';
	import { absoluteUrl, resolveMetaTitle, resolveMetaDescription } from '$lib/config/site.js';

	let { data } = $props();
	const client = getSupabaseBrowserClient();
	let isBookmarked = $state(false);
	let upvotesCount = $state(0);
	let isUpvoted = $state(false);

	$effect(() => {
		if (data.tool) {
			client.auth.getUser().then(({ data: { user } }) => {
				if (user) {
					// Check bookmark
					client.from('bookmarks')
						.select('id')
						.eq('user_id', user.id)
						.eq('item_type', 'ai_tool')
						.eq('item_id', data.tool.id)
						.maybeSingle()
						.then(({ data: bm }) => { isBookmarked = !!bm; });

					// Check if user already upvoted
					client.from('upvotes')
						.select('id')
						.eq('user_id', user.id)
						.eq('item_type', 'ai_tool')
						.eq('item_id', data.tool.id)
						.maybeSingle()
						.then(({ data: uv }) => { isUpvoted = !!uv; });
				}
			});

			// Get total upvote count
			client.from('upvotes')
				.select('id', { count: 'exact', head: true })
				.eq('item_type', 'ai_tool')
				.eq('item_id', data.tool.id)
				.then(({ count }) => { upvotesCount = count || 0; });
		}
	});

	async function toggleBookmark() {
		const { data: { user } } = await client.auth.getUser();
		if (!user) return goto('/auth/login');

		if (isBookmarked) {
			await client.from('bookmarks').delete().eq('user_id', user.id).eq('item_type', 'ai_tool').eq('item_id', data.tool.id);
		} else {
			await client.from('bookmarks').insert({ user_id: user.id, item_type: 'ai_tool', item_id: data.tool.id });
		}
		isBookmarked = !isBookmarked;
	}

	async function toggleUpvote() {
		const { data: { user } } = await client.auth.getUser();
		if (!user) return goto('/auth/login');

		if (isUpvoted) {
			await client.from('upvotes').delete().eq('user_id', user.id).eq('item_type', 'ai_tool').eq('item_id', data.tool.id);
			upvotesCount = Math.max(0, upvotesCount - 1);
		} else {
			await client.from('upvotes').insert({ user_id: user.id, item_type: 'ai_tool', item_id: data.tool.id });
			upvotesCount += 1;
		}
		isUpvoted = !isUpvoted;
	}

	const tool = $derived(data.tool);

	const toolSchema = $derived(tool ? JSON.stringify({
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		"name": tool.name,
		"description": resolveMetaDescription(tool.meta_description, tool.description),
		"applicationCategory": tool.category,
		"url": absoluteUrl(`/ai-tools/${tool.slug}`),
		"image": tool.image_url || "",
		"offers": {
			"@type": "Offer",
			"price": "0",
			"priceCurrency": "USD",
			"description": tool.pricing || "Contact for pricing"
		}
	}) : null);
</script>

{#if tool}
	<SeoHead
		title={resolveMetaTitle(tool.meta_title, tool.name)}
		description={resolveMetaDescription(tool.meta_description, tool.description)}
		image={tool.image_url || ''}
		url={`/ai-tools/${tool.slug}`}
		type="website"
		tags={[tool.category, ...(tool.tags || [])]}
		customSchema={toolSchema}
		preloadImage={tool.image_url || ''}
	/>

	<section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
			<Breadcrumbs items={[
				{ label: 'Home', href: '/' },
				{ label: 'AI Showcase', href: '/ai-tools' },
				{ label: tool.name }
			]} />

			<div class="flex items-center gap-2 flex-wrap sm:justify-end">
				<CategoryBadge category={tool.category} size="sm" />
				{#if tool.is_featured}
					<span class="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
						<Star size={12} fill="currentColor" />
						Featured
					</span>
				{/if}
				{#if tool.pricing}
					<span class="text-xs text-surface-300 bg-surface-800 border border-surface-700 px-2.5 py-1 rounded-full">
						{tool.pricing}
					</span>
				{/if}
			</div>
		</div>

		<h1 class="text-3xl sm:text-4xl font-bold text-white mb-6">{tool.name}</h1>

		{#if tool.image_url}
			<div class="aspect-video rounded-2xl overflow-hidden bg-surface-800 mb-8">
				<img
					src={optimizeImageUrl(tool.image_url, { width: 1200, quality: 85 })}
					srcset="{optimizeImageUrl(tool.image_url, { width: 400, quality: 85 })} 400w, {optimizeImageUrl(tool.image_url, { width: 800, quality: 85 })} 800w, {optimizeImageUrl(tool.image_url, { width: 1200, quality: 85 })} 1200w"
					sizes="(max-width: 768px) 100vw, 800px"
					alt={tool.name}
					class="w-full h-full object-cover"
					loading="eager"
					fetchpriority="high"
					width="1200"
					height="675"
				/>
			</div>
		{/if}

		{#if tool.long_description}
			<div class="md-content prose max-w-none text-surface-300 leading-relaxed">
				{@html renderMarkdown(tool.long_description)}
			</div>
		{:else}
			<p class="text-surface-400 leading-relaxed">{tool.description}</p>
		{/if}

		<div class="flex items-center gap-3 mt-8 flex-wrap">
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
		</div>

		{#if tool.attachments && tool.attachments.length > 0}
			<div class="mt-10 pt-8 border-t border-surface-800">
				<h3 class="text-lg font-semibold text-white mb-6">Attachments</h3>
				<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
					{#each tool.attachments as url}
						<a href={url} target="_blank" rel="noopener noreferrer" class="group relative aspect-square rounded-lg overflow-hidden bg-surface-800 hover:bg-surface-700 transition-colors border border-surface-700 hover:border-surface-600">
							<img src={optimizeImageUrl(url, { width: 600, quality: 80 })} alt="Attachment" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
							<div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
								<ExternalLink size={24} class="text-white" />
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Action Buttons: Like, Bookmark, Share -->
		<div class="mt-8 pt-8 border-t border-surface-800">
			<div class="flex items-center gap-3 flex-wrap">
				<button onclick={toggleUpvote} class="flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all duration-300 {isUpvoted ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400' : 'bg-surface-800 border border-surface-700 text-surface-400 hover:text-rose-400 hover:border-rose-500/30'}" aria-label="Toggle upvote">
					<Heart size={18} fill={isUpvoted ? 'currentColor' : 'none'} class="transition-transform {isUpvoted ? 'scale-110' : ''}" />
					<span class="text-sm font-medium">{upvotesCount}</span>
				</button>
				<button onclick={toggleBookmark} class="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-surface-700 text-surface-400 hover:text-accent-400 hover:border-accent-400/30 transition-all {isBookmarked ? 'bg-accent-500/15 border border-accent-500/30 text-accent-400' : 'bg-surface-800'}" aria-label="Toggle bookmark">
					{#if isBookmarked}
						<BookmarkCheck size={18} />
						<span class="text-sm font-medium">Saved</span>
					{:else}
						<Bookmark size={18} />
						<span class="text-sm font-medium">Save</span>
					{/if}
				</button>
				<div class="ml-auto">
					<ShareButtons title={tool.name} url={`/ai-tools/${tool.slug}`} description={tool.description} />
				</div>
			</div>
		</div>

		<!-- Reviews & Comments Section -->
		<CommentsSection itemId={tool.id} itemType="ai_tool" />
	</section>
{:else}
	<section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
		<h1 class="text-2xl font-bold text-white mb-2">Tool Not Found</h1>
		<p class="text-surface-400">The AI tool you're looking for doesn't exist.</p>
	</section>
{/if}

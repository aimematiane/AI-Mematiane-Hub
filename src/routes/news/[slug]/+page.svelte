<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import ShareButtons from '$lib/components/ShareButtons.svelte';
	import { Clock, ExternalLink, Bookmark, BookmarkCheck, User, Link } from '@lucide/svelte';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { renderMarkdown } from '$lib/utils/marked';

	let { data } = $props();
	const client = getSupabaseBrowserClient();
	let isBookmarked = $state(false);

	const item = $derived(data.item);

	const newsSchema = $derived(item ? JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'NewsArticle',
		headline: item.title,
		description: item.excerpt,
		image: item.cover_image_url,
		datePublished: item.published_at,
		author: item.author?.display_name ? { '@type': 'Person', name: item.author.display_name } : undefined,
		publisher: { '@type': 'Organization', name: 'AI Mematiane' }
	}) : '');

	$effect(() => {
		if (item) {
			client.auth.getUser().then(({ data: { user } }) => {
				if (user) {
					client.from('bookmarks').select('id').eq('user_id', user.id).eq('item_type', 'news').eq('item_id', item.id).single()
						.then(({ data: bm }) => { isBookmarked = !!bm; });
				}
			});
		}
	});

	async function toggleBookmark() {
		const { data: { user } } = await client.auth.getUser();
		if (!user) return window.location.href = '/auth/login';
		if (isBookmarked) {
			await client.from('bookmarks').delete().eq('user_id', user.id).eq('item_type', 'news').eq('item_id', item.id);
		} else {
			await client.from('bookmarks').insert({ user_id: user.id, item_type: 'news', item_id: item.id });
		}
		isBookmarked = !isBookmarked;
	}

	function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
</script>

<svelte:head>
	{#if newsSchema}
		<script type="application/ld+json">{newsSchema}</script>
	{/if}
</svelte:head>

{#if item}
	<SeoHead
		title={item.title}
		description={item.excerpt}
		image={item.cover_image_url || ''}
		url="/news/{item.slug}"
		type="article"
		publishedTime={item.published_at}
		authorName={item.author?.display_name || ''}
		tags={[item.category, ...(item.tags || [])]}
	/>

	<article class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
		<Breadcrumbs items={[
			{ label: 'Home', href: '/' },
			{ label: 'News', href: '/news' },
			{ label: item.title }
		]} />

		<header class="mb-8">
			<div class="flex items-center gap-3 mb-4">
				<CategoryBadge category={item.category} />
				<span class="inline-flex items-center gap-1 text-sm text-surface-500">
					<Clock size={12} />
					{item.reading_time_min} min read
				</span>
				{#if item.published_at}
					<time class="text-sm text-surface-500">{formatDate(item.published_at)}</time>
				{/if}
			</div>
			<h1 class="text-3xl sm:text-4xl font-bold text-white mb-4">{item.title}</h1>
			<p class="text-lg text-surface-400 leading-relaxed">{item.excerpt}</p>
			<div class="flex items-center justify-between gap-4 mt-6 flex-wrap">
				<div class="flex items-center gap-4">
					{#if item.author}
						<div class="flex items-center gap-2">
							{#if item.author.avatar_url}
								<img src={item.author.avatar_url} alt="" class="w-8 h-8 rounded-full" />
							{:else}
								<div class="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center">
									<User size={14} class="text-surface-400" />
								</div>
							{/if}
							<span class="text-sm text-surface-300">{item.author.display_name}</span>
						</div>
					{/if}
					{#if item.source_url}
						<a href={item.source_url} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-sm text-accent-400 hover:text-accent-300">
							<ExternalLink size={12} />
							Source
						</a>
					{/if}
				</div>
				<div class="flex items-center gap-3">
					<button onclick={toggleBookmark} class="p-2 rounded-lg hover:bg-surface-800 transition-colors" aria-label="Toggle bookmark">
						{#if isBookmarked}
							<BookmarkCheck size={18} class="text-accent-400" />
						{:else}
							<Bookmark size={18} class="text-surface-500" />
						{/if}
					</button>
					<ShareButtons title={item.title} url="/news/{item.slug}" description={item.excerpt} />
				</div>
			</div>
		</header>

		{#if item.cover_image_url}
			<div class="rounded-2xl overflow-hidden mb-8">
				<img src={item.cover_image_url} alt={item.title} class="w-full object-cover max-h-96" />
			</div>
		{/if}

		<div class="md-content prose max-w-none text-surface-300 leading-relaxed">
			{@html renderMarkdown(item.content)}
		</div>

		{#if item.references_links && item.references_links.length > 0}
			<div class="mt-10 pt-8 border-t border-surface-800">
				<h3 class="text-lg font-semibold text-white mb-4">References</h3>
				<ul class="space-y-2">
					{#each item.references_links as url}
						<li>
							<a href={url} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-accent-400 hover:text-accent-300 transition-colors break-all">
								<ExternalLink size={14} class="shrink-0" />
								<span class="underline">{url}</span>
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if item.attachments && item.attachments.length > 0}
			<div class="mt-8 pt-8 border-t border-surface-800">
				<h3 class="text-lg font-semibold text-white mb-6">Attachments</h3>
				<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
					{#each item.attachments as url}
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
	</article>
{:else}
	<section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
		<h1 class="text-2xl font-bold text-white mb-2">Article Not Found</h1>
		<p class="text-surface-400">The news article you're looking for doesn't exist.</p>
	</section>
{/if}

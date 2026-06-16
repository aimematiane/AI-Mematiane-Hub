<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import { Clock, Loader2 } from '@lucide/svelte';
	import { optimizeImageUrl } from '$lib/utils/image';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';

	let { data } = $props();
	const client = getSupabaseBrowserClient();

	const categories = [
		{ value: '', label: 'All' },
		{ value: 'research', label: 'Research' },
		{ value: 'industry', label: 'Industry' },
		{ value: 'policy', label: 'Policy' },
		{ value: 'product', label: 'Product' },
		{ value: 'general', label: 'General' }
	];

	let newsItems = $state(data.newsItems);
	let page = $state(data.page);
	let loading = $state(false);
	let hasMore = $derived(page < Math.ceil(data.totalCount / data.perPage));
	let loadMoreRef = $state(null);

	$effect(() => {
		newsItems = data.newsItems;
		page = data.page;
	});

	async function loadMore() {
		if (loading || !hasMore) return;
		loading = true;
		const nextPage = page + 1;
		
		let query = client
			.from('news')
			.select('id, title, slug, excerpt, cover_image_url, category, reading_time_min, published_at')
			.eq('is_published', true)
			.order('published_at', { ascending: false })
			.range((nextPage - 1) * data.perPage, nextPage * data.perPage - 1);

		if (data.category) {
			query = query.eq('category', data.category);
		}

		const { data: newItems, error } = await query;
		
		if (!error && newItems && newItems.length > 0) {
			newsItems.push(...newItems);
			page = nextPage;
		}
		loading = false;
	}

	$effect(() => {
		if (!loadMoreRef || !hasMore) return;
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) {
				loadMore();
			}
		}, { rootMargin: '400px' });
		observer.observe(loadMoreRef);
		return () => observer.disconnect();
	});

	function formatDate(date) {
		return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<SeoHead
	title="AI News - Latest Developments in Artificial Intelligence"
	description="Stay informed with the latest AI news, research breakthroughs, industry movements, and policy updates."
	url="/news"
	tags={['AI news', 'artificial intelligence', 'machine learning news', 'AI research']}
/>

<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<Breadcrumbs items={[
		{ label: 'Home', href: '/' },
		{ label: 'News' }
	]} />

	<div class="mb-8">
		<h1 class="text-3xl sm:text-4xl font-bold text-white mb-2">AI News</h1>
		<p class="text-surface-400">Breaking developments and latest stories from the world of AI.</p>
	</div>

	<!-- Category Filters -->
	<div class="flex gap-2 flex-wrap mb-8">
		{#each categories as cat}
			<a
				href="/news?category={cat.value}&page=1"
				class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 {data.category === cat.value
					? 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/25'
					: 'bg-white/5 text-surface-400 hover:text-white hover:bg-white/10 border border-white/5'}"
			>
				{cat.label}
			</a>
		{/each}
	</div>

	<!-- News Grid -->
	{#if newsItems.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each newsItems as item, i}
				<a
					href="/news/{item.slug}"
					class="glass-card group block rounded-2xl overflow-hidden animate-fade-in-up hover:border-rose-500/20 hover:shadow-rose-500/10"
					style="animation-delay: {Math.min(i * 100, 800)}ms;"
				>
					{#if item.cover_image_url}
						<div class="aspect-video overflow-hidden bg-surface-950/40 relative">
							<img src={optimizeImageUrl(item.cover_image_url, { width: 400, quality: 80 })} alt={item.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" loading="lazy" />
							<div class="absolute inset-0 bg-gradient-to-t from-surface-950/30 to-transparent pointer-events-none"></div>
						</div>
					{:else}
						<div class="aspect-video bg-gradient-to-br from-rose-900/20 to-surface-900 flex items-center justify-center relative">
							<span class="text-3xl font-bold text-surface-700 group-hover:scale-110 transition-transform duration-500">{item.title.charAt(0)}</span>
						</div>
					{/if}
					<div class="p-5">
						<div class="flex items-center gap-2 mb-3">
							<CategoryBadge category={item.category} size="xs" />
							<span class="inline-flex items-center gap-1 text-xs text-surface-500">
								<Clock size={10} />
								{item.reading_time_min} min
							</span>
						</div>
						<h2 class="font-bold text-white group-hover:text-rose-400 transition-colors mb-2 line-clamp-2 text-lg tracking-tight">{item.title}</h2>
						<p class="text-sm text-surface-400 leading-relaxed line-clamp-2 mb-4">{item.excerpt}</p>
						{#if item.published_at}
							<time class="text-xs text-surface-500">{formatDate(item.published_at)}</time>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="text-center py-20">
			<p class="text-surface-500 text-lg">No news articles found.</p>
		</div>
	{/if}

	{#if hasMore}
		<div bind:this={loadMoreRef} class="flex flex-col items-center justify-center py-10 mt-4">
			{#if loading}
				<Loader2 size={24} class="animate-spin text-rose-500" />
			{/if}
			<!-- Fallback pagination for search bots or disabled JS -->
			<div class="sr-only focus:not-sr-only print:hidden mt-4">
				<a href="?page={page + 1}{data.category ? '&category=' + data.category : ''}" class="px-4 py-2 rounded-xl bg-surface-900 border border-surface-800 text-sm text-surface-200 hover:text-white transition-all">
					Next Page (Page {page + 1})
				</a>
			</div>
		</div>
	{/if}
</section>

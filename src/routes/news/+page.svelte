<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import { Clock, ChevronLeft, ChevronRight } from '@lucide/svelte';

	let { data } = $props();

	const categories = [
		{ value: '', label: 'All' },
		{ value: 'research', label: 'Research' },
		{ value: 'industry', label: 'Industry' },
		{ value: 'policy', label: 'Policy' },
		{ value: 'product', label: 'Product' },
		{ value: 'general', label: 'General' }
	];

	const totalPages = Math.ceil(data.totalCount / data.perPage);

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
				class="px-3 py-2 rounded-lg text-sm transition-all {data.category === cat.value
					? 'bg-rose-500 text-white'
					: 'bg-surface-800 text-surface-400 hover:text-white hover:bg-surface-700'}"
			>
				{cat.label}
			</a>
		{/each}
	</div>

	<!-- News Grid -->
	{#if data.newsItems.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.newsItems as item}
				<a href="/news/{item.slug}" class="group block rounded-2xl bg-surface-900 border border-surface-800 hover:border-rose-500/30 transition-all overflow-hidden hover:shadow-lg hover:shadow-rose-500/5">
					{#if item.cover_image_url}
						<div class="aspect-video overflow-hidden bg-surface-800">
							<img src={item.cover_image_url} alt={item.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
						</div>
					{:else}
						<div class="aspect-video bg-gradient-to-br from-rose-900/20 to-surface-900 flex items-center justify-center">
							<span class="text-3xl font-bold text-surface-700">{item.title.charAt(0)}</span>
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
						<h2 class="font-semibold text-white group-hover:text-rose-400 transition-colors mb-2 line-clamp-2">{item.title}</h2>
						<p class="text-sm text-surface-400 leading-relaxed line-clamp-2 mb-3">{item.excerpt}</p>
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

	<!-- Pagination -->
	{#if totalPages > 1}
		<div class="flex items-center justify-center gap-2 mt-10">
			{#if data.page > 1}
				<a href="/news?category={data.category}&page={data.page - 1}" class="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white transition-all">
					<ChevronLeft size={18} />
				</a>
			{/if}
			<span class="px-4 py-2 text-sm text-surface-400">Page {data.page} of {totalPages}</span>
			{#if data.page < totalPages}
				<a href="/news?category={data.category}&page={data.page + 1}" class="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white transition-all">
					<ChevronRight size={18} />
				</a>
			{/if}
		</div>
	{/if}
</section>

<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import { Search, ExternalLink, Star, ChevronLeft, ChevronRight } from '@lucide/svelte';

	let { data } = $props();

	const categories = [
		{ value: '', label: 'All' },
		{ value: 'text', label: 'Text' },
		{ value: 'image', label: 'Image' },
		{ value: 'video', label: 'Video' },
		{ value: 'audio', label: 'Audio' },
		{ value: 'code', label: 'Code' },
		{ value: 'data', label: 'Data' },
		{ value: 'other', label: 'Other' }
	];

	let activeCategory = $state(data.category);
	let searchQuery = $state(data.search);
	const totalPages = Math.ceil(data.totalCount / data.perPage);

	function updateUrl() {
		const params = new URLSearchParams();
		if (activeCategory) params.set('category', activeCategory);
		if (searchQuery) params.set('q', searchQuery);
		params.set('page', '1');
		window.location.href = `/ai-tools?${params.toString()}`;
	}
</script>

<SeoHead
	title="AI Showcase - Global Directory of AI Tools"
	description="Explore the world's most comprehensive directory of AI models and tools. Filter by category, search, and discover cutting-edge AI."
	url="/ai-tools"
	tags={['AI tools', 'AI models', 'artificial intelligence', 'machine learning']}
/>

<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<Breadcrumbs items={[
		{ label: 'Home', href: '/' },
		{ label: 'AI Showcase' }
	]} />

	<div class="mb-8">
		<h1 class="text-3xl sm:text-4xl font-bold text-white mb-2">AI Showcase</h1>
		<p class="text-surface-400">Discover and explore cutting-edge AI models and tools from around the world.</p>
	</div>

	<!-- Filters -->
	<div class="flex flex-col sm:flex-row gap-4 mb-8">
		<div class="relative flex-1">
			<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
			<input
				type="text"
				placeholder="Search AI tools..."
				bind:value={searchQuery}
				onkeydown={(e) => e.key === 'Enter' && updateUrl()}
				class="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-900 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all text-sm"
			/>
		</div>
		<div class="flex gap-2 flex-wrap">
			{#each categories as cat}
				<button
					onclick={() => { activeCategory = cat.value; updateUrl(); }}
					class="px-3 py-2 rounded-lg text-sm transition-all {activeCategory === cat.value
						? 'bg-accent-500 text-white'
						: 'bg-surface-800 text-surface-400 hover:text-white hover:bg-surface-700'}"
				>
					{cat.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Tools Grid -->
	{#if data.tools.length > 0}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.tools as tool}
				<a href="/ai-tools/{tool.slug}" class="group block rounded-2xl bg-surface-900 border border-surface-800 hover:border-accent-500/30 transition-all overflow-hidden hover:shadow-lg hover:shadow-accent-500/5">
					{#if tool.image_url}
						<div class="aspect-video overflow-hidden bg-surface-800">
							<img src={tool.image_url} alt={tool.name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
						</div>
					{:else}
						<div class="aspect-video bg-gradient-to-br from-surface-800 to-surface-900 flex items-center justify-center">
							<span class="text-3xl font-bold text-surface-700">{tool.name.charAt(0)}</span>
						</div>
					{/if}
					<div class="p-5">
						<div class="flex items-start justify-between gap-2 mb-2">
							<h3 class="font-semibold text-white group-hover:text-accent-400 transition-colors">{tool.name}</h3>
							{#if tool.is_featured}
								<Star size={14} class="text-amber-400 shrink-0 mt-1" fill="currentColor" />
							{/if}
						</div>
						<p class="text-sm text-surface-400 leading-relaxed mb-3 line-clamp-2">{tool.description}</p>
						<div class="flex items-center gap-2 flex-wrap">
							<CategoryBadge category={tool.category} size="xs" />
							{#if tool.website_url}
								<span class="inline-flex items-center gap-1 text-xs text-surface-500">
									<ExternalLink size={10} />
									Website
								</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="text-center py-20">
			<p class="text-surface-500 text-lg">No AI tools found. Try adjusting your filters.</p>
		</div>
	{/if}

	<!-- Pagination -->
	{#if totalPages > 1}
		<div class="flex items-center justify-center gap-2 mt-10">
			{#if data.page > 1}
				<a href="/ai-tools?category={data.category}&q={data.search}&page={data.page - 1}" class="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white transition-all">
					<ChevronLeft size={18} />
				</a>
			{/if}
			<span class="px-4 py-2 text-sm text-surface-400">Page {data.page} of {totalPages}</span>
			{#if data.page < totalPages}
				<a href="/ai-tools?category={data.category}&q={data.search}&page={data.page + 1}" class="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white transition-all">
					<ChevronRight size={18} />
				</a>
			{/if}
		</div>
	{/if}
</section>

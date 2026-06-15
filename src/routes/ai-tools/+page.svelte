<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import { Search, ExternalLink, Star, Loader2 } from '@lucide/svelte';
	import { optimizeImageUrl } from '$lib/utils/image';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';

	let { data } = $props();
	const client = getSupabaseBrowserClient();

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
	
	let tools = $state(data.tools);
	let page = $state(data.page);
	let loading = $state(false);
	let hasMore = $derived(page < Math.ceil(data.totalCount / data.perPage));
	let loadMoreRef = $state(null);

	$effect(() => {
		tools = data.tools;
		page = data.page;
		activeCategory = data.category;
		searchQuery = data.search;
	});

	async function loadMore() {
		if (loading || !hasMore) return;
		loading = true;
		const nextPage = page + 1;
		
		let query = client
			.from('ai_tools')
			.select('*')
			.order('is_featured', { ascending: false })
			.order('created_at', { ascending: false })
			.range((nextPage - 1) * data.perPage, nextPage * data.perPage - 1);

		if (data.category) query = query.eq('category', data.category);
		if (data.search) query = query.textSearch('name', data.search, { type: 'websearch' });

		const { data: newTools, error } = await query;
		
		if (!error && newTools && newTools.length > 0) {
			tools.push(...newTools);
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
				class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-900/40 backdrop-blur-md border border-white/10 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all text-sm"
			/>
		</div>
		<div class="flex gap-2 flex-wrap">
			{#each categories as cat}
				<button
					onclick={() => { activeCategory = cat.value; updateUrl(); }}
					class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 {activeCategory === cat.value
						? 'bg-gradient-to-r from-accent-500 to-cyan-500 text-white shadow-lg shadow-accent-500/25'
						: 'bg-white/5 text-surface-400 hover:text-white hover:bg-white/10 border border-white/5'}"
				>
					{cat.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Tools Grid -->
	{#if tools.length > 0}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each tools as tool, i}
				<a
					href="/ai-tools/{tool.slug}"
					class="glass-card group block rounded-2xl overflow-hidden animate-fade-in-up"
					style="animation-delay: {Math.min(i * 100, 800)}ms; opacity: 0;"
				>
					{#if tool.image_url}
						<div class="aspect-video overflow-hidden bg-surface-950/40 relative">
							<img src={optimizeImageUrl(tool.image_url, { width: 400, quality: 80 })} alt={tool.name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" loading="lazy" />
							<div class="absolute inset-0 bg-gradient-to-t from-surface-950/30 to-transparent pointer-events-none"></div>
						</div>
					{:else}
						<div class="aspect-video bg-gradient-to-br from-surface-900 to-surface-950 flex items-center justify-center relative">
							<span class="text-3xl font-bold text-surface-700 group-hover:scale-110 transition-transform duration-500">{tool.name.charAt(0)}</span>
						</div>
					{/if}
					<div class="p-5">
						<div class="flex items-start justify-between gap-2 mb-2">
							<h3 class="font-bold text-white group-hover:text-accent-400 transition-colors text-lg">{tool.name}</h3>
							{#if tool.is_featured}
								<Star size={14} class="text-amber-400 shrink-0 mt-1" fill="currentColor" />
							{/if}
						</div>
						<p class="text-sm text-surface-400 leading-relaxed mb-4 line-clamp-2">{tool.description}</p>
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

	{#if hasMore}
		<div bind:this={loadMoreRef} class="flex items-center justify-center py-10 mt-4">
			{#if loading}
				<Loader2 size={24} class="animate-spin text-accent-500" />
			{/if}
		</div>
	{/if}
</section>

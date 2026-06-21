<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import { Bookmark, Heart, Loader2, MessageCircle, Share2 } from '@lucide/svelte';
	import { optimizeImageUrl } from '$lib/utils/image';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';

	let { data } = $props();
	const client = getSupabaseBrowserClient();

	let posts = $state([]);
	let page = $state(1);
	let loading = $state(false);
	let loadMoreRef = $state(null);

	$effect(() => {
		posts = data.posts || [];
		page = data.page ?? 1;
	});

	let hasMore = $derived(page < Math.ceil(data.totalCount / data.perPage));

	async function loadMore() {
		if (loading || !hasMore) return;
		loading = true;
		const nextPage = page + 1;
		const { data: newPosts, error } = await client
			.from('posts')
			.select('id, title, slug, excerpt, cover_image_url, category, tags, created_at, author:profiles(display_name, avatar_url)')
			.eq('is_published', true)
			.order('published_at', { ascending: false })
			.range((nextPage - 1) * data.perPage, nextPage * data.perPage - 1);
		
		if (!error && newPosts && newPosts.length > 0) {
			const metrics = await fetchMetrics('post', newPosts.map((post) => post.id));
			posts.push(...newPosts.map((post) => ({ ...post, metrics: metrics[post.id] || emptyMetrics() })));
			page = nextPage;
		}
		loading = false;
	}

	function emptyMetrics() {
		return { upvotes: 0, bookmarks: 0, comments: 0 };
	}

	async function fetchMetrics(itemType, itemIds) {
		const { data: metrics } = await client.rpc('get_content_metrics', {
			p_item_type: itemType,
			p_item_ids: itemIds
		});
		return Object.fromEntries((metrics || []).map((row) => [row.item_id, {
			upvotes: row.upvotes_count || 0,
			bookmarks: row.bookmarks_count || 0,
			comments: row.comments_count || 0
		}]));
	}

	async function shareCard(event, post) {
		event.preventDefault();
		event.stopPropagation();
		const url = `${window.location.origin}/blog/${post.slug}`;
		if (navigator.share) {
			await navigator.share({ title: post.title, text: post.excerpt, url });
		} else {
			await navigator.clipboard?.writeText(url);
		}
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

	const canonicalUrl = $derived(data.page > 1 ? `/blog?page=${data.page}` : '/blog');
	const prevUrl = $derived(data.page > 1 ? (data.page > 2 ? `/blog?page=${data.page - 1}` : '/blog') : '');
	const nextUrl = $derived(data.page < Math.ceil(data.totalCount / data.perPage) ? `/blog?page=${data.page + 1}` : '');

	function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
</script>

<SeoHead
	title={data.page > 1 ? `Blog - Page ${data.page}` : 'Blog - Deep Dives into AI'}
	description="In-depth articles exploring AI technologies, ethics, applications, and the future of intelligent systems."
	url={canonicalUrl}
	prevUrl={prevUrl}
	nextUrl={nextUrl}
	tags={['AI blog', 'artificial intelligence articles', 'machine learning deep dives']}
/>

<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<Breadcrumbs items={[
		{ label: 'Home', href: '/' },
		{ label: 'Blog' }
	]} />

	<div class="mb-8">
		<h1 class="text-3xl sm:text-4xl font-bold text-white mb-2">Blog</h1>
		<p class="text-surface-400">Deep dives, analysis, and thought pieces on the world of AI.</p>
	</div>

	{#if posts.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
			{#each posts as post, i}
				<a
					href="/blog/{post.slug}"
					class="glass-card group block rounded-2xl overflow-hidden animate-fade-in-up hover:border-emerald-500/20 hover:shadow-emerald-500/10"
					style="animation-delay: {Math.min(i * 100, 800)}ms;"
				>
					{#if post.cover_image_url}
						<div class="aspect-video overflow-hidden bg-surface-950/40 relative">
							<img src={optimizeImageUrl(post.cover_image_url, { width: 600, quality: 80 })} alt={post.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" loading="lazy" />
							<div class="absolute inset-0 bg-gradient-to-t from-surface-950/30 to-transparent pointer-events-none"></div>
						</div>
					{:else}
						<div class="aspect-video bg-gradient-to-br from-emerald-950/20 to-surface-900 flex items-center justify-center relative">
							<span class="text-4xl font-bold text-surface-700 group-hover:scale-110 transition-transform duration-500">{post.title.charAt(0)}</span>
						</div>
					{/if}
					<div class="p-6">
						<div class="flex items-center gap-3 mb-3">
							<CategoryBadge category={post.category} size="xs" />
							{#if post.author}
								<span class="text-xs text-surface-500">{post.author.display_name}</span>
							{/if}
							{#if post.created_at}
								<time class="text-xs text-surface-500">{formatDate(post.created_at)}</time>
							{/if}
						</div>
						<h2 class="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors mb-2 tracking-tight">{post.title}</h2>
						<p class="text-sm text-surface-400 leading-relaxed line-clamp-3 mb-4">{post.excerpt}</p>
						<div class="flex items-center justify-between gap-3">
							{#if post.author}
								<div class="flex items-center gap-2">
									<UserAvatar src={post.author.avatar_url} alt="" size="xs" />
									<span class="text-xs text-surface-400">{post.author.display_name}</span>
								</div>
							{/if}
							<div class="flex items-center gap-3 text-xs text-surface-500">
								<span class="inline-flex items-center gap-1" title="Likes"><Heart size={13} />{post.metrics?.upvotes || 0}</span>
								<span class="inline-flex items-center gap-1" title="Saves"><Bookmark size={13} />{post.metrics?.bookmarks || 0}</span>
								<span class="inline-flex items-center gap-1" title="Comments"><MessageCircle size={13} />{post.metrics?.comments || 0}</span>
								<button type="button" onclick={(event) => shareCard(event, post)} class="inline-flex items-center gap-1 hover:text-accent-400 transition-colors" title="Share">
									<Share2 size={13} />
								</button>
							</div>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="text-center py-20">
			<p class="text-surface-500 text-lg">No blog posts yet.</p>
		</div>
	{/if}

	{#if hasMore}
		<div bind:this={loadMoreRef} class="flex flex-col items-center justify-center py-10 mt-4">
			{#if loading}
				<Loader2 size={24} class="animate-spin text-emerald-500" />
			{/if}
			<!-- Fallback pagination for search bots or disabled JS -->
			<div class="sr-only focus:not-sr-only print:hidden mt-4">
				<a href="?page={page + 1}" class="px-4 py-2 rounded-xl bg-surface-900 border border-surface-800 text-sm text-surface-200 hover:text-white transition-all">
					Next Page (Page {page + 1})
				</a>
			</div>
		</div>
	{/if}
</section>

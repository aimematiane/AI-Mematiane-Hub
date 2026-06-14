<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import { BookmarkX, Brain, Newspaper, BookOpen } from '@lucide/svelte';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';

	let { data } = $props();
	const client = getSupabaseBrowserClient();

	async function removeBookmark(id) {
		await client.from('bookmarks').delete().eq('id', id);
		window.location.reload();
	}

	function getItemLink(itemType, item) {
		if (itemType === 'ai_tool') return `/ai-tools/${item.slug}`;
		if (itemType === 'post') return `/blog/${item.slug}`;
		if (itemType === 'news') return `/news/${item.slug}`;
		return '#';
	}

	function getItemIcon(type) {
		if (type === 'ai_tool') return Brain;
		if (type === 'post') return BookOpen;
		return Newspaper;
	}
</script>

<SeoHead title="Bookmarks" description="Your saved articles and tools" url="/profile/bookmarks" />

<section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<Breadcrumbs items={[
		{ label: 'Home', href: '/' },
		{ label: 'Profile', href: '/profile' },
		{ label: 'Bookmarks' }
	]} />

	<h1 class="text-3xl font-bold text-white mb-2">My Bookmarks</h1>
	<p class="text-surface-400 mb-8">Articles and tools you've saved for later.</p>

	{#if data.bookmarks.length > 0}
		<div class="space-y-4">
			{#each data.bookmarks as bm}
				{@const Icon = getItemIcon(bm.item_type)}
				{@const link = getItemLink(bm.item_type, bm.item)}
				<div class="group flex items-start gap-4 p-4 rounded-xl bg-surface-900 border border-surface-800 hover:border-surface-700 transition-all">
					<div class="shrink-0 w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center">
						<Icon size={18} class="text-accent-400" />
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1">
							<span class="text-xs text-surface-500 uppercase">{bm.item_type === 'ai_tool' ? 'AI Tool' : bm.item_type === 'post' ? 'Blog Post' : 'News'}</span>
							<CategoryBadge category={bm.item.category} size="xs" />
						</div>
						<a href={link} class="text-sm font-medium text-white hover:text-accent-400 transition-colors">
							{bm.item.name || bm.item.title}
						</a>
						<p class="text-xs text-surface-400 mt-1 line-clamp-1">{bm.item.description || bm.item.excerpt}</p>
					</div>
					<button
						onclick={() => removeBookmark(bm.id)}
						class="shrink-0 p-2 rounded-lg hover:bg-red-500/10 text-surface-500 hover:text-red-400 transition-all"
						aria-label="Remove bookmark"
					>
						<BookmarkX size={16} />
					</button>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-20">
			<p class="text-surface-500 text-lg mb-2">No bookmarks yet</p>
			<p class="text-sm text-surface-600">Save articles and AI tools to find them here later.</p>
		</div>
	{/if}
</section>

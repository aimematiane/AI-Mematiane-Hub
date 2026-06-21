<script>
	import { goto } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import ShareButtons from '$lib/components/ShareButtons.svelte';
	import CommentsSection from '$lib/components/CommentsSection.svelte';
	import { Bookmark, BookmarkCheck, List, ExternalLink, Heart } from '@lucide/svelte';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { renderMarkdown } from '$lib/utils/marked';
	import { optimizeImageUrl } from '$lib/utils/image';
	import { resolveMetaTitle, resolveMetaDescription } from '$lib/config/site.js';

	let { data } = $props();
	const client = getSupabaseBrowserClient();
	let isBookmarked = $state(false);
	let tocOpen = $state(false);
	let upvotesCount = $state(0);
	let isUpvoted = $state(false);

	$effect(() => {
		if (data.post) {
			client.auth.getUser().then(({ data: { user } }) => {
				if (user) {
					client.from('bookmarks').select('id').eq('user_id', user.id).eq('item_type', 'post').eq('item_id', data.post.id).maybeSingle()
						.then(({ data: bm }) => { isBookmarked = !!bm; });

					client.from('upvotes').select('id').eq('user_id', user.id).eq('item_type', 'post').eq('item_id', data.post.id).maybeSingle()
						.then(({ data: uv }) => { isUpvoted = !!uv; });
				}
			});

			client.from('upvotes')
				.select('id', { count: 'exact', head: true })
				.eq('item_type', 'post')
				.eq('item_id', data.post.id)
				.then(({ count }) => { upvotesCount = count || 0; });
		}
	});

	async function toggleBookmark() {
		const { data: { user } } = await client.auth.getUser();
		if (!user) return goto('/auth/login');
		if (isBookmarked) {
			await client.from('bookmarks').delete().eq('user_id', user.id).eq('item_type', 'post').eq('item_id', data.post.id);
		} else {
			await client.from('bookmarks').insert({ user_id: user.id, item_type: 'post', item_id: data.post.id });
		}
		isBookmarked = !isBookmarked;
	}

	async function toggleUpvote() {
		const { data: { user } } = await client.auth.getUser();
		if (!user) return goto('/auth/login');
		if (isUpvoted) {
			await client.from('upvotes').delete().eq('user_id', user.id).eq('item_type', 'post').eq('item_id', data.post.id);
			upvotesCount = Math.max(0, upvotesCount - 1);
		} else {
			await client.from('upvotes').insert({ user_id: user.id, item_type: 'post', item_id: data.post.id });
			upvotesCount += 1;
		}
		isUpvoted = !isUpvoted;
	}

	const post = $derived(data.post);
	const headings = $derived(data.headings);
	function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }

	function addHeadingIds(html) {
		return html.replace(/<h([23])>(.*?)<\/h[23]>/g, (_, level, text) => {
			const id = text.replace(/<[^>]+>/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
			return `<h${level} id="${id}">${text}</h${level}>`;
		});
	}
</script>

{#if post}
	<SeoHead
		title={resolveMetaTitle(post.meta_title, post.title)}
		description={resolveMetaDescription(post.meta_description, post.excerpt)}
		image={post.cover_image_url || ''}
		url={`/blog/${post.slug}`}
		type="article"
		schemaType="Article"
		publishedTime={post.created_at}
		authorName={post.author?.display_name || ''}
		tags={[post.category, ...(post.tags || [])]}
		preloadImage={post.cover_image_url || ''}
	/>

	<article class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
		<Breadcrumbs items={[
			{ label: 'Home', href: '/' },
			{ label: 'Blog', href: '/blog' },
			{ label: post.title }
		]} />

		<div class="lg:grid lg:grid-cols-[1fr_260px] lg:gap-10">
			<!-- Main Content -->
			<div>
				<header class="mb-8">
					<div class="flex items-center gap-3 mb-4 flex-wrap">
						<CategoryBadge category={post.category} />
						{#if post.author}
							<span class="text-sm text-surface-500">{post.author.display_name}</span>
						{/if}
						{#if post.created_at}
							<time class="text-sm text-surface-500">{formatDate(post.created_at)}</time>
						{/if}
					</div>
					<h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">{post.title}</h1>
					<p class="text-lg text-surface-400 leading-relaxed">{post.excerpt}</p>
				</header>

				{#if post.cover_image_url}
					<div class="rounded-2xl overflow-hidden mb-8">
						<img
							src={optimizeImageUrl(post.cover_image_url, { width: 1200, quality: 85 })}
							srcset="{optimizeImageUrl(post.cover_image_url, { width: 400, quality: 85 })} 400w, {optimizeImageUrl(post.cover_image_url, { width: 800, quality: 85 })} 800w, {optimizeImageUrl(post.cover_image_url, { width: 1200, quality: 85 })} 1200w"
							sizes="(max-width: 768px) 100vw, 800px"
							alt={post.title}
							class="w-full object-cover max-h-96"
							loading="eager"
							fetchpriority="high"
							width="1200"
							height="675"
						/>
					</div>
				{/if}

				<div class="md-content prose max-w-none text-surface-300 leading-relaxed">
					{@html addHeadingIds(renderMarkdown(post.content))}
				</div>

				{#if post.references_links && post.references_links.length > 0}
					<div class="mt-10 pt-8 border-t border-surface-800">
						<h3 class="text-lg font-semibold text-white mb-4">References</h3>
						<ul class="space-y-2">
							{#each post.references_links as url}
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

				{#if post.attachments && post.attachments.length > 0}
					<div class="mt-8 pt-8 border-t border-surface-800">
						<h3 class="text-lg font-semibold text-white mb-6">Attachments</h3>
						<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
							{#each post.attachments as url}
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

				{#if post.tags?.length > 0}
					<div class="mt-8 pt-8 border-t border-surface-800">
						<h3 class="text-sm font-medium text-surface-400 mb-3">Tags</h3>
						<div class="flex gap-2 flex-wrap">
							{#each post.tags as tag}
								<span class="text-xs bg-surface-800 text-surface-400 px-2.5 py-1 rounded-lg">{tag}</span>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Action Buttons: Share, Like, Bookmark -->
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
							<ShareButtons title={post.title} url={`/blog/${post.slug}`} description={post.excerpt} />
						</div>
					</div>
				</div>

				<!-- Comments Section -->
				<CommentsSection itemId={post.id} itemType="post" />
			</div>

			<!-- Table of Contents (Desktop) -->
			{#if headings.length > 0}
				<aside class="hidden lg:block">
					<div class="sticky top-24">
						<h3 class="text-sm font-semibold text-white mb-3 flex items-center gap-2">
							<List size={14} />
							Table of Contents
						</h3>
						<nav class="space-y-1.5">
							{#each headings as h}
								<a
									href="#{h.id}"
									class="block text-sm text-surface-500 hover:text-accent-400 transition-colors {h.level === 3 ? 'pl-4' : ''}"
								>
									{h.text}
								</a>
							{/each}
						</nav>
					</div>
				</aside>

				<!-- Mobile TOC Toggle -->
				<div class="lg:hidden fixed bottom-6 right-6 z-40">
					<button
						onclick={() => tocOpen = !tocOpen}
						class="p-3 rounded-full bg-surface-800 border border-surface-700 text-surface-300 hover:text-white shadow-lg"
						aria-label="Table of contents"
					>
						<List size={20} />
					</button>
					{#if tocOpen}
						<div class="absolute bottom-14 right-0 w-64 p-4 rounded-xl bg-surface-900 border border-surface-700 shadow-xl">
							<h3 class="text-sm font-semibold text-white mb-2">Contents</h3>
							<nav class="space-y-1">
								{#each headings as h}
									<a href="#{h.id}" onclick={() => tocOpen = false} class="block text-xs text-surface-400 hover:text-accent-400 transition-colors {h.level === 3 ? 'pl-3' : ''}">
										{h.text}
									</a>
								{/each}
							</nav>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</article>
{:else}
	<section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
		<h1 class="text-2xl font-bold text-white mb-2">Post Not Found</h1>
		<p class="text-surface-400">The blog post you're looking for doesn't exist.</p>
	</section>
{/if}

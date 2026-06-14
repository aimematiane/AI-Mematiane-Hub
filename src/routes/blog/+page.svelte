<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import { Clock, User, ChevronLeft, ChevronRight } from '@lucide/svelte';

	let { data } = $props();
	const totalPages = Math.ceil(data.totalCount / data.perPage);

	function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
</script>

<SeoHead
	title="Blog - Deep Dives into AI"
	description="In-depth articles exploring AI technologies, ethics, applications, and the future of intelligent systems."
	url="/blog"
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

	{#if data.posts.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
			{#each data.posts as post}
				<a href="/blog/{post.slug}" class="group block rounded-2xl bg-surface-900 border border-surface-800 hover:border-emerald-500/30 transition-all overflow-hidden hover:shadow-lg hover:shadow-emerald-500/5">
					{#if post.cover_image_url}
						<div class="aspect-video overflow-hidden bg-surface-800">
							<img src={post.cover_image_url} alt={post.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
						</div>
					{:else}
						<div class="aspect-video bg-gradient-to-br from-emerald-900/20 to-surface-900 flex items-center justify-center">
							<span class="text-4xl font-bold text-surface-700">{post.title.charAt(0)}</span>
						</div>
					{/if}
					<div class="p-6">
						<div class="flex items-center gap-3 mb-3">
							<CategoryBadge category={post.category} size="xs" />
							<span class="inline-flex items-center gap-1 text-xs text-surface-500">
								<Clock size={10} />
								{post.reading_time_min} min read
							</span>
						</div>
						<h2 class="text-xl font-semibold text-white group-hover:text-emerald-400 transition-colors mb-2">{post.title}</h2>
						<p class="text-sm text-surface-400 leading-relaxed line-clamp-3 mb-4">{post.excerpt}</p>
						<div class="flex items-center justify-between">
							{#if post.author}
								<div class="flex items-center gap-2">
									{#if post.author.avatar_url}
										<img src={post.author.avatar_url} alt="" class="w-6 h-6 rounded-full" />
									{:else}
										<div class="w-6 h-6 rounded-full bg-surface-700 flex items-center justify-center">
											<User size={10} class="text-surface-400" />
										</div>
									{/if}
									<span class="text-xs text-surface-400">{post.author.display_name}</span>
								</div>
							{/if}
							{#if post.published_at}
								<time class="text-xs text-surface-500">{formatDate(post.published_at)}</time>
							{/if}
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

	{#if totalPages > 1}
		<div class="flex items-center justify-center gap-2 mt-10">
			{#if data.page > 1}
				<a href="/blog?page={data.page - 1}" class="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white transition-all">
					<ChevronLeft size={18} />
				</a>
			{/if}
			<span class="px-4 py-2 text-sm text-surface-400">Page {data.page} of {totalPages}</span>
			{#if data.page < totalPages}
				<a href="/blog?page={data.page + 1}" class="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white transition-all">
					<ChevronRight size={18} />
				</a>
			{/if}
		</div>
	{/if}
</section>

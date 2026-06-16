<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { Brain, Newspaper, BookOpen, Plus, Shield } from '@lucide/svelte';

	let { data } = $props();
</script>

<SeoHead title="Admin Dashboard" description="AI Mematiane admin dashboard" url="/admin" noindex={true} />

<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<div class="flex items-center gap-3 mb-8">
		<Shield size={24} class="text-amber-400" />
		<h1 class="text-3xl font-bold text-white">Admin Dashboard</h1>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
		<div class="p-6 rounded-2xl bg-surface-900 border border-surface-800">
			<div class="flex items-center justify-between mb-3">
				<Brain size={20} class="text-accent-400" />
				<a href="/admin/ai-tools" class="text-xs text-accent-400 hover:text-accent-300">Manage</a>
			</div>
			<p class="text-2xl font-bold text-white">{data.counts.tools}</p>
			<p class="text-sm text-surface-400">AI Tools</p>
		</div>
		<div class="p-6 rounded-2xl bg-surface-900 border border-surface-800">
			<div class="flex items-center justify-between mb-3">
				<Newspaper size={20} class="text-rose-400" />
				<a href="/admin/news" class="text-xs text-rose-400 hover:text-rose-300">Manage</a>
			</div>
			<p class="text-2xl font-bold text-white">{data.counts.news}</p>
			<p class="text-sm text-surface-400">News Articles</p>
		</div>
		<div class="p-6 rounded-2xl bg-surface-900 border border-surface-800">
			<div class="flex items-center justify-between mb-3">
				<BookOpen size={20} class="text-emerald-400" />
				<a href="/admin/posts" class="text-xs text-emerald-400 hover:text-emerald-300">Manage</a>
			</div>
			<p class="text-2xl font-bold text-white">{data.counts.posts}</p>
			<p class="text-sm text-surface-400">Blog Posts</p>
		</div>
	</div>

	<!-- Quick Actions -->
	<h2 class="text-lg font-semibold text-white mb-4">Quick Actions</h2>
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<a href="/admin/ai-tools?action=new" class="flex items-center gap-3 p-4 rounded-xl bg-surface-900 border border-surface-800 hover:border-accent-500/30 transition-all">
			<div class="w-8 h-8 rounded-lg bg-accent-500/10 flex items-center justify-center">
				<Plus size={16} class="text-accent-400" />
			</div>
			<span class="text-sm text-white">Add AI Tool</span>
		</a>
		<a href="/admin/news?action=new" class="flex items-center gap-3 p-4 rounded-xl bg-surface-900 border border-surface-800 hover:border-rose-500/30 transition-all">
			<div class="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
				<Plus size={16} class="text-rose-400" />
			</div>
			<span class="text-sm text-white">Add News Article</span>
		</a>
		<a href="/admin/posts?action=new" class="flex items-center gap-3 p-4 rounded-xl bg-surface-900 border border-surface-800 hover:border-emerald-500/30 transition-all">
			<div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
				<Plus size={16} class="text-emerald-400" />
			</div>
			<span class="text-sm text-white">Add Blog Post</span>
		</a>
	</div>
</section>

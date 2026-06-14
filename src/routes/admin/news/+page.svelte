<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { Plus, Pencil, Trash2, X, Save, Eye, EyeOff } from '@lucide/svelte';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { estimateReadingTime } from '$lib/utils/marked';

	let { data } = $props();
	const client = getSupabaseBrowserClient();

	let showForm = $state(false);
	let editingItem = $state(null);
	let form = $state({ title: '', slug: '', excerpt: '', content: '', cover_image_url: '', category: 'general', tags: '', source_url: '', is_published: false });
	let saving = $state(false);
	let error = $state('');

	function openNew() {
		editingItem = null;
		form = { title: '', slug: '', excerpt: '', content: '', cover_image_url: '', category: 'general', tags: '', source_url: '', is_published: false };
		showForm = true;
	}

	function openEdit(item) {
		editingItem = item;
		form = {
			title: item.title,
			slug: item.slug,
			excerpt: item.excerpt,
			content: item.content,
			cover_image_url: item.cover_image_url || '',
			category: item.category,
			tags: item.tags?.join(', ') || '',
			source_url: item.source_url || '',
			is_published: item.is_published
		};
		showForm = true;
	}

	async function handleSave() {
		saving = true;
		error = '';
		const payload = {
			title: form.title,
			slug: form.slug,
			excerpt: form.excerpt,
			content: form.content,
			cover_image_url: form.cover_image_url || null,
			category: form.category,
			tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
			source_url: form.source_url || null,
			is_published: form.is_published,
			reading_time_min: estimateReadingTime(form.content),
			author_id: data.userId,
			...(form.is_published && !editingItem?.published_at ? { published_at: new Date().toISOString() } : {})
		};

		let result;
		if (editingItem) {
			result = await client.from('news').update(payload).eq('id', editingItem.id);
		} else {
			result = await client.from('news').insert(payload);
		}

		if (result.error) {
			error = result.error.message;
		} else {
			showForm = false;
			window.location.reload();
		}
		saving = false;
	}

	async function handleDelete(id) {
		if (!confirm('Delete this article?')) return;
		await client.from('news').delete().eq('id', id);
		window.location.reload();
	}
</script>

<SeoHead title="Admin - News" url="/admin/news" />

<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<div class="flex items-center justify-between mb-8">
		<h1 class="text-2xl font-bold text-white">News Articles</h1>
		<button onclick={openNew} class="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors">
			<Plus size={16} />
			New Article
		</button>
	</div>

	{#if error}
		<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">{error}</div>
	{/if}

	{#if showForm}
		<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-10 px-4 overflow-y-auto">
			<div class="w-full max-w-4xl bg-surface-900 border border-surface-700 rounded-2xl p-6 mb-20">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-lg font-semibold text-white">{editingItem ? 'Edit' : 'New'} News Article</h2>
					<button onclick={() => showForm = false} class="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400"><X size={18} /></button>
				</div>

				<form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm text-surface-300 mb-1">Title *</label>
							<input type="text" bind:value={form.title} onblur={() => { form.slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }} required
								class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
						</div>
						<div>
							<label class="block text-sm text-surface-300 mb-1">Slug *</label>
							<input type="text" bind:value={form.slug} required
								class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
						</div>
					</div>
					<div>
						<label class="block text-sm text-surface-300 mb-1">Excerpt *</label>
						<input type="text" bind:value={form.excerpt} required
							class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
					</div>
					<div>
						<label class="block text-sm text-surface-300 mb-1">Content (Markdown) *</label>
						<textarea bind:value={form.content} rows="16" required
							class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500 resize-y font-mono"></textarea>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm text-surface-300 mb-1">Cover Image URL</label>
							<input type="url" bind:value={form.cover_image_url}
								class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
						</div>
						<div>
							<label class="block text-sm text-surface-300 mb-1">Source URL</label>
							<input type="url" bind:value={form.source_url}
								class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm text-surface-300 mb-1">Category</label>
							<input type="text" bind:value={form.category}
								class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
						</div>
						<div>
							<label class="block text-sm text-surface-300 mb-1">Tags (comma-separated)</label>
							<input type="text" bind:value={form.tags}
								class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
						</div>
					</div>
					<label class="flex items-center gap-2 text-sm text-surface-300">
						<input type="checkbox" bind:checked={form.is_published} class="rounded" />
						Published
					</label>
					<div class="flex justify-end gap-3 pt-2">
						<button type="button" onclick={() => showForm = false} class="px-4 py-2 rounded-lg bg-surface-800 text-surface-300 text-sm">Cancel</button>
						<button type="submit" disabled={saving} class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-sm">
							<Save size={14} />
							{saving ? 'Saving...' : 'Save'}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<div class="overflow-x-auto">
		<table class="w-full">
			<thead>
				<tr class="border-b border-surface-800">
					<th class="text-left text-xs font-medium text-surface-400 pb-3 pr-4">Title</th>
					<th class="text-left text-xs font-medium text-surface-400 pb-3 pr-4">Status</th>
					<th class="text-left text-xs font-medium text-surface-400 pb-3 pr-4">Category</th>
					<th class="text-right text-xs font-medium text-surface-400 pb-3">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.newsItems as item}
					<tr class="border-b border-surface-800/50 hover:bg-surface-900/50">
						<td class="py-3 pr-4">
							{#if item.is_published}
								<a href="/news/{item.slug}" class="text-sm text-white hover:text-rose-400">{item.title}</a>
							{:else}
								<span class="text-sm text-surface-400">{item.title}</span>
							{/if}
							<p class="text-xs text-surface-500 line-clamp-1">{item.excerpt}</p>
						</td>
						<td class="py-3 pr-4">
							{#if item.is_published}
								<span class="inline-flex items-center gap-1 text-xs text-emerald-400"><Eye size={10} />Published</span>
							{:else}
								<span class="inline-flex items-center gap-1 text-xs text-surface-500"><EyeOff size={10} />Draft</span>
							{/if}
						</td>
						<td class="py-3 pr-4 text-sm text-surface-400">{item.category}</td>
						<td class="py-3 text-right">
							<div class="flex items-center justify-end gap-2">
								<button onclick={() => openEdit(item)} class="p-1.5 rounded hover:bg-surface-800 text-surface-400 hover:text-white"><Pencil size={14} /></button>
								<button onclick={() => handleDelete(item.id)} class="p-1.5 rounded hover:bg-red-500/10 text-surface-400 hover:text-red-400"><Trash2 size={14} /></button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.newsItems.length === 0}
		<p class="text-center text-surface-500 py-10">No news articles yet.</p>
	{/if}
</section>

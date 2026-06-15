<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import { Plus, Pencil, Trash2, X, Save, Eye, EyeOff } from '@lucide/svelte';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { estimateReadingTime } from '$lib/utils/marked';

	let { data } = $props();
	const client = getSupabaseBrowserClient();

	let showForm = $state(false);
	let editingPost = $state(null);
	let form = $state({ title: '', slug: '', excerpt: '', content: '', cover_image_url: '', category: 'general', tags: '', references_links: '', is_published: false });
	let coverFiles = $state([]);
	let attachments = $state([]);
	let saving = $state(false);
	let error = $state('');

	function openNew() {
		editingPost = null;
		form = { title: '', slug: '', excerpt: '', content: '', cover_image_url: '', category: 'general', tags: '', references_links: '', is_published: false };
		coverFiles = [];
		attachments = [];
		showForm = true;
	}

	function openEdit(post) {
		editingPost = post;
		form = {
			title: post.title,
			slug: post.slug,
			excerpt: post.excerpt,
			content: post.content,
			cover_image_url: post.cover_image_url || '',
			category: post.category,
			tags: post.tags?.join(', ') || '',
			references_links: post.references_links?.join(', ') || '',
			is_published: post.is_published
		};
		coverFiles = post.cover_image_url ? [post.cover_image_url] : [];
		attachments = post.attachments || [];
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
			cover_image_url: coverFiles.length > 0 ? coverFiles[0] : (form.cover_image_url || null),
			category: form.category,
			tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
			references_links: form.references_links.split(',').map(l => l.trim()).filter(Boolean),
			attachments: attachments,
			is_published: form.is_published,
			reading_time_min: estimateReadingTime(form.content),
			author_id: data.userId,
			...(form.is_published && !editingPost?.published_at ? { published_at: new Date().toISOString() } : {})
		};

		let result;
		if (editingPost) {
			result = await client.from('posts').update(payload).eq('id', editingPost.id);
		} else {
			result = await client.from('posts').insert(payload);
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
		if (!confirm('Delete this post?')) return;
		await client.from('posts').delete().eq('id', id);
		window.location.reload();
	}
</script>

<SeoHead title="Admin - Blog Posts" url="/admin/posts" />

<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<div class="flex items-center justify-between mb-8">
		<h1 class="text-2xl font-bold text-white">Blog Posts</h1>
		<button onclick={openNew} class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors">
			<Plus size={16} />
			New Post
		</button>
	</div>

	{#if error}
		<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">{error}</div>
	{/if}

	{#if showForm}
		<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-10 px-4 overflow-y-auto">
			<div class="w-full max-w-4xl bg-surface-900 border border-surface-700 rounded-2xl p-6 mb-20">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-lg font-semibold text-white">{editingPost ? 'Edit' : 'New'} Blog Post</h2>
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

					<!-- Cover Image -->
					<div>
						<label class="block text-sm text-surface-300 mb-1.5">Cover Image</label>
						<FileUpload accept="image/*" bindable:files={coverFiles} path="posts" />
						<input type="url" bind:value={form.cover_image_url} placeholder="Or paste image URL directly"
							class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500 mt-2" />
					</div>

					<!-- Attachments -->
					<FileUpload label="Attachments (images, PDFs, etc.)" accept="image/*,application/pdf" bindable:files={attachments} path="posts" />

					<!-- Category, Tags, References -->
					<div class="grid grid-cols-3 gap-4">
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
						<div>
							<label class="block text-sm text-surface-300 mb-1">References (comma-separated URLs)</label>
							<input type="text" bind:value={form.references_links} placeholder="https://..., https://..."
								class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
						</div>
					</div>

					<label class="flex items-center gap-2 text-sm text-surface-300">
						<input type="checkbox" bind:checked={form.is_published} class="rounded" />
						Published
					</label>
					<div class="flex justify-end gap-3 pt-2">
						<button type="button" onclick={() => showForm = false} class="px-4 py-2 rounded-lg bg-surface-800 text-surface-300 text-sm">Cancel</button>
						<button type="submit" disabled={saving} class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm">
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
				{#each data.posts as post}
					<tr class="border-b border-surface-800/50 hover:bg-surface-900/50">
						<td class="py-3 pr-4">
							{#if post.is_published}
								<a href="/blog/{post.slug}" class="text-sm text-white hover:text-emerald-400">{post.title}</a>
							{:else}
								<span class="text-sm text-surface-400">{post.title}</span>
							{/if}
							<p class="text-xs text-surface-500 line-clamp-1">{post.excerpt}</p>
						</td>
						<td class="py-3 pr-4">
							{#if post.is_published}
								<span class="inline-flex items-center gap-1 text-xs text-emerald-400"><Eye size={10} />Published</span>
							{:else}
								<span class="inline-flex items-center gap-1 text-xs text-surface-500"><EyeOff size={10} />Draft</span>
							{/if}
						</td>
						<td class="py-3 pr-4 text-sm text-surface-400">{post.category}</td>
						<td class="py-3 text-right">
							<div class="flex items-center justify-end gap-2">
								<button onclick={() => openEdit(post)} class="p-1.5 rounded hover:bg-surface-800 text-surface-400 hover:text-white"><Pencil size={14} /></button>
								<button onclick={() => handleDelete(post.id)} class="p-1.5 rounded hover:bg-red-500/10 text-surface-400 hover:text-red-400"><Trash2 size={14} /></button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.posts.length === 0}
		<p class="text-center text-surface-500 py-10">No blog posts yet.</p>
	{/if}
</section>

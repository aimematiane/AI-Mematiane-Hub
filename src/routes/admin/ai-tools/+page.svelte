<script>
	import { invalidateAll } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
	import { Plus, Pencil, Trash2, Star, X, Save } from '@lucide/svelte';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';

	let { data } = $props();
	const client = getSupabaseBrowserClient();

	let showForm = $state(false);
	let editingTool = $state(null);
	let form = $state({
		name: '', slug: '', description: '', long_description: '', category: 'text',
		image_url: '', website_url: '', demo_url: '', github_url: '', paper_url: '',
		pricing: 'free', is_featured: false, tags: ''
	});
	let coverFiles = $state([]);
	let attachments = $state([]);
	let saving = $state(false);
	let error = $state('');

	$effect(() => {
		const fileUrl = coverFiles[0] || '';
		if (form.image_url !== fileUrl) {
			form.image_url = fileUrl;
		}
	});

	$effect(() => {
		const currentUrl = form.image_url || '';
		if (currentUrl && coverFiles[0] !== currentUrl) {
			coverFiles = [currentUrl];
		} else if (!currentUrl && coverFiles.length > 0) {
			coverFiles = [];
		}
	});

	$effect(() => {
		if (editingTool && coverFiles) {
			const newCoverUrl = coverFiles[0] || null;
			if (editingTool.image_url !== newCoverUrl) {
				editingTool.image_url = newCoverUrl;
				client.from('ai_tools').update({ image_url: newCoverUrl }).eq('id', editingTool.id).then(() => {
					invalidateAll();
				});
			}
		}
	});

	$effect(() => {
		if (editingTool && attachments) {
			const oldAttachments = editingTool.attachments || [];
			if (JSON.stringify(oldAttachments) !== JSON.stringify(attachments)) {
				editingTool.attachments = attachments;
				client.from('ai_tools').update({ attachments }).eq('id', editingTool.id).then(() => {
					invalidateAll();
				});
			}
		}
	});

	function openNew() {
		editingTool = null;
		form = {
			name: '', slug: '', description: '', long_description: '', category: 'text',
			image_url: '', website_url: '', demo_url: '', github_url: '', paper_url: '',
			pricing: 'free', is_featured: false, tags: ''
		};
		coverFiles = [];
		attachments = [];
		showForm = true;
	}

	function openEdit(tool) {
		editingTool = tool;
		form = {
			name: tool.name,
			slug: tool.slug,
			description: tool.description,
			long_description: tool.long_description || '',
			category: tool.category,
			image_url: tool.image_url || '',
			website_url: tool.website_url || '',
			demo_url: tool.demo_url || '',
			github_url: tool.github_url || '',
			paper_url: tool.paper_url || '',
			pricing: tool.pricing || 'free',
			is_featured: tool.is_featured,
			tags: tool.tags?.join(', ') || ''
		};
		coverFiles = tool.image_url ? [tool.image_url] : [];
		attachments = tool.attachments || [];
		showForm = true;
	}

	function generateSlug() {
		form.slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
	}

	async function handleSave() {
		saving = true;
		error = '';
		const payload = {
			name: form.name,
			slug: form.slug,
			description: form.description,
			long_description: form.long_description || null,
			category: form.category,
			image_url: coverFiles.length > 0 ? coverFiles[0] : (form.image_url || null),
			website_url: form.website_url || null,
			demo_url: form.demo_url || null,
			github_url: form.github_url || null,
			paper_url: form.paper_url || null,
			pricing: form.pricing,
			is_featured: form.is_featured,
			tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
			attachments: attachments
		};

		let result;
		if (editingTool) {
			result = await client.from('ai_tools').update(payload).eq('id', editingTool.id);
		} else {
			result = await client.from('ai_tools').insert(payload);
		}

		if (result.error) {
			error = result.error.message;
		} else {
			showForm = false;
			await invalidateAll();
		}
		saving = false;
	}

	async function handleDelete(id) {
		if (!confirm('Delete this tool?')) return;
		await client.from('ai_tools').delete().eq('id', id);
		await invalidateAll();
	}
</script>

<SeoHead title="Admin - AI Tools" url="/admin/ai-tools" noindex={true} />

<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<div class="flex items-center justify-between mb-8">
		<h1 class="text-2xl font-bold text-white">AI Tools</h1>
		<button onclick={openNew} class="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium transition-colors">
			<Plus size={16} />
			Add Tool
		</button>
	</div>

	{#if error}
		<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">{error}</div>
	{/if}

	{#if showForm}
		<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-10 px-4 overflow-y-auto">
			<div class="w-full max-w-3xl bg-surface-900 border border-surface-700 rounded-2xl p-6 mb-20">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-lg font-semibold text-white">{editingTool ? 'Edit' : 'New'} AI Tool</h2>
					<button onclick={() => showForm = false} class="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400"><X size={18} /></button>
				</div>

				<form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="ai-tool-name" class="block text-sm text-surface-300 mb-1">Name *</label>
							<input id="ai-tool-name" type="text" bind:value={form.name} onblur={generateSlug} required
								class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
						</div>
						<div>
							<label for="ai-tool-slug" class="block text-sm text-surface-300 mb-1">Slug *</label>
							<input id="ai-tool-slug" type="text" bind:value={form.slug} required
								class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
						</div>
					</div>
					<div>
						<label for="ai-tool-description" class="block text-sm text-surface-300 mb-1">Short Description *</label>
						<input id="ai-tool-description" type="text" bind:value={form.description} required
							class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
					</div>
					<div>
						<label for="ai-tool-long-desc" class="block text-sm text-surface-300 mb-1.5">Long Description (Markdown)</label>
						<MarkdownEditor id="ai-tool-long-desc" bind:value={form.long_description} rows={8} placeholder="Write a detailed description of this AI tool..." />
					</div>

					<!-- Category, Pricing, Tags -->
					<div class="grid grid-cols-3 gap-4">
						<div>
							<label for="ai-tool-category" class="block text-sm text-surface-300 mb-1">Category *</label>
							<select id="ai-tool-category" bind:value={form.category}
								class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500">
								<option value="text">Text</option>
								<option value="image">Image</option>
								<option value="video">Video</option>
								<option value="audio">Audio</option>
								<option value="code">Code</option>
								<option value="data">Data</option>
								<option value="other">Other</option>
							</select>
						</div>
						<div>
							<label for="ai-tool-pricing" class="block text-sm text-surface-300 mb-1">Pricing</label>
							<select id="ai-tool-pricing" bind:value={form.pricing}
								class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500">
								<option value="free">Free</option>
								<option value="freemium">Freemium</option>
								<option value="paid">Paid</option>
								<option value="open_source">Open Source</option>
							</select>
						</div>
						<div>
							<label for="ai-tool-tags" class="block text-sm text-surface-300 mb-1">Tags (comma-separated)</label>
							<input id="ai-tool-tags" type="text" bind:value={form.tags}
								class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
						</div>
					</div>

					<!-- Cover Image Upload -->
					<div>
						<label for="ai-tool-image-url" class="block text-sm text-surface-300 mb-1.5">Cover Image</label>
						<FileUpload accept="image/*" bind:files={coverFiles} path="ai-tools" />
						<input id="ai-tool-image-url" type="url" bind:value={form.image_url} placeholder="Or paste image URL directly"
							class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500 mt-2" />
					</div>

					<!-- Links -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="ai-tool-website" class="block text-sm text-surface-300 mb-1">Website URL</label>
							<input id="ai-tool-website" type="url" bind:value={form.website_url} placeholder="https://example.com"
								class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
						</div>
						<div>
							<label for="ai-tool-demo" class="block text-sm text-surface-300 mb-1">Demo URL</label>
							<input id="ai-tool-demo" type="url" bind:value={form.demo_url} placeholder="https://demo.example.com"
								class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="ai-tool-github" class="block text-sm text-surface-300 mb-1">GitHub URL</label>
							<input id="ai-tool-github" type="url" bind:value={form.github_url} placeholder="https://github.com/..."
								class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
						</div>
						<div>
							<label for="ai-tool-paper" class="block text-sm text-surface-300 mb-1">Research Paper URL</label>
							<input id="ai-tool-paper" type="url" bind:value={form.paper_url} placeholder="https://arxiv.org/..."
								class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
						</div>
					</div>

					<!-- Additional Attachments -->
					<FileUpload label="Additional Attachments (screenshots, docs, etc.)" accept="image/*,application/pdf" bind:files={attachments} path="ai-tools" />

					<label class="flex items-center gap-2 text-sm text-surface-300">
						<input type="checkbox" bind:checked={form.is_featured} class="rounded" />
						Featured
					</label>
					<div class="flex justify-end gap-3 pt-2">
						<button type="button" onclick={() => showForm = false} class="px-4 py-2 rounded-lg bg-surface-800 text-surface-300 text-sm">Cancel</button>
						<button type="submit" disabled={saving} class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white text-sm">
							<Save size={14} />
							{saving ? 'Saving...' : 'Save'}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Table -->
	<div class="overflow-x-auto">
		<table class="w-full">
			<thead>
				<tr class="border-b border-surface-800">
					<th class="text-left text-xs font-medium text-surface-400 pb-3 pr-4">Name</th>
					<th class="text-left text-xs font-medium text-surface-400 pb-3 pr-4">Category</th>
					<th class="text-left text-xs font-medium text-surface-400 pb-3 pr-4">Pricing</th>
					<th class="text-left text-xs font-medium text-surface-400 pb-3 pr-4">Featured</th>
					<th class="text-right text-xs font-medium text-surface-400 pb-3">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.tools as tool}
					<tr class="border-b border-surface-800/50 hover:bg-surface-900/50">
						<td class="py-3 pr-4">
							<a href="/ai-tools/{tool.slug}" class="text-sm text-white hover:text-accent-400">{tool.name}</a>
							<p class="text-xs text-surface-500 line-clamp-1">{tool.description}</p>
						</td>
						<td class="py-3 pr-4"><CategoryBadge category={tool.category} size="xs" /></td>
						<td class="py-3 pr-4 text-sm text-surface-400">{tool.pricing || 'free'}</td>
						<td class="py-3 pr-4">{#if tool.is_featured}<Star size={14} class="text-amber-400" fill="currentColor" />{:else}<span class="text-surface-600">-</span>{/if}</td>
						<td class="py-3 text-right">
							<div class="flex items-center justify-end gap-2">
								<button onclick={() => openEdit(tool)} class="p-1.5 rounded hover:bg-surface-800 text-surface-400 hover:text-white"><Pencil size={14} /></button>
								<button onclick={() => handleDelete(tool.id)} class="p-1.5 rounded hover:bg-red-500/10 text-surface-400 hover:text-red-400"><Trash2 size={14} /></button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.tools.length === 0}
		<p class="text-center text-surface-500 py-10">No AI tools yet. Click "Add Tool" to create one.</p>
	{/if}
</section>

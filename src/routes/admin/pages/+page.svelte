<script>
	import { goto, invalidateAll } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { FileText, Plus, Edit, Trash2, Eye, EyeOff, Globe, Calendar } from '@lucide/svelte';

	let { data } = $props();

	let pages = $state([]);
	let showCreateModal = $state(false);
	let newPage = $state({ title: '', slug: '' });
	let creating = $state(false);

	// Re-sync whenever server data refreshes (after any action)
	$effect(() => {
		pages = data.pages;
	});

	function formatDate(date) {
		return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	async function createPage() {
		if (!newPage.title) return;
		creating = true;

		const formData = new FormData();
		formData.append('title', newPage.title);
		formData.append('slug', newPage.slug);

		const response = await fetch('?/create', { method: 'POST', body: formData });
		if (!response.ok) {
			const errorText = await response.text();
			console.error('Failed to create page:', response.status, errorText);
			creating = false;
			return;
		}
		creating = false;
		showCreateModal = false;
		newPage = { title: '', slug: '' };
		await invalidateAll();
	}

	async function deletePage(id) {
		if (!confirm('Delete this page?')) return;

		const formData = new FormData();
		formData.append('id', id);

		await fetch('?/delete', { method: 'POST', body: formData });
		await invalidateAll();
	}

	async function publishPage(id, currentlyPublished) {
		const formData = new FormData();
		formData.append('id', id);

		if (currentlyPublished) {
			await fetch('?/unpublish', { method: 'POST', body: formData });
		} else {
			await fetch('?/publish', { method: 'POST', body: formData });
		}
		await invalidateAll();
	}

	function generateSlug() {
		newPage.slug = newPage.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
	}
</script>

<SeoHead title="Pages" noindex={true} />

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold text-white flex items-center gap-3">
				<FileText size={24} class="text-accent-400" />
				Pages
			</h1>
			<p class="text-surface-400 mt-1">Create and manage custom pages</p>
		</div>
		<button
			onclick={() => showCreateModal = true}
			class="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-medium text-sm transition-colors"
		>
			<Plus size={16} />
			New Page
		</button>
	</div>

	<!-- Pages Table -->
	<div class="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
		{#if pages.length > 0}
			<table class="w-full">
				<thead class="bg-surface-800">
					<tr>
						<th class="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Title</th>
						<th class="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Status</th>
						<th class="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Created</th>
						<th class="text-right px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-800">
					{#each pages as page}
						<tr class="hover:bg-surface-800/50 transition-colors">
							<td class="px-6 py-4">
								<div>
									<a href={`/admin/pages/${page.id}`} class="font-medium text-white hover:text-accent-400">{page.title}</a>
									<p class="text-sm text-surface-500">/{page.slug}</p>
								</div>
							</td>
							<td class="px-6 py-4">
								<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium {page.is_published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface-700 text-surface-400'}">
									{#if page.is_published}<Globe size={12} />{:else}<FileText size={12} />{/if}
									{page.is_published ? 'Published' : 'Draft'}
								</span>
							</td>
							<td class="px-6 py-4 text-sm text-surface-400">
								<div class="flex items-center gap-1.5">
									<Calendar size={14} />
									{formatDate(page.created_at)}
								</div>
							</td>
							<td class="px-6 py-4">
								<div class="flex items-center justify-end gap-2">
									<a href="/admin/pages/{page.id}" class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white" title="Edit">
										<Edit size={16} />
									</a>
									<button onclick={() => publishPage(page.id, page.is_published)} class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white" title={page.is_published ? 'Unpublish' : 'Publish'}>
										{#if page.is_published}<EyeOff size={16} />{:else}<Eye size={16} />{/if}
									</button>
									<button onclick={() => deletePage(page.id)} class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-rose-400" title="Delete">
										<Trash2 size={16} />
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<div class="p-12 text-center">
				<FileText size={48} class="text-surface-700 mx-auto mb-4" />
				<h3 class="text-lg font-medium text-white mb-2">No pages yet</h3>
				<p class="text-surface-400 text-sm mb-4">Create your first page to get started.</p>
				<button
					onclick={() => showCreateModal = true}
					class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-medium text-sm"
				>
					<Plus size={16} />
					Create Page
				</button>
			</div>
		{/if}
	</div>
</div>

<!-- Create Modal -->
{#if showCreateModal}
	<div role="presentation" tabindex="-1" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onkeydown={(e) => { if (e.key === 'Escape') showCreateModal = false; }} onclick={(e) => { if (e.target === e.currentTarget) showCreateModal = false; }}>
		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-md">
			<h3 class="text-lg font-semibold text-white mb-4">Create New Page</h3>
			<div class="space-y-4">
				<div>
					<label for="new-page-title" class="block text-sm text-surface-300 mb-1.5">Page Title</label>
					<input id="new-page-title" type="text" bind:value={newPage.title} oninput={generateSlug} placeholder="e.g. About Us" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
				<div>
					<label for="new-page-slug" class="block text-sm text-surface-300 mb-1.5">Slug</label>
					<input id="new-page-slug" type="text" bind:value={newPage.slug} placeholder="about-us" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm font-mono" />
				</div>
			</div>
			<div class="flex gap-3 mt-6">
				<button onclick={() => showCreateModal = false} class="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 text-white font-medium text-sm">Cancel</button>
				<button onclick={createPage} disabled={creating || !newPage.title} class="flex-1 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm">{creating ? 'Creating...' : 'Create'}</button>
			</div>
		</div>
	</div>
{/if}

<script>
	import { invalidateAll } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import { Image, Upload, Trash2, Search, FolderOpen, Grid, List, Copy, ExternalLink, X, Check, Edit } from '@lucide/svelte';

	let { data } = $props();

	let media = $state([]);
	let folders = $state([]);
	let searchQuery = $state('');
	let activeFolder = $state('all');
	let viewMode = $state('grid');
	let showUploadModal = $state(false);
	let showEditModal = $state(false);
	let editingMedia = $state(null);
	let uploadFiles = $state([]);
	let urlInput = $state('');
	let uploadFilename = $state('');
	let uploadAltText = $state('');
	let uploadFolder = $state('/');
	let editForm = $state({ alt_text: '', title: '', description: '' });
	let copiedUrl = $state('');
	let saving = $state(false);

	$effect(() => {
		media = data.media;
		folders = data.folders;
	});

	const filteredMedia = $derived(media.filter(m => {
		const matchesSearch = !searchQuery || m.filename.toLowerCase().includes(searchQuery.toLowerCase()) || (m.original_filename || '').toLowerCase().includes(searchQuery.toLowerCase());
		const matchesFolder = activeFolder === 'all' || m.folder === activeFolder;
		return matchesSearch && matchesFolder;
	}));

	function formatBytes(bytes) {
		if (!bytes || bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	function formatDate(date) {
		return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	async function uploadByUrl() {
		if (!urlInput) return;
		saving = true;

		const formData = new FormData();
		formData.append('url', urlInput);
		formData.append('filename', uploadFilename || urlInput.split('/').pop() || 'file');
		formData.append('alt_text', uploadAltText);
		formData.append('folder', uploadFolder);

		await fetch('?/upload', { method: 'POST', body: formData });

		showUploadModal = false;
		urlInput = '';
		uploadFilename = '';
		uploadAltText = '';
		uploadFolder = '/';
		saving = false;
		await invalidateAll();
	}

	async function handleFileUploaded() {
		if (uploadFiles.length === 0) return;
		saving = true;

		for (const fileUrl of uploadFiles) {
			const formData = new FormData();
			formData.append('url', fileUrl);
			formData.append('filename', fileUrl.split('/').pop() || 'file');
			formData.append('alt_text', uploadAltText);
			formData.append('folder', uploadFolder);
			await fetch('?/upload', { method: 'POST', body: formData });
		}

		showUploadModal = false;
		uploadFiles = [];
		uploadAltText = '';
		uploadFolder = '/';
		saving = false;
		await invalidateAll();
	}

	async function deleteMedia(id) {
		if (!confirm('Delete this file?')) return;

		const formData = new FormData();
		formData.append('id', id);
		await fetch('?/delete', { method: 'POST', body: formData });
		await invalidateAll();
	}

	function startEdit(item) {
		editingMedia = item;
		editForm = {
			alt_text: item.alt_text || '',
			title: item.title || '',
			description: item.description || ''
		};
		showEditModal = true;
	}

	async function saveEdit() {
		saving = true;
		const formData = new FormData();
		formData.append('id', editingMedia.id);
		formData.append('alt_text', editForm.alt_text);
		formData.append('title', editForm.title);
		formData.append('description', editForm.description);
		await fetch('?/updateMeta', { method: 'POST', body: formData });
		showEditModal = false;
		editingMedia = null;
		saving = false;
		await invalidateAll();
	}

	function copyUrl(url) {
		navigator.clipboard.writeText(url);
		copiedUrl = url;
		setTimeout(() => copiedUrl = '', 2000);
	}

	function isImage(mimeType) {
		return mimeType?.startsWith('image/');
	}
</script>

<SeoHead title="Media Library" noindex={true} />

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold text-white flex items-center gap-3">
				<Image size={24} class="text-accent-400" />
				Media Library
			</h1>
			<p class="text-surface-400 mt-1">{media.length} files</p>
		</div>
		<button
			onclick={() => showUploadModal = true}
			class="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-medium text-sm transition-colors"
		>
			<Upload size={16} />
			Upload
		</button>
	</div>

	<!-- Filters -->
	<div class="flex flex-col sm:flex-row gap-4 mb-6">
		<div class="flex-1 relative">
			<Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search files..."
				class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-900 border border-surface-800 text-white placeholder-surface-500 text-sm"
			/>
		</div>
		<select
			bind:value={activeFolder}
			class="px-4 py-2.5 rounded-xl bg-surface-900 border border-surface-800 text-white text-sm"
		>
			<option value="all">All Folders</option>
			{#each folders as folder}
				<option value={folder}>{folder}</option>
			{/each}
		</select>
		<div class="flex gap-2">
			<button onclick={() => viewMode = 'grid'} class="p-2.5 rounded-xl {viewMode === 'grid' ? 'bg-accent-500 text-white' : 'bg-surface-900 text-surface-400'} border border-surface-800">
				<Grid size={18} />
			</button>
			<button onclick={() => viewMode = 'list'} class="p-2.5 rounded-xl {viewMode === 'list' ? 'bg-accent-500 text-white' : 'bg-surface-900 text-surface-400'} border border-surface-800">
				<List size={18} />
			</button>
		</div>
	</div>

	<!-- Media Grid/List -->
	{#if viewMode === 'grid'}
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
			{#each filteredMedia as item}
				<div class="group relative aspect-square rounded-xl bg-surface-900 border border-surface-800 overflow-hidden hover:border-surface-600 transition-all">
					{#if isImage(item.mime_type)}
						<img src={item.url} alt={item.alt_text || item.filename} class="w-full h-full object-cover" />
					{:else}
						<div class="w-full h-full flex items-center justify-center">
							<FolderOpen size={32} class="text-surface-600" />
						</div>
					{/if}
					<div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
						<div class="flex-1 min-w-0">
							<p class="text-xs font-medium text-white truncate">{item.original_filename}</p>
						</div>
						<div class="flex gap-1">
							<button onclick={() => startEdit(item)} class="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white">
								<Edit size={14} />
							</button>
							<button onclick={() => copyUrl(item.url)} class="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white">
								{#if copiedUrl === item.url}<Check size={14} />{:else}<Copy size={14} />{/if}
							</button>
							<button onclick={() => deleteMedia(item.id)} class="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white">
								<Trash2 size={14} />
							</button>
						</div>
					</div>
				</div>
			{:else}
				<div class="col-span-full p-12 text-center">
					<Image size={48} class="text-surface-700 mx-auto mb-4" />
					<p class="text-surface-400">No media files found</p>
				</div>
			{/each}
		</div>
	{:else}
		<div class="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
			{#if filteredMedia.length > 0}
				<table class="w-full">
					<thead class="bg-surface-800">
						<tr>
							<th class="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase">File</th>
							<th class="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase">Size</th>
							<th class="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase">Date</th>
							<th class="text-right px-6 py-3 text-xs font-medium text-surface-400 uppercase">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-surface-800">
						{#each filteredMedia as item}
							<tr class="hover:bg-surface-800/50">
								<td class="px-6 py-4">
									<div class="flex items-center gap-3">
										{#if isImage(item.mime_type)}
											<img src={item.url} alt="" class="w-10 h-10 rounded-lg object-cover" />
										{:else}
											<div class="w-10 h-10 rounded-lg bg-surface-700 flex items-center justify-center">
												<FolderOpen size={18} class="text-surface-500" />
											</div>
										{/if}
										<div>
											<p class="font-medium text-white text-sm">{item.original_filename}</p>
											<p class="text-xs text-surface-500">{item.folder}</p>
										</div>
									</div>
								</td>
								<td class="px-6 py-4 text-sm text-surface-400">{formatBytes(item.size_bytes)}</td>
								<td class="px-6 py-4 text-sm text-surface-400">{formatDate(item.created_at)}</td>
								<td class="px-6 py-4">
									<div class="flex items-center justify-end gap-2">
										<button onclick={() => startEdit(item)} class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white">
											<Edit size={16} />
										</button>
										<button onclick={() => copyUrl(item.url)} class="p-2 rounded-lg hover:bg-surface-700 text-surface-400">
											{#if copiedUrl === item.url}<Check size={16} class="text-emerald-400" />{:else}<Copy size={16} />{/if}
										</button>
										<a href={item.url} target="_blank" class="p-2 rounded-lg hover:bg-surface-700 text-surface-400">
											<ExternalLink size={16} />
										</a>
										<button onclick={() => deleteMedia(item.id)} class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-rose-400">
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
					<Image size={48} class="text-surface-700 mx-auto mb-4" />
					<p class="text-surface-400">No media files found</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Upload Modal -->
{#if showUploadModal}
	<div role="presentation" tabindex="-1" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onkeydown={(e) => { if (e.key === 'Escape') showUploadModal = false; }} onclick={(e) => { if (e.target === e.currentTarget) showUploadModal = false; }}>
		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-lg">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold text-white">Add Media</h3>
				<button onclick={() => showUploadModal = false} class="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400"><X size={18} /></button>
			</div>

			<!-- Tab: Upload file -->
			<div class="mb-4">
				<FileUpload label="Upload File" accept="image/*,application/pdf,.svg" bind:files={uploadFiles} path="media" />
				{#if uploadFiles.length > 0}
					<div class="mt-3 space-y-3">
						<div>
							<label for="upload-file-alt" class="block text-sm text-surface-300 mb-1.5">Alt Text</label>
							<input id="upload-file-alt" type="text" bind:value={uploadAltText} placeholder="Describe the image" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
						</div>
						<div>
							<label for="upload-file-folder" class="block text-sm text-surface-300 mb-1.5">Folder</label>
							<input id="upload-file-folder" type="text" bind:value={uploadFolder} placeholder="/" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
						</div>
					</div>
					<button onclick={handleFileUploaded} disabled={saving} class="mt-4 w-full px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm">
						{saving ? 'Saving...' : 'Save to Library'}
					</button>
				{/if}
			</div>

			<!-- Divider -->
			<div class="flex items-center gap-3 my-4">
				<div class="flex-1 h-px bg-surface-700"></div>
				<span class="text-xs text-surface-500">or add by URL</span>
				<div class="flex-1 h-px bg-surface-700"></div>
			</div>

			<!-- Add by URL -->
			<div class="space-y-3">
				<div>
					<label for="upload-url" class="block text-sm text-surface-300 mb-1.5">URL</label>
					<input id="upload-url" type="url" bind:value={urlInput} placeholder="https://..." class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
				<div>
					<label for="upload-url-alt" class="block text-sm text-surface-300 mb-1.5">Alt Text</label>
					<input id="upload-url-alt" type="text" bind:value={uploadAltText} placeholder="Describe the image" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
			</div>
			<div class="flex gap-3 mt-4">
				<button onclick={() => showUploadModal = false} class="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 text-white font-medium text-sm">Cancel</button>
				<button onclick={uploadByUrl} disabled={saving || !urlInput} class="flex-1 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm">{saving ? 'Adding...' : 'Add URL'}</button>
			</div>
		</div>
	</div>
{/if}

<!-- Edit Modal -->
{#if showEditModal && editingMedia}
	<div role="presentation" tabindex="-1" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onkeydown={(e) => { if (e.key === 'Escape') showEditModal = false; }} onclick={(e) => { if (e.target === e.currentTarget) showEditModal = false; }}>
		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-md">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold text-white">Edit Media</h3>
				<button onclick={() => showEditModal = false} class="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400"><X size={18} /></button>
			</div>

			{#if isImage(editingMedia.mime_type)}
				<img src={editingMedia.url} alt={editingMedia.alt_text} class="w-full h-40 object-cover rounded-xl mb-4" />
			{/if}
			<p class="text-sm text-surface-400 mb-4 truncate">{editingMedia.original_filename}</p>

			<div class="space-y-4">
				<div>
					<label for="edit-media-alt" class="block text-sm text-surface-300 mb-1.5">Alt Text</label>
					<input id="edit-media-alt" type="text" bind:value={editForm.alt_text} placeholder="Describe the image for accessibility" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
				<div>
					<label for="edit-media-title" class="block text-sm text-surface-300 mb-1.5">Title</label>
					<input id="edit-media-title" type="text" bind:value={editForm.title} placeholder="Optional title" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
				<div>
					<label for="edit-media-description" class="block text-sm text-surface-300 mb-1.5">Description</label>
					<textarea id="edit-media-description" bind:value={editForm.description} rows="2" placeholder="Optional description" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm resize-none"></textarea>
				</div>
			</div>
			<div class="flex gap-3 mt-6">
				<button onclick={() => showEditModal = false} class="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 text-white font-medium text-sm">Cancel</button>
				<button onclick={saveEdit} disabled={saving} class="flex-1 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm">{saving ? 'Saving...' : 'Save'}</button>
			</div>
		</div>
	</div>
{/if}

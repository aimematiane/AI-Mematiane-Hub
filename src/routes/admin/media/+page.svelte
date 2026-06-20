<script>
	import { untrack } from 'svelte';
	import { invalidateAll, goto } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import { Image, Upload, Trash2, Search, Folder, FolderOpen, ChevronRight, ChevronDown, Grid, List, Copy, ExternalLink, X, Check, Edit, AlertCircle, CheckCircle2, Plus } from '@lucide/svelte';
	import { submitAction } from '$lib/utils/adminFetch.js';
	import { isImageFile, inlineImageUrl } from '$lib/utils/media.js';

	let { data } = $props();

	// Derived state to keep perfectly synced with SvelteKit loading/invalidations
	const media = $derived(data.media || []);
	const folders = $derived(data.folders || []);
	const activeFolder = $derived(data.activeFolder || '/');

	let searchQuery = $state('');
	let viewMode = $state('grid');
	let showUploadModal = $state(false);
	let showEditModal = $state(false);
	let editingMedia = $state(null);
	let deletingMediaItem = $state(null);
	let uploadFiles = $state([]);
	let urlInput = $state('');
	let uploadFilename = $state('');
	let uploadAltText = $state('');
	let uploadFolder = $state('media');
	let editForm = $state({ alt_text: '', title: '', description: '' });
	let copiedUrl = $state('');
	let saving = $state(false);
	let toast = $state(null);

	// Folder tree and action states
	let expandedFolders = $state(new Set(['/']));
	let showNewFolderModal = $state(false);
	let newFolderParent = $state('');
	let newFolderName = $state('');
	let renamingFolder = $state(null);
	let deletingFolder = $state(null);

	const SYSTEM_FOLDERS = ['/', 'media', 'posts', 'news', 'ai-tools', 'profile-images'];

	// Navigate to a folder using client-side SvelteKit routing
	async function selectFolder(path) {
		const url = new URL(window.location.href);
		url.searchParams.set('folder', path);
		await goto(url.pathname + url.search, { keepFocus: true, noScroll: true });
	}

	// Auto-expand tree nodes for selected activeFolder
	$effect(() => {
		if (activeFolder && activeFolder !== '/') {
			untrack(() => {
				const parts = activeFolder.split('/');
				let cumulative = '';
				let changed = false;
				const currentFolders = expandedFolders;
				const nextFolders = new Set(currentFolders);
				
				for (const p of parts) {
					cumulative = cumulative ? `${cumulative}/${p}` : p;
					if (!nextFolders.has(cumulative)) {
						nextFolders.add(cumulative);
						changed = true;
					}
				}
				
				if (changed) {
					expandedFolders = nextFolders;
				}
			});
		}
	});

	// Build hierarchical tree structure from flat folders list
	const folderTree = $derived.by(() => {
		const root = { name: 'Root', path: '/', children: {} };
		for (const f of folders) {
			if (!f || f === '/') continue;
			const parts = f.split('/');
			let current = root;
			let cumulative = '';
			for (const part of parts) {
				cumulative = cumulative ? `${cumulative}/${part}` : part;
				if (!current.children[part]) {
					current.children[part] = { name: part, path: cumulative, children: {} };
				}
				current = current.children[part];
			}
		}
		return root;
	});

	// Get immediate subfolders of the current folder
	const currentSubfolders = $derived(folders.filter(f => {
		if (f === '/') return false;
		if (activeFolder === '/') {
			return !f.includes('/');
		} else {
			return f.startsWith(activeFolder + '/') && f.substring(activeFolder.length + 1).split('/').length === 1;
		}
	}));

	// Files that are directly in the active folder
	const currentFiles = $derived(media.filter(m => m.folder === activeFolder));

	// Search filter applied on top of active folder structure
	const filteredMedia = $derived(media.filter(m => {
		const matchesSearch = !searchQuery || m.filename.toLowerCase().includes(searchQuery.toLowerCase()) || (m.original_filename || '').toLowerCase().includes(searchQuery.toLowerCase());
		// If searching, search globally across all files, otherwise scope to active folder
		const matchesFolder = searchQuery ? true : (m.folder === activeFolder);
		return matchesSearch && matchesFolder;
	}));

	// Sync uploadFolder state with activeFolder
	$effect(() => {
		if (activeFolder) {
			uploadFolder = activeFolder === '/' ? 'media' : activeFolder;
		}
	});

	function isSystemFolder(path) {
		return SYSTEM_FOLDERS.includes(path.replace(/^\/|\/$/g, ''));
	}

	function toggleExpand(path) {
		if (expandedFolders.has(path)) {
			expandedFolders.delete(path);
		} else {
			expandedFolders.add(path);
		}
		expandedFolders = new Set(expandedFolders);
	}

	function showToast(msg, type = 'success') {
		toast = { msg, type };
		setTimeout(() => (toast = null), 3000);
	}

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
		try {
			const formData = new FormData();
			formData.append('url', urlInput);
			formData.append('filename', uploadFilename || urlInput.split('/').pop() || 'file');
			formData.append('alt_text', uploadAltText);
			formData.append('folder', activeFolder || 'media');
			await submitAction('upload', formData, '/admin/media');
			showUploadModal = false;
			urlInput = '';
			uploadFilename = '';
			uploadAltText = '';
			showToast('URL added successfully');
			await invalidateAll();
		} catch (err) {
			showToast(err.message, 'error');
		}
		saving = false;
	}

	async function handleFileUploaded() {
		if (uploadFiles.length === 0) return;
		saving = true;
		try {
			for (const fileUrl of uploadFiles) {
				const formData = new FormData();
				formData.append('url', fileUrl);
				formData.append('filename', fileUrl.split('/').pop() || 'file');
				formData.append('alt_text', uploadAltText);
				formData.append('folder', activeFolder || 'media');
				await submitAction('upload', formData, '/admin/media');
			}
			showUploadModal = false;
			uploadFiles = [];
			uploadAltText = '';
			showToast('Files uploaded successfully');
			await invalidateAll();
		} catch (err) {
			showToast(err.message, 'error');
		}
		saving = false;
	}

	function startDelete(item) {
		deletingMediaItem = item;
	}

	async function confirmDelete() {
		if (!deletingMediaItem) return;
		saving = true;
		try {
			const formData = new FormData();
			formData.append('id', deletingMediaItem.id);
			await submitAction('delete', formData, '/admin/media');
			deletingMediaItem = null;
			showToast('File deleted successfully');
			await invalidateAll();
		} catch (err) {
			showToast(err.message, 'error');
		}
		saving = false;
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
		try {
			const formData = new FormData();
			formData.append('id', editingMedia.id);
			formData.append('alt_text', editForm.alt_text);
			formData.append('title', editForm.title);
			formData.append('description', editForm.description);
			await submitAction('updateMeta', formData, '/admin/media');
			showEditModal = false;
			editingMedia = null;
			showToast('Metadata updated successfully');
			await invalidateAll();
		} catch (err) {
			showToast(err.message, 'error');
		}
		saving = false;
	}

	async function createFolder() {
		if (!newFolderName) return;
		saving = true;
		try {
			const formData = new FormData();
			formData.append('parentPath', newFolderParent);
			formData.append('folderName', newFolderName.trim());
			await submitAction('createFolder', formData, '/admin/media');
			showNewFolderModal = false;
			newFolderName = '';
			showToast('Folder created successfully');
			await invalidateAll();
		} catch (err) {
			showToast(err.message, 'error');
		}
		saving = false;
	}

	function startRenameFolder(path) {
		renamingFolder = path;
		newFolderName = path.split('/').pop() || '';
	}

	async function renameFolder() {
		if (!renamingFolder || !newFolderName) return;
		saving = true;
		try {
			const formData = new FormData();
			formData.append('oldFolder', renamingFolder);
			formData.append('newFolderName', newFolderName.trim());
			await submitAction('renameFolder', formData, '/admin/media');
			
			// Adjust activeFolder path if it was renamed
			if (activeFolder === renamingFolder) {
				const parts = renamingFolder.split('/');
				parts[parts.length - 1] = newFolderName.trim();
				await selectFolder(parts.join('/'));
			} else if (activeFolder.startsWith(renamingFolder + '/')) {
				await selectFolder(activeFolder.replace(renamingFolder + '/', newFolderName.trim() + '/'));
			} else {
				await invalidateAll();
			}

			renamingFolder = null;
			newFolderName = '';
			showToast('Folder renamed successfully');
		} catch (err) {
			showToast(err.message, 'error');
		}
		saving = false;
	}

	function startDeleteFolder(path) {
		deletingFolder = path;
	}

	async function deleteFolder() {
		if (!deletingFolder) return;
		saving = true;
		try {
			const formData = new FormData();
			formData.append('folderPath', deletingFolder);
			await submitAction('deleteFolder', formData, '/admin/media');
			if (activeFolder.startsWith(deletingFolder)) {
				await selectFolder('/');
			} else {
				await invalidateAll();
			}
			deletingFolder = null;
			showToast('Folder deleted successfully');
		} catch (err) {
			showToast(err.message, 'error');
		}
		saving = false;
	}

	function copyUrl(url) {
		navigator.clipboard.writeText(displayUrl(url));
		copiedUrl = url;
		setTimeout(() => copiedUrl = '', 2000);
	}

	function isImage(mimeType, filename) {
		return isImageFile(mimeType, filename);
	}

	function displayUrl(url) {
		return inlineImageUrl(url);
	}
</script>

<SeoHead title="Media Library Explorer" noindex={true} />

<!-- Toast Notification -->
{#if toast}
	<div class="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all
		{toast.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/20 border border-rose-500/30 text-rose-300'} animate-in fade-in slide-in-from-top-4 duration-300">
		{#if toast.type === 'success'}<CheckCircle2 size={16} />{:else}<AlertCircle size={16} />{/if}
		{toast.msg}
	</div>
{/if}

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
		<div>
			<h1 class="text-2xl font-bold text-white flex items-center gap-3">
				<Image size={24} class="text-accent-400" />
				Media Library
			</h1>
			<p class="text-surface-400 mt-1">{media.length} files in this directory</p>
		</div>
		
		<div class="flex items-center gap-2">
			<button
				onclick={() => { showNewFolderModal = true; newFolderParent = activeFolder; }}
				class="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-900 border border-surface-800 hover:border-surface-700 text-white font-medium text-sm transition-all"
			>
				<Plus size={16} />
				New Folder
			</button>
			<button
				onclick={() => showUploadModal = true}
				class="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-medium text-sm transition-colors shadow-lg shadow-accent-500/10"
			>
				<Upload size={16} />
				Upload File
			</button>
		</div>
	</div>

	<!-- Main Directory Split Panel -->
	<div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
		
		<!-- Left Sidebar: Collapsible Folders Tree -->
		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-4 space-y-4 h-fit">
			<div class="flex items-center justify-between pb-2 border-b border-surface-800/80">
				<h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider">Directories</h3>
				<span class="text-[10px] text-surface-500 font-mono">{folders.length} folders</span>
			</div>
			
			<div class="space-y-1 max-h-[50vh] lg:max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
				{@render folderNode(folderTree, 0)}
			</div>
		</div>

		<!-- Right Side: Folder content panel -->
		<div class="lg:col-span-3 space-y-6">
			<!-- Filters & Controls -->
			<div class="flex flex-col sm:flex-row gap-4">
				<div class="flex-1 relative">
					<Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search files globally..."
						class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-900 border border-surface-800 text-white placeholder-surface-500 text-sm focus:outline-none focus:border-surface-650 transition-colors"
					/>
				</div>
				<div class="flex gap-2">
					<button onclick={() => viewMode = 'grid'} class="p-2.5 rounded-xl {viewMode === 'grid' ? 'bg-accent-500 text-white' : 'bg-surface-900 text-surface-400'} border border-surface-800 transition-colors">
						<Grid size={18} />
					</button>
					<button onclick={() => viewMode = 'list'} class="p-2.5 rounded-xl {viewMode === 'list' ? 'bg-accent-500 text-white' : 'bg-surface-900 text-surface-400'} border border-surface-800 transition-colors">
						<List size={18} />
					</button>
				</div>
			</div>

			<!-- Breadcrumbs Path -->
			<div class="flex flex-wrap items-center gap-1.5 px-4 py-3 rounded-xl bg-surface-900/50 border border-surface-800/80 text-sm font-medium">
				<button onclick={() => selectFolder('/')} class="text-surface-400 hover:text-white transition-colors flex items-center gap-1">
					<Folder size={14} class="text-accent-400" />
					Root
				</button>
				{#if activeFolder !== '/'}
					{#each activeFolder.split('/') as segment, idx}
						<span class="text-surface-600">/</span>
						{@const path = activeFolder.split('/').slice(0, idx + 1).join('/')}
						{#if idx === activeFolder.split('/').length - 1}
							<span class="text-white font-semibold flex items-center gap-1">
								{segment}
								{#if !isSystemFolder(activeFolder)}
									<span class="flex items-center gap-1 ml-2">
										<button onclick={() => startRenameFolder(activeFolder)} class="p-1 rounded hover:bg-surface-800 text-surface-400 hover:text-white" title="Rename Current Folder">
											<Edit size={12} />
										</button>
										<button onclick={() => startDeleteFolder(activeFolder)} class="p-1 rounded hover:bg-surface-800 text-surface-400 hover:text-rose-400" title="Delete Current Folder">
											<Trash2 size={12} />
										</button>
									</span>
								{/if}
							</span>
						{:else}
							<button onclick={() => selectFolder(path)} class="text-surface-400 hover:text-white transition-colors">{segment}</button>
						{/if}
					{/each}
				{/if}
			</div>

			<!-- Subfolders Grid in current active folder -->
			{#if !searchQuery && currentSubfolders.length > 0}
				<div class="space-y-3">
					<h4 class="text-xs font-bold text-surface-400 uppercase tracking-wider">Subfolders</h4>
					<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
						{#each currentSubfolders as sub}
							{@const subFolderName = sub.split('/').pop()}
							<div
								role="button"
								tabindex="0"
								class="group relative flex items-center justify-between p-3.5 rounded-xl bg-surface-900 border border-surface-800 hover:border-surface-700 transition-all cursor-pointer shadow-sm hover:shadow w-full"
								onclick={() => selectFolder(sub)}
								onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectFolder(sub); } }}
							>
								<div class="flex items-center gap-3 min-w-0">
									<Folder size={18} class="text-accent-400 shrink-0" />
									<span class="text-sm font-semibold text-white truncate">{subFolderName}</span>
								</div>
								
								{#if !isSystemFolder(sub)}
									<div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5" role="presentation" onclick={(e) => e.stopPropagation()}>
										<button type="button" onclick={() => startRenameFolder(sub)} class="p-1 rounded hover:bg-surface-800 text-surface-400 hover:text-white" title="Rename">
											<Edit size={12} />
										</button>
										<button type="button" onclick={() => startDeleteFolder(sub)} class="p-1 rounded hover:bg-surface-800 text-surface-400 hover:text-rose-400" title="Delete">
											<Trash2 size={12} />
										</button>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Media Grid/List for active folder -->
			<div class="space-y-3">
				{#if !searchQuery}
					<h4 class="text-xs font-bold text-surface-400 uppercase tracking-wider">Files ({filteredMedia.length})</h4>
				{/if}

				{#if viewMode === 'grid'}
					<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
						{#each filteredMedia as item}
							<div class="group relative aspect-square rounded-xl bg-surface-900 border border-surface-800 overflow-hidden hover:border-surface-650 transition-all shadow-sm">
								{#if isImage(item.mime_type, item.filename || item.original_filename)}
									<img src={displayUrl(item.url)} alt={item.alt_text || item.filename} class="w-full h-full object-contain bg-surface-950 p-2" />
								{:else}
									<div class="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
										<FolderOpen size={32} class="text-surface-600" />
										<span class="text-[10px] text-surface-500 font-mono text-center truncate w-full">{item.mime_type.split('/').pop()}</span>
									</div>
								{/if}
								
								<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
									<p class="text-xs font-semibold text-white truncate mb-0.5">{item.original_filename}</p>
									<p class="text-[9px] text-surface-400 truncate mb-2">{formatBytes(item.size_bytes)}</p>
									<div class="flex gap-1">
										<button onclick={() => startEdit(item)} class="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white" title="Edit Meta">
											<Edit size={12} />
										</button>
										<button onclick={() => copyUrl(item.url)} class="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white" title="Copy Link">
											{#if copiedUrl === item.url}<Check size={12} />{:else}<Copy size={12} />{/if}
										</button>
										<a href={item.url} target="_blank" class="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white" title="Open Link">
											<ExternalLink size={12} />
										</a>
										<button onclick={() => startDelete(item)} class="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white hover:bg-red-500/30" title="Delete File">
											<Trash2 size={12} />
										</button>
									</div>
								</div>
							</div>
						{:else}
							{#if !currentSubfolders.length}
								<div class="col-span-full p-12 text-center bg-surface-900/40 border border-surface-800 rounded-2xl">
									<Image size={40} class="text-surface-700 mx-auto mb-3" />
									<p class="text-surface-400 text-sm">Folder is empty</p>
								</div>
							{/if}
						{/each}
					</div>
				{:else}
					<div class="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden shadow-sm">
						{#if filteredMedia.length > 0}
							<table class="w-full text-left border-collapse">
								<thead class="bg-surface-800/80">
									<tr>
										<th class="px-6 py-3 text-xs font-bold text-surface-400 uppercase tracking-wider">File</th>
										<th class="px-6 py-3 text-xs font-bold text-surface-400 uppercase tracking-wider">Size</th>
										<th class="px-6 py-3 text-xs font-bold text-surface-400 uppercase tracking-wider">Date</th>
										<th class="px-6 py-3 text-xs font-bold text-surface-400 uppercase tracking-wider text-right">Actions</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-surface-800">
									{#each filteredMedia as item}
										<tr class="hover:bg-surface-800/30 transition-colors">
											<td class="px-6 py-4">
												<div class="flex items-center gap-3">
													{#if isImage(item.mime_type, item.filename || item.original_filename)}
														<img src={displayUrl(item.url)} alt="" class="w-9 h-9 rounded-lg object-contain bg-surface-950 p-0.5 border border-surface-800" />
													{:else}
														<div class="w-9 h-9 rounded-lg bg-surface-800 flex items-center justify-center border border-surface-750">
															<FolderOpen size={16} class="text-surface-500" />
														</div>
													{/if}
													<div class="min-w-0">
														<p class="font-semibold text-white text-sm truncate max-w-[200px] sm:max-w-sm">{item.original_filename}</p>
														<p class="text-[10px] text-surface-500 font-mono truncate">{item.folder}</p>
													</div>
												</div>
											</td>
											<td class="px-6 py-4 text-sm text-surface-400 font-mono">{formatBytes(item.size_bytes)}</td>
											<td class="px-6 py-4 text-sm text-surface-400">{formatDate(item.created_at)}</td>
											<td class="px-6 py-4 text-right">
												<div class="flex items-center justify-end gap-1.5">
													<button onclick={() => startEdit(item)} class="p-1.5 rounded hover:bg-surface-800 text-surface-400 hover:text-white" title="Edit Meta">
														<Edit size={14} />
													</button>
													<button onclick={() => copyUrl(item.url)} class="p-1.5 rounded hover:bg-surface-800 text-surface-400" title="Copy Link">
														{#if copiedUrl === item.url}<Check size={14} class="text-emerald-400" />{:else}<Copy size={14} />{/if}
													</button>
													<a href={item.url} target="_blank" class="p-1.5 rounded hover:bg-surface-800 text-surface-400" title="Open Link">
														<ExternalLink size={14} />
													</a>
													<button onclick={() => startDelete(item)} class="p-1.5 rounded hover:bg-surface-800 text-surface-400 hover:text-rose-400" title="Delete File">
														<Trash2 size={14} />
													</button>
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						{:else}
							{#if !currentSubfolders.length}
								<div class="p-12 text-center">
									<Image size={40} class="text-surface-700 mx-auto mb-3" />
									<p class="text-surface-400 text-sm">Folder is empty</p>
								</div>
							{/if}
						{/if}
					</div>
				{/if}
			</div>
		</div>

	</div>
</div>

<!-- Recursive Folder Node Snippet -->
{#snippet folderNode(node, depth)}
	{@const isExpanded = expandedFolders.has(node.path)}
	{@const hasChildren = Object.keys(node.children).length > 0}
	
	<div class="space-y-1">
		<div class="group flex items-center justify-between rounded-xl transition-all border border-transparent
			{activeFolder === node.path ? 'bg-accent-500/10 text-accent-400 border-accent-500/20' : 'text-surface-300 hover:bg-surface-800/60'}"
		>
			<div class="flex-1 flex items-center min-w-0 py-1.5" style="padding-left: {depth * 14 + 6}px">
				{#if hasChildren}
					<button onclick={() => toggleExpand(node.path)} class="p-0.5 rounded hover:bg-surface-700 text-surface-500 hover:text-white mr-1">
						{#if isExpanded}
							<ChevronDown size={14} />
						{:else}
							<ChevronRight size={14} />
						{/if}
					</button>
				{:else}
					<span class="w-5"></span>
				{/if}
				
				<button onclick={() => selectFolder(node.path)} class="flex-1 flex items-center gap-2 text-left text-sm truncate font-medium">
					{#if activeFolder === node.path}
						<FolderOpen size={15} class="text-accent-400 shrink-0" />
					{:else}
						<Folder size={15} class="text-surface-500 shrink-0" />
					{/if}
					<span class="truncate">{node.name}</span>
				</button>
			</div>

			<!-- Folder Actions (visible on hover) -->
			{#if node.path !== '/' && !isSystemFolder(node.path)}
				<div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 pr-2">
					<button onclick={(e) => { e.stopPropagation(); startRenameFolder(node.path); }} class="p-1 rounded hover:bg-surface-700 text-surface-400 hover:text-white" title="Rename Folder">
						<Edit size={11} />
					</button>
					<button onclick={(e) => { e.stopPropagation(); startDeleteFolder(node.path); }} class="p-1 rounded hover:bg-surface-700 text-surface-400 hover:text-rose-450" title="Delete Folder">
						<Trash2 size={11} />
					</button>
				</div>
			{/if}
		</div>

		{#if hasChildren && isExpanded}
			<div class="space-y-1">
				{#each Object.values(node.children) as child}
					{@render folderNode(child, depth + 1)}
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

<!-- Upload Modal -->
{#if showUploadModal}
	<div role="presentation" tabindex="-1" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onkeydown={(e) => { if (e.key === 'Escape') showUploadModal = false; }} onclick={(e) => { if (e.target === e.currentTarget) showUploadModal = false; }}>
		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-white">Upload to {activeFolder === '/' ? 'Root' : activeFolder}</h3>
				<button onclick={() => showUploadModal = false} class="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400"><X size={18} /></button>
			</div>

			<!-- Upload files -->
			<div class="space-y-3">
				<FileUpload label="Select files" accept="image/*,application/pdf,.svg" bind:files={uploadFiles} path={activeFolder === '/' ? 'media' : activeFolder} />
				{#if uploadFiles.length > 0}
					<div>
						<label for="upload-file-alt" class="block text-xs text-surface-300 mb-1.5">Alt Text</label>
						<input id="upload-file-alt" type="text" bind:value={uploadAltText} placeholder="Describe the upload" class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm" />
					</div>
					<button onclick={handleFileUploaded} disabled={saving} class="w-full px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm transition-colors">
						{saving ? 'Saving...' : 'Save to Library'}
					</button>
				{/if}
			</div>

			<!-- Divider -->
			<div class="flex items-center gap-3">
				<div class="flex-1 h-px bg-surface-700"></div>
				<span class="text-xs text-surface-500">or add by URL</span>
				<div class="flex-1 h-px bg-surface-700"></div>
			</div>

			<!-- Add by URL -->
			<div class="space-y-3">
				<div>
					<label for="upload-url" class="block text-xs text-surface-300 mb-1.5">URL</label>
					<input id="upload-url" type="url" bind:value={urlInput} placeholder="https://..." class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm font-mono focus:outline-none" />
				</div>
				<div>
					<label for="upload-url-alt" class="block text-xs text-surface-300 mb-1.5">Alt Text</label>
					<input id="upload-url-alt" type="text" bind:value={uploadAltText} placeholder="Describe the image" class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
			</div>
			<div class="flex gap-3">
				<button onclick={() => showUploadModal = false} class="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 text-white font-medium text-sm hover:bg-surface-700 transition-colors">Cancel</button>
				<button onclick={uploadByUrl} disabled={saving || !urlInput} class="flex-1 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm transition-colors">{saving ? 'Adding...' : 'Add URL'}</button>
			</div>
		</div>
	</div>
{/if}

<!-- Edit Modal -->
{#if showEditModal && editingMedia}
	<div role="presentation" tabindex="-1" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onkeydown={(e) => { if (e.key === 'Escape') showEditModal = false; }} onclick={(e) => { if (e.target === e.currentTarget) showEditModal = false; }}>
		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-white">Edit Media</h3>
				<button onclick={() => showEditModal = false} class="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400"><X size={18} /></button>
			</div>

			{#if isImage(editingMedia.mime_type, editingMedia.filename || editingMedia.original_filename)}
				<img src={displayUrl(editingMedia.url)} alt={editingMedia.alt_text} class="w-full h-40 object-contain bg-surface-950 rounded-xl p-2" />
			{/if}
			<p class="text-xs text-surface-400 truncate"><strong>File Path:</strong> {editingMedia.folder}/{editingMedia.filename}</p>

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
				<button onclick={() => showEditModal = false} class="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 text-white font-medium text-sm hover:bg-surface-700 transition-colors">Cancel</button>
				<button onclick={saveEdit} disabled={saving} class="flex-1 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm transition-colors">{saving ? 'Saving...' : 'Save'}</button>
			</div>
		</div>
	</div>
{/if}

<!-- File Deletion Confirmation Modal -->
{#if deletingMediaItem}
	<div role="presentation" tabindex="-1" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onkeydown={(e) => { if (e.key === 'Escape') deletingMediaItem = null; }} onclick={(e) => { if (e.target === e.currentTarget) deletingMediaItem = null; }}>
		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-white">Delete File?</h3>
				<button onclick={() => deletingMediaItem = null} class="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400"><X size={18} /></button>
			</div>
			
			<p class="text-sm text-surface-400">
				Are you sure you want to permanently delete <strong>{deletingMediaItem.original_filename || deletingMediaItem.filename}</strong>? This action cannot be undone.
			</p>
			
			{#if isImage(deletingMediaItem.mime_type, deletingMediaItem.filename)}
				<img src={displayUrl(deletingMediaItem.url)} alt="" class="w-full h-32 object-contain bg-surface-950 rounded-xl mb-4 p-2" />
			{/if}
			
			<div class="flex gap-3 pt-2">
				<button onclick={() => deletingMediaItem = null} class="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 text-white font-medium text-sm hover:bg-surface-700 transition-colors">Cancel</button>
				<button onclick={confirmDelete} disabled={saving} class="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-medium text-sm transition-colors">
					{saving ? 'Deleting...' : 'Delete'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- New Folder Modal -->
{#if showNewFolderModal}
	<div role="presentation" tabindex="-1" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onkeydown={(e) => { if (e.key === 'Escape') showNewFolderModal = false; }} onclick={(e) => { if (e.target === e.currentTarget) showNewFolderModal = false; }}>
		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-white">Create New Folder</h3>
				<button onclick={() => showNewFolderModal = false} class="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400"><X size={18} /></button>
			</div>
			<div>
				<label for="new-folder-input" class="block text-xs text-surface-300 mb-1.5">Folder Name</label>
				<input
					id="new-folder-input"
					type="text"
					bind:value={newFolderName}
					placeholder="e.g. logos"
					class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500"
					onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createFolder(); } }}
				/>
			</div>
			<div class="flex justify-end gap-3 pt-2">
				<button onclick={() => showNewFolderModal = false} class="px-4 py-2 rounded-lg bg-surface-800 text-surface-300 text-sm hover:bg-surface-700 transition-colors">Cancel</button>
				<button onclick={createFolder} disabled={saving || !newFolderName} class="px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
					{saving ? 'Creating...' : 'Create'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Rename Folder Modal -->
{#if renamingFolder}
	<div role="presentation" tabindex="-1" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onkeydown={(e) => { if (e.key === 'Escape') renamingFolder = null; }} onclick={(e) => { if (e.target === e.currentTarget) renamingFolder = null; }}>
		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-white">Rename Folder</h3>
				<button onclick={() => renamingFolder = null} class="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400"><X size={18} /></button>
			</div>
			<div>
				<label for="rename-folder-input" class="block text-xs text-surface-300 mb-1.5">New Folder Name</label>
				<input
					id="rename-folder-input"
					type="text"
					bind:value={newFolderName}
					class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500"
					onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); renameFolder(); } }}
				/>
			</div>
			<div class="flex justify-end gap-3 pt-2">
				<button onclick={() => renamingFolder = null} class="px-4 py-2 rounded-lg bg-surface-800 text-surface-300 text-sm hover:bg-surface-700 transition-colors">Cancel</button>
				<button onclick={renameFolder} disabled={saving || !newFolderName} class="px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
					{saving ? 'Renaming...' : 'Rename'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Delete Folder Modal -->
{#if deletingFolder}
	<div role="presentation" tabindex="-1" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onkeydown={(e) => { if (e.key === 'Escape') deletingFolder = null; }} onclick={(e) => { if (e.target === e.currentTarget) deletingFolder = null; }}>
		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-white">Delete Folder?</h3>
				<button onclick={() => deletingFolder = null} class="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400"><X size={18} /></button>
			</div>
			<p class="text-sm text-surface-400">
				Are you sure you want to permanently delete the folder <strong>{deletingFolder}</strong> and all of its contents?
			</p>
			<div class="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5">
				<AlertCircle size={18} class="text-red-400 shrink-0 mt-0.5" />
				<p class="text-xs text-red-300 font-medium leading-relaxed">This will permanently delete all files and nested subfolders inside this directory from storage and the database. This action is irreversible.</p>
			</div>
			<div class="flex justify-end gap-3 pt-2">
				<button onclick={() => deletingFolder = null} class="px-4 py-2 rounded-lg bg-surface-800 text-surface-300 text-sm hover:bg-surface-700 transition-colors">Cancel</button>
				<button onclick={deleteFolder} disabled={saving} class="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">
					{saving ? 'Deleting...' : 'Delete Everything'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Custom scrollbar for premium sidebar look */
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #27272a;
		border-radius: 9999px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #3f3f46;
	}
</style>

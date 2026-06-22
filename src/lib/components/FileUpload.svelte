<script>
	import { Upload, X, File, Loader2 } from '@lucide/svelte';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { optimizeImageUrl } from '$lib/utils/image';

	import { guessMimeType } from '$lib/utils/media.js';

	let { label = 'Upload Files', accept = 'image/*', files = $bindable([]), path = 'misc', onUploaded = null } = $props();

	const client = getSupabaseBrowserClient();
	let uploading = $state(false);
	let dragOver = $state(false);
	let uploadError = $state('');
	const inputId = 'file-upload-' + Math.random().toString(36).substring(2, 9);

	const MAX_FILE_BYTES = 10 * 1024 * 1024; // matches Supabase bucket limit

	let filesToUpload = $state([]);
	let currentUploadIndex = $state(-1);
	let customName = $state('');
	let currentFile = $derived(filesToUpload[currentUploadIndex]);

	function handleUpload(fileList) {
		if (!fileList || fileList.length === 0) return;
		uploadError = '';
		
		const validFiles = [];
		for (const file of fileList) {
			if (file.size > MAX_FILE_BYTES) {
				uploadError = `"${file.name}" exceeds the 10 MB limit.`;
				continue;
			}
			validFiles.push(file);
		}

		if (validFiles.length === 0) return;

		filesToUpload = validFiles;
		currentUploadIndex = 0;
		const filename = validFiles[0].name;
		customName = filename.substring(0, filename.lastIndexOf('.')) || filename;
	}

	async function submitFileName() {
		if (!currentFile) return;
		uploading = true;
		
		const slugName = customName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'file';
		const ext = currentFile.name.split('.').pop();
		const timestamp = Date.now();
		const filePath = `${path}/${timestamp}-${slugName}.${ext}`;
		const contentType = currentFile.type || guessMimeType(currentFile.name);

		try {
			const { data, error } = await client.storage
				.from('uploads')
				.upload(filePath, currentFile, {
					contentType,
					upsert: false
				});

			if (error) {
				console.error('Storage upload error:', error);
				uploadError = `Failed to upload "${currentFile.name}": ${error.message}`;
			} else if (data) {
				const { data: urlData } = client.storage.from('uploads').getPublicUrl(data.path);
				files = [...files, urlData.publicUrl];
			}
		} catch (err) {
			console.error('Upload error:', err);
			uploadError = `Upload failed: ${err.message}`;
		}

		uploading = false;
		nextFile();
	}

	function cancelFileName() {
		nextFile();
	}

	function nextFile() {
		currentUploadIndex++;
		if (currentUploadIndex < filesToUpload.length) {
			const nextFile = filesToUpload[currentUploadIndex];
			customName = nextFile.name.substring(0, nextFile.name.lastIndexOf('.')) || nextFile.name;
		} else {
			filesToUpload = [];
			currentUploadIndex = -1;
			if (onUploaded && files.length > 0) {
				onUploaded([...files]);
			}
		}
	}

	function handleDrop(e) {
		e.preventDefault();
		dragOver = false;
		handleUpload(e.dataTransfer.files);
	}

	async function removeFile(index) {
		const fileUrl = files[index];
		files = files.filter((_, i) => i !== index);

		if (fileUrl) {
			const marker = '/storage/v1/object/public/uploads/';
			const idx = fileUrl.indexOf(marker);
			if (idx !== -1) {
				const filePath = fileUrl.substring(idx + marker.length);
				try {
					const { error } = await client.storage.from('uploads').remove([filePath]);
					if (error) {
						console.error('Failed to delete file from storage:', error);
					}
				} catch (err) {
					console.error('Error deleting file:', err);
				}
			}
		}
	}

	function isImage(url) {
		return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url);
	}
</script>

<div>
	<label for={inputId} class="block text-sm text-surface-300 mb-1.5">{label}</label>

	<!-- Drop zone -->
	<div
		class="relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
			{dragOver ? 'border-accent-500 bg-accent-500/5' : 'border-surface-700 hover:border-surface-600'}"
	>
		<input
			id={inputId}
			type="file"
			accept={accept}
			multiple
			class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
			onchange={(e) => handleUpload(e.target.files)}
			ondragover={(e) => { e.preventDefault(); dragOver = true; }}
			ondragleave={() => dragOver = false}
			ondrop={handleDrop}
		/>
		{#if uploading}
			<div class="flex items-center justify-center gap-2 text-accent-400">
				<Loader2 size={20} class="animate-spin" />
				<span class="text-sm">Uploading...</span>
			</div>
		{:else}
			<div class="flex flex-col items-center gap-2 text-surface-500">
				<Upload size={24} />
				<span class="text-sm">Drop files here or click to upload</span>
			</div>
		{/if}
	</div>
	
	{#if uploadError}
		<div class="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg flex items-center justify-between">
			<span>{uploadError}</span>
			<button type="button" onclick={() => uploadError = ''} class="text-red-400 hover:text-red-300 ml-2" aria-label="Dismiss error">
				<X size={12} />
			</button>
		</div>
	{/if}

	<!-- Preview uploaded files -->
	{#if files.length > 0}
		<div class="mt-3 space-y-2">
			{#each files as fileUrl, i}
				<div class="flex items-center gap-3 p-2 rounded-lg bg-surface-800 border border-surface-700">
					{#if isImage(fileUrl)}
						<img src={optimizeImageUrl(fileUrl, { width: 100, quality: 80 })} alt="Upload" class="w-10 h-10 rounded object-cover" />
					{:else}
						<div class="w-10 h-10 rounded bg-surface-700 flex items-center justify-center">
							<File size={16} class="text-surface-400" />
						</div>
					{/if}
					<a href={fileUrl} target="_blank" rel="noopener noreferrer" class="flex-1 text-xs text-surface-300 hover:text-accent-400 truncate">
						{fileUrl.split('/').pop()}
					</a>
					<button
						type="button"
						onclick={() => removeFile(i)}
						class="p-1 rounded hover:bg-red-500/10 text-surface-500 hover:text-red-400"
						aria-label="Remove file"
					>
						<X size={14} />
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Rename Modal Overlay -->
{#if currentUploadIndex !== -1 && currentFile}
	<div class="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
		<div class="w-full max-w-md bg-surface-900 border border-surface-700 rounded-2xl p-6 shadow-2xl space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-white">Rename Upload</h3>
				<button type="button" onclick={() => { filesToUpload = []; currentUploadIndex = -1; }} class="p-1 rounded-lg hover:bg-surface-800 text-surface-400">
					<X size={18} />
				</button>
			</div>
			
			<p class="text-xs text-surface-400">
				Set a friendly name for <strong>{currentFile.name}</strong>.
			</p>
			
			<div>
				<label for="custom-filename-input" class="block text-xs text-surface-300 mb-1.5">Filename (no extension)</label>
				<input
					id="custom-filename-input"
					type="text"
					bind:value={customName}
					placeholder="Enter filename"
					class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500"
					onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitFileName(); } }}
				/>
			</div>
			
			<div class="flex justify-end gap-3 pt-2">
				<button type="button" onclick={cancelFileName} class="px-4 py-2 rounded-lg bg-surface-800 text-surface-300 text-sm hover:bg-surface-700 transition-colors">
					Skip
				</button>
				<button type="button" onclick={submitFileName} disabled={uploading} class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
					{#if uploading}
						<Loader2 size={14} class="animate-spin" />
						Uploading...
					{:else}
						Upload
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

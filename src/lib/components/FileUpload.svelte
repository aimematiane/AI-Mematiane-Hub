<script>
	import { Upload, X, File, Loader2 } from '@lucide/svelte';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';

	let { label = 'Upload Files', accept = 'image/*', files = $bindable([]), path = 'misc' } = $props();

	const client = getSupabaseBrowserClient();
	let uploading = $state(false);
	let dragOver = $state(false);

	async function handleUpload(fileList) {
		if (!fileList || fileList.length === 0) return;
		uploading = true;

		for (const file of fileList) {
			const ext = file.name.split('.').pop();
			const timestamp = Date.now();
			const randomStr = Math.random().toString(36).substring(2, 8);
			const filePath = `${path}/${timestamp}-${randomStr}.${ext}`;

			const { data, error } = await client.storage
				.from('uploads')
				.upload(filePath, file, {
					contentType: file.type,
					upsert: false
				});

			if (!error && data) {
				const { data: urlData } = client.storage.from('uploads').getPublicUrl(data.path);
				files = [...files, urlData.publicUrl];
			}
		}
		uploading = false;
	}

	function handleDrop(e) {
		e.preventDefault();
		dragOver = false;
		handleUpload(e.dataTransfer.files);
	}

	function removeFile(index) {
		files = files.filter((_, i) => i !== index);
	}

	function isImage(url) {
		return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url);
	}
</script>

<div>
	<label class="block text-sm text-surface-300 mb-1.5">{label}</label>

	<!-- Drop zone -->
	<div
		class="relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
			{dragOver ? 'border-accent-500 bg-accent-500/5' : 'border-surface-700 hover:border-surface-600'}"
		ondragover={(e) => { e.preventDefault(); dragOver = true; }}
		ondragleave={() => dragOver = false}
		ondrop={handleDrop}
	>
		<input
			type="file"
			accept={accept}
			multiple
			class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
			onchange={(e) => handleUpload(e.target.files)}
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

	<!-- Preview uploaded files -->
	{#if files.length > 0}
		<div class="mt-3 space-y-2">
			{#each files as fileUrl, i}
				<div class="flex items-center gap-3 p-2 rounded-lg bg-surface-800 border border-surface-700">
					{#if isImage(fileUrl)}
						<img src={fileUrl} alt="Upload" class="w-10 h-10 rounded object-cover" />
					{:else}
						<div class="w-10 h-10 rounded bg-surface-700 flex items-center justify-center">
							<File size={16} class="text-surface-400" />
						</div>
					{/if}
					<a href={fileUrl} target="_blank" rel="noopener noreferrer" class="flex-1 text-xs text-surface-300 hover:text-accent-400 truncate">
						{fileUrl.split('/').pop()}
					</a>
					<button
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

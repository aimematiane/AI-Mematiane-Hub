<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import { Mail, Shield, Bookmark, Calendar, Upload, X } from '@lucide/svelte';
	import { invalidateAll } from '$app/navigation';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { isAdminRole } from '$lib/utils/roles.js';

	let { data } = $props();
	const client = getSupabaseBrowserClient();
	const siteName = $derived(data.site?.site_name || 'this site');

	let displayName = $state('');
	let avatarUrl = $state('');
	let saving = $state(false);
	let saved = $state(false);
	let uploadingAvatar = $state(false);
	let avatarUploadError = $state('');

	$effect(() => {
		displayName = data.profile?.display_name || '';
		avatarUrl = data.profile?.avatar_url || '';
	});

	async function handleSave() {
		saving = true;
		saved = false;
		const { error } = await client
			.from('profiles')
			.update({ display_name: displayName, avatar_url: avatarUrl })
			.eq('id', data.user.id);
		if (!error) {
			saved = true;
			await invalidateAll();
		}
		saving = false;
	}

	let fileToUpload = $state(null);
	let customAvatarName = $state('');
	let showAvatarRenameModal = $state(false);

	function startAvatarUpload(files) {
		if (!files || files.length === 0) return;
		fileToUpload = files[0];
		const defaultName = fileToUpload.name.substring(0, fileToUpload.name.lastIndexOf('.')) || fileToUpload.name;
		customAvatarName = defaultName;
		showAvatarRenameModal = true;
	}

	async function confirmAvatarUpload() {
		if (!fileToUpload) return;
		showAvatarRenameModal = false;
		uploadingAvatar = true;
		avatarUploadError = '';

		try {
			const slugName = customAvatarName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'avatar';
			const ext = fileToUpload.name.split('.').pop();
			const timestamp = Date.now();
			const filePath = `profile-images/${data.user.id}/${timestamp}-${slugName}.${ext}`;

			const { data: uploadData, error: uploadError } = await client.storage
				.from('uploads')
				.upload(filePath, fileToUpload, {
					contentType: fileToUpload.type,
					upsert: true // Overwrite previous profile image
				});

			if (uploadError) {
				console.error('Storage upload error:', uploadError);
				avatarUploadError = `Failed to upload image: ${uploadError.message}`;
				uploadingAvatar = false;
				return;
			}

			if (uploadData) {
				const { data: urlData } = client.storage.from('uploads').getPublicUrl(uploadData.path);
				avatarUrl = urlData.publicUrl;
				
				// Immediately update local profile object so UI reflects the new image without page refresh
				data.profile = {
					...data.profile,
					avatar_url: avatarUrl
				};
				
				const { error: updateError } = await client
					.from('profiles')
					.update({ avatar_url: avatarUrl })
					.eq('id', data.user.id);
				
				if (updateError) {
					avatarUploadError = 'Uploaded but failed to save. Try manual save.';
				} else {
					saved = true;
					await invalidateAll();
					setTimeout(() => { saved = false; }, 3000);
				}
			}
		} catch (err) {
			console.error('Avatar upload error:', err);
			avatarUploadError = err.message || 'Upload failed';
		} finally {
			uploadingAvatar = false;
			fileToUpload = null;
		}
	}

	function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
</script>

<SeoHead title="Profile" description={`Your ${siteName} profile`} url="/profile" noindex={true} />

<section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<Breadcrumbs items={[
		{ label: 'Home', href: '/' },
		{ label: 'Profile' }
	]} />

	<h1 class="text-3xl font-bold text-white mb-8">Profile</h1>

	<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-6">
		<!-- User Info -->
		<div class="flex items-center gap-4 pb-6 border-b border-surface-800">
			<UserAvatar src={avatarUrl || data.profile?.avatar_url} alt="" size="xl" class="bg-accent-500/20" iconClass="text-accent-400" />
			<div>
				<h2 class="text-lg font-semibold text-white">{displayName || data.profile?.display_name || 'User'}</h2>
				<div class="flex items-center gap-3 text-sm text-surface-400">
					<span class="inline-flex items-center gap-1"><Mail size={12} />{data.user.email}</span>
					{#if isAdminRole(data.profile?.role)}
						<span class="inline-flex items-center gap-1 text-amber-400"><Shield size={12} />Admin</span>
					{/if}
				</div>
				<p class="text-xs text-surface-500 mt-1 inline-flex items-center gap-1"><Calendar size={10} />Joined {formatDate(data.profile?.created_at)}</p>
			</div>
		</div>

		<!-- Edit Form -->
		<form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="space-y-4">
			<div>
				<label for="displayName" class="block text-sm text-surface-300 mb-1.5">Display Name</label>
				<input id="displayName" type="text" bind:value={displayName}
					class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 text-sm" />
			</div>

			<!-- Profile Image Upload -->
			<div class="p-4 rounded-xl bg-surface-800/50 border border-surface-700 space-y-3">
				<h3 class="text-sm font-semibold text-white flex items-center gap-2">
					<Upload size={16} class="text-accent-400" />
					Upload Profile Image
				</h3>
				<p class="text-xs text-surface-400">
					Upload a new profile picture (JPG, PNG, WebP). It may be shown publicly next to your posts and comments.
				</p>
				<div class="relative">
					<label for="profileImageInput" class="block border-2 border-dashed border-surface-700 rounded-xl p-6 text-center cursor-pointer hover:border-surface-600 transition-all">
						<input 
							id="profileImageInput"
							type="file" 
							accept="image/jpeg,image/png,image/webp"
							class="hidden"
							disabled={uploadingAvatar}
							onchange={(e) => {
								const files = e.target.files;
								if (files && files.length > 0) {
									const fileArray = Array.from(files);
									startAvatarUpload(fileArray);
									e.target.value = '';
								}
							}}
						/>
						{#if uploadingAvatar}
							<div class="flex items-center justify-center gap-2 text-accent-400">
								<div class="w-4 h-4 border-2 border-accent-400 border-t-transparent rounded-full animate-spin"></div>
								<span class="text-sm">Uploading...</span>
							</div>
						{:else}
							<div class="flex flex-col items-center gap-2 text-surface-500">
								<Upload size={20} />
								<span class="text-sm">Click to upload or drag file</span>
								<span class="text-xs text-surface-600">JPG, PNG, or WebP (max 5MB)</span>
							</div>
						{/if}
					</label>
				</div>
				{#if avatarUploadError}
					<div class="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
						{avatarUploadError}
					</div>
				{/if}
			</div>

			<div>
				<label for="avatarUrl" class="block text-sm text-surface-300 mb-1.5">Avatar URL (or paste external URL)</label>
				<input id="avatarUrl" type="url" bind:value={avatarUrl} placeholder="https://example.com/avatar.jpg"
					class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 text-sm" />
			</div>
			<div class="flex items-center gap-3">
				<button type="submit" disabled={saving}
					class="px-6 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm transition-colors">
					{saving ? 'Saving...' : 'Save Changes'}
				</button>
				{#if saved}
					<span class="text-sm text-emerald-400">Saved!</span>
				{/if}
			</div>
		</form>
	</div>

	<!-- Quick Links -->
	<div class="mt-8">
		<h3 class="text-lg font-semibold text-white mb-4">Quick Links</h3>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<a href="/profile/bookmarks" class="p-4 rounded-xl bg-surface-900 border border-surface-800 hover:border-accent-500/30 transition-all flex items-center gap-3">
				<Bookmark size={18} class="text-accent-400" />
				<div>
					<p class="text-sm font-medium text-white">My Bookmarks</p>
					<p class="text-xs text-surface-400">View saved articles and tools</p>
				</div>
			</a>
			{#if isAdminRole(data.profile?.role)}
				<a href="/admin" class="p-4 rounded-xl bg-surface-900 border border-surface-800 hover:border-amber-500/30 transition-all flex items-center gap-3">
					<Shield size={18} class="text-amber-400" />
					<div>
						<p class="text-sm font-medium text-white">Admin Dashboard</p>
						<p class="text-xs text-surface-400">Manage content & tools</p>
					</div>
				</a>
			{/if}
		</div>
	</div>
</section>

<!-- Avatar Rename Modal -->
{#if showAvatarRenameModal && fileToUpload}
	<div class="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
		<div class="w-full max-w-md bg-surface-900 border border-surface-700 rounded-2xl p-6 shadow-2xl space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-white">Rename Profile Image</h3>
				<button type="button" onclick={() => { showAvatarRenameModal = false; fileToUpload = null; }} class="p-1 rounded-lg hover:bg-surface-800 text-surface-400">
					<X size={18} />
				</button>
			</div>
			
			<p class="text-xs text-surface-400">
				Set a friendly name for your new profile picture <strong>{fileToUpload.name}</strong>.
			</p>
			
			<div>
				<label for="avatar-filename-input" class="block text-xs text-surface-300 mb-1.5">Filename (no extension)</label>
				<input
					id="avatar-filename-input"
					type="text"
					bind:value={customAvatarName}
					placeholder="Enter filename"
					class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500"
					onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmAvatarUpload(); } }}
				/>
			</div>
			
			<div class="flex justify-end gap-3 pt-2">
				<button type="button" onclick={() => { showAvatarRenameModal = false; fileToUpload = null; }} class="px-4 py-2 rounded-lg bg-surface-800 text-surface-300 text-sm hover:bg-surface-700 transition-colors">
					Cancel
				</button>
				<button type="button" onclick={confirmAvatarUpload} disabled={uploadingAvatar} class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
					{#if uploadingAvatar}
						<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						Uploading...
					{:else}
						Upload
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

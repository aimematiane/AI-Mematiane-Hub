<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import { Mail, Shield, Bookmark, Calendar, Upload } from '@lucide/svelte';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';

	let { data } = $props();
	const client = getSupabaseBrowserClient();

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
		if (!error) saved = true;
		saving = false;
	}

	async function handleAvatarUpload(files) {
		if (!files || files.length === 0) return;
		
		const file = files[0]; // Only use first file

		// Client-side validation: type + size
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			avatarUploadError = 'Please upload a JPG, PNG, or WebP image.';
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			avatarUploadError = 'Image is too large (max 5MB).';
			return;
		}

		uploadingAvatar = true;
		avatarUploadError = '';

		try {
			const ext = file.name.split('.').pop();
			const timestamp = Date.now();
			const randomStr = Math.random().toString(36).substring(2, 8);
			const filePath = `profile-images/${data.user.id}/${timestamp}-${randomStr}.${ext}`;

			const { data: uploadData, error: uploadError } = await client.storage
				.from('uploads')
				.upload(filePath, file, {
					contentType: file.type,
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
				
				// Auto-save the new avatar URL
				const { error: updateError } = await client
					.from('profiles')
					.update({ avatar_url: avatarUrl })
					.eq('id', data.user.id);
				
				if (updateError) {
					avatarUploadError = 'Uploaded but failed to save. Try manual save.';
				} else {
					saved = true;
					setTimeout(() => { saved = false; }, 3000);
				}
			}
		} catch (err) {
			console.error('Avatar upload error:', err);
			avatarUploadError = err.message || 'Upload failed';
		} finally {
			uploadingAvatar = false;
		}
	}

	function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
</script>

<SeoHead title="Profile" description="Your AI Mematiane profile" url="/profile" noindex={true} />

<section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<Breadcrumbs items={[
		{ label: 'Home', href: '/' },
		{ label: 'Profile' }
	]} />

	<h1 class="text-3xl font-bold text-white mb-8">Profile</h1>

	<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-6">
		<!-- User Info -->
		<div class="flex items-center gap-4 pb-6 border-b border-surface-800">
			<Avatar src={avatarUrl || data.profile?.avatar_url} name={displayName || data.profile?.display_name} size={72} />
			<div>
				<h2 class="text-lg font-semibold text-white">{data.profile?.display_name || 'User'}</h2>
				<div class="flex items-center gap-3 text-sm text-surface-400">
					<span class="inline-flex items-center gap-1"><Mail size={12} />{data.user.email}</span>
					{#if data.profile?.role === 'admin'}
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
					Upload a new profile picture (JPG, PNG, WebP). Only you can access this image.
				</p>
				<div class="relative">
					<label for="profileImageInput" class="block border-2 border-dashed border-surface-700 rounded-xl p-6 text-center cursor-pointer hover:border-surface-600 transition-all">
						<input 
							id="profileImageInput"
							type="file" 
							accept="image/jpeg,image/png,image/webp"
							class="hidden"
							disabled={uploadingAvatar}
							onchange={async (e) => {
								const files = e.target.files;
								if (files && files.length > 0) {
									const fileArray = Array.from(files);
									await handleAvatarUpload(fileArray);
									// Reset input
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
			{#if data.profile?.role === 'admin'}
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

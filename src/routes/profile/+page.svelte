<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { User, Mail, Shield, Bookmark, Calendar } from '@lucide/svelte';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';

	let { data } = $props();
	const client = getSupabaseBrowserClient();

	let displayName = $state(data.profile?.display_name || '');
	let avatarUrl = $state(data.profile?.avatar_url || '');
	let saving = $state(false);
	let saved = $state(false);

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

	function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
</script>

<SeoHead title="Profile" description="Your AI Mematiane profile" url="/profile" />

<section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<h1 class="text-3xl font-bold text-white mb-8">Profile</h1>

	<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-6">
		<!-- User Info -->
		<div class="flex items-center gap-4 pb-6 border-b border-surface-800">
			{#if data.profile?.avatar_url}
				<img src={data.profile.avatar_url} alt="" class="w-16 h-16 rounded-full" />
			{:else}
				<div class="w-16 h-16 rounded-full bg-accent-500/20 flex items-center justify-center">
					<User size={28} class="text-accent-400" />
				</div>
			{/if}
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
			<div>
				<label for="avatarUrl" class="block text-sm text-surface-300 mb-1.5">Avatar URL</label>
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

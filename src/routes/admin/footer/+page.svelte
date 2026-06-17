<script>
	import { invalidateAll } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { SOCIAL_ICONS, SOCIAL_ICON_KEYS } from '$lib/utils/socialIcons.js';
	import { Layers, Plus, Trash2, Save, ExternalLink, Share2, Eye, EyeOff, Edit } from '@lucide/svelte';

	let { data } = $props();

	let settings = $state(data.settings);
	let columns = $state(data.columns);
	let socialLinks = $state(data.socialLinks);
	let saving = $state(false);

	// Modal states
	let showColumnForm = $state(false);
	let showLinkForm = $state(false);
	let showSocialForm = $state(false);
	let showEditSocialForm = $state(false);

	// Form data
	let activeColumnId = $state(null);
	let newColumn = $state({ title: '' });
	let newLink = $state({ label: '', url: '', is_external: false });
	let newSocial = $state({ platform: '', label: '', url: '', icon_key: 'link', is_visible: true });
	let editingSocial = $state(null);

	// Re-sync whenever server data refreshes
	$effect(() => {
		settings = data.settings;
		columns = data.columns;
		socialLinks = data.socialLinks;
	});

	function handleSettingInput(id, value) {
		settings = settings.map(s => s.id === id ? { ...s, value } : s);
	}

	async function saveSettings() {
		saving = true;
		const formData = new FormData();
		formData.append('settings', JSON.stringify(settings));
		await fetch('?/updateSettings', { method: 'POST', body: formData });
		saving = false;
		await invalidateAll();
	}

	async function createColumn() {
		const formData = new FormData();
		formData.append('title', newColumn.title);
		formData.append('sort_order', columns.length.toString());
		await fetch('?/createColumn', { method: 'POST', body: formData });
		showColumnForm = false;
		newColumn = { title: '' };
		await invalidateAll();
	}

	async function deleteColumn(id) {
		if (!confirm('Delete this column and all its links?')) return;
		const formData = new FormData();
		formData.append('id', id);
		await fetch('?/deleteColumn', { method: 'POST', body: formData });
		await invalidateAll();
	}

	async function createLink() {
		const formData = new FormData();
		formData.append('column_id', activeColumnId);
		formData.append('label', newLink.label);
		formData.append('url', newLink.url);
		formData.append('is_external', newLink.is_external.toString());
		formData.append('sort_order', '0');
		await fetch('?/createLink', { method: 'POST', body: formData });
		showLinkForm = false;
		newLink = { label: '', url: '', is_external: false };
		await invalidateAll();
	}

	async function deleteLink(id) {
		const formData = new FormData();
		formData.append('id', id);
		await fetch('?/deleteLink', { method: 'POST', body: formData });
		await invalidateAll();
	}

	// Social link actions
	async function createSocialLink() {
		const formData = new FormData();
		formData.append('platform', newSocial.platform);
		formData.append('label', newSocial.label);
		formData.append('url', newSocial.url);
		formData.append('icon_key', newSocial.icon_key);
		formData.append('sort_order', socialLinks.length.toString());
		formData.append('is_visible', newSocial.is_visible.toString());
		await fetch('?/createSocialLink', { method: 'POST', body: formData });
		showSocialForm = false;
		newSocial = { platform: '', label: '', url: '', icon_key: 'link', is_visible: true };
		await invalidateAll();
	}

	async function updateSocialLink() {
		if (!editingSocial) return;
		const formData = new FormData();
		formData.append('id', editingSocial.id);
		formData.append('platform', editingSocial.platform);
		formData.append('label', editingSocial.label);
		formData.append('url', editingSocial.url);
		formData.append('icon_key', editingSocial.icon_key);
		formData.append('is_visible', editingSocial.is_visible.toString());
		await fetch('?/updateSocialLink', { method: 'POST', body: formData });
		showEditSocialForm = false;
		editingSocial = null;
		await invalidateAll();
	}

	async function deleteSocialLink(id) {
		if (!confirm('Delete this social link?')) return;
		const formData = new FormData();
		formData.append('id', id);
		await fetch('?/deleteSocialLink', { method: 'POST', body: formData });
		await invalidateAll();
	}

	async function toggleSocialVisibility(link) {
		const formData = new FormData();
		formData.append('id', link.id);
		formData.append('platform', link.platform);
		formData.append('label', link.label);
		formData.append('url', link.url);
		formData.append('icon_key', link.icon_key);
		formData.append('is_visible', (!link.is_visible).toString());
		await fetch('?/updateSocialLink', { method: 'POST', body: formData });
		await invalidateAll();
	}

	function openEditSocial(link) {
		editingSocial = { ...link };
		showEditSocialForm = true;
	}
</script>

<SeoHead title="Footer Management" noindex={true} />

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold text-white flex items-center gap-3">
				<Layers size={24} class="text-accent-400" />
				Footer Management
			</h1>
			<p class="text-surface-400 mt-1">Configure footer content, columns, and social links</p>
		</div>
	</div>

	<!-- Settings Section -->
	<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 mb-6">
		<h2 class="text-lg font-semibold text-white mb-4">Footer Settings</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each settings as setting}
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">{setting.display_name}</label>
					{#if setting.key.includes('enabled')}
						<label class="flex items-center gap-2 cursor-pointer">
							<input type="checkbox" checked={setting.value === 'true'} onchange={(e) => handleSettingInput(setting.id, e.target.checked ? 'true' : 'false')} class="rounded bg-surface-800 border-surface-600 text-accent-500" />
							<span class="text-sm text-surface-400">Enabled</span>
						</label>
					{:else}
						<textarea value={setting.value || ''} oninput={(e) => handleSettingInput(setting.id, e.target.value)} rows="2" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm resize-none"></textarea>
					{/if}
				</div>
			{/each}
		</div>
		<button onclick={saveSettings} disabled={saving} class="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm">
			<Save size={16} />
			{saving ? 'Saving...' : 'Save Settings'}
		</button>
	</div>

	<!-- Social Links Section -->
	<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 mb-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-white flex items-center gap-2">
				<Share2 size={20} />
				Social Links
			</h2>
			<button onclick={() => showSocialForm = true} class="flex items-center gap-1 text-sm text-accent-400 hover:text-accent-300">
				<Plus size={14} />
				Add Social Link
			</button>
		</div>

		{#if socialLinks.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{#each socialLinks as link}
					<div class="p-4 rounded-xl bg-surface-800 border border-surface-700 flex items-start justify-between">
						<div class="flex items-center gap-3">
							<div class="p-2 rounded-lg bg-surface-700">
								{@html SOCIAL_ICONS[link.icon_key]?.svg || SOCIAL_ICONS.link.svg}
							</div>
							<div>
								<p class="font-medium text-white">{link.platform}</p>
								<p class="text-xs text-surface-500 truncate max-w-[120px]">{link.url}</p>
								{#if !link.is_visible}
									<span class="text-xs text-amber-400">Hidden</span>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-1">
							<button onclick={() => toggleSocialVisibility(link)} class="p-1.5 rounded hover:bg-surface-600 text-surface-400 hover:text-white" title={link.is_visible ? 'Hide' : 'Show'}>
								{#if link.is_visible}<Eye size={14} />{:else}<EyeOff size={14} />{/if}
							</button>
							<button onclick={() => openEditSocial(link)} class="p-1.5 rounded hover:bg-surface-600 text-surface-400 hover:text-white" title="Edit">
								<Edit size={14} />
							</button>
							<button onclick={() => deleteSocialLink(link.id)} class="p-1.5 rounded hover:bg-surface-600 text-surface-400 hover:text-rose-400" title="Delete">
								<Trash2 size={14} />
							</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="p-6 text-center">
				<Share2 size={32} class="text-surface-700 mx-auto mb-2" />
				<p class="text-surface-500 text-sm">No social links yet. Add your first social link.</p>
			</div>
		{/if}
	</div>

	<!-- Footer Columns -->
	<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-white">Footer Columns</h2>
			<button onclick={() => showColumnForm = true} class="flex items-center gap-1 text-sm text-accent-400 hover:text-accent-300">
				<Plus size={14} />
				Add Column
			</button>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each columns as column}
				<div class="p-4 rounded-xl bg-surface-800 border border-surface-700">
					<div class="flex items-center justify-between mb-3">
						<h3 class="font-medium text-white">{column.title}</h3>
						<button onclick={() => deleteColumn(column.id)} class="p-1 rounded hover:bg-surface-700 text-surface-400 hover:text-rose-400">
							<Trash2 size={14} />
						</button>
					</div>
					<ul class="space-y-2">
						{#each column.links?.sort((a, b) => a.sort_order - b.sort_order) || [] as link}
							<li class="flex items-center justify-between group">
								<div class="flex items-center gap-2 text-sm text-surface-300">
									<span>{link.label}</span>
									{#if link.is_external}<ExternalLink size={10} />{/if}
								</div>
								<button onclick={() => deleteLink(link.id)} class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-700 text-surface-400 hover:text-rose-400">
									<Trash2 size={12} />
								</button>
							</li>
						{/each}
					</ul>
					<button onclick={() => { activeColumnId = column.id; showLinkForm = true; }} class="mt-3 w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-surface-400 hover:text-white text-xs transition-colors">
						<Plus size={12} />
						Add Link
					</button>
				</div>
			{/each}
		</div>

		{#if columns.length === 0}
			<div class="p-8 text-center">
				<p class="text-surface-500 mb-4">No footer columns yet. Create your first column.</p>
				<button onclick={() => showColumnForm = true} class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 text-white font-medium text-sm">
					<Plus size={16} />
					Add Column
				</button>
			</div>
		{/if}
	</div>
</div>

<!-- Column Form Modal -->
{#if showColumnForm}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={(e) => { if (e.target === e.currentTarget) showColumnForm = false; }}>
		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-md">
			<h3 class="text-lg font-semibold text-white mb-4">Add Footer Column</h3>
			<div>
				<label class="block text-sm text-surface-300 mb-1.5">Column Title</label>
				<input type="text" bind:value={newColumn.title} placeholder="e.g. Quick Links" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
			</div>
			<div class="flex gap-3 mt-6">
				<button onclick={() => showColumnForm = false} class="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 text-white font-medium text-sm">Cancel</button>
				<button onclick={createColumn} disabled={!newColumn.title} class="flex-1 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm">Create</button>
			</div>
		</div>
	</div>
{/if}

<!-- Link Form Modal -->
{#if showLinkForm}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={(e) => { if (e.target === e.currentTarget) showLinkForm = false; }}>
		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-md">
			<h3 class="text-lg font-semibold text-white mb-4">Add Footer Link</h3>
			<div class="space-y-4">
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">Label</label>
					<input type="text" bind:value={newLink.label} placeholder="e.g. About Us" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">URL</label>
					<input type="text" bind:value={newLink.url} placeholder="/about or https://..." class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
				<label class="flex items-center gap-2 cursor-pointer">
					<input type="checkbox" bind:checked={newLink.is_external} class="rounded bg-surface-800 border-surface-600 text-accent-500" />
					<span class="text-sm text-surface-300">External Link</span>
				</label>
			</div>
			<div class="flex gap-3 mt-6">
				<button onclick={() => showLinkForm = false} class="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 text-white font-medium text-sm">Cancel</button>
				<button onclick={createLink} disabled={!newLink.label || !newLink.url} class="flex-1 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm">Add</button>
			</div>
		</div>
	</div>
{/if}

<!-- Add Social Link Modal -->
{#if showSocialForm}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={(e) => { if (e.target === e.currentTarget) showSocialForm = false; }}>
		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-md">
			<h3 class="text-lg font-semibold text-white mb-4">Add Social Link</h3>
			<div class="space-y-4">
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">Platform Name</label>
					<input type="text" bind:value={newSocial.platform} placeholder="e.g. GitHub" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">Display Label</label>
					<input type="text" bind:value={newSocial.label} placeholder="e.g. Follow us on GitHub" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">URL</label>
					<input type="text" bind:value={newSocial.url} placeholder="https://github.com/..." class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">Icon</label>
					<div class="grid grid-cols-6 gap-2 p-3 rounded-xl bg-surface-800 border border-surface-700">
						{#each SOCIAL_ICON_KEYS as key}
							<button
								type="button"
								onclick={() => newSocial.icon_key = key}
								class="p-2 rounded-lg flex items-center justify-center transition-colors {newSocial.icon_key === key ? 'bg-accent-500 text-white' : 'bg-surface-700 text-surface-400 hover:bg-surface-600'}"
								title={SOCIAL_ICONS[key].label}
							>
								{@html SOCIAL_ICONS[key].svg}
							</button>
						{/each}
					</div>
				</div>
				<label class="flex items-center gap-2 cursor-pointer">
					<input type="checkbox" bind:checked={newSocial.is_visible} class="rounded bg-surface-800 border-surface-600 text-accent-500" />
					<span class="text-sm text-surface-300">Visible in footer</span>
				</label>
			</div>
			<div class="flex gap-3 mt-6">
				<button onclick={() => showSocialForm = false} class="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 text-white font-medium text-sm">Cancel</button>
				<button onclick={createSocialLink} disabled={!newSocial.platform || !newSocial.url} class="flex-1 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm">Add</button>
			</div>
		</div>
	</div>
{/if}

<!-- Edit Social Link Modal -->
{#if showEditSocialForm && editingSocial}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={(e) => { if (e.target === e.currentTarget) showEditSocialForm = false; }}>
		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-md">
			<h3 class="text-lg font-semibold text-white mb-4">Edit Social Link</h3>
			<div class="space-y-4">
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">Platform Name</label>
					<input type="text" bind:value={editingSocial.platform} class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">Display Label</label>
					<input type="text" bind:value={editingSocial.label} class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">URL</label>
					<input type="text" bind:value={editingSocial.url} class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">Icon</label>
					<div class="grid grid-cols-6 gap-2 p-3 rounded-xl bg-surface-800 border border-surface-700">
						{#each SOCIAL_ICON_KEYS as key}
							<button
								type="button"
								onclick={() => editingSocial.icon_key = key}
								class="p-2 rounded-lg flex items-center justify-center transition-colors {editingSocial.icon_key === key ? 'bg-accent-500 text-white' : 'bg-surface-700 text-surface-400 hover:bg-surface-600'}"
								title={SOCIAL_ICONS[key].label}
							>
								{@html SOCIAL_ICONS[key].svg}
							</button>
						{/each}
					</div>
				</div>
				<label class="flex items-center gap-2 cursor-pointer">
					<input type="checkbox" bind:checked={editingSocial.is_visible} class="rounded bg-surface-800 border-surface-600 text-accent-500" />
					<span class="text-sm text-surface-300">Visible in footer</span>
				</label>
			</div>
			<div class="flex gap-3 mt-6">
				<button onclick={() => showEditSocialForm = false} class="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 text-white font-medium text-sm">Cancel</button>
				<button onclick={updateSocialLink} class="flex-1 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-medium text-sm">Save</button>
			</div>
		</div>
	</div>
{/if}

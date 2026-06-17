<script>
	import { goto } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { Layers, Plus, Trash2, Edit, GripVertical, Save, ExternalLink, Check } from '@lucide/svelte';

	let { data } = $props();

	let settings = $state(data.settings);
	let columns = $state(data.columns);
	let saving = $state(false);
	let showColumnForm = $state(false);
	let showLinkForm = $state(false);
	let activeColumnId = $state(null);
	let newColumn = $state({ title: '' });
	let newLink = $state({ label: '', url: '', is_external: false });

	async function saveSettings() {
		saving = true;
		await fetch('/admin/footer', {
			method: 'POST',
			body: JSON.stringify({ settings })
		});
		saving = false;
		goto('/admin/footer');
	}

	async function createColumn() {
		await fetch('/admin/footer', {
			method: 'POST',
			body: new URLSearchParams({ title: newColumn.title, sort_order: columns.length, action: 'createColumn' })
		});
		showColumnForm = false;
		newColumn = { title: '' };
		goto('/admin/footer');
	}

	async function deleteColumn(id) {
		if (!confirm('Delete this column and all its links?')) return;
		await fetch('/admin/footer', {
			method: 'POST',
			body: new URLSearchParams({ id, action: 'deleteColumn' })
		});
		goto('/admin/footer');
	}

	async function createLink() {
		await fetch('/admin/footer', {
			method: 'POST',
			body: new URLSearchParams({ column_id: activeColumnId, ...newLink, sort_order: 0, action: 'createLink' })
		});
		showLinkForm = false;
		newLink = { label: '', url: '', is_external: false };
		goto('/admin/footer');
	}

	async function deleteLink(id) {
		await fetch('/admin/footer', {
			method: 'POST',
			body: new URLSearchParams({ id, action: 'deleteLink' })
		});
		goto('/admin/footer');
	}

	function handleSettingInput(id, value) {
		settings = settings.map(s => s.id === id ? { ...s, value } : s);
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
			<p class="text-surface-400 mt-1">Configure footer content and layout</p>
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

<script>
	import { goto } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { Navigation, Plus, Trash2, Edit, GripVertical, ExternalLink, Eye, EyeOff, ChevronDown, Check } from '@lucide/svelte';

	let { data } = $props();

	let menus = $state(data.menus);
	let items = $state(data.items);
	let activeMenu = $state(menus[0]?.id || null);
	let showMenuForm = $state(false);
	let showItemForm = $state(false);
	let editingItem = $state(null);
	let saving = $state(false);
	let message = $state('');

	let menuForm = $state({ name: '', location: 'header' });
	let itemForm = $state({ label: '', url: '', is_external: false, open_in_new_tab: false, sort_order: 0 });

	const locationLabels = {
		header: 'Header Navigation',
		footer: 'Footer Navigation',
		sidebar: 'Sidebar Navigation',
		mobile: 'Mobile Navigation'
	};

	function getMenuItems(menuId) {
		return items.filter(i => i.menu_id === menuId && !i.parent_id).sort((a, b) => a.sort_order - b.sort_order);
	}

	function getChildItems(parentId) {
		return items.filter(i => i.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);
	}

	async function createMenu() {
		if (!menuForm.name) return;
		saving = true;

		const formData = new FormData();
		formData.append('name', menuForm.name);
		formData.append('location', menuForm.location);
		const response = await fetch('/admin/navigation?/createMenu', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			goto('/admin/navigation');
		}
		saving = false;
	}

	async function deleteMenu(id) {
		if (!confirm('Delete this menu and all its items?')) return;

		const formData = new FormData();
		formData.append('id', id);
		await fetch('/admin/navigation?/deleteMenu', {
			method: 'POST',
			body: formData
		});
		goto('/admin/navigation');
	}

	async function createItem() {
		if (!itemForm.label || !itemForm.url) return;
		saving = true;

		const formData = new FormData();
		formData.append('menu_id', activeMenu);
		formData.append('label', itemForm.label);
		formData.append('url', itemForm.url);
		formData.append('is_external', itemForm.is_external.toString());
		formData.append('open_in_new_tab', itemForm.open_in_new_tab.toString());
		formData.append('sort_order', itemForm.sort_order.toString());
		await fetch('/admin/navigation?/createItem', {
			method: 'POST',
			body: formData
		});

		showItemForm = false;
		itemForm = { label: '', url: '', is_external: false, open_in_new_tab: false, sort_order: 0 };
		goto('/admin/navigation');
	}

	async function updateItem() {
		if (!editingItem) return;
		saving = true;

		const formData = new FormData();
		formData.append('id', editingItem.id);
		formData.append('label', itemForm.label);
		formData.append('url', itemForm.url);
		formData.append('is_external', itemForm.is_external.toString());
		formData.append('open_in_new_tab', itemForm.open_in_new_tab.toString());
		formData.append('sort_order', itemForm.sort_order.toString());
		await fetch('/admin/navigation?/updateItem', {
			method: 'POST',
			body: formData
		});

		editingItem = null;
		showItemForm = false;
		itemForm = { label: '', url: '', is_external: false, open_in_new_tab: false, sort_order: 0 };
		goto('/admin/navigation');
	}

	async function deleteItem(id) {
		if (!confirm('Delete this menu item?')) return;

		const formData = new FormData();
		formData.append('id', id);
		await fetch('/admin/navigation?/deleteItem', {
			method: 'POST',
			body: formData
		});
		goto('/admin/navigation');
	}

	function startEdit(item) {
		editingItem = item;
		itemForm = {
			label: item.label,
			url: item.url,
			is_external: item.is_external,
			open_in_new_tab: item.open_in_new_tab,
			sort_order: item.sort_order
		};
		showItemForm = true;
	}

	async function toggleVisibility(item) {
		const formData = new FormData();
		formData.append('id', item.id);
		formData.append('label', item.label);
		formData.append('url', item.url);
		formData.append('is_external', item.is_external.toString());
		formData.append('open_in_new_tab', item.open_in_new_tab.toString());
		formData.append('sort_order', item.sort_order.toString());
		formData.append('is_visible', (!item.is_visible).toString());
		await fetch('/admin/navigation?/updateItem', {
			method: 'POST',
			body: formData
		});
		goto('/admin/navigation');
	}
</script>

<SeoHead title="Navigation Management" noindex={true} />

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold text-white flex items-center gap-3">
				<Navigation size={24} class="text-accent-400" />
				Navigation Management
			</h1>
			<p class="text-surface-400 mt-1">Build and manage site navigation menus</p>
		</div>
		<button
			onclick={() => showMenuForm = true}
			class="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-medium text-sm transition-colors"
		>
			<Plus size={16} />
			New Menu
		</button>
	</div>

	{#if message}
		<div class="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3">
			<Check size={18} />
			{message}
		</div>
	{/if}

	<!-- Menu Tabs -->
	<div class="flex flex-wrap gap-2 mb-6">
		{#each menus as menu}
			<button
				onclick={() => activeMenu = menu.id}
				class="px-4 py-2 rounded-xl text-sm font-medium transition-all {activeMenu === menu.id ? 'bg-accent-500 text-white' : 'bg-surface-800 text-surface-400 hover:text-white'}"
			>
				{menu.name}
				<span class="ml-2 text-xs opacity-60">({locationLabels[menu.location]})</span>
			</button>
		{/each}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Menu Items List -->
		<div class="lg:col-span-2">
			<div class="bg-surface-900 border border-surface-800 rounded-2xl">
				<div class="flex items-center justify-between p-4 border-b border-surface-800">
					<h2 class="font-semibold text-white">Menu Items</h2>
					{#if activeMenu}
						<button
							onclick={() => { editingItem = null; itemForm = { label: '', url: '', is_external: false, open_in_new_tab: false, sort_order: 0 }; showItemForm = true; }}
							class="flex items-center gap-1 text-sm text-accent-400 hover:text-accent-300"
						>
							<Plus size={14} />
							Add Item
						</button>
					{/if}
				</div>

				<div class="p-4 space-y-2">
					{#if activeMenu}
						{#each getMenuItems(activeMenu) as item}
							<div class="group p-3 rounded-xl bg-surface-800 border border-surface-700 hover:border-surface-600 transition-all">
								<div class="flex items-center gap-3">
									<GripVertical size={16} class="text-surface-500 cursor-grab" />
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2">
											<span class="font-medium text-white">{item.label}</span>
											{#if item.is_external}
												<ExternalLink size={12} class="text-surface-500" />
											{/if}
											{#if !item.is_visible}
												<EyeOff size={12} class="text-surface-500" />
											{/if}
										</div>
										<p class="text-sm text-surface-500 truncate">{item.url}</p>
									</div>
									<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
										<button onclick={() => toggleVisibility(item)} class="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white">
											{#if item.is_visible}<Eye size={16} />{:else}<EyeOff size={16} />{/if}
										</button>
										<button onclick={() => startEdit(item)} class="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white">
											<Edit size={16} />
										</button>
										<button onclick={() => deleteItem(item.id)} class="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-rose-400">
											<Trash2 size={16} />
										</button>
									</div>
								</div>

								<!-- Child Items -->
								{#if getChildItems(item.id).length > 0}
									<div class="mt-3 ml-6 space-y-2">
										{#each getChildItems(item.id) as child}
											<div class="group flex items-center gap-3 p-2 rounded-lg bg-surface-900 border border-surface-700">
												<GripVertical size={14} class="text-surface-500 cursor-grab" />
												<div class="flex-1 min-w-0">
													<span class="text-sm text-white">{child.label}</span>
													<p class="text-xs text-surface-500 truncate">{child.url}</p>
												</div>
												<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100">
													<button onclick={() => startEdit(child)} class="p-1 rounded hover:bg-surface-700 text-surface-400">
														<Edit size={14} />
													</button>
													<button onclick={() => deleteItem(child.id)} class="p-1 rounded hover:bg-surface-700 text-rose-400">
														<Trash2 size={14} />
													</button>
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{:else}
							<p class="text-surface-500 text-sm py-8 text-center">No items in this menu. Add your first navigation item.</p>
						{/each}
					{:else}
						<p class="text-surface-500 text-sm py-8 text-center">Select a menu to manage its items.</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Menu Settings -->
		<div class="space-y-6">
			<!-- Menu Info -->
			{#if activeMenu}
				{@const menu = menus.find(m => m.id === activeMenu)}
				<div class="bg-surface-900 border border-surface-800 rounded-2xl p-4">
					<h3 class="font-semibold text-white mb-4">Menu Settings</h3>
					<div class="space-y-3 text-sm">
						<div>
							<span class="text-surface-500">Name:</span>
							<span class="text-white ml-2">{menu?.name}</span>
						</div>
						<div>
							<span class="text-surface-500">Location:</span>
							<span class="text-white ml-2">{locationLabels[menu?.location]}</span>
						</div>
						<div>
							<span class="text-surface-500">Status:</span>
							<span class="ml-2 px-2 py-0.5 rounded-full text-xs {menu?.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface-700 text-surface-400'}">
								{menu?.is_active ? 'Active' : 'Inactive'}
							</span>
						</div>
					</div>
					<button
						onclick={() => deleteMenu(activeMenu)}
						class="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium text-sm transition-colors"
					>
						<Trash2 size={16} />
						Delete Menu
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Menu Form Modal -->
{#if showMenuForm}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={(e) => { if (e.target === e.currentTarget) showMenuForm = false; }}>
		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-md">
			<h3 class="text-lg font-semibold text-white mb-4">Create New Menu</h3>
			<div class="space-y-4">
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">Menu Name</label>
					<input type="text" bind:value={menuForm.name} placeholder="e.g. Main Menu" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">Location</label>
					<select bind:value={menuForm.location} class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm">
						<option value="header">Header</option>
						<option value="footer">Footer</option>
						<option value="sidebar">Sidebar</option>
						<option value="mobile">Mobile</option>
					</select>
				</div>
			</div>
			<div class="flex gap-3 mt-6">
				<button onclick={() => showMenuForm = false} class="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 text-white font-medium text-sm">Cancel</button>
				<button onclick={createMenu} disabled={saving || !menuForm.name} class="flex-1 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm">{saving ? 'Creating...' : 'Create'}</button>
			</div>
		</div>
	</div>
{/if}

<!-- Item Form Modal -->
{#if showItemForm}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={(e) => { if (e.target === e.currentTarget) showItemForm = false; }}>
		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-md">
			<h3 class="text-lg font-semibold text-white mb-4">{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
			<div class="space-y-4">
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">Label</label>
					<input type="text" bind:value={itemForm.label} placeholder="e.g. About Us" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">URL</label>
					<input type="text" bind:value={itemForm.url} placeholder="e.g. /about or https://example.com" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
				<div class="flex items-center gap-4">
					<label class="flex items-center gap-2 cursor-pointer">
						<input type="checkbox" bind:checked={itemForm.is_external} class="rounded bg-surface-800 border-surface-600 text-accent-500" />
						<span class="text-sm text-surface-300">External Link</span>
					</label>
					<label class="flex items-center gap-2 cursor-pointer">
						<input type="checkbox" bind:checked={itemForm.open_in_new_tab} class="rounded bg-surface-800 border-surface-600 text-accent-500" />
						<span class="text-sm text-surface-300">Open in new tab</span>
					</label>
				</div>
			</div>
			<div class="flex gap-3 mt-6">
				<button onclick={() => { showItemForm = false; editingItem = null; }} class="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 text-white font-medium text-sm">Cancel</button>
				<button onclick={editingItem ? updateItem : createItem} disabled={saving || !itemForm.label || !itemForm.url} class="flex-1 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm">{saving ? 'Saving...' : (editingItem ? 'Update' : 'Add')}</button>
			</div>
		</div>
	</div>
{/if}

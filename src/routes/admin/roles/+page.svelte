<script>
	import { invalidateAll } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { Shield, Plus, Save, Check, X, AlertCircle } from '@lucide/svelte';

	let { data } = $props();

	let activeRole = $state(null);
	let showCreateModal = $state(false);
	let saving = $state(false);
	let creating = $state(false);
	let message = $state({ type: '', text: '' });
	let newRole = $state({ display_name: '', name: '', level: 10, description: '' });
	let role_permissions = $state([]);

	// Use derived state instead of effects for better reactivity
	let roles = $derived.by(() => data.roles || []);
	let permissions = $derived.by(() => data.permissions || []);
	let permissionsByModule = $derived.by(() => data.permissionsByModule || {});

	// Initialize activeRole after data loads
	$effect(() => {
		if (roles.length > 0 && activeRole === null) {
			activeRole = roles[0].id;
		}
	});

	// Update role_permissions when data changes
	$effect(() => {
		if (data?.role_permissions) {
			role_permissions = data.role_permissions;
		}
	});

	function roleHasPermission(roleId, permId) {
		return role_permissions.some(rp => rp.role_id === roleId && rp.permission_id === permId);
	}

	function togglePermission(permId) {
		const hasIt = roleHasPermission(activeRole, permId);
		if (hasIt) {
			role_permissions = role_permissions.filter(rp => !(rp.role_id === activeRole && rp.permission_id === permId));
		} else {
			role_permissions = [...role_permissions, { role_id: activeRole, permission_id: permId }];
		}
	}

	async function savePermissions() {
		saving = true;
		message = { type: '', text: '' };
		try {
			const perms = role_permissions.filter(rp => rp.role_id === activeRole).map(rp => rp.permission_id);
			const formData = new FormData();
			formData.append('role_id', activeRole);
			formData.append('permissions', JSON.stringify(perms));
			const response = await fetch('/admin/roles?/updatePermissions', {
				method: 'POST',
				body: formData
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			
			const result = await response.json();
			if (result.success) {
				message = { type: 'success', text: 'Permissions saved successfully!' };
				await invalidateAll();
			} else {
				message = { type: 'error', text: result.error || 'Failed to save permissions' };
			}
		} catch (err) {
			console.error('Save permissions error:', err);
			message = { type: 'error', text: 'Error: ' + err.message };
		} finally {
			saving = false;
		}
	}

	async function createRole() {
		if (!newRole.display_name.trim()) {
			message = { type: 'error', text: 'Display name is required' };
			return;
		}
		if (!newRole.name.trim()) {
			message = { type: 'error', text: 'Role key is required' };
			return;
		}

		creating = true;
		message = { type: '', text: '' };

		try {
			const formData = new FormData();
			const roleKey = newRole.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
			formData.append('name', roleKey);
			formData.append('display_name', newRole.display_name);
			formData.append('level', newRole.level.toString());
			formData.append('description', newRole.description);

			const response = await fetch('/admin/roles?/createRole', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error(`Server error: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();
			
			if (result.success) {
				message = { type: 'success', text: 'Role created successfully!' };
				showCreateModal = false;
				newRole = { display_name: '', name: '', level: 10, description: '' };
				await invalidateAll();
			} else {
				const errorMsg = result.error || result.message || 'Failed to create role';
				console.error('Create role error:', errorMsg, result);
				message = { type: 'error', text: errorMsg };
			}
		} catch (err) {
			message = { type: 'error', text: 'An error occurred: ' + err.message };
		} finally {
			creating = false;
		}
	}
</script>

<SeoHead title="Roles & Permissions" noindex={true} />

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold text-white flex items-center gap-3">
				<Shield size={24} class="text-accent-400" />
				Roles & Permissions
			</h1>
			<p class="text-surface-400 mt-1">Manage user roles and their permissions</p>
		</div>
		<button
			onclick={() => showCreateModal = true}
			class="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-medium text-sm transition-colors"
		>
			<Plus size={16} />
			New Role
		</button>
	</div>

	<div class="flex flex-col lg:flex-row gap-6">
		<!-- Roles List -->
		<div class="lg:w-64 shrink-0">
			<div class="bg-surface-900 border border-surface-800 rounded-2xl p-2">
				{#if roles.length > 0}
					{#each roles as role}
						<button
							onclick={() => activeRole = role.id}
							class="w-full text-left px-4 py-3 rounded-xl transition-all {activeRole === role.id ? 'bg-surface-800 text-white' : 'text-surface-400 hover:text-white'}"
						>
							<div class="flex items-center justify-between">
								<span class="font-medium">{role.display_name}</span>
								{#if role.is_system}
									<span class="text-xs px-1.5 py-0.5 rounded bg-surface-700 text-surface-400">system</span>
								{/if}
							</div>
							<p class="text-xs text-surface-500 mt-1">Level: {role.level}</p>
						</button>
					{/each}
				{:else}
					<div class="p-4 text-center">
						<Shield size={24} class="text-surface-700 mx-auto mb-2" />
						<p class="text-sm text-surface-500 mb-3">No roles found. Create one to get started.</p>
						<p class="text-xs text-surface-600 mb-4">
							If you're seeing this and expect roles to exist, check your database connection and ensure migrations have run.
						</p>
						<button
							onclick={() => showCreateModal = true}
							class="w-full px-3 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium transition-colors"
						>
							<Plus size={14} class="inline mr-1.5" />
							Create Your First Role
						</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Permissions Matrix -->
		<div class="flex-1">
			<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6">
				<div class="flex items-center justify-between mb-6">
					<div>
						<h2 class="text-lg font-semibold text-white">
							{#if activeRole && roles.length > 0}
								{roles.find(r => r.id === activeRole)?.display_name} Permissions
							{:else}
								Select a Role
							{/if}
						</h2>
						{#if activeRole && roles.length > 0}
							{@const currentRole = roles.find(r => r.id === activeRole)}
							{@const rolePermissions = role_permissions.filter(rp => rp.role_id === activeRole)}
							<p class="text-sm text-surface-400 mt-2">
								{#if currentRole.description}
									{currentRole.description} • 
								{/if}
								Level {currentRole.level} • {rolePermissions.length} permissions assigned
							</p>
						{/if}
					</div>
					{#if activeRole && roles.length > 0}
						<button
							onclick={savePermissions}
							disabled={saving}
							class="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm transition-colors"
						>
							<Save size={16} />
							{saving ? 'Saving...' : 'Save'}
						</button>
					{/if}
				</div>

				{#if activeRole && roles.length > 0}
					<div class="space-y-6">
						{#each Object.entries(permissionsByModule) as [module, perms]}
							<div>
								<h3 class="text-sm font-medium text-surface-300 mb-3 capitalize">{module.replace('_', ' ')}</h3>
								<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
									{#each perms as perm}
										<button
											onclick={() => togglePermission(perm.id)}
											class="flex items-center gap-2 px-3 py-2 rounded-lg transition-all {roleHasPermission(activeRole, perm.id) ? 'bg-accent-500/20 border border-accent-500/30 text-accent-400' : 'bg-surface-800 border border-surface-700 text-surface-400 hover:border-surface-600'}"
										>
											{#if roleHasPermission(activeRole, perm.id)}
												<Check size={14} />
											{:else}
												<X size={14} />
											{/if}
											<span class="text-sm">{perm.display_name}</span>
										</button>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-surface-500 text-center py-12">Select a role from the list to manage its permissions.</p>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Create Role Modal -->
{#if showCreateModal}
	<div role="dialog" aria-modal="true" tabindex="0" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onkeydown={(e) => { if (e.key === 'Escape') { showCreateModal = false; message = { type: '', text: '' }; } }} onclick={(e) => { if (e.target === e.currentTarget) { showCreateModal = false; message = { type: '', text: '' }; } }}>
		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-md">
			<h3 class="text-lg font-semibold text-white mb-4">Create New Role</h3>
			
			{#if message.text}
				<div class="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm {message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}">
					{#if message.type === 'success'}
						<Check size={16} />
					{:else}
						<AlertCircle size={16} />
					{/if}
					{message.text}
				</div>
			{/if}
			
			<form onsubmit={(e) => { e.preventDefault(); createRole(); }} class="space-y-4">
				<div>
					<label for="display-name" class="block text-sm text-surface-300 mb-1.5">Display Name <span class="text-rose-400">*</span></label>
					<input 
						id="display-name"
						type="text" 
						bind:value={newRole.display_name} 
						placeholder="e.g. Content Manager" 
						disabled={creating}
						required
						class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm disabled:opacity-50" 
					/>
				</div>
				<div>
					<label for="role-key" class="block text-sm text-surface-300 mb-1.5">Role Key (lowercase) <span class="text-rose-400">*</span></label>
					<input 
						id="role-key"
						type="text" 
						bind:value={newRole.name} 
						placeholder="content_manager" 
						disabled={creating}
						required
						class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm font-mono disabled:opacity-50" 
					/>
				</div>
				<div>
					<label for="role-level" class="block text-sm text-surface-300 mb-1.5">Level (higher = more access)</label>
					<input 
						id="role-level"
						type="number" 
						bind:value={newRole.level} 
						placeholder="10" 
						disabled={creating}
						class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm disabled:opacity-50" 
					/>
					<p class="text-xs text-surface-500 mt-1">0 (user) to 100 (super admin)</p>
				</div>
				<div>
					<label for="role-description" class="block text-sm text-surface-300 mb-1.5">Description</label>
					<textarea 
						id="role-description"
						bind:value={newRole.description} 
						rows="2" 
						placeholder="What this role can do..."
						disabled={creating}
						class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm resize-none disabled:opacity-50"
					></textarea>
				</div>
				<div class="flex gap-3 mt-6">
					<button 
						type="button"
						onclick={() => { showCreateModal = false; message = { type: '', text: '' }; }} 
						disabled={creating}
						class="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 text-white font-medium text-sm disabled:opacity-50"
					>
						Cancel
					</button>
					<button 
						type="submit"
						disabled={!newRole.display_name || !newRole.name || creating}
						class="flex-1 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2"
					>
						{#if creating}
							<span>Creating...</span>
						{:else}
							<Plus size={16} />
							<span>Create</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<script>
	import { goto } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { Shield, Plus, Save, Check, X } from '@lucide/svelte';

	let { data } = $props();

	let roles = $state(data.roles);
	let permissions = $state(data.permissions);
	let permissionsByModule = $state(data.permissionsByModule);
	let role_permissions = $state(data.role_permissions);
	let activeRole = $state(roles[0]?.id || null);
	let showCreateModal = $state(false);
	let saving = $state(false);
	let newRole = $state({ name: '', display_name: '', level: 10, description: '' });

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
		const perms = role_permissions.filter(rp => rp.role_id === activeRole).map(rp => rp.permission_id);
		const formData = new FormData();
		formData.append('role_id', activeRole);
		formData.append('permissions', JSON.stringify(perms));
		await fetch('/admin/roles?/updatePermissions', {
			method: 'POST',
			body: formData
		});
		saving = false;
		goto('/admin/roles');
	}

	async function createRole() {
		const formData = new FormData();
		formData.append('name', newRole.name);
		formData.append('display_name', newRole.display_name);
		formData.append('level', newRole.level.toString());
		formData.append('description', newRole.description);
		await fetch('/admin/roles?/createRole', {
			method: 'POST',
			body: formData
		});
		showCreateModal = false;
		goto('/admin/roles');
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
			</div>
		</div>

		<!-- Permissions Matrix -->
		<div class="flex-1">
			<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-lg font-semibold text-white">
						{#if activeRole}
							{roles.find(r => r.id === activeRole)?.display_name} Permissions
						{:else}
							Select a Role
						{/if}
					</h2>
					{#if activeRole}
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

				{#if activeRole}
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
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={(e) => { if (e.target === e.currentTarget) showCreateModal = false; }}>
		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-md">
			<h3 class="text-lg font-semibold text-white mb-4">Create New Role</h3>
			<div class="space-y-4">
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">Display Name</label>
					<input type="text" bind:value={newRole.display_name} placeholder="e.g. Content Manager" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">Role Key (lowercase)</label>
					<input type="text" bind:value={newRole.name} placeholder="content_manager" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm font-mono" />
				</div>
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">Level (higher = more access)</label>
					<input type="number" bind:value={newRole.level} placeholder="10" class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm" />
				</div>
				<div>
					<label class="block text-sm text-surface-300 mb-1.5">Description</label>
					<textarea bind:value={newRole.description} rows="2" placeholder="What this role can do..." class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm resize-none"></textarea>
				</div>
			</div>
			<div class="flex gap-3 mt-6">
				<button onclick={() => showCreateModal = false} class="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 text-white font-medium text-sm">Cancel</button>
				<button onclick={createRole} disabled={!newRole.display_name || !newRole.name} class="flex-1 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm">Create</button>
			</div>
		</div>
	</div>
{/if}

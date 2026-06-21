<script>
	import { invalidateAll } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { Users as UsersIcon, Shield, Calendar, MoreVertical, Check, Ban, UserX, Search, Filter } from '@lucide/svelte';

	let { data } = $props();

	let users = $state([]);
	let roles = $state([]);
	let searchQuery = $state('');
	let statusFilter = $state('all');
	let pendingRoleChanges = $state({}); // Track pending role changes: { userId: newRole }
	let savingUsers = $state(new Set()); // Track which users are being saved

	$effect(() => {
		users = data.users;
		roles = data.roles;
	});

	function formatDate(date) {
		return date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never';
	}

	const filteredUsers = $derived.by(() => {
		return users.filter(user => {
			const matchesSearch = !searchQuery ||
				user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(user.display_name || '').toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
			return matchesSearch && matchesStatus;
		});
	});

	async function updateStatus(id, newStatus) {
		const formData = new FormData();
		formData.append('id', id);
		formData.append('status', newStatus);

		await fetch('/admin/users?/updateStatus', { method: 'POST', body: formData });
		await invalidateAll();
	}

	async function updateRole(id, newRole) {
		pendingRoleChanges[id] = newRole;
	}

	async function saveRole(userId) {
		const newRole = pendingRoleChanges[userId];
		if (!newRole) return;

		savingUsers.add(userId);
	
		try {
			const formData = new FormData();
			formData.append('id', userId);
			formData.append('role', newRole);

			const response = await fetch('/admin/users?/updateRole', { method: 'POST', body: formData });
			
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(errorText || 'Failed to update role');
			}
			
			delete pendingRoleChanges[userId];
			await invalidateAll();
		} catch (err) {
			console.error('Role save error:', err);
			alert('Error updating role: ' + err.message);
		} finally {
			savingUsers.delete(userId);
		}
	}

	function cancelRoleChange(userId) {
		delete pendingRoleChanges[userId];
	}

	async function deleteUser(id) {
		if (!confirm('Delete this user? This cannot be undone.')) return;

		const formData = new FormData();
		formData.append('id', id);

		await fetch('/admin/users?/deleteUser', { method: 'POST', body: formData });
		await invalidateAll();
	}

	const statusColors = {
		active: 'bg-emerald-500/20 text-emerald-400',
		suspended: 'bg-amber-500/20 text-amber-400',
		banned: 'bg-rose-500/20 text-rose-400',
		pending: 'bg-surface-700 text-surface-400'
	};
</script>

<SeoHead title="User Management" noindex={true} />

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold text-white flex items-center gap-3">
				<UsersIcon size={24} class="text-accent-400" />
				User Management
			</h1>
			<p class="text-surface-400 mt-1">Manage user accounts and permissions</p>
		</div>
	</div>

	<!-- Filters -->
	<div class="flex flex-col sm:flex-row gap-4 mb-6">
		<div class="flex-1 relative">
			<Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search by email or name..."
				class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-900 border border-surface-800 text-white placeholder-surface-500 text-sm"
			/>
		</div>
		<select
			bind:value={statusFilter}
			class="px-4 py-2.5 rounded-xl bg-surface-900 border border-surface-800 text-white text-sm"
		>
			<option value="all">All Status</option>
			<option value="active">Active</option>
			<option value="suspended">Suspended</option>
			<option value="banned">Banned</option>
			<option value="pending">Pending</option>
		</select>
	</div>

	<!-- Users Table -->
	<div class="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
		{#if filteredUsers.length > 0}
			<table class="w-full">
				<thead class="bg-surface-800">
					<tr>
						<th class="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">User</th>
						<th class="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Role</th>
						<th class="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Status</th>
						<th class="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Last Login</th>
						<th class="text-right px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-800">
					{#each filteredUsers as user}
						<tr class="hover:bg-surface-800/50 transition-colors">
							<td class="px-6 py-4">
								<div class="flex items-center gap-3">
									{#if user.avatar_url}
										<img src={user.avatar_url} alt="" class="w-10 h-10 rounded-full object-cover" onerror={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }} />
										<div style="display: none;" class="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center">
											<UsersIcon size={18} class="text-surface-500" />
										</div>
									{:else}
										<div class="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center">
											<UsersIcon size={18} class="text-surface-500" />
										</div>
									{/if}
									<div>
										<p class="font-medium text-white">{user.display_name || 'No name'}</p>
										<p class="text-sm text-surface-500">{user.email}</p>
									</div>
								</div>
							</td>
							<td class="px-6 py-4">
								{#if roles.length > 0}
								<div class="flex items-center gap-2">
									<select
										value={pendingRoleChanges[user.id] || user.role || ''}
										onchange={(e) => updateRole(user.id, e.target.value)}
										disabled={savingUsers.has(user.id)}
										class="px-3 py-1.5 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm disabled:opacity-50"
									>
										{#if !user.role}
											<option value="">Select a role</option>
										{/if}
										{#each roles as role}
											<option value={role.name}>{role.display_name}</option>
										{/each}
									</select>
									{#if pendingRoleChanges[user.id]}
										<button
											onclick={() => saveRole(user.id)}
											disabled={savingUsers.has(user.id)}
											class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1"
										>
											<Check size={14} />
											{savingUsers.has(user.id) ? 'Saving...' : 'Save'}
										</button>
										<button
											onclick={() => cancelRoleChange(user.id)}
											class="px-3 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-surface-300 text-sm"
										>
											Cancel
										</button>
									{/if}
								</div>
								{:else}
									<span class="text-surface-500 text-sm">No roles available</span>
								{/if}
							</td>
							<td class="px-6 py-4">
								<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium {statusColors[user.status] || statusColors.pending}">
									{user.status || 'pending'}
								</span>
							</td>
							<td class="px-6 py-4 text-sm text-surface-400">
								<Calendar size={14} class="inline mr-1.5" />
								{formatDate(user.last_login_at)}
							</td>
							<td class="px-6 py-4">
								<div class="flex items-center justify-end gap-2">
									{#if user.status === 'active'}
										<button onclick={() => updateStatus(user.id, 'suspended')} class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-amber-400" title="Suspend">
											<Ban size={16} />
										</button>
									{:else if user.status === 'suspended'}
										<button onclick={() => updateStatus(user.id, 'active')} class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-emerald-400" title="Activate">
											<Check size={16} />
										</button>
									{:else}
										<button onclick={() => updateStatus(user.id, 'active')} class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-emerald-400" title="Activate">
											<Check size={16} />
										</button>
									{/if}
									<button onclick={() => deleteUser(user.id)} class="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-rose-400" title="Delete">
										<UserX size={16} />
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<div class="p-12 text-center">
				<UsersIcon size={48} class="text-surface-700 mx-auto mb-4" />
				<h3 class="text-lg font-medium text-white mb-2">No users found</h3>
				<p class="text-surface-400 text-sm">Try adjusting your search or filter.</p>
			</div>
		{/if}
	</div>
</div>

<script>
import { invalidateAll } from '$app/navigation';
import { Menu, X, LogIn, LogOut, User, Shield } from '@lucide/svelte';
import { getSupabaseBrowserClient } from '$lib/supabase/client';
import { isAdminRole } from '$lib/utils/roles.js';
import { page } from '$app/stores';

const client = getSupabaseBrowserClient();

let { navPages = [], user = null, profile = null } = $props();

let mobileOpen = $state(false);

$effect(() => {
	const { data: { subscription } } = client.auth.onAuthStateChange((event) => {
		// Avoid reload storms — INITIAL_SESSION fires on every page load
		if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
			invalidateAll();
		}
	});
	return () => subscription?.unsubscribe();
});

async function handleLogout() {
	await client.auth.signOut();
	await invalidateAll();
	mobileOpen = false;
}

const staticLinks = [
	{ href: '/ai-tools', label: 'AI Showcase' },
	{ href: '/news', label: 'News' },
	{ href: '/blog', label: 'Blog' }
];

let allNavLinks = $derived([
	...staticLinks,
	...navPages.map(p => ({ href: `/pages/${p.slug}`, label: p.title }))
]);

function isActive(href) {
	return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
}
</script>

<header class="sticky top-0 z-50 border-b border-white/5 bg-surface-950/70 backdrop-blur-lg">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">

			<a href="/" class="flex items-center gap-2.5 group transition-opacity duration-300 hover:opacity-95">
				<img src="/logo.png" alt="AI Mematiane" class="w-8 h-8 rounded-lg object-cover transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105" />
				<span class="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-surface-100 to-cyan-400 bg-clip-text text-transparent group-hover:to-cyan-300">AI Mematiane</span>
			</a>

			<nav aria-label="Main navigation" class="hidden md:flex items-center gap-1">
				{#each allNavLinks as link}
					<a
						href={link.href}
						class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 {isActive(link.href) ? 'text-white bg-white/10' : 'text-surface-300 hover:text-white hover:bg-white/5'}"
						aria-current={isActive(link.href) ? 'page' : undefined}
					>
						{link.label}
					</a>
				{/each}
			</nav>

			<div class="hidden md:flex items-center gap-2">
				{#if user}
					{#if isAdminRole(profile?.role)}
						<a href="/admin" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-amber-400 hover:bg-amber-500/10 transition-all duration-300">
							<Shield size={14} aria-hidden="true" />
							Admin
						</a>
					{/if}
					<a href="/profile" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-surface-300 hover:text-white hover:bg-white/5 transition-all duration-300">
						<User size={14} aria-hidden="true" />
						Profile
					</a>
					<button
						onclick={handleLogout}
						class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
					>
						<LogOut size={14} aria-hidden="true" />
						Logout
					</button>
				{:else}
					<a href="/auth/login" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-surface-300 hover:text-white hover:bg-white/5 transition-all duration-300">
						<LogIn size={14} aria-hidden="true" />
						Login
					</a>
					<a href="/auth/register" class="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-accent-500 to-cyan-500 hover:from-accent-600 hover:to-cyan-600 text-white shadow-lg shadow-accent-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
						Sign Up
					</a>
				{/if}
			</div>

			<button
				onclick={() => mobileOpen = !mobileOpen}
				class="md:hidden p-2 text-surface-400 hover:text-white"
				aria-expanded={mobileOpen}
				aria-controls="mobile-menu"
				aria-label="Toggle navigation menu"
			>
				{#if mobileOpen}<X size={22} aria-hidden="true" />{:else}<Menu size={22} aria-hidden="true" />{/if}
			</button>
		</div>
	</div>

	{#if mobileOpen}
		<div id="mobile-menu" class="md:hidden border-t border-surface-800 bg-surface-950/95 backdrop-blur-xl">
			<nav aria-label="Mobile navigation" class="px-4 py-3 space-y-1">
				{#each allNavLinks as link}
					<a
						href={link.href}
						onclick={() => mobileOpen = false}
						class="block px-3 py-2.5 rounded-lg text-sm transition-all {isActive(link.href) ? 'text-white bg-white/10' : 'text-surface-300 hover:text-white hover:bg-surface-800'}"
						aria-current={isActive(link.href) ? 'page' : undefined}
					>
						{link.label}
					</a>
				{/each}
				<div class="border-t border-surface-800 pt-2 mt-2">
					{#if user}
						{#if isAdminRole(profile?.role)}
							<a href="/admin" onclick={() => mobileOpen = false} class="block px-3 py-2.5 rounded-lg text-sm text-amber-400 hover:bg-amber-500/10">
								Admin Dashboard
							</a>
						{/if}
						<a href="/profile" onclick={() => mobileOpen = false} class="block px-3 py-2.5 rounded-lg text-sm text-surface-300 hover:text-white hover:bg-surface-800">
							Profile
						</a>
						<button onclick={handleLogout} class="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10">
							Logout
						</button>
					{:else}
						<a href="/auth/login" onclick={() => mobileOpen = false} class="block px-3 py-2.5 rounded-lg text-sm text-surface-300 hover:text-white hover:bg-surface-800">Login</a>
						<a href="/auth/register" onclick={() => mobileOpen = false} class="block px-3 py-2.5 rounded-lg text-sm font-medium bg-accent-500 hover:bg-accent-600 text-white text-center">Sign Up</a>
					{/if}
				</div>
			</nav>
		</div>
	{/if}
</header>

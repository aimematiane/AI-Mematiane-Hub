<script>
	import { Brain, Menu, X, LogIn, LogOut, User, Shield } from '@lucide/svelte';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';

	const client = getSupabaseBrowserClient();

	let mobileOpen = $state(false);
	let user = $state(null);
	let profile = $state(null);

	$effect(() => {
		client.auth.getUser().then(({ data }) => { user = data.user; });
		const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
			user = session?.user ?? null;
		});
		return () => subscription?.unsubscribe();
	});

	$effect(() => {
		if (user) {
			client.from('profiles').select('role, display_name').eq('id', user.id).single()
				.then(({ data }) => { profile = data; });
		} else {
			profile = null;
		}
	});

	async function handleLogout() {
		await client.auth.signOut();
		user = null;
		profile = null;
	}

	const navLinks = [
		{ href: '/ai-tools', label: 'AI Showcase' },
		{ href: '/news', label: 'News' },
		{ href: '/blog', label: 'Blog' }
	];
</script>

<header class="sticky top-0 z-50 glass-panel border-b border-white/5 bg-surface-950/70 backdrop-blur-lg">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2.5 group transition-opacity duration-300 hover:opacity-95">
				<img src="/logo.png" alt="AI Mematiane" class="w-8 h-8 rounded-lg object-cover transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105" />
				<span class="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-surface-100 to-cyan-400 bg-clip-text text-transparent group-hover:to-cyan-300">AI Mematiane</span>
			</a>

			<!-- Desktop Nav -->
			<nav class="hidden md:flex items-center gap-1">
				{#each navLinks as link}
					<a
						href={link.href}
						class="px-3 py-2 rounded-lg text-sm font-medium text-surface-300 hover:text-white hover:bg-white/5 transition-all duration-300"
					>
						{link.label}
					</a>
				{/each}
			</nav>

			<!-- Desktop Auth -->
			<div class="hidden md:flex items-center gap-2">
				{#if user}
					{#if profile?.role === 'admin'}
						<a href="/admin" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-amber-400 hover:bg-amber-500/10 transition-all duration-300">
							<Shield size={14} />
							Admin
						</a>
					{/if}
					<a href="/profile" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-surface-300 hover:text-white hover:bg-white/5 transition-all duration-300">
						<User size={14} />
						Profile
					</a>
					<button
						onclick={handleLogout}
						class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
					>
						<LogOut size={14} />
						Logout
					</button>
				{:else}
					<a href="/auth/login" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-surface-300 hover:text-white hover:bg-white/5 transition-all duration-300">
						<LogIn size={14} />
						Login
					</a>
					<a href="/auth/register" class="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-accent-500 to-cyan-500 hover:from-accent-600 hover:to-cyan-600 text-white shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
						Sign Up
					</a>
				{/if}
			</div>

			<!-- Mobile Menu Toggle -->
			<button
				onclick={() => mobileOpen = !mobileOpen}
				class="md:hidden p-2 text-surface-400 hover:text-white"
				aria-expanded={mobileOpen}
				aria-controls="mobile-menu"
				aria-label="Toggle navigation menu"
			>
				{#if mobileOpen}
					<X size={22} />
				{:else}
					<Menu size={22} />
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile Menu -->
	{#if mobileOpen}
		<div id="mobile-menu" class="md:hidden border-t border-surface-800 bg-surface-950/95 backdrop-blur-xl">
			<div class="px-4 py-3 space-y-1">
				{#each navLinks as link}
					<a href={link.href} onclick={() => mobileOpen = false} class="block px-3 py-2.5 rounded-lg text-sm text-surface-300 hover:text-white hover:bg-surface-800 transition-all">
						{link.label}
					</a>
				{/each}
				<div class="border-t border-surface-800 pt-2 mt-2">
					{#if user}
						{#if profile?.role === 'admin'}
							<a href="/admin" onclick={() => mobileOpen = false} class="block px-3 py-2.5 rounded-lg text-sm text-amber-400 hover:bg-amber-500/10">
								Admin Dashboard
							</a>
						{/if}
						<a href="/profile" onclick={() => mobileOpen = false} class="block px-3 py-2.5 rounded-lg text-sm text-surface-300 hover:text-white hover:bg-surface-800">
							Profile
						</a>
						<button onclick={() => { handleLogout(); mobileOpen = false; }} class="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10">
							Logout
						</button>
					{:else}
						<a href="/auth/login" onclick={() => mobileOpen = false} class="block px-3 py-2.5 rounded-lg text-sm text-surface-300 hover:text-white hover:bg-surface-800">
							Login
						</a>
						<a href="/auth/register" onclick={() => mobileOpen = false} class="block px-3 py-2.5 rounded-lg text-sm font-medium bg-accent-500 hover:bg-accent-600 text-white text-center">
							Sign Up
						</a>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</header>

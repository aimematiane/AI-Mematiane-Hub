<script>
	import { page } from '$app/stores';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import {
		LayoutDashboard, Brain, BookOpen, Newspaper, Settings, Menu,
		Navigation, FileText, Users, Shield, FolderOpen, Image, BarChart3, LogOut,
		ChevronLeft, Layers, Link as LinkIcon
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';

	let { data, children } = $props();
	const client = getSupabaseBrowserClient();

	let sidebarOpen = $state(true);
	let mobileSidebarOpen = $state(false);

	const navItems = $derived([
		{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
		{ href: '/admin/posts', label: 'Blog Posts', icon: BookOpen, count: data.counts.posts },
		{ href: '/admin/news', label: 'News', icon: Newspaper, count: data.counts.news },
		{ href: '/admin/ai-tools', label: 'AI Tools', icon: Brain, count: data.counts.tools },
		{ href: '/admin/pages', label: 'Pages', icon: FileText, count: data.counts.pages },
		{ href: '/admin/navigation', label: 'Navigation', icon: Navigation },
		{ spacer: true },
		{ section: 'System' },
		{ href: '/admin/settings', label: 'Site Settings', icon: Settings },
		{ href: '/admin/footer', label: 'Footer', icon: Layers },
		{ href: '/admin/seo', label: 'SEO', icon: BarChart3 },
		{ spacer: true },
		{ section: 'Users & Media' },
		{ href: '/admin/users', label: 'Users', icon: Users, count: data.counts.users },
		{ href: '/admin/roles', label: 'Roles & Permissions', icon: Shield },
		{ href: '/admin/media', label: 'Media Library', icon: Image, count: data.counts.media },
		{ spacer: true },
		{ section: 'Logs' },
		{ href: '/admin/audit', label: 'Audit Logs', icon: FolderOpen }
	]);

	function isActive(href, exact = false) {
		if (exact) {
			return $page.url.pathname === href;
		}
		return $page.url.pathname.startsWith(href);
	}

	async function handleLogout() {
		await client.auth.signOut();
		goto('/auth/login');
	}

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}
</script>

<SeoHead title="Admin" noindex={true} />

<div class="min-h-screen bg-surface-950 flex">
	<!-- Sidebar - Desktop -->
	<aside class="hidden lg:flex flex-col bg-surface-900 border-r border-surface-800 transition-all duration-300 {sidebarOpen ? 'w-64' : 'w-20'}">
		<!-- Logo -->
		<div class="h-16 flex items-center px-4 border-b border-surface-800">
			<a href="/" class="flex items-center gap-2">
				<div class="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center">
					<Brain size={18} class="text-white" />
				</div>
				{#if sidebarOpen}
					<span class="font-bold text-white">Admin</span>
				{/if}
			</a>
			<button onclick={toggleSidebar} class="ml-auto p-1.5 rounded-lg hover:bg-surface-800 text-surface-400">
				<ChevronLeft size={18} class="transition-transform {sidebarOpen ? '' : 'rotate-180'}" />
			</button>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 overflow-y-auto py-4 px-3">
			{#each navItems as item}
				{#if item.spacer}
					<div class="my-3"></div>
				{:else if item.section}
					{#if sidebarOpen}
						<p class="px-3 mb-2 text-xs font-medium text-surface-500 uppercase tracking-wider">{item.section}</p>
					{/if}
				{:else}
					<a
						href={item.href}
						class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all {isActive(item.href, item.exact) ? 'bg-accent-500/15 text-accent-400 border border-accent-500/20' : 'text-surface-400 hover:bg-surface-800 hover:text-white'}"
					>
						<item.icon size={18} class="shrink-0" />
						{#if sidebarOpen}
							<span class="flex-1 text-sm font-medium">{item.label}</span>
							{#if item.count !== undefined}
								<span class="text-xs px-2 py-0.5 rounded-full bg-surface-800 text-surface-400">{item.count}</span>
							{/if}
						{/if}
					</a>
				{/if}
			{/each}
		</nav>

		<!-- User Section -->
		<div class="p-3 border-t border-surface-800">
			<div class="flex items-center gap-3 p-2 rounded-xl bg-surface-800">
				<div class="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center shrink-0 overflow-hidden">
					{#if data.profile.avatar_url}
						<img src={data.profile.avatar_url} alt="" class="w-8 h-8 rounded-full object-cover" onerror={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'block'; }} />
						<div style="display: none;"><Users size={16} class="text-surface-400" /></div>
					{:else}
						<Users size={16} class="text-surface-400" />
					{/if}
				</div>
				{#if sidebarOpen}
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-white truncate">{data.profile.display_name || 'Admin'}</p>
						<p class="text-xs text-surface-500 truncate">{data.profile.email}</p>
					</div>
				{/if}
			</div>
			{#if sidebarOpen}
				<button onclick={handleLogout} class="mt-3 w-full flex items-center gap-3 px-3 py-2 rounded-xl text-surface-400 hover:bg-surface-800 hover:text-white">
					<LogOut size={18} />
					<span class="text-sm font-medium">Sign Out</span>
				</button>
			{/if}
		</div>
	</aside>

	<!-- Mobile Menu Overlay -->
	{#if mobileSidebarOpen}
		<button onclick={() => mobileSidebarOpen = false} class="lg:hidden fixed inset-0 bg-black/50 z-40" aria-label="Close menu"></button>
	{/if}

	<!-- Mobile Sidebar -->
	<aside class="lg:hidden fixed inset-y-0 left-0 w-64 bg-surface-900 border-r border-surface-800 z-50 transform transition-transform {mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}">
		<div class="h-16 flex items-center px-4 border-b border-surface-800">
			<a href="/" class="flex items-center gap-2">
				<div class="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center">
					<Brain size={18} class="text-white" />
				</div>
				<span class="font-bold text-white">Admin</span>
			</a>
		</div>
		<nav class="flex-1 overflow-y-auto py-4 px-3">
			{#each navItems as item}
				{#if item.spacer}
					<div class="my-3"></div>
				{:else if item.section}
					<p class="px-3 mb-2 text-xs font-medium text-surface-500 uppercase tracking-wider">{item.section}</p>
				{:else}
					<a
						href={item.href}
						onclick={() => mobileSidebarOpen = false}
						class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all {isActive(item.href, item.exact) ? 'bg-accent-500/15 text-accent-400 border border-accent-500/20' : 'text-surface-400 hover:bg-surface-800 hover:text-white'}"
					>
						<item.icon size={18} />
						<span class="flex-1 text-sm font-medium">{item.label}</span>
						{#if item.count !== undefined}
							<span class="text-xs px-2 py-0.5 rounded-full bg-surface-800 text-surface-400">{item.count}</span>
						{/if}
					</a>
				{/if}
			{/each}
		</nav>
		<div class="p-3 border-t border-surface-800">
			<button onclick={handleLogout} class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-surface-400 hover:bg-surface-800 hover:text-white">
				<LogOut size={18} />
				<span class="text-sm font-medium">Sign Out</span>
			</button>
		</div>
	</aside>

	<!-- Main Content -->
	<div class="flex-1 flex flex-col min-w-0">
		<!-- Top Bar -->
		<header class="h-16 flex items-center gap-4 px-4 lg:px-6 border-b border-surface-800 bg-surface-900/80 backdrop-blur-sm sticky top-0 z-30">
			<button onclick={() => mobileSidebarOpen = true} class="lg:hidden p-2 rounded-lg hover:bg-surface-800 text-surface-400">
				<Menu size={20} />
			</button>

			<div class="flex-1">
				<!-- Search placeholder -->
			</div>

			<div class="flex items-center gap-3">
				<a href="/" target="_blank" class="p-2 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-white" title="View Site">
					<LinkIcon size={20} />
				</a>
			</div>
		</header>

		<!-- Page Content -->
		<main class="flex-1 overflow-y-auto">
			{@render children()}
		</main>
	</div>
</div>

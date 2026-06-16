<script>
	import { Brain } from '@lucide/svelte';
</script>

<footer class="border-t border-surface-800 bg-surface-950">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
			<div class="md:col-span-1">
				<a href="/" class="flex items-center gap-2 mb-4">
					<img src="/logo.png" alt="AI Mematiane" class="w-10 h-10 rounded-md object-cover" />
					<span class="text-lg font-bold text-white">AI Mematiane</span>
				</a>
				<p class="text-sm text-surface-400 leading-relaxed">
					Your global directory of AI models, tools, news, and deep-dive analysis. Stay ahead of the curve.
				</p>
			</div>

			<div>
				<p class="text-sm font-semibold text-white mb-3 font-display">Explore</p>
				<ul class="space-y-2">
					<li><a href="/ai-tools" class="text-sm text-surface-400 hover:text-accent-400 transition-colors">AI Showcase</a></li>
					<li><a href="/news" class="text-sm text-surface-400 hover:text-accent-400 transition-colors">News</a></li>
					<li><a href="/blog" class="text-sm text-surface-400 hover:text-accent-400 transition-colors">Blog</a></li>
				</ul>
			</div>

			<div>
				<p class="text-sm font-semibold text-white mb-3 font-display">Account</p>
				<ul class="space-y-2">
					<li><a href="/profile" class="text-sm text-surface-400 hover:text-accent-400 transition-colors">Profile</a></li>
					<li><a href="/profile/bookmarks" class="text-sm text-surface-400 hover:text-accent-400 transition-colors">Bookmarks</a></li>
					<li><a href="/auth/login" class="text-sm text-surface-400 hover:text-accent-400 transition-colors">Login</a></li>
				</ul>
			</div>

			<div>
				<p class="text-sm font-semibold text-white mb-3 font-display">Connect</p>
				<div class="flex items-center gap-3">
					<a href="https://github.com/aimematiane" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white transition-all" aria-label="GitHub">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/><path d="M9 18c-4.51 2-5.5-1-7-2"/></svg>
					</a>
					<a href="https://www.threads.net/@aimematiane" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white transition-all" aria-label="Threads">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.03 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm4.27 12.87c-.47.66-1.12 1.09-1.92 1.29-.44.11-.86.16-1.28.16-1.1 0-2.03-.36-2.79-1.07-.76-.71-1.14-1.66-1.14-2.84 0-1.17.38-2.12 1.13-2.82.75-.71 1.68-1.07 2.78-1.07.72 0 1.39.16 2.01.48.62.32 1.11.77 1.48 1.34s.55 1.24.55 2v.45c0 .64-.17 1.14-.52 1.51-.35.37-.8.55-1.35.55-.42 0-.77-.12-1.04-.37-.27-.25-.41-.59-.41-1.03v-3.75h-1.63v.78c-.28-.32-.61-.56-1-.72-.39-.16-.83-.24-1.32-.24-.95 0-1.74.34-2.37 1.02-.63.68-.94 1.57-.94 2.67s.31 2 1 2.67c.69.67 1.49 1 2.39 1s1.61-.31 2.14-.92c.16.48.45.85.86 1.12s.91.4 1.49.4c.95 0 1.76-.35 2.44-1.05s1.02-1.61 1.02-2.73v-.45c0-1.3-.35-2.43-1.04-3.37s-1.66-1.63-2.91-2.07C14.07 5.16 12.98 5 11.96 5c-1.89 0-3.53.48-4.91 1.44S4.87 8.94 4.87 11.4s.74 4.07 2.22 5.06c1.48.99 3.29 1.48 5.43 1.48.86 0 1.74-.08 2.65-.24V16.3c-.66.12-1.32.18-1.97.18-1.77 0-3.15-.38-4.13-1.15-.98-.77-1.47-1.97-1.47-3.6s.48-2.85 1.45-3.66c.97-.81 2.29-1.22 3.96-1.22.86 0 1.73.12 2.62.36 1 .27 1.76.75 2.29 1.43s.8 1.56.8 2.64v.53c0 .67-.18 1.19-.53 1.57s-.82.57-1.4.57c-.45 0-.82-.13-1.1-.4s-.42-.64-.42-1.1v-2.31h.77V10c0-.5-.14-.91-.42-1.21-.28-.3-.66-.45-1.15-.45s-.87.15-1.15.45c-.28.3-.42.71-.42 1.21s.14.91.42 1.21c.28.3.66.45 1.15.45.31 0 .6-.06.87-.19.27-.13.48-.32.63-.57l.63.85c-.28.36-.66.63-1.14.8-.48.17-1 .25-1.56.25z"/></svg>
					</a>
					<a href="https://www.linkedin.com/in/ai-mematiane-879538415/" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white transition-all" aria-label="LinkedIn">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
					</a>
					<a href="https://x.com/AIMematiane" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white transition-all" aria-label="X (Twitter)">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
					</a>
				</div>
			</div>
		</div>

		<div class="border-t border-surface-800 mt-8 pt-8 text-center">
			<p class="text-xs text-surface-500">&copy; {new Date().getFullYear()} AI Mematiane. All rights reserved.</p>
		</div>
	</div>
</footer>

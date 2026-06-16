<script>
	import { goto } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { Mail, Lock, Eye, EyeOff } from '@lucide/svelte';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';

	const client = getSupabaseBrowserClient();

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let loading = $state(false);
	let error = $state('');

	async function handleEmailLogin() {
		loading = true;
		error = '';
		const { error: err } = await client.auth.signInWithPassword({ email, password });
		if (err) {
			error = err.message === 'Email not confirmed'
				? 'Your email is not confirmed. Check your inbox or disable email confirmation in Supabase Auth settings.'
				: err.message;
		} else {
			goto('/profile');
		}
		loading = false;
	}

	async function handleGoogleLogin() {
		const { error: err } = await client.auth.signInWithOAuth({
			provider: 'google',
			options: { redirectTo: `${window.location.origin}/auth/callback` }
		});
		if (err) error = err.message;
	}

	async function handleGithubLogin() {
		const { error: err } = await client.auth.signInWithOAuth({
			provider: 'github',
			options: { redirectTo: `${window.location.origin}/auth/callback` }
		});
		if (err) error = err.message;
	}
</script>

<SeoHead title="Login" description="Sign in to your AI Mematiane account" url="/auth/login" noindex={true} />

<section class="min-h-[80vh] flex items-center justify-center px-4 py-10">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-2xl font-bold text-white mb-2">Welcome back</h1>
			<p class="text-surface-400">Sign in to access your bookmarks and profile</p>
		</div>

		<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-5">
			{#if error}
				<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
			{/if}

			<!-- Social Login -->
			<div class="space-y-3">
				<button onclick={handleGoogleLogin} class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-white text-sm font-medium transition-all border border-surface-700">
					<svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
					Continue with Google
				</button>
				<button onclick={handleGithubLogin} class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-white text-sm font-medium transition-all border border-surface-700">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/><path d="M9 18c-4.51 2-5.5-1-7-2"/></svg>
					Continue with GitHub
				</button>
			</div>

			<div class="flex items-center gap-3">
				<div class="flex-1 border-t border-surface-700"></div>
				<span class="text-xs text-surface-500">OR</span>
				<div class="flex-1 border-t border-surface-700"></div>
			</div>

			<!-- Email Login -->
			<form onsubmit={(e) => { e.preventDefault(); handleEmailLogin(); }} class="space-y-4">
				<div>
					<label for="email" class="block text-sm text-surface-300 mb-1.5">Email</label>
					<div class="relative">
						<Mail size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
						<input id="email" type="email" bind:value={email} required placeholder="you@example.com"
							class="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 text-sm" />
					</div>
				</div>
				<div>
					<label for="password" class="block text-sm text-surface-300 mb-1.5">Password</label>
					<div class="relative">
						<Lock size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
						<input id="password" type={showPassword ? 'text' : 'password'} bind:value={password} required placeholder="Your password"
							class="w-full pl-9 pr-10 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 text-sm" />
						<button type="button" onclick={() => showPassword = !showPassword} class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">
							{#if showPassword}<EyeOff size={16} />{:else}<Eye size={16} />{/if}
						</button>
					</div>
				</div>
				<button type="submit" disabled={loading}
					class="w-full py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm transition-colors">
					{loading ? 'Signing in...' : 'Sign In'}
				</button>
			</form>

			<p class="text-sm text-center text-surface-400">
				Don't have an account?
				<a href="/auth/register" class="text-accent-400 hover:text-accent-300">Sign up</a>
			</p>
		</div>
	</div>
</section>

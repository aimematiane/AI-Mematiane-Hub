<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { Palette, Save, AlertCircle, Check, Eye } from '@lucide/svelte';
	import { submitAction } from '$lib/utils/adminFetch.js';

	let { data } = $props();

	let themeSettings = $state([]);
	let activeCategory = $state('colors');
	let saving = $state(false);
	let message = $state({ type: '', text: '' });
	let previewMode = $state(false);

	const categoryLabels = {
		colors: 'Colors',
		typography: 'Typography',
		layout: 'Layout & Spacing'
	};

	const categories = $derived([...new Set((data.themeSettings || []).map(s => s.category).filter(Boolean))]);

	$effect(() => {
		themeSettings = structuredClone(data.themeSettings || []);
		if (categories.length && !categories.includes(activeCategory)) {
			activeCategory = categories[0];
		}
	});

	function getSettingsByCategory(cat) {
		return themeSettings.filter(s => s.category === cat);
	}

	function handleInput(id, value) {
		const setting = themeSettings.find(s => s.id === id);
		themeSettings = themeSettings.map(s => s.id === id ? { ...s, value } : s);
		if (previewMode && setting?.css_variable && typeof document !== 'undefined') {
			document.documentElement.style.setProperty(setting.css_variable, value);
		}
	}

	$effect(() => {
		if (!previewMode && typeof document !== 'undefined') {
			for (const setting of themeSettings) {
				if (setting.css_variable) {
					document.documentElement.style.removeProperty(setting.css_variable);
				}
			}
		}
	});

	async function saveSettings() {
		saving = true;
		message = { type: '', text: '' };
		try {
			const formData = new FormData();
			formData.append('settings', JSON.stringify(themeSettings));
			await submitAction('update', formData, '/admin/theme');
			message = { type: 'success', text: 'Theme saved! Reloading to apply site-wide...' };
			setTimeout(() => window.location.reload(), 1200);
		} catch (err) {
			message = { type: 'error', text: err.message || 'Failed to save theme.' };
			saving = false;
		}
	}
</script>

<SeoHead title="Theme Builder" noindex={true} />

<div class="p-6 lg:p-8">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold text-white flex items-center gap-3">
				<Palette size={24} class="text-accent-400" />
				Theme Builder
			</h1>
			<p class="text-surface-400 mt-1">Customize colors, typography, and layout</p>
		</div>
		<div class="flex items-center gap-3">
			<button type="button" onclick={() => previewMode = !previewMode} class="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-white text-sm border border-surface-700">
				<Eye size={16} />
				{previewMode ? 'Preview On' : 'Preview'}
			</button>
			<button type="button" onclick={saveSettings} disabled={saving} class="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white text-sm">
				<Save size={16} />
				{saving ? 'Saving...' : 'Save Theme'}
			</button>
		</div>
	</div>

	{#if message.text}
		<div class="mb-6 p-4 rounded-xl flex items-center gap-3 {message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}">
			{#if message.type === 'success'}<Check size={18} />{:else}<AlertCircle size={18} />{/if}
			{message.text}
		</div>
	{/if}

	<div class="flex flex-col lg:flex-row gap-6">
		<div class="lg:w-56 shrink-0">
			<div class="bg-surface-900 border border-surface-800 rounded-2xl p-2">
				{#each categories as cat}
					<button type="button" onclick={() => activeCategory = cat} class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all {activeCategory === cat ? 'bg-surface-800 text-white' : 'text-surface-400 hover:text-white'}">
						{categoryLabels[cat] || cat}
					</button>
				{/each}
			</div>
		</div>

		<div class="flex-1 bg-surface-900 border border-surface-800 rounded-2xl p-6">
			<h2 class="text-lg font-semibold text-white mb-6">{categoryLabels[activeCategory] || activeCategory}</h2>

			{#if activeCategory === 'colors'}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					{#each getSettingsByCategory(activeCategory) as setting}
						<div class="p-4 rounded-xl bg-surface-800 border border-surface-700">
							<label for={`theme-color-${setting.id}`} class="block text-sm text-surface-300 mb-3">{setting.display_name}</label>
							<div class="flex items-center gap-3">
								<input id={`theme-color-${setting.id}`} type="color" value={setting.value || '#000000'} oninput={(e) => handleInput(setting.id, e.currentTarget.value)} class="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0" />
								<input type="text" value={setting.value || ''} oninput={(e) => handleInput(setting.id, e.currentTarget.value)} class="flex-1 px-3 py-2 rounded-lg bg-surface-900 border border-surface-600 text-white text-sm font-mono" />
							</div>
							{#if setting.css_variable}<p class="text-xs text-surface-500 mt-2 font-mono">{setting.css_variable}</p>{/if}
						</div>
					{:else}
						<p class="text-surface-500 text-sm">No color settings found.</p>
					{/each}
				</div>
			{:else}
				<div class="space-y-6">
					{#each getSettingsByCategory(activeCategory) as setting}
						<div>
							<label for={`theme-setting-${setting.id}`} class="block text-sm text-surface-300 mb-2">{setting.display_name}</label>
							{#if setting.key.includes('weight')}
								<select id={`theme-setting-${setting.id}`} value={setting.value || '400'} onchange={(e) => handleInput(setting.id, e.currentTarget.value)} class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm">
									<option value="300">Light (300)</option>
									<option value="400">Regular (400)</option>
									<option value="500">Medium (500)</option>
									<option value="600">Semi-Bold (600)</option>
									<option value="700">Bold (700)</option>
								</select>
							{:else}
								<input id={`theme-setting-${setting.id}`} type="text" value={setting.value || ''} oninput={(e) => handleInput(setting.id, e.currentTarget.value)} class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm font-mono" />
							{/if}
							{#if setting.css_variable}<p class="text-xs text-surface-500 mt-2 font-mono">{setting.css_variable}</p>{/if}
						</div>
					{:else}
						<p class="text-surface-500 text-sm">No settings in this category.</p>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

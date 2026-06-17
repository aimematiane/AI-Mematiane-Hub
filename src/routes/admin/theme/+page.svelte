<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { Palette, Save, AlertCircle, Check, Eye } from '@lucide/svelte';

	let { data } = $props();

	let themeSettings = $state(data.themeSettings);
	let categories = $state(data.categories);
	let activeCategory = $state(categories[0] || 'colors');
	let saving = $state(false);
	let message = $state({ type: '', text: '' });
	let previewMode = $state(false);

	const categoryLabels = {
		colors: 'Colors',
		typography: 'Typography',
		layout: 'Layout & Spacing'
	};

	function getSettingsByCategory(cat) {
		return themeSettings.filter(s => s.category === cat);
	}

	function handleInput(id, value) {
		themeSettings = themeSettings.map(s => s.id === id ? { ...s, value } : s);
	}

	async function saveSettings() {
		saving = true;
		message = { type: '', text: '' };

		try {
			const response = await fetch('/admin/theme', {
				method: 'POST',
				body: JSON.stringify({ settings: themeSettings })
			});

			if (response.ok) {
				message = { type: 'success', text: 'Theme settings saved successfully!' };
			} else {
				message = { type: 'error', text: 'Failed to save theme settings.' };
			}
		} catch (err) {
			message = { type: 'error', text: 'An error occurred.' };
		}

		saving = false;
	}

	function getPreviewStyles() {
		const styles = {};
		for (const setting of themeSettings) {
			if (setting.css_variable && setting.value) {
				styles[setting.css_variable] = setting.value;
			}
		}
		return styles;
	}

	function isColorSetting(key) {
		return key.startsWith('color_') || key.startsWith('bg_') || key.startsWith('text_') || key.includes('surface');
	}
</script>

<SeoHead title="Theme Builder" noindex={true} />

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold text-white flex items-center gap-3">
				<Palette size={24} class="text-accent-400" />
				Theme Builder
			</h1>
			<p class="text-surface-400 mt-1">Customize colors, typography, and layout</p>
		</div>
		<div class="flex items-center gap-3">
			<button
				onclick={() => previewMode = !previewMode}
				class="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-white font-medium text-sm transition-colors border border-surface-700"
			>
				<Eye size={16} />
				Preview
			</button>
			<button
				onclick={saveSettings}
				disabled={saving}
				class="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm transition-colors"
			>
				<Save size={16} />
				{saving ? 'Saving...' : 'Save Theme'}
			</button>
		</div>
	</div>

	<!-- Messages -->
	{#if message.text}
		<div class="mb-6 p-4 rounded-xl flex items-center gap-3 {message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}">
			{#if message.type === 'success'}
				<Check size={18} />
			{:else}
				<AlertCircle size={18} />
			{/if}
			{message.text}
		</div>
	{/if}

	<!-- Preview Panel -->
	{#if previewMode}
		<div class="mb-8 p-6 rounded-2xl border border-surface-700" style={getPreviewStyles()}>
			<h2 class="text-xl font-semibold text-white mb-4">Preview</h2>
			<div class="space-y-4">
				<div class="p-4 rounded-xl bg-surface-800">
					<h3 class="text-lg font-semibold text-white">Card Component</h3>
					<p class="text-surface-400 text-sm mt-2">This is how your cards will look with the current theme settings.</p>
					<button class="mt-4 px-4 py-2 rounded-xl bg-accent-500 text-white font-medium text-sm">
						Button Example
					</button>
				</div>
			</div>
		</div>
	{/if}

	<div class="flex flex-col lg:flex-row gap-6">
		<!-- Categories Sidebar -->
		<div class="lg:w-56 shrink-0">
			<div class="bg-surface-900 border border-surface-800 rounded-2xl p-2">
				{#each categories as cat}
					<button
						onclick={() => activeCategory = cat}
						class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all {activeCategory === cat ? 'bg-surface-800 text-white' : 'text-surface-400 hover:text-white'}"
					>
						{categoryLabels[cat] || cat}
					</button>
				{/each}
			</div>
		</div>

		<!-- Settings Form -->
		<div class="flex-1">
			<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6">
				<h2 class="text-lg font-semibold text-white mb-6">{categoryLabels[activeCategory] || activeCategory}</h2>

				{#if activeCategory === 'colors'}
					<!-- Color Grid Layout -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						{#each getSettingsByCategory(activeCategory) as setting}
							<div class="p-4 rounded-xl bg-surface-800 border border-surface-700">
								<label class="block text-sm font-medium text-surface-300 mb-3">
									{setting.display_name}
								</label>
								<div class="flex items-center gap-3">
									<input
										type="color"
										value={setting.value || '#000000'}
										oninput={(e) => handleInput(setting.id, e.target.value)}
										class="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0"
									/>
									<input
										type="text"
										value={setting.value || ''}
										oninput={(e) => handleInput(setting.id, e.target.value)}
										class="flex-1 px-3 py-2 rounded-lg bg-surface-900 border border-surface-600 text-white text-sm font-mono"
									/>
								</div>
								{#if setting.css_variable}
									<p class="text-xs text-surface-500 mt-2 font-mono">{setting.css_variable}</p>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<!-- Standard Layout for Typography/Layout -->
					<div class="space-y-6">
						{#each getSettingsByCategory(activeCategory) as setting}
							<div>
								<label class="block text-sm font-medium text-surface-300 mb-2">
									{setting.display_name}
								</label>

								{#if setting.key.includes('font') && !setting.key.includes('weight')}
									<input
										type="text"
										value={setting.value || ''}
										oninput={(e) => handleInput(setting.id, e.target.value)}
										class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 text-sm"
										placeholder="Font family name"
									/>
								{:else if setting.key.includes('weight')}
									<select
										value={setting.value || '400'}
										onchange={(e) => handleInput(setting.id, e.target.value)}
										class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 text-sm"
									>
										<option value="300">Light (300)</option>
										<option value="400">Regular (400)</option>
										<option value="500">Medium (500)</option>
										<option value="600">Semi-Bold (600)</option>
										<option value="700">Bold (700)</option>
									</select>
								{:else if setting.key.includes('radius')}
									<input
										type="text"
										value={setting.value || ''}
										oninput={(e) => handleInput(setting.id, e.target.value)}
										class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 text-sm"
										placeholder="e.g. 8px"
									/>
								{:else}
									<textarea
										value={setting.value || ''}
										oninput={(e) => handleInput(setting.id, e.target.value)}
										rows="2"
										class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 text-sm resize-none font-mono"
									></textarea>
								{/if}

								{#if setting.css_variable}
									<p class="text-xs text-surface-500 mt-2 font-mono">{setting.css_variable}</p>
								{/if}
							</div>
						{/each}
					</div>
				{/if}

				{#if getSettingsByCategory(activeCategory).length === 0}
					<p class="text-surface-500 text-sm">No settings in this category.</p>
				{/if}
			</div>
		</div>
	</div>
</div>

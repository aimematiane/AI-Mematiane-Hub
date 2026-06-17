<script>
	import { page } from '$app/stores';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { Settings, Save, AlertCircle, Check, Upload, Image as ImageIcon } from '@lucide/svelte';

	let { data, form } = $props();

	let settings = $state(data.settings);
	let categories = $state(data.categories);
	let activeCategory = $state(categories[0] || 'general');
	let saving = $state(false);
	let message = $state({ type: '', text: '' });

	const categoryLabels = {
		general: 'General',
		branding: 'Branding',
		contact: 'Contact',
		social: 'Social Media',
		legal: 'Legal',
		analytics: 'Analytics',
		custom: 'Custom Code'
	};

	function getSettingsByCategory(cat) {
		return settings.filter(s => s.category === cat);
	}

	function handleInput(id, value) {
		settings = settings.map(s => s.id === id ? { ...s, value } : s);
	}

	function handleJsonInput(id, key, value) {
		settings = settings.map(s => {
			if (s.id === id) {
				const existingJson = s.value_json || {};
				return { ...s, value_json: { ...existingJson, [key]: value } };
			}
			return s;
		});
	}

	async function saveSettings() {
		saving = true;
		message = { type: '', text: '' };

		try {
			const formData = new FormData();
			formData.append('settings', JSON.stringify(settings));

			const response = await fetch('/admin/settings?/update', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				message = { type: 'success', text: 'Settings saved successfully!' };
			} else {
				message = { type: 'error', text: 'Failed to save settings.' };
			}
		} catch (err) {
			message = { type: 'error', text: 'An error occurred.' };
		}

		saving = false;
	}
</script>

<SeoHead title="Site Settings" noindex={true} />

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold text-white flex items-center gap-3">
				<Settings size={24} class="text-accent-400" />
				Site Settings
			</h1>
			<p class="text-surface-400 mt-1">Configure global website settings</p>
		</div>
		<button
			onclick={saveSettings}
			disabled={saving}
			class="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm transition-colors"
		>
			<Save size={16} />
			{saving ? 'Saving...' : 'Save Changes'}
		</button>
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

				<div class="space-y-6">
					{#each getSettingsByCategory(activeCategory) as setting}
						<div>
							<label class="block text-sm font-medium text-surface-300 mb-2">
								{setting.display_name}
							</label>
							{#if setting.description}
								<p class="text-xs text-surface-500 mb-2">{setting.description}</p>
							{/if}

							{#if setting.input_type === 'text' || setting.input_type === 'url' || setting.input_type === 'email'}
								<input
									type={setting.input_type === 'email' ? 'email' : setting.input_type === 'url' ? 'url' : 'text'}
									value={setting.value || ''}
									oninput={(e) => handleInput(setting.id, e.target.value)}
									class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 text-sm"
									placeholder={setting.display_name}
								/>
							{:else if setting.input_type === 'textarea' || setting.input_type === 'rich_text'}
								<textarea
									value={setting.value || ''}
									oninput={(e) => handleInput(setting.id, e.target.value)}
									rows="4"
									class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 text-sm resize-none"
									placeholder={setting.display_name}
								></textarea>
							{:else if setting.input_type === 'image'}
								<div class="flex items-center gap-4">
									{#if setting.value}
										<img src={setting.value} alt="" class="w-16 h-16 rounded-lg object-cover border border-surface-700" />
									{:else}
										<div class="w-16 h-16 rounded-lg bg-surface-800 border border-surface-700 flex items-center justify-center">
											<ImageIcon size={20} class="text-surface-500" />
										</div>
									{/if}
									<input
										type="url"
										value={setting.value || ''}
										oninput={(e) => handleInput(setting.id, e.target.value)}
										class="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 text-sm"
										placeholder="Enter image URL"
									/>
								</div>
							{:else if setting.input_type === 'boolean'}
								<label class="flex items-center gap-3 cursor-pointer">
									<input
										type="checkbox"
										checked={setting.value === 'true'}
										onchange={(e) => handleInput(setting.id, e.target.checked ? 'true' : 'false')}
										class="w-5 h-5 rounded bg-surface-800 border border-surface-600 text-accent-500 focus:ring-accent-500 focus:ring-offset-0"
									/>
									<span class="text-sm text-surface-300">Enable</span>
								</label>
							{:else if setting.input_type === 'json'}
								<textarea
									value={JSON.stringify(setting.value_json || {}, null, 2)}
									oninput={(e) => {
										try {
											const json = JSON.parse(e.target.value);
											settings = settings.map(s => s.id === setting.id ? { ...s, value_json: json } : s);
										} catch {}
									}}
									rows="6"
									class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 text-sm font-mono resize-none"
									placeholder="Enter JSON object"
								></textarea>
							{:else}
								<input
									type="text"
									value={setting.value || ''}
									oninput={(e) => handleInput(setting.id, e.target.value)}
									class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 text-sm"
								/>
							{/if}
						</div>
					{/each}

					{#if getSettingsByCategory(activeCategory).length === 0}
						<p class="text-surface-500 text-sm">No settings in this category.</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

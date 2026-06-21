<script>
	import { invalidateAll } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import { Settings, Save, AlertCircle, Check, Image as ImageIcon } from '@lucide/svelte';
	import { submitAction } from '$lib/utils/adminFetch.js';
	import { inlineImageUrl } from '$lib/utils/media.js';

	let { data } = $props();

	let settings = $state([]);
	let activeCategory = $state('general');
	let saving = $state(false);
	let message = $state({ type: '', text: '' });

	const categoryLabels = {
		general: 'General',
		branding: 'Branding',
		contact: 'Contact',
		legal: 'Legal',
		analytics: 'Analytics',
		custom: 'Custom Code'
	};

	const categories = $derived(
		[...new Set((data.settings || []).map(s => s.category).filter(c => c && c !== 'social'))]
	);

	$effect(() => {
		settings = structuredClone(data.settings || []);
		if (categories.length && !categories.includes(activeCategory)) {
			activeCategory = categories[0];
		}
	});

	function getSettingsByCategory(cat) {
		return settings.filter(s => s.category === cat);
	}

	function handleInput(id, value) {
		settings = settings.map(s => s.id === id ? { ...s, value } : s);
	}

	function handleJsonValue(id, raw) {
		try {
			const json = JSON.parse(raw);
			settings = settings.map(s => s.id === id ? { ...s, value_json: json } : s);
		} catch {}
	}

	async function saveSettings() {
		saving = true;
		message = { type: '', text: '' };
		try {
			const formData = new FormData();
			formData.append('settings', JSON.stringify(settings));
			await submitAction('update', formData, '/admin/settings');
			message = { type: 'success', text: 'Settings saved successfully!' };
			await invalidateAll();
		} catch (err) {
			message = { type: 'error', text: err.message || 'Failed to save settings.' };
		}
		saving = false;
	}
</script>

<SeoHead title="Site Settings" noindex={true} />

<div class="p-6 lg:p-8">
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
					<button
						type="button"
						onclick={() => activeCategory = cat}
						class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all {activeCategory === cat ? 'bg-surface-800 text-white' : 'text-surface-400 hover:text-white'}"
					>
						{categoryLabels[cat] || cat}
					</button>
				{/each}
			</div>
		</div>

		<div class="flex-1">
			<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6">
				<h2 class="text-lg font-semibold text-white mb-6">{categoryLabels[activeCategory] || activeCategory}</h2>

				<div class="space-y-6">
					{#each getSettingsByCategory(activeCategory) as setting}
						<div>
							<label for={`site-setting-${setting.id}`} class="block text-sm font-medium text-surface-300 mb-2">
								{setting.display_name}
							</label>
							{#if setting.description}
								<p class="text-xs text-surface-500 mb-2">{setting.description}</p>
							{/if}

							{#if setting.input_type === 'text' || setting.input_type === 'url' || setting.input_type === 'email'}
								<input
									id={`site-setting-${setting.id}`}
									type={setting.input_type === 'email' ? 'email' : setting.input_type === 'url' ? 'url' : 'text'}
									value={setting.value || ''}
									oninput={(e) => handleInput(setting.id, e.currentTarget.value)}
									class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500"
								/>
							{:else if setting.input_type === 'select'}
								<select
									id={`site-setting-${setting.id}`}
									value={setting.value || ''}
									onchange={(e) => handleInput(setting.id, e.currentTarget.value)}
									class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500"
								>
									{#each setting.value_json?.options || [] as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							{:else if setting.input_type === 'textarea' || setting.input_type === 'rich_text'}
								<textarea
									id={`site-setting-${setting.id}`}
									value={setting.value || ''}
									oninput={(e) => handleInput(setting.id, e.currentTarget.value)}
									rows="4"
									class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm resize-none focus:outline-none focus:border-accent-500"
								></textarea>
							{:else if setting.input_type === 'image'}
								<div class="space-y-3">
									{#if setting.value}
										<img src={inlineImageUrl(setting.value)} alt="" class="w-20 h-20 rounded-lg object-contain border border-surface-700 bg-surface-950 p-1" />
									{:else}
										<div class="w-20 h-20 rounded-lg bg-surface-800 border border-surface-700 flex items-center justify-center">
											<ImageIcon size={20} class="text-surface-500" />
										</div>
									{/if}
									<FileUpload
										label="Upload image"
										accept="image/*,.svg"
										path="media"
										onUploaded={(uploaded) => { if (uploaded[0]) handleInput(setting.id, uploaded[0]); }}
									/>
									<input
										type="url"
										value={setting.value || ''}
										oninput={(e) => handleInput(setting.id, e.currentTarget.value)}
										placeholder="Or paste image URL"
										class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm"
									/>
								</div>
							{:else if setting.input_type === 'boolean'}
								<label class="flex items-center gap-3 cursor-pointer">
									<input
										id={`site-setting-${setting.id}`}
										type="checkbox"
										checked={setting.value === 'true'}
										onchange={(e) => handleInput(setting.id, e.currentTarget.checked ? 'true' : 'false')}
										class="w-5 h-5 rounded bg-surface-800 border-surface-600 text-accent-500"
									/>
									<span class="text-sm text-surface-300">Enabled</span>
								</label>
							{:else if setting.input_type === 'json'}
								<textarea
									id={`site-setting-${setting.id}`}
									value={JSON.stringify(setting.value_json || {}, null, 2)}
									oninput={(e) => handleJsonValue(setting.id, e.currentTarget.value)}
									rows="6"
									class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm font-mono resize-none"
								></textarea>
							{:else}
								<input
									id={`site-setting-${setting.id}`}
									type="text"
									value={setting.value || ''}
									oninput={(e) => handleInput(setting.id, e.currentTarget.value)}
									class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm"
								/>
							{/if}
						</div>
					{:else}
						<p class="text-surface-500 text-sm">No settings in this category.</p>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

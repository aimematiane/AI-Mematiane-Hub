import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env.local
const envFile = readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
	const parts = line.split('=');
	if (parts.length >= 2) {
		env[parts[0].trim()] = parts.slice(1).join('=').trim();
	}
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY);

async function listAllFiles(folder = '') {
	console.log('Listing folder:', folder || '[root]');
	const { data, error } = await supabase.storage.from('uploads').list(folder, {
		limit: 100,
		sortBy: { column: 'name', order: 'desc' }
	});
	if (error) {
		console.error('Error listing storage:', error);
		return [];
	}

	let files = [];
	for (const item of data || []) {
		if (!item.id || !item.metadata) {
			const subFolder = folder ? `${folder}/${item.name}` : item.name;
			const subFiles = await listAllFiles(subFolder);
			files = files.concat(subFiles);
		} else {
			const path = folder ? `${folder}/${item.name}` : item.name;
			const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path);
			files.push({
				name: item.name,
				path,
				url: urlData.publicUrl,
				size: item.metadata.size,
				mimetype: item.metadata.mimetype
			});
		}
	}
	return files;
}

async function test() {
	const files = await listAllFiles();
	console.log('Total files found in storage:', files.length);
	console.log('Files:', JSON.stringify(files, null, 2));

	const { data: media, error: mediaErr } = await supabase.from('media_files').select('*');
	console.log('Total media files in DB:', media?.length, mediaErr);
	console.log('DB files:', JSON.stringify(media, null, 2));
}

test();

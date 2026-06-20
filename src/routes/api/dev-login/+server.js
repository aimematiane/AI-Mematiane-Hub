import { createClient } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';
import { readFileSync } from 'fs';

export async function GET() {
	const envFile = readFileSync('.env.local', 'utf-8');
	const env = {};
	envFile.split('\n').forEach(line => {
		const parts = line.split('=');
		if (parts.length >= 2) {
			env[parts[0].trim()] = parts.slice(1).join('=').trim();
		}
	});

	const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
	const { data, error } = await supabase.auth.admin.generateLink({
		type: 'magiclink',
		email: 'gcchanturia@gmail.com',
		options: {
			redirectTo: 'http://localhost:5174/admin/media'
		}
	});
	if (error) {
		return new Response(error.message, { status: 500 });
	}
	throw redirect(302, data.properties.action_link);
}

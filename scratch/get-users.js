import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
	const parts = line.split('=');
	if (parts.length >= 2) {
		env[parts[0].trim()] = parts.slice(1).join('=').trim();
	}
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY);

async function run() {
	const { data: profiles, error } = await supabase.from('profiles').select('email, role');
	console.log('Profiles:', profiles, error);
}
run();

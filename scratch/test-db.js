import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env.local
const envFile = readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
	const parts = line.split('=');
	if (parts.length === 2) {
		env[parts[0].trim()] = parts[1].trim();
	}
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY);

async function test() {
	const { data: posts, error: err1 } = await supabase.from('posts').select('*').limit(3);
	const { data: news, error: err2 } = await supabase.from('news').select('*').limit(3);
	console.log('Posts:', posts, err1);
	console.log('News:', news, err2);
}

test();

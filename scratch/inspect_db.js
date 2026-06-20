import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const lines = env.split('\n');
const processEnv = {};
for (const line of lines) {
	if (line.startsWith('#') || !line.trim()) continue;
	const parts = line.split('=');
	const key = parts[0].trim();
	const val = parts.slice(1).join('=').trim();
	processEnv[key] = val;
}

const supabaseUrl = processEnv.VITE_SUPABASE_URL;
const supabaseServiceKey = processEnv.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
	const { data: objects, error: objError } = await supabase.storage.from('uploads').list('profile-images/6f4e4b44-989d-472a-9406-ed0c4e4b7bd9');
	if (objError) {
		console.error('Error listing user subfolder:', objError);
	} else {
		console.log('FILES IN USER PROFILE-IMAGES FOLDER:');
		console.log(JSON.stringify(objects, null, 2));
	}
}

run();

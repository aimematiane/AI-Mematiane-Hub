import fetch from 'node-fetch'; // wait, node-fetch might not be installed. Let's use global fetch or https module.
import https from 'https';

const url = 'https://aocnsmmsddvnmrbnneds.supabase.co/storage/v1/object/public/uploads/profile-images/6f4e4b44-989d-472a-9406-ed0c4e4b7bd9/1781980187069-istockphoto-1209793467-204admin-users-page-17819799845608x2048.jpg';

https.get(url, (res) => {
	console.log('STATUS CODE:', res.statusCode);
	console.log('HEADERS:', res.headers);
	let data = '';
	res.on('data', (chunk) => { data += chunk; });
	res.on('end', () => {
		console.log('BODY:', data.substring(0, 500));
	});
}).on('error', (err) => {
	console.error('ERROR:', err);
});

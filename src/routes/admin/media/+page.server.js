import { requireAdmin } from '$lib/server/auth.js';
import { logAudit } from '$lib/server/audit.js';
import { guessMimeType } from '$lib/utils/media.js';
import { fail } from '@sveltejs/kit';

async function listAllFiles(client, folder = '') {
	const listFolder = folder === '/' ? '' : folder;
	const { data, error } = await client.storage.from('uploads').list(listFolder, {
		limit: 100,
		sortBy: { column: 'name', order: 'desc' }
	});
	if (error) {
		console.error(`Error listing folder "${folder}":`, error);
		return [];
	}

	let files = [];
	for (const item of data || []) {
		if (item.name === '.emptyFolderPlaceholder') {
			continue;
		}
		const path = folder && folder !== '/' ? `${folder}/${item.name}` : item.name;
		if (!item.id || !item.metadata) {
			const subFiles = await listAllFiles(client, path);
			files = files.concat(subFiles);
		} else {
			const { data: urlData } = client.storage.from('uploads').getPublicUrl(path);
			files.push({
				storage_path: path,
				filename: item.name,
				size_bytes: item.metadata.size || 0,
				mime_type: item.metadata.mimetype || guessMimeType(item.name),
				url: urlData.publicUrl,
				folder: folder || '/',
				created_at: item.created_at || item.updated_at || new Date().toISOString()
			});
		}
	}
	return files;
}

async function listAllPathsIncludingPlaceholders(client, folder = '') {
	const listFolder = folder === '/' ? '' : folder;
	const { data, error } = await client.storage.from('uploads').list(listFolder, {
		limit: 100,
		sortBy: { column: 'name', order: 'desc' }
	});
	if (error) {
		console.error(`Error listing folder for paths "${folder}":`, error);
		return [];
	}

	let paths = [];
	for (const item of data || []) {
		const path = folder && folder !== '/' ? `${folder}/${item.name}` : item.name;
		if (!item.id || !item.metadata) {
			const subPaths = await listAllPathsIncludingPlaceholders(client, path);
			paths = paths.concat(subPaths);
		} else {
			paths.push(path);
		}
	}
	return paths;
}

const marker = '/storage/v1/object/public/uploads/';
function getPathFromUrl(url) {
	if (!url) return '';
	const idx = url.indexOf(marker);
	if (idx !== -1) {
		return url.substring(idx + marker.length);
	}
	try {
		const parsed = new URL(url);
		return decodeURIComponent(parsed.pathname.split('/uploads/').pop() || '');
	} catch {
		return url;
	}
}

export async function load(event) {
	const { client, user } = await requireAdmin(event, 'role');

	// Helper to normalize folder paths consistently
	const normalizeFolder = (f) => {
		if (!f) return '/';
		const clean = f.trim().replace(/^\/+|\/+$/g, '');
		return clean === '' ? '/' : clean;
	};

	const activeFolder = normalizeFolder(event.url.searchParams.get('folder') || '/');

	// 1. Get files in the active folder from storage (non-recursive, extremely fast)
	const listFolder = activeFolder === '/' ? '' : activeFolder;
	const { data: storageObjects, error: storageErr } = await client.storage.from('uploads').list(listFolder, {
		limit: 150,
		sortBy: { column: 'name', order: 'desc' }
	});

	let storageFiles = [];
	if (!storageErr && storageObjects) {
		for (const item of storageObjects) {
			if (item.name === '.emptyFolderPlaceholder') continue;
			
			// If it's a file (has id/metadata)
			if (item.id && item.metadata) {
				const path = activeFolder === '/' ? item.name : `${activeFolder}/${item.name}`;
				const { data: urlData } = client.storage.from('uploads').getPublicUrl(path);
				storageFiles.push({
					storage_path: path,
					filename: item.name,
					size_bytes: item.metadata.size || 0,
					mime_type: item.metadata.mimetype || guessMimeType(item.name),
					url: urlData.publicUrl,
					folder: activeFolder,
					created_at: item.created_at || item.updated_at || new Date().toISOString()
				});
			}
		}
	}

	// 2. Get all tracked files in the media_files DB table
	const { data: dbFiles } = await client
		.from('media_files')
		.select('id, filename, original_filename, mime_type, size_bytes, url, thumbnail_url, alt_text, title, description, folder, created_at, uploader:profiles(display_name)')
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	const dbMap = new Map();
	if (dbFiles) {
		for (const db of dbFiles) {
			const normalizedPath = getPathFromUrl(db.url);
			if (normalizedPath) {
				dbMap.set(normalizedPath, db);
			}
		}
	}

	// 3. Merge files in storage for active folder with DB metadata
	const media = [];
	for (const sf of storageFiles) {
		const dbMatch = dbMap.get(sf.storage_path);
		if (dbMatch) {
			media.push({
				...sf,
				id: dbMatch.id,
				original_filename: dbMatch.original_filename || sf.filename,
				alt_text: dbMatch.alt_text || '',
				title: dbMatch.title || '',
				description: dbMatch.description || '',
				uploader: dbMatch.uploader,
				created_at: dbMatch.created_at || sf.created_at,
				folder: activeFolder
			});
			dbMap.delete(sf.storage_path);
		} else {
			media.push({
				id: `virtual:${sf.storage_path}`,
				filename: sf.filename,
				original_filename: sf.filename,
				mime_type: sf.mime_type,
				size_bytes: sf.size_bytes,
				url: sf.url,
				thumbnail_url: null,
				alt_text: '',
				title: '',
				description: '',
				folder: activeFolder,
				created_at: sf.created_at,
				uploader: null
			});
		}
	}

	// 4. Add remaining DB files that are in the active folder
	for (const db of dbMap.values()) {
		if (normalizeFolder(db.folder) === activeFolder) {
			media.push({
				id: db.id,
				filename: db.filename,
				original_filename: db.original_filename || db.filename,
				mime_type: db.mime_type,
				size_bytes: db.size_bytes,
				url: db.url,
				thumbnail_url: db.thumbnail_url,
				alt_text: db.alt_text || '',
				title: db.title || '',
				description: db.description || '',
				folder: activeFolder,
				created_at: db.created_at,
				uploader: db.uploader
			});
		}
	}

	media.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

	// 5. Construct folders tree list (fast, no recursion)
	const foldersSet = new Set(['/']);
	
	// Add folders from DB
	if (dbFiles) {
		for (const item of dbFiles) {
			if (item.folder) {
				const clean = normalizeFolder(item.folder);
				if (clean !== '/') {
					const parts = clean.split('/');
					let cumulative = '';
					for (const p of parts) {
						cumulative = cumulative ? `${cumulative}/${p}` : p;
						foldersSet.add(cumulative);
					}
				}
			}
		}
	}

	// Add top-level storage directories to tree
	const { data: topObjects } = await client.storage.from('uploads').list('', { limit: 100 });
	if (topObjects) {
		for (const obj of topObjects) {
			if (!obj.id || !obj.metadata) { // folder
				const clean = normalizeFolder(obj.name);
				if (clean !== '/') {
					foldersSet.add(clean);
				}
			}
		}
	}

	// Add sub-level storage directories of the activeFolder to tree
	if (activeFolder !== '/') {
		const { data: subObjects } = await client.storage.from('uploads').list(activeFolder, { limit: 100 });
		if (subObjects) {
			for (const obj of subObjects) {
				if (!obj.id || !obj.metadata) { // folder
					const clean = normalizeFolder(`${activeFolder}/${obj.name}`);
					if (clean !== '/') {
						foldersSet.add(clean);
					}
				}
			}
		}
	}

	const folders = Array.from(foldersSet).sort((a, b) => a.localeCompare(b));

	return {
		media,
		folders,
		activeFolder,
		user
	};
}

export const actions = {
	async upload(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const url_path = formData.get('url')?.toString() || '';
		const filename = formData.get('filename')?.toString() || url_path.split('/').pop() || 'file';
		const alt_text = formData.get('alt_text')?.toString() || '';
		const folder = formData.get('folder')?.toString() || 'media';

		const mime_type = guessMimeType(filename);

		const listFolder = folder === '/' ? '' : folder;
		const { data: listData } = await client.storage.from('uploads').list(listFolder, {
			search: filename
		});
		const matchedItem = listData?.find(item => item.name === filename);
		const size_bytes = matchedItem?.metadata?.size || 0;

		const { error } = await client.from('media_files').insert({
			filename,
			original_filename: filename,
			mime_type,
			size_bytes,
			url: url_path,
			uploaded_by: user.id,
			folder,
			alt_text
		});

		if (error) return fail(400, { message: error.message });

		await logAudit(client, {
			userId: user.id,
			action: 'media_upload',
			entityType: 'media_files',
			newValues: { url: url_path, filename }
		});

		return { success: true };
	},

	async delete(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id')?.toString() || '';

		let storagePath = '';

		if (id.startsWith('virtual:')) {
			storagePath = id.substring('virtual:'.length);
		} else {
			const { data: dbFile } = await client
				.from('media_files')
				.select('url')
				.eq('id', id)
				.single();
			
			if (dbFile?.url) {
				storagePath = getPathFromUrl(dbFile.url);
			}

			const { error } = await client
				.from('media_files')
				.update({ deleted_at: new Date().toISOString() })
				.eq('id', id);
			
			if (error) return fail(400, { message: error.message });
		}

		if (storagePath) {
			const { error: storageError } = await client.storage.from('uploads').remove([storagePath]);
			if (storageError) {
				console.error(`Failed to delete "${storagePath}" from storage:`, storageError);
			}
		}

		await logAudit(client, {
			userId: user.id,
			action: 'media_delete',
			entityType: 'media_files',
			entityId: id.startsWith('virtual:') ? null : id,
			newValues: { storagePath }
		});

		return { success: true };
	},

	async updateMeta(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const id = formData.get('id')?.toString() || '';
		const alt_text = formData.get('alt_text')?.toString() || '';
		const title = formData.get('title')?.toString() || '';
		const description = formData.get('description')?.toString() || '';

		let dbId = id;

		if (id.startsWith('virtual:')) {
			const storagePath = id.substring('virtual:'.length);
			const filename = storagePath.split('/').pop() || 'file';
			const { data: urlData } = client.storage.from('uploads').getPublicUrl(storagePath);
			const folder = storagePath.split('/').slice(0, -1).join('/') || '/';
			const mime_type = guessMimeType(filename);

			let size_bytes = 0;
			const listFolder = folder === '/' ? '' : folder;
			const { data: listData } = await client.storage.from('uploads').list(listFolder, {
				search: filename
			});
			const matchedItem = listData?.find(item => item.name === filename);
			if (matchedItem) {
				size_bytes = matchedItem.metadata?.size || 0;
			}

			const { data: inserted, error: insertError } = await client
				.from('media_files')
				.insert({
					filename,
					original_filename: filename,
					mime_type,
					size_bytes,
					url: urlData.publicUrl,
					uploaded_by: user.id,
					folder,
					alt_text,
					title,
					description
				})
				.select('id')
				.single();

			if (insertError) {
				return fail(400, { message: insertError.message });
			}
			dbId = inserted.id;
		} else {
			const { error } = await client
				.from('media_files')
				.update({ alt_text, title, description })
				.eq('id', dbId);
			
			if (error) return fail(400, { message: error.message });
		}

		await logAudit(client, {
			userId: user.id,
			action: 'media_update',
			entityType: 'media_files',
			entityId: dbId
		});

		return { success: true };
	},

	async createFolder(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const parentPath = formData.get('parentPath')?.toString() || '';
		const folderName = formData.get('folderName')?.toString() || '';

		if (!folderName) return fail(400, { message: 'Folder name is required' });
		
		const cleanParent = parentPath.replace(/^\/|\/$/g, '');
		const folderPath = cleanParent ? `${cleanParent}/${folderName}` : folderName;
		const placeholderPath = `${folderPath}/.emptyFolderPlaceholder`;

		const { error } = await client.storage
			.from('uploads')
			.upload(placeholderPath, new Blob(['']), {
				contentType: 'text/plain',
				upsert: true
			});

		if (error) return fail(400, { message: error.message });

		await logAudit(client, { userId: user.id, action: 'media_folder_create', entityType: 'media_files', newValues: { folderPath } });
		return { success: true };
	},

	async renameFolder(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const oldFolder = formData.get('oldFolder')?.toString() || '';
		const newFolderName = formData.get('newFolderName')?.toString() || '';

		if (!oldFolder || oldFolder === '/') return fail(400, { message: 'Cannot rename root folder' });
		if (!newFolderName) return fail(400, { message: 'New folder name is required' });

		const parts = oldFolder.split('/');
		parts[parts.length - 1] = newFolderName.trim();
		const newFolder = parts.join('/');

		const paths = await listAllPathsIncludingPlaceholders(client, oldFolder);

		for (const path of paths) {
			const relativePath = path.substring(oldFolder.length);
			const newPath = `${newFolder}${relativePath}`;
			const { error: moveError } = await client.storage.from('uploads').move(path, newPath);
			if (moveError) {
				console.error(`Failed to move "${path}" to "${newPath}":`, moveError);
				continue;
			}

			// Update URL and folder path in DB
			const { data: oldUrlData } = client.storage.from('uploads').getPublicUrl(path);
			const { data: newUrlData } = client.storage.from('uploads').getPublicUrl(newPath);
			const newFileFolder = newPath.split('/').slice(0, -1).join('/') || '/';

			await client.from('media_files')
				.update({
					url: newUrlData.publicUrl,
					folder: newFileFolder
				})
				.eq('url', oldUrlData.publicUrl);
		}

		await logAudit(client, {
			userId: user.id,
			action: 'media_folder_rename',
			entityType: 'media_files',
			newValues: { oldFolder, newFolder }
		});

		return { success: true };
	},

	async deleteFolder(event) {
		const { request } = event;
		const { client, user } = await requireAdmin(event, 'role');
		const formData = await request.formData();
		const folderPath = formData.get('folderPath')?.toString() || '';

		if (!folderPath || folderPath === '/') return fail(400, { message: 'Cannot delete root folder' });

		const paths = await listAllPathsIncludingPlaceholders(client, folderPath);
		// Add the placeholder for the folder itself just in case
		paths.push(`${folderPath}/.emptyFolderPlaceholder`);

		// Filter unique paths to be absolutely safe
		const uniquePaths = Array.from(new Set(paths));

		if (uniquePaths.length > 0) {
			const { error: deleteError } = await client.storage.from('uploads').remove(uniquePaths);
			if (deleteError) return fail(400, { message: deleteError.message });

			// Soft-delete matching DB records
			for (const path of uniquePaths) {
				if (path.endsWith('.emptyFolderPlaceholder')) continue;
				const { data: urlData } = client.storage.from('uploads').getPublicUrl(path);
				await client.from('media_files')
					.update({ deleted_at: new Date().toISOString() })
					.eq('url', urlData.publicUrl);
			}
		}

		await logAudit(client, {
			userId: user.id,
			action: 'media_folder_delete',
			entityType: 'media_files',
			newValues: { folderPath }
		});

		return { success: true };
	}
};

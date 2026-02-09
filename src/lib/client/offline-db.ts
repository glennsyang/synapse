/**
 * IndexedDB wrapper for offline data caching
 * Provides a simple key-value store for caching user data when offline
 */

const DB_NAME = 'synapse-offline';
const DB_VERSION = 1;
const STORE_NAME = 'cache';

export interface OfflineRecord {
	id: string;
	tableName: string;
	data: Record<string, unknown>;
	operation: 'insert' | 'update' | 'delete';
	timestamp: number;
	synced: boolean;
}

/**
 * Initialize IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(new Error(request.error?.message || 'Failed to open database'));
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			// Create object store if it doesn't exist
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const store = db.createObjectStore(STORE_NAME, {
					keyPath: ['tableName', 'id']
				});
				store.createIndex('synced', 'synced', { unique: false });
				store.createIndex('timestamp', 'timestamp', { unique: false });
			}
		};
	});
}

/**
 * Save a record to offline cache
 */
export async function saveToOfflineCache(record: OfflineRecord): Promise<void> {
	const db = await openDatabase();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.put(record);

		request.onerror = () => reject(new Error(request.error?.message || 'Failed to save record'));
		request.onsuccess = () => resolve();
	});
}

/**
 * Get a single record from offline cache
 */
export async function getFromOfflineCache(
	tableName: string,
	id: string
): Promise<OfflineRecord | null> {
	const db = await openDatabase();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.get([tableName, id]);

		request.onerror = () => reject(new Error(request.error?.message || 'Failed to get record'));
		request.onsuccess = () => resolve(request.result || null);
	});
}

/**
 * Get all records for a specific table
 */
export async function getAllFromTable(tableName: string): Promise<OfflineRecord[]> {
	const db = await openDatabase();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.getAll();

		request.onerror = () => reject(new Error(request.error?.message || 'Failed to get records'));
		request.onsuccess = () => {
			const results = (request.result || []).filter(
				(record: OfflineRecord) => record.tableName === tableName
			);
			resolve(results);
		};
	});
}

/**
 * Get all unsynced records (pending sync to server)
 */
export async function getUnsyncedRecords(): Promise<OfflineRecord[]> {
	const db = await openDatabase();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.getAll();

		request.onerror = () =>
			reject(new Error(request.error?.message || 'Failed to get unsynced records'));
		request.onsuccess = () => {
			const results = (request.result || []).filter(
				(record: OfflineRecord) => record.synced === false
			);
			resolve(results);
		};
	});
}

/**
 * Mark a record as synced
 */
export async function markAsSynced(tableName: string, id: string): Promise<void> {
	const record = await getFromOfflineCache(tableName, id);
	if (record) {
		record.synced = true;
		await saveToOfflineCache(record);
	}
}

/**
 * Delete a record from offline cache
 */
export async function deleteFromOfflineCache(tableName: string, id: string): Promise<void> {
	const db = await openDatabase();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.delete([tableName, id]);

		request.onerror = () => reject(new Error(request.error?.message || 'Failed to delete record'));
		request.onsuccess = () => resolve();
	});
}

/**
 * Clear all cached data (useful for logout)
 */
export async function clearOfflineCache(): Promise<void> {
	const db = await openDatabase();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.clear();

		request.onerror = () => reject(new Error(request.error?.message || 'Failed to clear cache'));
		request.onsuccess = () => resolve();
	});
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
	total: number;
	synced: number;
	unsynced: number;
}> {
	const db = await openDatabase();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const countRequest = store.count();

		countRequest.onerror = () =>
			reject(new Error(countRequest.error?.message || 'Failed to get cache stats'));
		countRequest.onsuccess = async () => {
			const total = countRequest.result;
			const unsyncedRecords = await getUnsyncedRecords();
			const unsynced = unsyncedRecords.length;

			resolve({
				total,
				synced: total - unsynced,
				unsynced
			});
		};
	});
}

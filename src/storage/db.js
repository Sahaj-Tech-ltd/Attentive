const DB_NAME = 'Anchor_DB';
const DB_VERSION = 1;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            reject(event.target.error);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('sessions')) {
                db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('module_results')) {
                const store = db.createObjectStore('module_results', { keyPath: 'id', autoIncrement: true });
                store.createIndex('session_id', 'session_id', { unique: false });
                store.createIndex('module_type', 'module_type', { unique: false });
            }
            if (!db.objectStoreNames.contains('trials')) {
                const store = db.createObjectStore('trials', { keyPath: 'id', autoIncrement: true });
                store.createIndex('session_id', 'session_id', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
    });
}

let dbInstance = null;

export async function initDB() {
    if (!dbInstance) {
        dbInstance = await openDB();
    }
    return dbInstance;
}

export async function saveSession(participantId, metadata) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        const session = {
            participantId,
            date: new Date().toISOString(),
            metadata
        };
        const request = store.add(session);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

export async function saveModuleResults(sessionId, moduleType, results) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['module_results'], 'readwrite');
        const store = transaction.objectStore('module_results');
        const request = store.add({
            session_id: sessionId,
            module_type: moduleType,
            date: new Date().toISOString(),
            results
        });
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

export async function saveTrials(sessionId, trials) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['trials'], 'readwrite');
        const store = transaction.objectStore('trials');

        transaction.oncomplete = () => resolve();
        transaction.onerror = (event) => reject(event.target.error);

        trials.forEach(trial => {
            store.add({ session_id: sessionId, ...trial });
        });
    });
}

export async function getSessions() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sessions'], 'readonly');
        const request = transaction.objectStore('sessions').getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function getModuleResults(sessionId) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['module_results'], 'readonly');
        const index = transaction.objectStore('module_results').index('session_id');
        const request = index.getAll(sessionId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

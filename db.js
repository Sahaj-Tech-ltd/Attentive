const DB_NAME = 'OpenCPT_DB';
const DB_VERSION = 1;

class CPTDatabase {
    constructor() {
        this.db = null;
    }

    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("Database error: " + event.target.errorCode);
                reject(event.target.error);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Sessions store: id, participantName, date, settings
                if (!db.objectStoreNames.contains('sessions')) {
                    db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
                }

                // Trials store: session_id, block, stimulus, response, rt, correct
                if (!db.objectStoreNames.contains('trials')) {
                    const trialsStore = db.createObjectStore('trials', { keyPath: 'id', autoIncrement: true });
                    trialsStore.createIndex('session_id', 'session_id', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
        });
    }

    async saveSession(participantName, settings) {
        if (!this.db) await this.open();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sessions'], 'readwrite');
            const store = transaction.objectStore('sessions');
            const session = {
                participantName,
                date: new Date().toISOString(),
                settings
            };
            
            const request = store.add(session);
            
            request.onsuccess = (event) => {
                resolve(event.target.result); // Returns the new session ID
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async saveTrials(sessionId, trialsData) {
        if (!this.db) await this.open();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['trials'], 'readwrite');
            const store = transaction.objectStore('trials');
            
            let completed = 0;
            
            transaction.oncomplete = () => {
                resolve();
            };

            transaction.onerror = (event) => {
                reject(event.target.error);
            };

            trialsData.forEach(trial => {
                store.add({
                    session_id: sessionId,
                    ...trial
                });
            });
        });
    }

    async getAllSessions() {
        if (!this.db) await this.open();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sessions'], 'readonly');
            const store = transaction.objectStore('sessions');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

const db = new CPTDatabase();

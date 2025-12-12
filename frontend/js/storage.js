// IndexedDB Storage Manager
class StorageManager {
  constructor() {
    this.dbName = 'ForestBuilderDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('user')) {
          db.createObjectStore('user', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('trees')) {
          const treeStore = db.createObjectStore('trees', { keyPath: 'id', autoIncrement: true });
          treeStore.createIndex('plotNumber', 'plotNumber', { unique: false });
        }

        if (!db.objectStoreNames.contains('gameState')) {
          db.createObjectStore('gameState', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('inventory')) {
          db.createObjectStore('inventory', { keyPath: 'type' });
        }
      };
    });
  }

  // Generic methods
  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // User methods
  async saveUser(userData) {
    return this.put('user', { id: 'current', ...userData });
  }

  async getUser() {
    return this.get('user', 'current');
  }

  async clearUser() {
    return this.clear('user');
  }

  // Tree methods
  async saveTrees(trees) {
    await this.clear('trees');
    for (const tree of trees) {
      await this.add('trees', tree);
    }
  }

  async getTrees() {
    return this.getAll('trees');
  }

  async getTreesByPlot(plotNumber) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trees'], 'readonly');
      const store = transaction.objectStore('trees');
      const index = store.index('plotNumber');
      const request = index.getAll(plotNumber);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Game state methods
  async saveGameState(key, value) {
    return this.put('gameState', { key, value, timestamp: Date.now() });
  }

  async getGameState(key) {
    const result = await this.get('gameState', key);
    return result ? result.value : null;
  }

  // Inventory methods
  async saveInventory(inventory) {
    await this.clear('inventory');
    for (const [type, quantity] of Object.entries(inventory)) {
      await this.add('inventory', { type, quantity });
    }
  }

  async getInventory() {
    const items = await this.getAll('inventory');
    const inventory = {};
    items.forEach(item => {
      inventory[item.type] = item.quantity;
    });
    return inventory;
  }

  // Clear all data
  async clearAll() {
    await this.clear('user');
    await this.clear('trees');
    await this.clear('gameState');
    await this.clear('inventory');
  }
}

// Initialize storage
const storage = new StorageManager();

// Auto-save game state periodically
let autoSaveInterval;

function startAutoSave() {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  
  autoSaveInterval = setInterval(async () => {
    try {
      if (window.currentUser) {
        await storage.saveGameState('lastSaved', Date.now());
        console.log('Game auto-saved');
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, 30000); // Save every 30 seconds
}

function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}
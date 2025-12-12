// Notification Manager
class NotificationManager {
  constructor() {
    this.permission = 'default';
    this.enabled = false;
  }

  async init() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
      
      // Check if notifications are enabled in storage
      const enabled = await storage.getGameState('notificationsEnabled');
      this.enabled = enabled !== null ? enabled : true;
    }
  }

  async requestPermission() {
    if ('Notification' in window && this.permission === 'default') {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    }
    return this.permission === 'granted';
  }

  async toggle() {
    if (!('Notification' in window)) {
      showToast('Notifications not supported on this device');
      return false;
    }

    if (this.permission === 'default') {
      const granted = await this.requestPermission();
      if (!granted) {
        showToast('Please allow notifications in browser settings');
        return false;
      }
    }

    this.enabled = !this.enabled;
    await storage.saveGameState('notificationsEnabled', this.enabled);
    showToast(`Notifications ${this.enabled ? 'enabled' : 'disabled'}`);
    return this.enabled;
  }

  send(title, body, options = {}) {
    if (!this.enabled || this.permission !== 'granted') return;

    const notification = new Notification(title, {
      body,
      icon: '/assets/icons/icon-192.png',
      badge: '/assets/icons/icon-96.png',
      vibrate: [200, 100, 200],
      tag: options.tag || 'forest-builder',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }

  // Specific game notifications
  treeReadyToHarvest(treeType) {
    this.send(
      '🌳 Tree Ready!',
      `Your ${treeType} tree is ready to harvest!`,
      { tag: 'harvest' }
    );
  }

  treeNeedsWater(treeType) {
    this.send(
      '💧 Tree Needs Water',
      `Your ${treeType} tree needs watering`,
      { tag: 'water' }
    );
  }

  treeFullyGrown() {
    this.send(
      '🎉 Congratulations!',
      'A tree has fully grown in your forest!',
      { tag: 'grown' }
    );
  }

  newPlotUnlocked() {
    this.send(
      '🎊 New Plot Unlocked!',
      'You can now plant more trees!',
      { tag: 'plot' }
    );
  }

  birdVisiting() {
    this.send(
      '🐦 Bird Visiting',
      'A bird is visiting your forest!',
      { tag: 'bird' }
    );
  }

  weatherChange(weather) {
    const messages = {
      sunny: 'Sunny weather! Great for growing 🌞',
      rainy: 'Rain! Your trees are being watered 🌧️',
      cloudy: 'Cloudy weather ☁️'
    };
    
    this.send(
      'Weather Update',
      messages[weather] || 'Weather has changed',
      { tag: 'weather' }
    );
  }
}

// Initialize notification manager
const notificationManager = new NotificationManager();

// Schedule notifications based on tree states
function scheduleTreeNotifications(trees) {
  if (!notificationManager.enabled) return;

  trees.forEach(tree => {
    const now = Date.now();
    
    // Notify when tree will be ready
    if (tree.nextStageAt) {
      const timeUntilReady = new Date(tree.nextStageAt).getTime() - now;
      
      if (timeUntilReady > 0 && timeUntilReady < 24 * 60 * 60 * 1000) { // Within 24 hours
        setTimeout(() => {
          notificationManager.treeFullyGrown();
        }, timeUntilReady);
      }
    }

    // Notify if tree needs water (water level < 30%)
    if (tree.waterLevel < 30) {
      notificationManager.treeNeedsWater(tree.seedType);
    }

    // Notify if fruits are ready
    if (tree.stage === 'fruiting' && tree.fruitsReady > 0) {
      notificationManager.treeReadyToHarvest(tree.seedType);
    }
  });
}

// Request notification permission on first interaction
async function initNotifications() {
  await notificationManager.init();
  
  // Request permission if not already asked
  if (notificationManager.permission === 'default') {
    setTimeout(() => {
      notificationManager.requestPermission();
    }, 5000); // Ask after 5 seconds
  }
}
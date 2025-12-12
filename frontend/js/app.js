// Global game state
let currentUser = null;
let currentPlot = 0;
let trees = [];
let selectedPosition = null;
let selectedSeed = null;
let selectedTree = null;

// Initialize app
async function initApp() {
  try {
    // Initialize IndexedDB
    await storage.init();

    // Register service worker
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');
    }

    // Initialize notifications
    await initNotifications();

    // Check for existing session
    const token = api.getToken();
    const savedUser = await storage.getUser();

    if (token && savedUser) {
      currentUser = savedUser;
      await loadGame();
    } else {
      showAuthScreen();
    }

  } catch (error) {
    console.error('Init error:', error);
    showAuthScreen();
  }
}

// Show/Hide screens
function showLoadingScreen() {
  document.getElementById('loadingScreen').classList.remove('hidden');
}

function hideLoadingScreen() {
  document.getElementById('loadingScreen').classList.add('hidden');
}

function showAuthScreen() {
  hideLoadingScreen();
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('gameScreen').classList.add('hidden');
}

function showGameScreen() {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('gameScreen').classList.remove('hidden');
}

// Auth functions
function switchToRegister() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('registerForm').classList.remove('hidden');
  document.getElementById('authError').classList.add('hidden');
}

function switchToLogin() {
  document.getElementById('registerForm').classList.add('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('authError').classList.add('hidden');
}

async function register() {
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  if (!username || !email || !password) {
    showError('Please fill all fields');
    return;
  }

  try {
    showLoadingScreen();
    const data = await api.register(username, email, password);
    
    currentUser = data.user;
    await storage.saveUser(currentUser);
    
    hideLoadingScreen();
    await loadGame();
    
  } catch (error) {
    hideLoadingScreen();
    showError(error.message);
  }
}

async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showError('Please fill all fields');
    return;
  }

  try {
    showLoadingScreen();
    const data = await api.login(email, password);
    
    currentUser = data.user;
    await storage.saveUser(currentUser);
    
    hideLoadingScreen();
    await loadGame();
    
  } catch (error) {
    hideLoadingScreen();
    showError(error.message);
  }
}

function showError(message) {
  const errorEl = document.getElementById('authError');
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

async function logout() {
  api.clearToken();
  await storage.clearAll();
  stopAutoSave();
  currentUser = null;
  trees = [];
  showAuthScreen();
  closeModal();
}

// Load game
async function loadGame() {
  try {
    showGameScreen();
    updateUI();
    
    // Load trees from server
    await refreshTrees();
    
    // Start auto-save
    startAutoSave();
    
    // Start growth update interval
    startGrowthUpdates();
    
    showToast('Welcome to your forest! 🌳');
    
  } catch (error) {
    console.error('Load game error:', error);
    showToast('Error loading game');
  }
}

// Update UI
function updateUI() {
  if (!currentUser) return;

  document.getElementById('username').textContent = currentUser.username;
  document.getElementById('coinCount').textContent = currentUser.coins;
  document.getElementById('treesGrown').textContent = currentUser.totalTreesGrown;
  document.getElementById('plotsUnlocked').textContent = currentUser.plotsUnlocked;
}

// Refresh trees from server
async function refreshTrees() {
  try {
    const data = await api.getTrees();
    trees = data.trees;
    
    // Save to IndexedDB
    await storage.saveTrees(trees);
    
    // Update canvas
    updateTreeDisplay();
    
  } catch (error) {
    console.error('Refresh trees error:', error);
    // Load from IndexedDB if offline
    trees = await storage.getTrees() || [];
    updateTreeDisplay();
  }
}

// Update tree display
function updateTreeDisplay() {
  const plotTrees = trees.filter(t => t.plotNumber === currentPlot);
  
  // Update canvas
  if (forestCanvas) {
    const canvasTrees = plotTrees.map(t => ({
      stage: t.stage,
      type: t.seedType,
      health: t.health
    }));
    forestCanvas.updateTrees(canvasTrees);
  }
  
  // Update grid
  for (let i = 0; i < 6; i++) {
    const slot = document.querySelector(`[data-position="${i}"]`);
    const tree = plotTrees.find(t => t.position === i);
    
    if (tree) {
      slot.classList.add('occupied');
      slot.innerHTML = `
        <div class="tree-info ${tree.waterLevel < 30 ? 'needs-water' : ''}">
          <span class="tree-emoji">${getTreeEmoji(tree.stage, tree.seedType)}</span>
          <span class="tree-stage">${tree.stage}</span>
          <div class="tree-health-bar">
            <div class="tree-health-fill" style="width: ${tree.health}%"></div>
          </div>
        </div>
      `;
    } else {
      slot.classList.remove('occupied');
      slot.innerHTML = '<div class="empty-slot">+</div>';
    }
  }
  
  // Schedule notifications
  scheduleTreeNotifications(plotTrees);
}

function getTreeEmoji(stage, type) {
  const emojis = {
    seed: '🌱',
    germinating: '🌿',
    sapling: '🌲',
    tree: '🌳',
    fruiting: type === 'apple' ? '🍎' : type === 'mango' ? '🥭' : type === 'orange' ? '🍊' : '🍒'
  };
  return emojis[stage] || '🌱';
}

// Plot selection
function selectPlot(plotNumber) {
  if (plotNumber >= currentUser.plotsUnlocked) {
    showToast('Plot locked! Grow more trees to unlock');
    return;
  }
  
  currentPlot = plotNumber;
  
  // Update UI
  document.querySelectorAll('.plot-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === plotNumber);
  });
  
  updateTreeDisplay();
}

// Handle slot click
function handleSlotClick(position) {
  const plotTrees = trees.filter(t => t.plotNumber === currentPlot);
  const tree = plotTrees.find(t => t.position === position);
  
  if (tree) {
    // Show tree details
    showTreeModal(tree);
  } else {
    // Open plant modal
    selectedPosition = position;
    openPlantModal();
  }
}

// Plant modal
function openPlantModal() {
  if (selectedPosition === null) {
    showToast('Select a position first');
    return;
  }
  
  document.getElementById('selectedPosition').textContent = selectedPosition + 1;
  document.getElementById('plantModal').classList.remove('hidden');
}

function selectSeed(type) {
  selectedSeed = type;
  
  // Update UI
  document.querySelectorAll('.seed-card').forEach(card => {
    card.classList.remove('selected');
  });
  event.target.closest('.seed-card').classList.add('selected');
}

async function plantSelectedSeed() {
  if (!selectedSeed || selectedPosition === null) {
    showToast('Select a seed first');
    return;
  }
  
  try {
    const data = await api.plantTree(currentPlot, selectedPosition, selectedSeed);
    
    showToast(`${selectedSeed} seed planted! 🌱`);
    closeModal();
    
    await refreshTrees();
    
  } catch (error) {
    showToast(error.message);
  }
}

// Tree modal
function showTreeModal(tree) {
  selectedTree = tree;
  
  document.getElementById('treeTitle').textContent = `${tree.seedType} Tree`;
  document.getElementById('treeType').textContent = tree.seedType;
  document.getElementById('treeStage').textContent = tree.stage;
  document.getElementById('treeHealth').style.width = `${tree.health}%`;
  document.getElementById('treeWater').style.width = `${tree.waterLevel}%`;
  document.getElementById('treeFruits').textContent = tree.fruitsReady;
  
  if (tree.nextStageAt) {
    const timeLeft = Math.max(0, new Date(tree.nextStageAt) - Date.now());
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    document.getElementById('treeNextStage').textContent = `${hours}h ${minutes}m`;
  } else {
    document.getElementById('treeNextStage').textContent = 'Fully grown';
  }
  
  // Enable/disable harvest button
  const harvestBtn = document.getElementById('harvestBtn');
  harvestBtn.disabled = tree.fruitsReady === 0;
  
  document.getElementById('treeModal').classList.remove('hidden');
}

async function waterTree() {
  if (!selectedTree) return;
  
  try {
    const data = await api.waterTree(selectedTree._id);
    
    showToast('Tree watered! 💧');
    
    await refreshTrees();
    closeTreeModal();
    
  } catch (error) {
    showToast(error.message);
  }
}

async function harvestTree() {
  if (!selectedTree) return;
  
  try {
    const data = await api.harvestTree(selectedTree._id);
    
    // Update user coins (fruit value = 5 coins each)
    currentUser.coins += data.harvested * 5;
    await storage.saveUser(currentUser);
    
    showToast(`Harvested ${data.harvested} fruits! +${data.harvested * 5} coins 🪙`);
    updateUI();
    
    await refreshTrees();
    closeTreeModal();
    
  } catch (error) {
    showToast(error.message);
  }
}

async function waterAllTrees() {
  const plotTrees = trees.filter(t => t.plotNumber === currentPlot);
  
  if (plotTrees.length === 0) {
    showToast('No trees to water');
    return;
  }
  
  try {
    let watered = 0;
    for (const tree of plotTrees) {
      await api.waterTree(tree._id);
      watered++;
    }
    
    showToast(`Watered ${watered} trees! 💧`);
    await refreshTrees();
    
  } catch (error) {
    showToast(error.message);
  }
}

function closeTreeModal() {
  document.getElementById('treeModal').classList.add('hidden');
  selectedTree = null;
}

// Market
function openMarket() {
  document.getElementById('marketModal').classList.remove('hidden');
}

function switchMarketTab(tab) {
  if (tab === 'sell') {
    document.getElementById('sellTab').classList.remove('hidden');
    document.getElementById('buyTab').classList.add('hidden');
  } else {
    document.getElementById('sellTab').classList.add('hidden');
    document.getElementById('buyTab').classList.remove('hidden');
  }
  
  // Update active tab button
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tab));
  });
}

async function buySeed(type, price) {
  if (currentUser.coins < price) {
    showToast('Not enough coins!');
    return;
  }
  
  currentUser.coins -= price;
  await storage.saveUser(currentUser);
  updateUI();
  
  showToast(`Purchased ${type} seed for ${price} coins!`);
}

// Menu
function openMenu() {
  document.getElementById('menuModal').classList.remove('hidden');
}

async function toggleNotifications() {
  const enabled = await notificationManager.toggle();
  closeModal();
}

function showStats() {
  showToast(`Trees: ${currentUser.totalTreesGrown} | Coins: ${currentUser.coins}`);
  closeModal();
}

// Close modal
function closeModal() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.add('hidden');
  });
  selectedPosition = null;
  selectedSeed = null;
}

// Toast notification
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// Growth updates
let growthInterval;

function startGrowthUpdates() {
  if (growthInterval) clearInterval(growthInterval);
  
  growthInterval = setInterval(async () => {
    try {
      await api.updateGrowth();
      await refreshTrees();
    } catch (error) {
      console.error('Growth update error:', error);
    }
  }, 60000); // Update every minute
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', initApp);

// Handle visibility change (app goes to background/foreground)
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden && currentUser) {
    await refreshTrees();
  }
});
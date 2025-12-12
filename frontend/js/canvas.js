// Canvas Drawing for Trees, Birds, and Environment
class ForestCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.trees = [];
    this.birds = [];
    this.weather = 'sunny'; // sunny, rainy, cloudy
    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.animate();
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Draw sky with clouds
  drawSky() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    
    if (this.weather === 'sunny') {
      gradient.addColorStop(0, '#87ceeb');
      gradient.addColorStop(1, '#e8f5e9');
    } else if (this.weather === 'rainy') {
      gradient.addColorStop(0, '#607d8b');
      gradient.addColorStop(1, '#90a4ae');
    } else {
      gradient.addColorStop(0, '#b0bec5');
      gradient.addColorStop(1, '#cfd8dc');
    }

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw sun
    if (this.weather === 'sunny') {
      this.drawSun(this.canvas.width * 0.85, this.canvas.height * 0.2);
    }

    // Draw clouds
    this.drawClouds();
  }

  drawSun(x, y) {
    this.ctx.save();
    this.ctx.fillStyle = '#FFD700';
    this.ctx.shadowColor = '#FFD700';
    this.ctx.shadowBlur = 20;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 25, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawClouds() {
    const numClouds = 3;
    for (let i = 0; i < numClouds; i++) {
      const x = (this.canvas.width / numClouds) * i + Math.sin(Date.now() / 2000 + i) * 30;
      const y = 30 + Math.sin(Date.now() / 3000 + i) * 10;
      this.drawCloud(x, y);
    }
  }

  drawCloud(x, y) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, 20, 0, Math.PI * 2);
    this.ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
    this.ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  // Draw ground
  drawGround() {
    const groundHeight = this.canvas.height * 0.3;
    const gradient = this.ctx.createLinearGradient(0, this.canvas.height - groundHeight, 0, this.canvas.height);
    gradient.addColorStop(0, '#7fb069');
    gradient.addColorStop(1, '#5a8f4f');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, this.canvas.height - groundHeight, this.canvas.width, groundHeight);

    // Draw grass texture
    this.ctx.strokeStyle = '#6da05a';
    this.ctx.lineWidth = 2;
    for (let i = 0; i < this.canvas.width; i += 5) {
      const height = Math.random() * 10 + 5;
      this.ctx.beginPath();
      this.ctx.moveTo(i, this.canvas.height - groundHeight);
      this.ctx.lineTo(i, this.canvas.height - groundHeight - height);
      this.ctx.stroke();
    }
  }

  // Draw tree based on stage
  drawTree(x, y, stage, type, health) {
    const baseY = this.canvas.height * 0.7;
    
    switch(stage) {
      case 'seed':
        this.drawSeed(x, baseY);
        break;
      case 'germinating':
        this.drawGerminating(x, baseY);
        break;
      case 'sapling':
        this.drawSapling(x, baseY, type);
        break;
      case 'tree':
        this.drawFullTree(x, baseY, type, health);
        break;
      case 'fruiting':
        this.drawFruitingTree(x, baseY, type, health);
        break;
    }
  }

  drawSeed(x, y) {
    this.ctx.save();
    this.ctx.fillStyle = '#8b4513';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 3, 5, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Small soil mound
    this.ctx.fillStyle = '#6b4423';
    this.ctx.beginPath();
    this.ctx.arc(x, y + 5, 8, 0, Math.PI, true);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawGerminating(x, y) {
    this.ctx.save();
    
    // Sprout
    this.ctx.strokeStyle = '#7fb069';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x - 3, y - 15);
    this.ctx.stroke();

    // Tiny leaves
    this.ctx.fillStyle = '#9bc183';
    this.ctx.beginPath();
    this.ctx.ellipse(x - 3, y - 15, 3, 5, Math.PI / 4, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawSapling(x, y, type) {
    this.ctx.save();
    
    // Small trunk
    this.ctx.strokeStyle = '#8b4513';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x, y - 30);
    this.ctx.stroke();

    // Young leaves
    this.ctx.fillStyle = this.getTreeColor(type);
    this.ctx.beginPath();
    this.ctx.arc(x, y - 30, 15, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawFullTree(x, y, type, health) {
    this.ctx.save();
    
    // Trunk
    this.ctx.fillStyle = '#654321';
    this.ctx.fillRect(x - 5, y - 60, 10, 60);

    // Branches
    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 3;
    
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - 40);
    this.ctx.lineTo(x - 15, y - 50);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(x, y - 40);
    this.ctx.lineTo(x + 15, y - 50);
    this.ctx.stroke();

    // Canopy
    const opacity = health / 100;
    this.ctx.fillStyle = this.getTreeColor(type, opacity);
    
    this.ctx.beginPath();
    this.ctx.arc(x, y - 70, 30, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(x - 20, y - 60, 20, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(x + 20, y - 60, 20, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawFruitingTree(x, y, type, health) {
    this.drawFullTree(x, y, type, health);
    
    // Draw fruits
    this.ctx.save();
    const fruitColor = this.getFruitColor(type);
    this.ctx.fillStyle = fruitColor;
    
    const fruitPositions = [
      {x: x - 15, y: y - 65},
      {x: x + 10, y: y - 70},
      {x: x - 5, y: y - 55},
      {x: x + 20, y: y - 60}
    ];

    fruitPositions.forEach(pos => {
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Shine effect
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      this.ctx.beginPath();
      this.ctx.arc(pos.x - 1, pos.y - 1, 2, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  getTreeColor(type, opacity = 1) {
    const colors = {
      apple: `rgba(76, 175, 80, ${opacity})`,
      mango: `rgba(139, 195, 74, ${opacity})`,
      orange: `rgba(156, 204, 101, ${opacity})`,
      cherry: `rgba(102, 187, 106, ${opacity})`
    };
    return colors[type] || `rgba(76, 175, 80, ${opacity})`;
  }

  getFruitColor(type) {
    const colors = {
      apple: '#f44336',
      mango: '#ff9800',
      orange: '#ff5722',
      cherry: '#e91e63'
    };
    return colors[type] || '#f44336';
  }

  // Draw bird
  drawBird(x, y, direction = 1) {
    this.ctx.save();
    
    // Bird body
    this.ctx.fillStyle = '#795548';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 8, 6, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Wings (animated)
    const wingAngle = Math.sin(Date.now() / 100) * 0.5;
    this.ctx.strokeStyle = '#795548';
    this.ctx.lineWidth = 2;
    
    // Left wing
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x - 10 * direction, y - 5 + wingAngle * 5);
    this.ctx.stroke();

    // Right wing
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + 10 * direction, y - 5 - wingAngle * 5);
    this.ctx.stroke();

    // Head
    this.ctx.fillStyle = '#6d4c41';
    this.ctx.beginPath();
    this.ctx.arc(x + 6 * direction, y - 3, 4, 0, Math.PI * 2);
    this.ctx.fill();

    // Eye
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(x + 7 * direction, y - 3, 1, 0, Math.PI * 2);
    this.ctx.fill();

    // Beak
    this.ctx.fillStyle = '#ff6f00';
    this.ctx.beginPath();
    this.ctx.moveTo(x + 9 * direction, y - 3);
    this.ctx.lineTo(x + 12 * direction, y - 2);
    this.ctx.lineTo(x + 9 * direction, y - 1);
    this.ctx.fill();

    this.ctx.restore();
  }

  // Draw rain
  drawRain() {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(174, 214, 241, 0.6)';
    this.ctx.lineWidth = 1;

    for (let i = 0; i < 100; i++) {
      const x = Math.random() * this.canvas.width;
      const y = (Math.random() * this.canvas.height + Date.now() / 5) % this.canvas.height;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x, y + 10);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  // Update trees from game state
  updateTrees(treesData) {
    this.trees = treesData;
  }

  // Add bird
  addBird() {
    this.birds.push({
      x: -50,
      y: 50 + Math.random() * 100,
      speed: 1 + Math.random(),
      direction: 1
    });
  }

  // Update birds
  updateBirds() {
    this.birds = this.birds.filter(bird => {
      bird.x += bird.speed;
      return bird.x < this.canvas.width + 50;
    });

    // Randomly add birds
    if (Math.random() < 0.01 && this.birds.length < 3) {
      this.addBird();
    }
  }

  // Set weather
  setWeather(weather) {
    this.weather = weather;
  }

  // Main animation loop
  animate() {
    this.clear();
    this.drawSky();
    this.drawGround();

    // Draw trees from game state
    if (this.trees && this.trees.length > 0) {
      const spacing = this.canvas.width / 7;
      this.trees.forEach((tree, index) => {
        const x = spacing * (index + 1);
        this.drawTree(x, 0, tree.stage, tree.type, tree.health);
      });
    }

    // Draw birds
    this.updateBirds();
    this.birds.forEach(bird => {
      this.drawBird(bird.x, bird.y, bird.direction);
    });

    // Draw weather effects
    if (this.weather === 'rainy') {
      this.drawRain();
    }

    requestAnimationFrame(() => this.animate());
  }
}

// Initialize canvas when DOM is ready
let forestCanvas;
document.addEventListener('DOMContentLoaded', () => {
  forestCanvas = new ForestCanvas('forestCanvas');
});
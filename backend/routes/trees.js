const express = require('express');
const auth = require('../middleware/auth');
const Tree = require('../models/Tree');
const User = require('../models/User');
const router = express.Router();

// Plant tree
router.post('/plant', auth, async (req, res) => {
  try {
    const { plotNumber, position, seedType } = req.body;

    // Check if position is occupied
    const existingTree = await Tree.findOne({
      userId: req.userId,
      plotNumber,
      position
    });

    if (existingTree) {
      return res.status(400).json({ error: 'Position already occupied' });
    }

    // Calculate next stage time (2 hours for germination)
    const nextStageAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const tree = new Tree({
      userId: req.userId,
      plotNumber,
      position,
      seedType,
      nextStageAt
    });

    await tree.save();

    res.status(201).json({ tree });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all user trees
router.get('/', auth, async (req, res) => {
  try {
    const trees = await Tree.find({ userId: req.userId });
    res.json({ trees });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Water tree
router.post('/:treeId/water', auth, async (req, res) => {
  try {
    const tree = await Tree.findOne({ _id: req.params.treeId, userId: req.userId });

    if (!tree) {
      return res.status(404).json({ error: 'Tree not found' });
    }

    tree.waterLevel = Math.min(100, tree.waterLevel + 30);
    tree.lastWatered = Date.now();
    
    // Speed up growth if well-watered
    if (tree.waterLevel > 70 && tree.nextStageAt) {
      tree.nextStageAt = new Date(tree.nextStageAt.getTime() - 30 * 60 * 1000); // 30 min faster
    }

    await tree.save();

    res.json({ tree });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update tree growth (called periodically)
router.post('/update-growth', auth, async (req, res) => {
  try {
    const trees = await Tree.find({ userId: req.userId });
    const now = Date.now();
    
    for (let tree of trees) {
      // Decrease water level over time
      const hoursSinceWater = tree.lastWatered 
        ? (now - tree.lastWatered.getTime()) / (1000 * 60 * 60)
        : 24;
      
      tree.waterLevel = Math.max(0, tree.waterLevel - (hoursSinceWater * 2));

      // Check if tree should advance stage
      if (tree.nextStageAt && now >= tree.nextStageAt.getTime()) {
        const stages = ['seed', 'germinating', 'sapling', 'tree', 'fruiting'];
        const currentIndex = stages.indexOf(tree.stage);
        
        if (currentIndex < stages.length - 1) {
          tree.stage = stages[currentIndex + 1];
          
          // Set next stage time
          if (tree.stage === 'tree') {
            tree.nextStageAt = new Date(now + 12 * 60 * 60 * 1000); // 12 hours to fruiting
          } else if (tree.stage === 'fruiting') {
            tree.nextStageAt = null; // Fully grown
            tree.fruitsReady = Math.floor(Math.random() * 5) + 3; // 3-7 fruits
          } else {
            tree.nextStageAt = new Date(now + 2 * 60 * 60 * 1000); // 2 hours per stage
          }
        }
      }

      // Health decreases if not watered
      if (tree.waterLevel < 30) {
        tree.health = Math.max(0, tree.health - 1);
      }

      await tree.save();
    }

    res.json({ trees });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Harvest fruits
router.post('/:treeId/harvest', auth, async (req, res) => {
  try {
    const tree = await Tree.findOne({ _id: req.params.treeId, userId: req.userId });

    if (!tree) {
      return res.status(404).json({ error: 'Tree not found' });
    }

    if (tree.stage !== 'fruiting' || tree.fruitsReady === 0) {
      return res.status(400).json({ error: 'No fruits to harvest' });
    }

    const harvested = tree.fruitsReady;
    tree.fruitsReady = 0;
    
    // Next fruit cycle in 12 hours
    tree.nextStageAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

    await tree.save();

    // Update user
    const user = await User.findById(req.userId);
    user.totalTreesGrown += 1;
    await user.save();

    res.json({ harvested, tree });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
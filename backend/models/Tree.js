const mongoose = require('mongoose');

const treeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plotNumber: { type: Number, required: true }, // 0-3 (4 plots)
  position: { type: Number, required: true }, // 0-5 (6 trees per plot)
  seedType: { type: String, enum: ['apple', 'mango', 'orange', 'cherry'], required: true },
  stage: { type: String, enum: ['seed', 'germinating', 'sapling', 'tree', 'fruiting'], default: 'seed' },
  health: { type: Number, default: 100 },
  waterLevel: { type: Number, default: 100 },
  lastWatered: { type: Date },
  lastFertilized: { type: Date },
  plantedAt: { type: Date, default: Date.now },
  nextStageAt: { type: Date },
  fruitsReady: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Tree', treeSchema);
const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fruitType: { type: String, required: true },
  quantity: { type: Number, required: true },
  pricePerUnit: { type: Number, required: true },
  listedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Market', marketSchema);
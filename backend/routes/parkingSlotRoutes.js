const express = require('express');
const router = express.Router();
const {
  getAllSlots,
  getAvailableSlots,
  getSlotById,
  createSlot,
  updateSlot,
  deleteSlot,
  getOccupancyStats
} = require('../controllers/parkingSlotController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Public or general authenticated routes
router.get('/', getAllSlots);
router.get('/available', getAvailableSlots);
router.get('/occupancy', protect, adminOnly, getOccupancyStats);
router.get('/:id', getSlotById);

// Admin-only management routes
router.post('/', protect, adminOnly, createSlot);
router.patch('/:id', protect, adminOnly, updateSlot);
router.delete('/:id', protect, adminOnly, deleteSlot);

module.exports = router;

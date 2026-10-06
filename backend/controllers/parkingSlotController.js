const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');

// Helper function to check if a slot is currently occupied right now
const getCurrentBookingsMap = async (slotIds) => {
  const now = new Date();
  const activeBookings = await Booking.find({
    parkingSlot: { $in: slotIds },
    status: 'confirmed',
    startTime: { $lte: now },
    endTime: { $gt: now }
  }).populate('user', 'name email');

  // Map slotId -> booking
  const map = {};
  for (const b of activeBookings) {
    map[b.parkingSlot.toString()] = b;
  }
  return map;
};

// @desc    Get all parking slots (with real-time occupancy info)
// @route   GET /api/slots
// @access  Public (or Private)
const getAllSlots = async (req, res) => {
  try {
    const slots = await ParkingSlot.find().sort({ slotNumber: 1 });
    const slotIds = slots.map((s) => s._id);
    const currentBookingsMap = await getCurrentBookingsMap(slotIds);

    const slotsWithOccupancy = slots.map((slot) => {
      const activeBooking = currentBookingsMap[slot._id.toString()];
      const isOccupied = Boolean(activeBooking);

      return {
        ...slot.toObject(),
        isCurrentlyOccupied: isOccupied,
        currentBooking: activeBooking || null
      };
    });

    return res.status(200).json(slotsWithOccupancy);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching parking slots: ' + error.message });
  }
};

// @desc    Get available parking slots (optionally for a specific time window)
// @route   GET /api/slots/available
// @access  Public (or Private)
const getAvailableSlots = async (req, res) => {
  try {
    const { startTime, endTime } = req.query;

    // Base query: slot status must be marked as 'available'
    const availableSlots = await ParkingSlot.find({ status: 'available' }).sort({ slotNumber: 1 });

    // If a specific time range is provided in query, filter out overlapping bookings
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        return res.status(400).json({ message: 'Invalid start or end time parameter' });
      }

      // Find all slots with conflicting bookings in this window
      const conflictingBookings = await Booking.find({
        status: 'confirmed',
        startTime: { $lt: end },
        endTime: { $gt: start }
      }).select('parkingSlot');

      const conflictingSlotIds = new Set(
        conflictingBookings.map((b) => b.parkingSlot.toString())
      );

      const filtered = availableSlots.filter(
        (slot) => !conflictingSlotIds.has(slot._id.toString())
      );

      return res.status(200).json(filtered);
    }

    // If no time window specified, exclude slots that are currently occupied right now
    const slotIds = availableSlots.map((s) => s._id);
    const currentBookingsMap = await getCurrentBookingsMap(slotIds);

    const freeSlots = availableSlots.filter(
      (slot) => !currentBookingsMap[slot._id.toString()]
    );

    return res.status(200).json(freeSlots);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching available slots: ' + error.message });
  }
};

// @desc    Get single parking slot by ID
// @route   GET /api/slots/:id
// @access  Public (or Private)
const getSlotById = async (req, res) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }

    const currentBookingsMap = await getCurrentBookingsMap([slot._id]);
    const activeBooking = currentBookingsMap[slot._id.toString()] || null;

    // Also fetch upcoming bookings for this slot
    const now = new Date();
    const upcomingBookings = await Booking.find({
      parkingSlot: slot._id,
      status: 'confirmed',
      endTime: { $gt: now }
    })
      .sort({ startTime: 1 })
      .populate('user', 'name email');

    return res.status(200).json({
      ...slot.toObject(),
      isCurrentlyOccupied: Boolean(activeBooking),
      currentBooking: activeBooking,
      upcomingBookings
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching slot: ' + error.message });
  }
};

// @desc    Create new parking slot
// @route   POST /api/slots
// @access  Private (Admin only)
const createSlot = async (req, res) => {
  try {
    const { slotNumber, status, location } = req.body;

    if (!slotNumber || !slotNumber.trim()) {
      return res.status(400).json({ message: 'Slot number is required' });
    }

    const formattedSlotNumber = slotNumber.trim().toUpperCase();

    // Check if slot number already exists
    const existingSlot = await ParkingSlot.findOne({ slotNumber: formattedSlotNumber });
    if (existingSlot) {
      return res.status(400).json({ message: `Slot number '${formattedSlotNumber}' already exists` });
    }

    const newSlot = await ParkingSlot.create({
      slotNumber: formattedSlotNumber,
      status: status || 'available',
      location: location ? location.trim() : 'Main Parking Area'
    });

    return res.status(201).json(newSlot);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating parking slot: ' + error.message });
  }
};

// @desc    Update parking slot
// @route   PATCH /api/slots/:id
// @access  Private (Admin only)
const updateSlot = async (req, res) => {
  try {
    const { slotNumber, status, location } = req.body;
    const slot = await ParkingSlot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }

    // If changing slotNumber, ensure it's not taken by another slot
    if (slotNumber && slotNumber.trim().toUpperCase() !== slot.slotNumber) {
      const formattedNumber = slotNumber.trim().toUpperCase();
      const duplicate = await ParkingSlot.findOne({ slotNumber: formattedNumber });
      if (duplicate) {
        return res.status(400).json({ message: `Slot number '${formattedNumber}' already exists` });
      }
      slot.slotNumber = formattedNumber;
    }

    if (status) {
      if (!['available', 'unavailable'].includes(status)) {
        return res.status(400).json({ message: "Status must be 'available' or 'unavailable'" });
      }
      slot.status = status;
    }

    if (location !== undefined) {
      slot.location = location.trim();
    }

    const updatedSlot = await slot.save();
    return res.status(200).json(updatedSlot);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating parking slot: ' + error.message });
  }
};

// @desc    Delete parking slot
// @route   DELETE /api/slots/:id
// @access  Private (Admin only)
const deleteSlot = async (req, res) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }

    // Check if slot has active or upcoming confirmed bookings
    const now = new Date();
    const activeBooking = await Booking.findOne({
      parkingSlot: slot._id,
      status: 'confirmed',
      endTime: { $gt: now }
    });

    if (activeBooking) {
      return res.status(400).json({
        message: 'Cannot delete slot with active or upcoming bookings. Cancel those bookings first.'
      });
    }

    await ParkingSlot.findByIdAndDelete(slot._id);
    return res.status(200).json({ message: `Slot ${slot.slotNumber} deleted successfully` });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting parking slot: ' + error.message });
  }
};

// @desc    Get parking occupancy metrics
// @route   GET /api/slots/occupancy
// @access  Private (Admin only)
const getOccupancyStats = async (req, res) => {
  try {
    const now = new Date();

    const totalSlots = await ParkingSlot.countDocuments();
    const unavailableSlots = await ParkingSlot.countDocuments({ status: 'unavailable' });

    // Active bookings right now
    const currentActiveBookings = await Booking.find({
      status: 'confirmed',
      startTime: { $lte: now },
      endTime: { $gt: now }
    });

    // Unique occupied slots right now
    const occupiedSlotIds = new Set(
      currentActiveBookings.map((b) => b.parkingSlot.toString())
    );
    const currentlyOccupied = occupiedSlotIds.size;

    // Available slots = total configured as 'available' minus currently occupied ones
    const configuredAvailableSlots = await ParkingSlot.countDocuments({ status: 'available' });
    // An available slot might be occupied right now by a confirmed booking
    const availableSlots = Math.max(0, configuredAvailableSlots - currentlyOccupied);

    // Total upcoming and active bookings (endTime > now)
    const totalActiveBookings = await Booking.countDocuments({
      status: 'confirmed',
      endTime: { $gt: now }
    });

    return res.status(200).json({
      totalSlots,
      availableSlots,
      unavailableSlots,
      currentlyOccupied,
      totalActiveBookings
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error computing occupancy: ' + error.message });
  }
};

module.exports = {
  getAllSlots,
  getAvailableSlots,
  getSlotById,
  createSlot,
  updateSlot,
  deleteSlot,
  getOccupancyStats
};

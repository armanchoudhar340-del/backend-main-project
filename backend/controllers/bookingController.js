const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (User & Admin)
const createBooking = async (req, res) => {
  try {
    const { parkingSlot, startTime, endTime, vehicleNumber } = req.body;

    // 1. Validate required fields
    if (!parkingSlot) {
      return res.status(400).json({ message: 'Parking slot ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(parkingSlot)) {
      return res.status(400).json({ message: 'Invalid parking slot ID' });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'Both start time and end time are required' });
    }

    // 2. Validate date values
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date/time format' });
    }

    // 3. Reject end time before or equal to start time
    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // 4. Reject bookings in the past (allow a tiny 2-minute buffer for network latency)
    const nowWithBuffer = new Date(Date.now() - 2 * 60 * 1000);
    if (end <= new Date()) {
      return res.status(400).json({ message: 'Cannot create a booking in the past' });
    }
    if (start < nowWithBuffer) {
      return res.status(400).json({ message: 'Start time cannot be in the past' });
    }

    // 5. Check if parking slot exists
    const slot = await ParkingSlot.findById(parkingSlot);
    if (!slot) {
      return res.status(404).json({ message: 'Selected parking slot does not exist' });
    }

    // 6. Check if slot status is available
    if (slot.status === 'unavailable') {
      return res.status(400).json({
        message: 'This parking slot is currently under maintenance or marked unavailable'
      });
    }

    // 7. TIME CONFLICT VALIDATION (Core Business Rule)
    // Overlap condition:
    // existing.startTime < requested.endTime AND existing.endTime > requested.startTime
    const overlappingBooking = await Booking.findOne({
      parkingSlot: slot._id,
      status: 'confirmed',
      startTime: { $lt: end },
      endTime: { $gt: start }
    });

    if (overlappingBooking) {
      return res.status(409).json({
        message: 'Parking slot is already booked for the selected time.'
      });
    }

    // 8. Create the booking
    const newBooking = await Booking.create({
      parkingSlot: slot._id,
      user: req.user._id,
      startTime: start,
      endTime: end,
      vehicleNumber: vehicleNumber ? vehicleNumber.trim().toUpperCase() : '',
      status: 'confirmed'
    });

    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('parkingSlot', 'slotNumber status location')
      .populate('user', 'name email');

    return res.status(201).json(populatedBooking);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating booking: ' + error.message });
  }
};

// @desc    Get bookings of the currently logged-in user
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('parkingSlot', 'slotNumber status location')
      .sort({ createdAt: -1 });

    return res.status(200).json(bookings);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching your bookings: ' + error.message });
  }
};

// @desc    Get all bookings (Admin only)
// @route   GET /api/bookings
// @access  Private (Admin only)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('parkingSlot', 'slotNumber status location')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json(bookings);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching bookings: ' + error.message });
  }
};

// @desc    Get single booking details
// @route   GET /api/bookings/:id
// @access  Private (Owner or Admin)
const getBookingById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking ID format' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('parkingSlot', 'slotNumber status location')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only booking owner or admin can view details
    if (
      req.user.role !== 'admin' &&
      booking.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    return res.status(200).json(booking);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching booking: ' + error.message });
  }
};

// @desc    Cancel a booking
// @route   PATCH /api/bookings/:id/cancel
// @access  Private (Owner or Admin)
const cancelBooking = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking ID format' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only owner or admin can cancel
    if (
      req.user.role !== 'admin' &&
      booking.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    booking.status = 'cancelled';
    const updatedBooking = await booking.save();

    const populated = await Booking.findById(updatedBooking._id)
      .populate('parkingSlot', 'slotNumber status location')
      .populate('user', 'name email');

    return res.status(200).json(populated);
  } catch (error) {
    return res.status(500).json({ message: 'Error cancelling booking: ' + error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  cancelBooking
};

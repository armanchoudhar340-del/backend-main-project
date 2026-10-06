const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    parkingSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSlot',
      required: [true, 'Parking slot is required']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required']
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required']
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'completed'],
      default: 'confirmed'
    }
  },
  {
    timestamps: true
  }
);

// Index to help speed up time-overlap searches
bookingSchema.index({ parkingSlot: 1, status: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);

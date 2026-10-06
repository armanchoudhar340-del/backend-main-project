const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema(
  {
    slotNumber: {
      type: String,
      required: [true, 'Please provide a slot number'],
      unique: true,
      trim: true,
      uppercase: true
    },
    status: {
      type: String,
      enum: ['available', 'unavailable'],
      default: 'available'
    },
    location: {
      type: String,
      trim: true,
      default: 'Main Parking Area'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);

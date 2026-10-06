const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const ParkingSlot = require('./models/ParkingSlot');
const Booking = require('./models/Booking');

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/parking_db';
    console.log('Connecting to database for seeding...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Clear existing data
    await User.deleteMany();
    await ParkingSlot.deleteMany();
    await Booking.deleteMany();
    console.log('Cleared existing users, slots, and bookings.');

    // 1. Create Users
    // (Note: passwords will be hashed by User schema pre-save hook)
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });

    const testUser = await User.create({
      name: 'Test User',
      email: 'user@example.com',
      password: 'password123',
      role: 'user'
    });

    const johnUser = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'user'
    });

    console.log('Created sample users (Admin User, Test User, John Doe).');

    // 2. Create Parking Slots
    const slots = [
      { slotNumber: 'A-01', location: 'Ground Floor - Section A', status: 'available' },
      { slotNumber: 'A-02', location: 'Ground Floor - Section A', status: 'available' },
      { slotNumber: 'A-03', location: 'Ground Floor - Section A', status: 'available' },
      { slotNumber: 'A-04', location: 'Ground Floor - Section A', status: 'available' },
      { slotNumber: 'B-01', location: 'Basement 1 - Section B', status: 'available' },
      { slotNumber: 'B-02', location: 'Basement 1 - Section B', status: 'available' },
      { slotNumber: 'B-03', location: 'Basement 1 - Section B', status: 'available' },
      { slotNumber: 'B-04', location: 'Basement 1 - Section B', status: 'available' },
      { slotNumber: 'C-01', location: 'Section C - EV Charging', status: 'unavailable' }
    ];

    const createdSlots = await ParkingSlot.insertMany(slots);
    console.log(`Created ${createdSlots.length} parking slots.`);

    // 3. Create Sample Bookings
    // Create an active booking on A-02 for right now (started 1 hour ago, ends in 2 hours)
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const slotA02 = createdSlots.find((s) => s.slotNumber === 'A-02');
    const slotA03 = createdSlots.find((s) => s.slotNumber === 'A-03');

    // Active booking right now
    await Booking.create({
      parkingSlot: slotA02._id,
      user: testUser._id,
      startTime: oneHourAgo,
      endTime: twoHoursLater,
      vehicleNumber: 'KA-01-AB-1234',
      status: 'confirmed'
    });

    // Upcoming future booking on A-03 tomorrow
    const tomorrowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000);

    await Booking.create({
      parkingSlot: slotA03._id,
      user: johnUser._id,
      startTime: tomorrowStart,
      endTime: tomorrowEnd,
      vehicleNumber: 'DL-03-XY-9876',
      status: 'confirmed'
    });

    console.log('Created sample active and upcoming bookings.');

    console.log('\n========================================');
    console.log('Seeding completed successfully!');
    console.log('Default credentials:');
    console.log('Admin: admin@example.com / password123');
    console.log('User:  user@example.com  / password123');
    console.log('User:  john@example.com  / password123');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedData();

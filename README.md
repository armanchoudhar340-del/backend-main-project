# Parking Slot Management System

A full-stack commercial complex parking slot management system built with **Node.js, Express.js, MongoDB, Mongoose, JWT Authentication, and React (Vite)**.

---

## 📌 Project Overview

This system allows commercial facilities to manage parking slots and lets users reserve parking slots for designated time intervals. The backend guarantees that overlapping reservations cannot be made for the same slot, while admins can monitor real-time parking occupancy and configure slot availability.

### Key Features
- **JWT Authentication & Authorization**: Secure role-based access for `user` and `admin` roles with bcrypt password hashing.
- **Dynamic Slot Availability**: Real-time slot status (`Available`, `Occupied`, or `Maintenance`).
- **Conflict Prevention Engine**: Rejects any booking request that overlaps with an existing confirmed reservation on the same slot (`409 Conflict`).
- **Real-Time Occupancy Analytics**: Calculates current occupancy dynamically based on whether the current time falls between a booking's `startTime` and `endTime`.
- **User Portal**: Book slots, view active/upcoming reservations, and cancel bookings.
- **Admin Control Center**: Create/update/delete slots, toggle availability status, view facility occupancy metrics, and manage all facility bookings.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, Mongoose, MongoDB, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cors`, `dotenv`
- **Frontend**: React (Vite), React Router (`react-router-dom`), Axios, Clean Custom CSS
- **Database**: MongoDB (Local or MongoDB Atlas)

---

## 📁 Project Structure

```
parking-slot-management/
│
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, and profile
│   │   ├── parkingSlotController.js # Slot CRUD & real-time occupancy metrics
│   │   └── bookingController.js  # Booking creation, conflict checks & cancel
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT token verification
│   │   └── adminMiddleware.js    # Admin role guard (403 Forbidden)
│   ├── models/
│   │   ├── User.js               # User schema with bcrypt pre-save hook
│   │   ├── ParkingSlot.js        # Parking slot schema
│   │   └── Booking.js            # Booking schema with indexed overlap queries
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth endpoints
│   │   ├── parkingSlotRoutes.js  # /api/slots endpoints
│   │   └── bookingRoutes.js      # /api/bookings endpoints
│   ├── utils/
│   │   └── generateToken.js      # JWT signing helper
│   ├── .env.example              # Environment variables template
│   ├── package.json
│   ├── seed.js                   # Database seeder with sample data
│   ├── server.js                 # Main Express server entrypoint
│   └── test.js                   # Automated test suite (14 requirements)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Navigation with role-based links
│   │   │   ├── SlotCard.jsx      # Slot status card with Book Now trigger
│   │   │   ├── PrivateRoute.jsx  # User route guard
│   │   │   └── AdminRoute.jsx    # Admin route guard
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Login with quick demo auto-fill
│   │   │   ├── Register.jsx      # Registration with role selector
│   │   │   ├── Dashboard.jsx     # User overview, live counts, active bookings
│   │   │   ├── ParkingSlots.jsx  # Slot grid with status filters & search
│   │   │   ├── BookParkingSlot.jsx # Reservation form with conflict detection
│   │   │   ├── MyBookings.jsx    # User booking history & cancellation
│   │   │   ├── BookingDetails.jsx# Detailed view of a single reservation
│   │   │   ├── AdminDashboard.jsx# Real-time occupancy statistics & tables
│   │   │   └── ManageSlots.jsx   # Admin CRUD operations for slots
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Authentication context & session persistence
│   │   ├── services/
│   │   │   └── api.js            # Axios client with JWT interceptor
│   │   ├── App.jsx               # React Router configuration
│   │   ├── main.jsx              # React DOM entry point
│   │   └── index.css             # Clean, responsive CSS styling
│   ├── .env.example
│   └── package.json
│
├── thunder-collection_parking_slot_management.json # Thunder Client import
├── postman_collection.json                         # Postman import
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas URI

### 2. Backend Setup
```bash
cd backend
npm install

# Copy .env.example to .env
cp .env.example .env

# Optional: Seed sample users and parking slots
node seed.js

# Start backend server (starts on http://localhost:5001)
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Copy .env.example to .env
cp .env.example .env

# Start frontend dev server (runs on http://localhost:5173)
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🔑 Default Seed Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@example.com` | `password123` |
| **User**  | `user@example.com`  | `password123` |
| **User**  | `john@example.com`  | `password123` |

*(On the frontend login page, you can also click the **"Fill Admin"** or **"Fill User"** quick demo buttons.)*

---

## 💡 Core Business Rule: Booking Conflict Logic

To prevent double booking of any slot, the backend executes the standard interval overlap condition before creating any booking:

$$\text{existing.startTime} < \text{requested.endTime} \quad \text{AND} \quad \text{existing.endTime} > \text{requested.startTime}$$

### Mongoose Implementation:
```javascript
const overlappingBooking = await Booking.findOne({
  parkingSlot: slotId,
  status: 'confirmed',
  startTime: { $lt: requestedEndTime },
  endTime: { $gt: requestedStartTime }
});

if (overlappingBooking) {
  return res.status(409).json({
    message: 'Parking slot is already booked for the selected time.'
  });
}
```

### Edge Cases Handled:
1. **Back-to-back Bookings Allowed**: A booking from `10:00 - 12:00` followed by `12:00 - 14:00` is permitted because the previous reservation has ended at 12:00.
2. **Invalid Date/Time Ranges Rejected (`400`)**: If `endTime <= startTime`, the request is rejected.
3. **Past Dates Rejected (`400`)**: Bookings in the past are rejected.
4. **Maintenance Slots Rejected (`400`)**: Unavailable slots cannot be reserved.

---

## 📊 Live Occupancy Calculation

Occupancy is determined dynamically by querying confirmed reservations where the current timestamp falls within the window:

$$\text{startTime} \le \text{now} < \text{endTime}$$

- **Total Slots**: All slots in the database.
- **Currently Occupied**: Distinct slots with an active reservation at the current moment.
- **Available Slots**: Total slots configured as `available` minus those currently occupied.
- **Unavailable**: Slots marked as `unavailable` (e.g. maintenance).

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` — Register a new account (`name`, `email`, `password`, optional `role`)
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Get current logged-in user profile *(Requires JWT)*

### Parking Slots
- `GET /api/slots` — View all parking slots with real-time occupancy status
- `GET /api/slots/available` — View currently available parking slots (supports optional `?startTime=&endTime=` filters)
- `GET /api/slots/:id` — View single slot details and its upcoming schedule
- `POST /api/slots` — Create a new parking slot *(Admin Only)*
- `PATCH /api/slots/:id` — Update slot code, section, or status *(Admin Only)*
- `DELETE /api/slots/:id` — Delete a parking slot *(Admin Only)*
- `GET /api/slots/occupancy` — Real-time facility occupancy metrics *(Admin Only)*

### Bookings
- `POST /api/bookings` — Book a parking slot *(Requires JWT)*
- `GET /api/bookings/my` — View authenticated user's own bookings *(Requires JWT)*
- `GET /api/bookings` — View all system bookings *(Admin Only)*
- `GET /api/bookings/:id` — View single booking *(Owner or Admin)*
- `PATCH /api/bookings/:id/cancel` — Cancel a confirmed booking *(Owner or Admin)*

---

## ⚡ How to Run Thunder Client / Postman

### Using Thunder Client in VS Code:
1. Open **VS Code** and install the **Thunder Client** extension.
2. Click the **Thunder Client** icon in the sidebar.
3. Click **Collections** → click the three dots (`...`) or import icon → select **Import**.
4. Choose the file: `thunder-collection_parking_slot_management.json` located in the root directory.
5. All requests (Auth, Slots, Bookings, Conflict tests) will appear organized into folders ready to execute!

### Using Postman:
1. Open **Postman**.
2. Click **Import** in the top left.
3. Drag and drop `postman_collection.json`.
4. Run requests against `http://localhost:5001`.

---

## 🧪 Automated Testing

An automated test suite tests all 14 project requirements (registration, auth guards, slot CRUD, overlap conflict detection 409, back-to-back allowance, occupancy calculation, cancellation, and re-booking):

```bash
cd backend
npm test
```

Expected output:
```
--- STARTING 14 PROJECT SCENARIO TESTS ---
✅ [PASS] TEST 1: Register user & Login -> receives JWT
✅ [PASS] TEST 2: Login with incorrect password -> rejected with 401
✅ [PASS] TEST 3: User views available parking slots
✅ [PASS] TEST 4: Admin creates parking slot
✅ [PASS] TEST 5: Normal user tries to create slot -> rejected with 403 Forbidden
✅ [PASS] TEST 6: User books an available slot -> success 201
✅ [PASS] TEST 7: Same slot booked for overlapping time -> rejected with 409 Conflict
✅ [PASS] TEST 8: Same slot booked for non-overlapping time -> allowed 201
✅ [PASS] TEST 9: Invalid time range -> rejected with 400
✅ [PASS] TEST 10: User views own bookings
✅ [PASS] TEST 11: Admin views all bookings
✅ [PASS] TEST 12: User cancels their booking
✅ [PASS] TEST 13: Admin changes slot availability
✅ [PASS] TEST 14: Dashboard correctly calculates occupancy metrics
========================================
TEST RESULTS: 17 PASSED, 0 FAILED
========================================
```

---

## 🎓 Viva Explanation Guide

When presenting this project in a viva or interview:

1. **Architecture Explanation**:
   > *"The project follows a decoupled client-server architecture. The frontend is built in React using Vite for fast bundling and React Router for client-side routing. The backend is an Express REST API connected to MongoDB via Mongoose. All protected actions require a signed JWT token sent in the Authorization header."*

2. **Booking Conflict Logic**:
   > *"To prevent double bookings, we query MongoDB before inserting a new record. We check if any confirmed booking on that slot has $\text{startTime} < \text{newEnd}$ and $\text{endTime} > \text{newStart}$. If any match exists, we immediately return HTTP 409 Conflict. If no overlap is detected and the slot is active, we insert the booking and return HTTP 201 Created."*

3. **Dynamic Occupancy**:
   > *"Occupancy is not a static database flag. Instead, the backend dynamically determines whether the current timestamp $\text{now}$ falls between $\text{startTime}$ and $\text{endTime}$ of confirmed bookings. This ensures slots automatically become available when a booking window expires."*

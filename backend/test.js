// Comprehensive automated test script for all 14 scenarios specified in the project requirements
const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

process.env.PORT = '5099';
process.env.NODE_ENV = 'test';

const app = require('./server');

// Helper to make HTTP requests
const request = ({ method, path, headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5099,
        path,
        method,
        headers: reqHeaders
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let json = null;
          try {
            json = data ? JSON.parse(data) : {};
          } catch (e) {
            json = { raw: data };
          }
          resolve({ status: res.statusCode, data: json });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

const runTests = async () => {
  const server = app.listen(5099, async () => {
    console.log('Testing server started on port 5099.\n');

    try {
      let passed = 0;
      let failed = 0;

      const assert = (condition, title, details = '') => {
        if (condition) {
          console.log(`✅ [PASS] ${title}`);
          passed++;
        } else {
          console.error(`❌ [FAIL] ${title} - ${details}`);
          failed++;
        }
      };

      console.log('--- STARTING 14 PROJECT SCENARIO TESTS ---\n');

      // TEST 1: Register user -> login -> receive JWT
      const uniqueSuffix = Date.now();
      const testEmail = `student_${uniqueSuffix}@example.com`;
      const regRes = await request({
        method: 'POST',
        path: '/api/auth/register',
        body: {
          name: 'College Student',
          email: testEmail,
          password: 'securePassword123'
        }
      });
      assert(
        regRes.status === 201 && regRes.data.token,
        'TEST 1 (Part A): Register user -> receives JWT',
        JSON.stringify(regRes.data)
      );

      const loginRes = await request({
        method: 'POST',
        path: '/api/auth/login',
        body: {
          email: testEmail,
          password: 'securePassword123'
        }
      });
      const userToken = loginRes.data.token;
      assert(
        loginRes.status === 200 && Boolean(userToken),
        'TEST 1 (Part B): Login user -> receives JWT',
        JSON.stringify(loginRes.data)
      );

      // TEST 2: Login with incorrect password -> rejected
      const badLoginRes = await request({
        method: 'POST',
        path: '/api/auth/login',
        body: {
          email: testEmail,
          password: 'wrongPassword'
        }
      });
      assert(
        badLoginRes.status === 401,
        'TEST 2: Login with incorrect password -> rejected with 401',
        `Status was ${badLoginRes.status}`
      );

      // Login as Admin
      const adminLoginRes = await request({
        method: 'POST',
        path: '/api/auth/login',
        body: {
          email: 'admin@example.com',
          password: 'password123'
        }
      });
      const adminToken = adminLoginRes.data.token;
      assert(
        adminLoginRes.status === 200 && adminLoginRes.data.role === 'admin',
        'Setup: Login as seeded Admin user',
        JSON.stringify(adminLoginRes.data)
      );

      // TEST 3: User views available parking slots
      const availRes = await request({
        method: 'GET',
        path: '/api/slots/available'
      });
      assert(
        availRes.status === 200 && Array.isArray(availRes.data),
        'TEST 3: User views available parking slots',
        `Count: ${availRes.data.length}`
      );

      // TEST 4: Admin creates parking slot
      const newSlotNumber = `T-${Math.floor(Math.random() * 900 + 100)}`;
      const createSlotRes = await request({
        method: 'POST',
        path: '/api/slots',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          slotNumber: newSlotNumber,
          location: 'Test Level 2',
          status: 'available'
        }
      });
      const createdSlotId = createSlotRes.data._id;
      assert(
        createSlotRes.status === 201 && createSlotRes.data.slotNumber === newSlotNumber,
        'TEST 4: Admin creates parking slot',
        JSON.stringify(createSlotRes.data)
      );

      // TEST 5: Normal user tries to create slot -> rejected (403)
      const userCreateSlotRes = await request({
        method: 'POST',
        path: '/api/slots',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          slotNumber: 'FORBIDDEN-01',
          location: 'Anywhere'
        }
      });
      assert(
        userCreateSlotRes.status === 403,
        'TEST 5: Normal user tries to create slot -> rejected with 403 Forbidden',
        `Status was ${userCreateSlotRes.status}`
      );

      // Setup times for testing booking logic
      // Slot: createdSlotId
      // Base window: tomorrow 10:00 to 12:00
      const tomorrowBase = new Date();
      tomorrowBase.setDate(tomorrowBase.getDate() + 2);
      tomorrowBase.setHours(10, 0, 0, 0);

      const baseStart = new Date(tomorrowBase);
      const baseEnd = new Date(tomorrowBase);
      baseEnd.setHours(12, 0, 0, 0);

      // TEST 6: User books an available slot -> success
      const book1Res = await request({
        method: 'POST',
        path: '/api/bookings',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          parkingSlot: createdSlotId,
          startTime: baseStart.toISOString(),
          endTime: baseEnd.toISOString(),
          vehicleNumber: 'MH-12-AB-1234'
        }
      });
      const booking1Id = book1Res.data._id;
      assert(
        book1Res.status === 201 && book1Res.data.status === 'confirmed',
        'TEST 6: User books an available slot -> success 201',
        JSON.stringify(book1Res.data)
      );

      // TEST 7: Same slot is booked for overlapping time -> rejected (409)
      // Overlapping: 11:00 to 13:00 (overlaps with 10:00 - 12:00)
      const overlapStart = new Date(tomorrowBase);
      overlapStart.setHours(11, 0, 0, 0);
      const overlapEnd = new Date(tomorrowBase);
      overlapEnd.setHours(13, 0, 0, 0);

      const bookOverlapRes = await request({
        method: 'POST',
        path: '/api/bookings',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          parkingSlot: createdSlotId,
          startTime: overlapStart.toISOString(),
          endTime: overlapEnd.toISOString(),
          vehicleNumber: 'MH-12-AB-5678'
        }
      });
      assert(
        bookOverlapRes.status === 409 &&
          bookOverlapRes.data.message ===
            'Parking slot is already booked for the selected time.',
        'TEST 7: Same slot booked for overlapping time -> rejected with 409 Conflict',
        JSON.stringify(bookOverlapRes.data)
      );

      // TEST 8: Same slot is booked for a non-overlapping time -> allowed
      // Non-overlapping: 12:00 to 14:00 (starts right as previous ends)
      const nonOverlapStart = new Date(tomorrowBase);
      nonOverlapStart.setHours(12, 0, 0, 0);
      const nonOverlapEnd = new Date(tomorrowBase);
      nonOverlapEnd.setHours(14, 0, 0, 0);

      const bookNonOverlapRes = await request({
        method: 'POST',
        path: '/api/bookings',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          parkingSlot: createdSlotId,
          startTime: nonOverlapStart.toISOString(),
          endTime: nonOverlapEnd.toISOString(),
          vehicleNumber: 'MH-12-AB-9999'
        }
      });
      assert(
        bookNonOverlapRes.status === 201 && bookNonOverlapRes.data.status === 'confirmed',
        'TEST 8: Same slot booked for non-overlapping time (12:00-14:00) -> allowed 201',
        JSON.stringify(bookNonOverlapRes.data)
      );

      // TEST 9: Invalid time range -> rejected (400)
      // End time before start time
      const invalidTimeRes = await request({
        method: 'POST',
        path: '/api/bookings',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          parkingSlot: createdSlotId,
          startTime: baseEnd.toISOString(),
          endTime: baseStart.toISOString()
        }
      });
      assert(
        invalidTimeRes.status === 400,
        'TEST 9: Invalid time range (end before start) -> rejected with 400',
        JSON.stringify(invalidTimeRes.data)
      );

      // TEST 10: User views own bookings
      const myBookingsRes = await request({
        method: 'GET',
        path: '/api/bookings/my',
        headers: { Authorization: `Bearer ${userToken}` }
      });
      assert(
        myBookingsRes.status === 200 && myBookingsRes.data.length >= 2,
        'TEST 10: User views own bookings',
        `Returned count: ${myBookingsRes.data.length}`
      );

      // TEST 11: Admin views all bookings
      const allBookingsRes = await request({
        method: 'GET',
        path: '/api/bookings',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(
        allBookingsRes.status === 200 && allBookingsRes.data.length >= 2,
        'TEST 11: Admin views all bookings',
        `Returned count: ${allBookingsRes.data.length}`
      );

      // TEST 12: User cancels their booking
      const cancelRes = await request({
        method: 'PATCH',
        path: `/api/bookings/${booking1Id}/cancel`,
        headers: { Authorization: `Bearer ${userToken}` }
      });
      assert(
        cancelRes.status === 200 && cancelRes.data.status === 'cancelled',
        'TEST 12: User cancels their booking -> status changed to cancelled',
        JSON.stringify(cancelRes.data)
      );

      // Verify that after cancellation, that slot window can now be booked without conflict!
      const rebookCancelledRes = await request({
        method: 'POST',
        path: '/api/bookings',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          parkingSlot: createdSlotId,
          startTime: baseStart.toISOString(),
          endTime: baseEnd.toISOString(),
          vehicleNumber: 'MH-12-REBOOK'
        }
      });
      assert(
        rebookCancelledRes.status === 201,
        'TEST 12 (Follow-up): Cancelled slot window can now be re-booked without conflict',
        `Status: ${rebookCancelledRes.status}`
      );

      // TEST 13: Admin changes slot availability
      const updateSlotRes = await request({
        method: 'PATCH',
        path: `/api/slots/${createdSlotId}`,
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { status: 'unavailable' }
      });
      assert(
        updateSlotRes.status === 200 && updateSlotRes.data.status === 'unavailable',
        'TEST 13: Admin changes slot availability to unavailable',
        JSON.stringify(updateSlotRes.data)
      );

      // TEST 14: Dashboard correctly shows occupancy
      const occupancyRes = await request({
        method: 'GET',
        path: '/api/slots/occupancy',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(
        occupancyRes.status === 200 &&
          typeof occupancyRes.data.totalSlots === 'number' &&
          typeof occupancyRes.data.currentlyOccupied === 'number' &&
          typeof occupancyRes.data.availableSlots === 'number',
        'TEST 14: Dashboard correctly calculates and returns occupancy metrics',
        JSON.stringify(occupancyRes.data)
      );

      console.log('\n========================================');
      console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
      console.log('========================================\n');

      server.close();
      process.exit(failed > 0 ? 1 : 0);
    } catch (err) {
      console.error('Test execution error:', err);
      server.close();
      process.exit(1);
    }
  });
};

runTests();

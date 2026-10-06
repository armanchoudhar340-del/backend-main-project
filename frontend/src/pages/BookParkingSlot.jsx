import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { slotService, bookingService } from '../services/api';

const BookParkingSlot = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedSlotDetails, setSelectedSlotDetails] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Helper to format Date to datetime-local input string (YYYY-MM-DDTHH:mm)
  const formatInputDateTime = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
  };

  useEffect(() => {
    // Set default times: start now, end 2 hours later rounded to next 5 minutes
    const now = new Date();
    const roundedMinutes = Math.ceil(now.getMinutes() / 5) * 5;
    now.setMinutes(roundedMinutes, 0, 0);

    const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    setStartTime(formatInputDateTime(now));
    setEndTime(formatInputDateTime(later));

    // Fetch all active slots
    const loadSlots = async () => {
      try {
        setFetchingSlots(true);
        const data = await slotService.getAll();
        // Only show slots configured as 'available' in the select dropdown
        const availableOnes = data.filter((s) => s.status === 'available');
        setSlots(availableOnes);

        const paramSlotId = searchParams.get('slotId');
        if (paramSlotId && availableOnes.some((s) => s._id === paramSlotId)) {
          setSelectedSlotId(paramSlotId);
        } else if (availableOnes.length > 0) {
          setSelectedSlotId(availableOnes[0]._id);
        }
      } catch (err) {
        setError('Failed to load parking slots.');
      } finally {
        setFetchingSlots(false);
      }
    };

    loadSlots();
  }, [searchParams]);

  // Load slot details when selectedSlotId changes
  useEffect(() => {
    if (!selectedSlotId) {
      setSelectedSlotDetails(null);
      return;
    }
    const loadDetails = async () => {
      try {
        const details = await slotService.getById(selectedSlotId);
        setSelectedSlotDetails(details);
      } catch (err) {
        console.error('Failed to load slot details:', err);
      }
    };
    loadDetails();
  }, [selectedSlotId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Frontend validations
    if (!selectedSlotId) {
      setError('Please select a parking slot.');
      return;
    }

    if (!startTime || !endTime) {
      setError('Please choose both start time and end time.');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Please enter valid dates.');
      return;
    }

    if (end <= start) {
      setError('Please select a valid end time. End time must be strictly after start time.');
      return;
    }

    if (end <= new Date()) {
      setError('Cannot book a time slot in the past.');
      return;
    }

    try {
      setLoading(true);
      const bookingData = {
        parkingSlot: selectedSlotId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        vehicleNumber: vehicleNumber.trim()
      };

      const result = await bookingService.create(bookingData);
      setSuccess(`Booking created successfully! Reservation ID: ${result._id}`);

      // Reset vehicle or navigate after brief delay
      setTimeout(() => {
        navigate('/my-bookings');
      }, 1500);
    } catch (err) {
      if (err.response?.status === 409) {
        setError(err.response.data.message || 'Parking slot is already booked for the selected time.');
      } else {
        setError(err.response?.data?.message || 'Failed to create booking. Please check your inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatScheduleTime = (iso) => {
    return new Date(iso).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container" style={{ maxWidth: '780px' }}>
      <div className="page-header">
        <div>
          <h1>Reserve a Parking Slot</h1>
          <p>Select your time window. The system verifies slot availability in real-time.</p>
        </div>
        <Link to="/slots" className="btn btn-secondary btn-sm">
          ← View All Slots
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        {fetchingSlots ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading available slots...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="empty-state">
            <h3>No Available Parking Slots</h3>
            <p>All parking slots are currently marked unavailable or none exist yet.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="parkingSlot">Choose Parking Slot</label>
              <select
                id="parkingSlot"
                className="form-control"
                value={selectedSlotId}
                onChange={(e) => setSelectedSlotId(e.target.value)}
                required
              >
                {slots.map((s) => (
                  <option key={s._id} value={s._id}>
                    Slot {s.slotNumber} – {s.location} {s.isCurrentlyOccupied ? '(Currently Occupied Now)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="startTime">Start Date & Time</label>
                <input
                  id="startTime"
                  type="datetime-local"
                  className="form-control"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="endTime">End Date & Time</label>
                <input
                  id="endTime"
                  type="datetime-local"
                  className="form-control"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="vehicleNumber">
                Vehicle Plate Number (Optional)
              </label>
              <input
                id="vehicleNumber"
                type="text"
                className="form-control"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. DL-01-AB-1234"
              />
              <span className="form-help">Helps parking security identify your registered vehicle.</span>
            </div>

            {/* Display upcoming bookings for the selected slot if any */}
            {selectedSlotDetails?.upcomingBookings?.length > 0 && (
              <div style={{ marginBottom: '1.25rem', padding: '0.85rem', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ fontSize: '0.85rem', color: '#92400e' }}>
                  ℹ️ Existing Reservations on Slot {selectedSlotDetails.slotNumber}:
                </strong>
                <ul style={{ fontSize: '0.82rem', marginTop: '0.35rem', paddingLeft: '1.25rem', color: '#78350f' }}>
                  {selectedSlotDetails.upcomingBookings.map((b) => (
                    <li key={b._id}>
                      {formatScheduleTime(b.startTime)} to {formatScheduleTime(b.endTime)}
                    </li>
                  ))}
                </ul>
                <div style={{ fontSize: '0.78rem', color: '#92400e', marginTop: '0.25rem' }}>
                  * Make sure your requested time window does not overlap with these hours.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Validating & Reserving...' : 'Confirm Reservation'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/slots')}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookParkingSlot;

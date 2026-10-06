import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingService } from '../services/api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await bookingService.getMy();
      setBookings(data);
    } catch (err) {
      setError('Failed to fetch your bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleCancel = async (bookingId, slotNumber) => {
    if (!window.confirm(`Are you sure you want to cancel the booking for Slot ${slotNumber}?`)) {
      return;
    }

    try {
      await bookingService.cancel(bookingId);
      setActionSuccess(`Booking for Slot ${slotNumber} was cancelled successfully.`);
      // Refresh list
      fetchMyBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>My Parking Bookings</h1>
          <p>Review past, current, and upcoming parking reservations</p>
        </div>
        <Link to="/book" className="btn btn-primary">
          + Book Another Slot
        </Link>
      </div>

      {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <h3>No Bookings Found</h3>
          <p>You haven't made any parking slot reservations yet.</p>
          <Link to="/book" className="btn btn-primary btn-sm">
            Make Your First Booking
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Slot</th>
                <th>Location</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Vehicle Plate</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const now = new Date();
                const isPast = new Date(b.endTime) < now;
                const isConfirmed = b.status === 'confirmed';

                return (
                  <tr key={b._id}>
                    <td>
                      <strong>Slot {b.parkingSlot?.slotNumber || 'N/A'}</strong>
                    </td>
                    <td>{b.parkingSlot?.location || 'Main Parking'}</td>
                    <td>{formatDateTime(b.startTime)}</td>
                    <td>{formatDateTime(b.endTime)}</td>
                    <td>{b.vehicleNumber || '—'}</td>
                    <td>
                      <span className={`badge badge-${b.status}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Link
                          to={`/bookings/${b._id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          View
                        </Link>
                        {isConfirmed && !isPast && (
                          <button
                            onClick={() => handleCancel(b._id, b.parkingSlot?.slotNumber)}
                            className="btn btn-danger btn-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyBookings;

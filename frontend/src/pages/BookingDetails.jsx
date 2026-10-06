import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await bookingService.getById(id);
      setBooking(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;

    try {
      setCancelling(true);
      const updated = await bookingService.cancel(id);
      setBooking(updated);
      setActionSuccess('Booking has been cancelled successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel reservation.');
    } finally {
      setCancelling(false);
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString([], {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container">
        <div className="alert alert-error">{error || 'Booking not found.'}</div>
        <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm">
          ← Go Back
        </button>
      </div>
    );
  }

  const now = new Date();
  const isPast = new Date(booking.endTime) < now;
  const isConfirmed = booking.status === 'confirmed';

  return (
    <div className="container" style={{ maxWidth: '680px' }}>
      <div className="page-header">
        <div>
          <h1>Booking Details</h1>
          <p>Reservation ID: <code style={{ fontSize: '0.9rem' }}>{booking._id}</code></p>
        </div>
        <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm">
          ← Back
        </button>
      </div>

      {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              Slot {booking.parkingSlot?.slotNumber}
            </span>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              📍 {booking.parkingSlot?.location || 'Main Parking Area'}
            </div>
          </div>
          <span className={`badge badge-${booking.status}`} style={{ fontSize: '0.9rem', padding: '0.35rem 0.85rem' }}>
            {booking.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <label className="stat-label">Start Time</label>
            <div style={{ fontWeight: 600 }}>{formatDateTime(booking.startTime)}</div>
          </div>

          <div>
            <label className="stat-label">End Time</label>
            <div style={{ fontWeight: 600 }}>{formatDateTime(booking.endTime)}</div>
          </div>

          <div>
            <label className="stat-label">Vehicle Registration</label>
            <div style={{ fontWeight: 600 }}>{booking.vehicleNumber || 'Not specified'}</div>
          </div>

          <div>
            <label className="stat-label">Booked At</label>
            <div style={{ fontWeight: 600 }}>{formatDateTime(booking.createdAt)}</div>
          </div>

          <div>
            <label className="stat-label">Customer Name</label>
            <div style={{ fontWeight: 600 }}>{booking.user?.name || 'User'}</div>
          </div>

          <div>
            <label className="stat-label">Customer Email</label>
            <div style={{ fontWeight: 600 }}>{booking.user?.email || 'N/A'}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          {isConfirmed && !isPast && (
            <button
              onClick={handleCancel}
              className="btn btn-danger"
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Reservation'}
            </button>
          )}

          <Link to="/slots" className="btn btn-secondary">
            Browse All Slots
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;

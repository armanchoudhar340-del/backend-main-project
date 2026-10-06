import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { slotService, bookingService } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [availableSlotsCount, setAvailableSlotsCount] = useState(0);
  const [totalSlotsCount, setTotalSlotsCount] = useState(0);
  const [activeBookings, setActiveBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch slots
        const slots = await slotService.getAll();
        setTotalSlotsCount(slots.length);
        const freeSlots = slots.filter((s) => s.status === 'available' && !s.isCurrentlyOccupied);
        setAvailableSlotsCount(freeSlots.length);

        // Fetch user's bookings
        const bookings = await bookingService.getMy();
        const now = new Date();

        // Active right now: confirmed and startTime <= now <= endTime
        const current = bookings.filter(
          (b) => b.status === 'confirmed' && new Date(b.startTime) <= now && new Date(b.endTime) > now
        );

        // Upcoming: confirmed and startTime > now
        const upcoming = bookings.filter(
          (b) => b.status === 'confirmed' && new Date(b.startTime) > now
        );

        setActiveBookings(current);
        setUpcomingBookings(upcoming);
      } catch (err) {
        setError('Failed to load dashboard data. Please make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString([], {
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
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Welcome, {user?.name}!</h1>
          <p>Commercial Complex Parking Management Portal</p>
        </div>
        <Link to="/book" className="btn btn-primary">
          + Book a Parking Slot
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Quick Overview Stats */}
      <div className="stats-grid">
        <div className="stat-card stat-success">
          <span className="stat-label">Available Slots Right Now</span>
          <span className="stat-value">{availableSlotsCount} / {totalSlotsCount}</span>
        </div>
        <div className="stat-card stat-primary">
          <span className="stat-label">My Active Bookings</span>
          <span className="stat-value">{activeBookings.length}</span>
        </div>
        <div className="stat-card stat-warning">
          <span className="stat-label">Upcoming Reservations</span>
          <span className="stat-value">{upcomingBookings.length}</span>
        </div>
      </div>

      {/* Currently Active Bookings Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="page-header" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Current Active Parking</h2>
          <Link to="/my-bookings" style={{ fontSize: '0.9rem' }}>View All Bookings →</Link>
        </div>

        {activeBookings.length === 0 ? (
          <div className="card" style={{ color: 'var(--text-muted)' }}>
            You do not have any vehicle parked right now.
          </div>
        ) : (
          <div className="card-grid">
            {activeBookings.map((b) => (
              <div key={b._id} className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    Slot {b.parkingSlot?.slotNumber || 'N/A'}
                  </span>
                  <span className="badge badge-confirmed">Parked Now</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  📍 {b.parkingSlot?.location || 'Main Area'}
                </p>
                <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  <strong>Time Window:</strong><br />
                  {formatDateTime(b.startTime)} – {formatDateTime(b.endTime)}
                </div>
                {b.vehicleNumber && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Vehicle: <strong>{b.vehicleNumber}</strong>
                  </div>
                )}
                <div style={{ marginTop: '0.75rem' }}>
                  <Link to={`/bookings/${b._id}`} className="btn btn-secondary btn-sm btn-block">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Reservations */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
          Upcoming Bookings
        </h2>

        {upcomingBookings.length === 0 ? (
          <div className="card" style={{ color: 'var(--text-muted)' }}>
            No upcoming reservations. Need a slot for later?{' '}
            <Link to="/book">Book one in advance</Link>.
          </div>
        ) : (
          <div className="card-grid">
            {upcomingBookings.map((b) => (
              <div key={b._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    Slot {b.parkingSlot?.slotNumber || 'N/A'}
                  </span>
                  <span className="badge badge-confirmed">Upcoming</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  📍 {b.parkingSlot?.location || 'Main Area'}
                </p>
                <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  <strong>Starts:</strong> {formatDateTime(b.startTime)}<br />
                  <strong>Ends:</strong> {formatDateTime(b.endTime)}
                </div>
                <Link to={`/bookings/${b._id}`} className="btn btn-secondary btn-sm btn-block">
                  View Details / Cancel
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

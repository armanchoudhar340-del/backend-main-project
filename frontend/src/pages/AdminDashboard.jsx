import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { slotService, bookingService } from '../services/api';

const AdminDashboard = () => {
  const [occupancy, setOccupancy] = useState(null);
  const [slots, setSlots] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('slots'); // 'slots' or 'bookings'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [occupancyData, slotsData, bookingsData] = await Promise.all([
        slotService.getOccupancy(),
        slotService.getAll(),
        bookingService.getAll()
      ]);
      setOccupancy(occupancyData);
      setSlots(slotsData);
      setAllBookings(bookingsData);
    } catch (err) {
      setError('Failed to fetch admin data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleSlotStatus = async (slot) => {
    try {
      const nextStatus = slot.status === 'available' ? 'unavailable' : 'available';
      await slotService.update(slot._id, { status: nextStatus });
      setSuccess(`Updated Slot ${slot.slotNumber} status to ${nextStatus}.`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update slot status.');
    }
  };

  const handleCancelBooking = async (bookingId, slotNumber) => {
    if (!window.confirm(`Admin Action: Cancel booking for Slot ${slotNumber}?`)) return;
    try {
      await bookingService.cancel(bookingId);
      setSuccess(`Booking on Slot ${slotNumber} cancelled by admin.`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString([], {
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
          <p>Loading Admin Dashboard metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Admin Control Center</h1>
          <p>Complex Parking Occupancy & Reservation Management</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/manage-slots" className="btn btn-primary">
            + Manage Slots
          </Link>
          <button onClick={loadData} className="btn btn-secondary">
            🔄 Refresh
          </button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Real-time Occupancy Metrics */}
      {occupancy && (
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <span className="stat-label">Total Slots</span>
            <span className="stat-value">{occupancy.totalSlots}</span>
          </div>
          <div className="stat-card stat-success">
            <span className="stat-label">Available Slots</span>
            <span className="stat-value">{occupancy.availableSlots}</span>
          </div>
          <div className="stat-card stat-danger">
            <span className="stat-label">Currently Occupied</span>
            <span className="stat-value">{occupancy.currentlyOccupied}</span>
          </div>
          <div className="stat-card stat-gray">
            <span className="stat-label">Maintenance / Off</span>
            <span className="stat-value">{occupancy.unavailableSlots}</span>
          </div>
          <div className="stat-card stat-warning">
            <span className="stat-label">Active / Upcoming Bookings</span>
            <span className="stat-value">{occupancy.totalActiveBookings}</span>
          </div>
        </div>
      )}

      {/* Tab selection */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('slots')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'slots' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'slots' ? var_primary : 'var(--text-muted)',
            padding: '0.5rem 1rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Parking Slots Monitor ({slots.length})
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'bookings' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'bookings' ? var_primary : 'var(--text-muted)',
            padding: '0.5rem 1rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          All System Bookings ({allBookings.length})
        </button>
      </div>

      {/* Tab Content 1: Slots Monitor Table */}
      {activeTab === 'slots' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Slot Number</th>
                <th>Location / Section</th>
                <th>Status</th>
                <th>Current Booking Window</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => {
                let statusLabel = 'Available';
                let statusClass = 'badge-available';

                if (slot.status === 'unavailable') {
                  statusLabel = 'Unavailable';
                  statusClass = 'badge-unavailable';
                } else if (slot.isCurrentlyOccupied) {
                  statusLabel = 'Occupied Now';
                  statusClass = 'badge-occupied';
                }

                return (
                  <tr key={slot._id}>
                    <td><strong>Slot {slot.slotNumber}</strong></td>
                    <td>{slot.location}</td>
                    <td>
                      <span className={`badge ${statusClass}`}>{statusLabel}</span>
                    </td>
                    <td>
                      {slot.isCurrentlyOccupied && slot.currentBooking ? (
                        <div style={{ fontSize: '0.85rem' }}>
                          🚗 User: {slot.currentBooking.user?.name || 'User'} ({slot.currentBooking.vehicleNumber || 'No Plate'})<br />
                          ⏰ {formatDateTime(slot.currentBooking.startTime)} – {formatDateTime(slot.currentBooking.endTime)}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No vehicle parked</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleToggleSlotStatus(slot)}
                          className="btn btn-secondary btn-sm"
                        >
                          {slot.status === 'available' ? 'Mark Maintenance' : 'Set Available'}
                        </button>
                        <Link
                          to={`/manage-slots?edit=${slot._id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content 2: All Bookings Table */}
      {activeTab === 'bookings' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Slot</th>
                <th>Booked By</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Admin Action</th>
              </tr>
            </thead>
            <tbody>
              {allBookings.map((b) => (
                <tr key={b._id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{b._id.slice(-6)}</td>
                  <td><strong>Slot {b.parkingSlot?.slotNumber || 'N/A'}</strong></td>
                  <td>
                    <div>{b.user?.name || 'User'}</div>
                    <small style={{ color: 'var(--text-muted)' }}>{b.user?.email}</small>
                  </td>
                  <td>{formatDateTime(b.startTime)}</td>
                  <td>{formatDateTime(b.endTime)}</td>
                  <td>{b.vehicleNumber || '—'}</td>
                  <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link to={`/bookings/${b._id}`} className="btn btn-secondary btn-sm">
                        Details
                      </Link>
                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancelBooking(b._id, b.parkingSlot?.slotNumber)}
                          className="btn btn-danger btn-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const var_primary = '#2563eb';

export default AdminDashboard;

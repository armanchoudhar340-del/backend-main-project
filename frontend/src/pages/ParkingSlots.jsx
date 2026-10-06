import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { slotService } from '../services/api';
import SlotCard from '../components/SlotCard';
import { useAuth } from '../context/AuthContext';

const ParkingSlots = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await slotService.getAll();
      setSlots(data);
    } catch (err) {
      setError('Failed to fetch parking slots from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleBookClick = (slot) => {
    navigate(`/book?slotId=${slot._id}`);
  };

  const handleToggleStatus = async (slot) => {
    try {
      const newStatus = slot.status === 'available' ? 'unavailable' : 'available';
      await slotService.update(slot._id, { status: newStatus });
      fetchSlots();
    } catch (err) {
      alert('Failed to update slot status: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filter slots
  const filteredSlots = slots.filter((slot) => {
    // Status filter
    if (statusFilter === 'available') {
      if (slot.status !== 'available' || slot.isCurrentlyOccupied) return false;
    } else if (statusFilter === 'occupied') {
      if (!slot.isCurrentlyOccupied) return false;
    } else if (statusFilter === 'unavailable') {
      if (slot.status !== 'unavailable') return false;
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNumber = slot.slotNumber.toLowerCase().includes(q);
      const matchLoc = (slot.location || '').toLowerCase().includes(q);
      if (!matchNumber && !matchLoc) return false;
    }

    return true;
  });

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Parking Slots Directory</h1>
          <p>Real-time slot availability across all commercial parking sections</p>
        </div>
        <button onClick={fetchSlots} className="btn btn-secondary btn-sm">
          🔄 Refresh Status
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label className="form-label" htmlFor="search-slot">Search Slot or Section</label>
          <input
            id="search-slot"
            type="text"
            className="form-control"
            placeholder="e.g. A-01 or Basement"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ minWidth: '180px' }}>
          <label className="form-label" htmlFor="filter-status">Filter by Status</label>
          <select
            id="filter-status"
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Slots ({slots.length})</option>
            <option value="available">Available Now</option>
            <option value="occupied">Currently Occupied</option>
            <option value="unavailable">Under Maintenance</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading parking slots...</p>
        </div>
      ) : filteredSlots.length === 0 ? (
        <div className="empty-state">
          <h3>No Parking Slots Found</h3>
          <p>No slots match your selected filter criteria.</p>
          <button
            onClick={() => { setStatusFilter('all'); setSearch(''); }}
            className="btn btn-secondary btn-sm"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {filteredSlots.map((slot) => (
            <SlotCard
              key={slot._id}
              slot={slot}
              onBookClick={handleBookClick}
              isAdmin={isAdmin}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ParkingSlots;

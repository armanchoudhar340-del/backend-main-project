import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { slotService } from '../services/api';

const ManageSlots = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [editingId, setEditingId] = useState(null);
  const [slotNumber, setSlotNumber] = useState('');
  const [location, setLocation] = useState('Ground Floor - Section A');
  const [status, setStatus] = useState('available');
  const [submitting, setSubmitting] = useState(false);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await slotService.getAll();
      setSlots(data);
    } catch (err) {
      setError('Failed to fetch parking slots.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  // Check if edit query parameter exists
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && slots.length > 0) {
      const slotToEdit = slots.find((s) => s._id === editId);
      if (slotToEdit) {
        setEditingId(slotToEdit._id);
        setSlotNumber(slotToEdit.slotNumber);
        setLocation(slotToEdit.location || '');
        setStatus(slotToEdit.status);
      }
    }
  }, [searchParams, slots]);

  const handleResetForm = () => {
    setEditingId(null);
    setSlotNumber('');
    setLocation('Ground Floor - Section A');
    setStatus('available');
    setSearchParams({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!slotNumber.trim()) {
      setError('Please provide a slot number.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await slotService.update(editingId, {
          slotNumber: slotNumber.trim(),
          location: location.trim(),
          status
        });
        setSuccess(`Slot ${slotNumber.toUpperCase()} updated successfully!`);
      } else {
        await slotService.create({
          slotNumber: slotNumber.trim(),
          location: location.trim(),
          status
        });
        setSuccess(`Slot ${slotNumber.toUpperCase()} created successfully!`);
      }
      handleResetForm();
      fetchSlots();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (slot) => {
    setEditingId(slot._id);
    setSlotNumber(slot.slotNumber);
    setLocation(slot.location || '');
    setStatus(slot.status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (slot) => {
    if (!window.confirm(`Are you sure you want to permanently delete Slot ${slot.slotNumber}?`)) {
      return;
    }

    try {
      await slotService.delete(slot._id);
      setSuccess(`Slot ${slot.slotNumber} deleted successfully.`);
      fetchSlots();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete slot.');
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Parking Slot Management</h1>
          <p>Create, configure, update, or remove parking slots in the facility</p>
        </div>
        <Link to="/admin" className="btn btn-secondary btn-sm">
          ← Back to Admin Dashboard
        </Link>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Slot Creation / Editing Form */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="card-title">
          {editingId ? `Edit Slot ${slotNumber}` : 'Create New Parking Slot'}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="manage-slot-number">Slot Number / Code</label>
              <input
                id="manage-slot-number"
                type="text"
                className="form-control"
                placeholder="e.g. C-01"
                value={slotNumber}
                onChange={(e) => setSlotNumber(e.target.value)}
                required
              />
              <span className="form-help">Must be unique (e.g. A-01, B-05, VIP-01).</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="manage-location">Location / Section</label>
              <input
                id="manage-location"
                type="text"
                className="form-control"
                placeholder="e.g. Basement 1 - Section B"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="manage-status">Initial Status</label>
              <select
                id="manage-status"
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable (Maintenance)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update Slot' : 'Create Slot'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={handleResetForm}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Slots List Table */}
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h2>Existing Parking Slots ({slots.length})</h2>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading slots...</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Slot Code</th>
                <th>Location / Section</th>
                <th>Status</th>
                <th>Live Occupancy</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot._id}>
                  <td><strong>Slot {slot.slotNumber}</strong></td>
                  <td>{slot.location}</td>
                  <td>
                    <span className={`badge ${slot.status === 'available' ? 'badge-available' : 'badge-unavailable'}`}>
                      {slot.status}
                    </span>
                  </td>
                  <td>
                    {slot.isCurrentlyOccupied ? (
                      <span className="badge badge-occupied">Occupied Right Now</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Vacant</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEditClick(slot)}
                        className="btn btn-secondary btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(slot)}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
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

export default ManageSlots;

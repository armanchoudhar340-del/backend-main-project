import React from 'react';
import { Link } from 'react-router-dom';

const SlotCard = ({ slot, onBookClick, isAdmin = false, onToggleStatus }) => {
  // Determine display status
  let statusBadge = null;
  let isBookable = false;

  if (slot.status === 'unavailable') {
    statusBadge = <span className="badge badge-unavailable">Maintenance</span>;
  } else if (slot.isCurrentlyOccupied) {
    statusBadge = <span className="badge badge-occupied">Occupied</span>;
  } else {
    statusBadge = <span className="badge badge-available">Available</span>;
    isBookable = true;
  }

  // Format booking time window if occupied
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="slot-card">
      <div className="slot-card-header">
        <span className="slot-card-number">{slot.slotNumber}</span>
        {statusBadge}
      </div>

      <div className="slot-card-body">
        <p className="slot-location">📍 {slot.location || 'Main Parking Area'}</p>

        {slot.isCurrentlyOccupied && slot.currentBooking && (
          <div className="slot-current-booking">
            <strong>Currently Occupied:</strong>
            <div>
              {formatTime(slot.currentBooking.startTime)} – {formatTime(slot.currentBooking.endTime)}
            </div>
          </div>
        )}
      </div>

      <div className="slot-card-footer">
        {isAdmin ? (
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <button
              onClick={() => onToggleStatus && onToggleStatus(slot)}
              className="btn btn-secondary btn-sm btn-block"
            >
              Toggle {slot.status === 'available' ? 'Off' : 'On'}
            </button>
            <Link
              to={`/manage-slots?edit=${slot._id}`}
              className="btn btn-primary btn-sm btn-block"
            >
              Edit
            </Link>
          </div>
        ) : isBookable ? (
          <button
            onClick={() => onBookClick(slot)}
            className="btn btn-primary btn-block btn-sm"
          >
            Book Now
          </button>
        ) : (
          <button className="btn btn-secondary btn-block btn-sm" disabled>
            {slot.status === 'unavailable' ? 'Unavailable' : 'Currently Occupied'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SlotCard;

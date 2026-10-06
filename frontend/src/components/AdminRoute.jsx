import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Verifying admin permissions...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="container" style={{ marginTop: '2rem' }}>
        <div className="alert alert-error">
          <h3>403 - Forbidden Access</h3>
          <p>You do not have administrative privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;

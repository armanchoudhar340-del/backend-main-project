import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ParkingSlots from './pages/ParkingSlots';
import BookParkingSlot from './pages/BookParkingSlot';
import MyBookings from './pages/MyBookings';
import BookingDetails from './pages/BookingDetails';
import AdminDashboard from './pages/AdminDashboard';
import ManageSlots from './pages/ManageSlots';

// Root redirect component based on authentication state
const HomeRedirect = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-layout">
          <Navbar />

          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* User Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/slots"
                element={
                  <PrivateRoute>
                    <ParkingSlots />
                  </PrivateRoute>
                }
              />
              <Route
                path="/book"
                element={
                  <PrivateRoute>
                    <BookParkingSlot />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <PrivateRoute>
                    <MyBookings />
                  </PrivateRoute>
                }
              />
              <Route
                path="/bookings/:id"
                element={
                  <PrivateRoute>
                    <BookingDetails />
                  </PrivateRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/manage-slots"
                element={
                  <AdminRoute>
                    <ManageSlots />
                  </AdminRoute>
                }
              />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="footer">
            <div className="container">
              Parking Slot Management System &copy; {new Date().getFullYear()} &bull; B.Tech Computer Science Engineering
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={isAdmin ? '/admin' : '/dashboard'} className="nav-brand">
          <span>🅿️ Parking System</span>
          {isAdmin && <span className="badge-tag">Admin</span>}
        </Link>

        <div className="nav-links">
          {user ? (
            <>
              {isAdmin ? (
                <>
                  <NavLink
                    to="/admin"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    Admin Dashboard
                  </NavLink>
                  <NavLink
                    to="/manage-slots"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    Manage Slots
                  </NavLink>
                  <NavLink
                    to="/slots"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    Parking Grid
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/slots"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    Browse Slots
                  </NavLink>
                  <NavLink
                    to="/book"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    Book Slot
                  </NavLink>
                  <NavLink
                    to="/my-bookings"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    My Bookings
                  </NavLink>
                </>
              )}

              <div className="nav-user">
                <div className="user-badge">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">{user.role}</span>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

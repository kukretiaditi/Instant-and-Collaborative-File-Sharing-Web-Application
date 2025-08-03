import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { FaUser, FaSignOutAlt, FaTachometerAlt, FaBars, FaTimes, FaMoon, FaSun } from 'react-icons/fa';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const authLinks = (
    <ul className={mobileMenuOpen ? 'mobile-menu active' : ''}>
      {user && (
        <li className="welcome">
          <span>Welcome, {user.name}</span>
        </li>
      )}
      <li>
        <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
          <FaTachometerAlt className="icon" /> Dashboard
        </Link>
      </li>
      <li>
        <a onClick={() => { logout(); setMobileMenuOpen(false); }} href="#!">
          <FaSignOutAlt className="icon" /> Logout
        </a>
      </li>
      <li className="theme-toggle-item">
        <button className="theme-toggle" onClick={toggleTheme}>
          {darkMode ? <FaSun className="icon" /> : <FaMoon className="icon" />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </li>
    </ul>
  );

  const guestLinks = (
    <ul className={mobileMenuOpen ? 'mobile-menu active' : ''}>
      <li>
        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
          <FaUser className="icon" /> Login
        </Link>
      </li>
      <li>
        <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
          Register
        </Link>
      </li>
      <li className="theme-toggle-item">
        <button className="theme-toggle" onClick={toggleTheme}>
          {darkMode ? <FaSun className="icon" /> : <FaMoon className="icon" />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </li>
    </ul>
  );

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/">
          <h1>FileToffee</h1>
        </Link>
      </div>
      
      <div className="navbar-right">
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
        
        <button 
          className="mobile-menu-btn" 
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      {isAuthenticated ? authLinks : guestLinks}
    </nav>
  );
};

export default Navbar; 
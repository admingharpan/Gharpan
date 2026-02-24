import React, { useState, useEffect } from 'react';
import './navbar.css';
import logo from '../images/image1.jpg';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState({
    totalResidents: 0,
    successfulRehabilitations: 0,
    ongoingCarePrograms: 0,
  });

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const statsResponse = await fetch("/api/residents/stats/dashboard");
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStatistics({
          totalResidents: statsData.data.totalResidents,
          successfulRehabilitations: statsData.data.successfulRehabilitations,
          ongoingCarePrograms: statsData.data.ongoingCarePrograms,
        });
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");   // Clear login token
    navigate("/");                      // Redirect to login page
  };

  return (
    <nav className="navbar navbar-expand-lg fixed-top shadow-lg">
      <div className="navbar-container">
        {/* Left Side Logo */}
        <Link to="/dashboard" className="navbar-brand d-flex align-items-center">
          <img src={logo} alt="Logo" className="logo me-2" />
          <span className="brand-text">Gharpan Foundation</span>
        </Link>

        {/* Middle Stats Display */}
        <div className="navbar-stats">
          <div className="stat-item">
            <span className="stat-value">{statistics.totalResidents}</span>
            <span className="stat-label">Residents</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-value">{statistics.successfulRehabilitations}</span>
            <span className="stat-label">Successful</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-value">{statistics.ongoingCarePrograms}</span>
            <span className="stat-label">Ongoing</span>
          </div>
        </div>

        {/* Right Side Logout Button */}
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;

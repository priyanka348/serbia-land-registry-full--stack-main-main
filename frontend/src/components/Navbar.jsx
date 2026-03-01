// Navbar.jsx
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const location = useLocation();

  const rememberPrev = () => {
    sessionStorage.setItem("prev_path", location.pathname + location.search);
  };

  return (
    <nav className="nav" aria-label="Primary">
      <div className="navInner">
        {/* ✅ Sidebar logo card (clickable) */}
        <NavLink
          to="/overview"
          onClick={rememberPrev}
          className="navBrandCard"
          aria-label="Go to Overview"
          title="Go to Overview"
        >
          <div className="navCrest" aria-hidden="true">🛡️</div>
          <div className="navBrandTxt">
            <div className="navBrandTop">Serbia</div>
            <div className="navBrandBottom">Land Registry</div>
          </div>
        </NavLink>

        {/* ✅ Nav items (SPA navigation) */}
        <NavLink
          to="/overview"
          onClick={rememberPrev}
          className={({ isActive }) => "navItem " + (isActive ? "active" : "")}
        >
          <span className="navIcon" aria-hidden="true">🏠</span>
          Overview
        </NavLink>

        <NavLink
          to="/disputes"
          onClick={rememberPrev}
          className={({ isActive }) => "navItem " + (isActive ? "active" : "")}
        >
          <span className="navIcon" aria-hidden="true">⚖️</span>
          Disputes
        </NavLink>

        <NavLink
          to="/transfers"
          onClick={rememberPrev}
          className={({ isActive }) => "navItem " + (isActive ? "active" : "")}
        >
          <span className="navIcon" aria-hidden="true">🔁</span>
          Transfer
        </NavLink>

        <NavLink
          to="/mortgages"
          onClick={rememberPrev}
          className={({ isActive }) => "navItem " + (isActive ? "active" : "")}
        >
          <span className="navIcon" aria-hidden="true">🏦</span>
          Mortgages
        </NavLink>

        <NavLink
          to="/regions"
          onClick={rememberPrev}
          className={({ isActive }) => "navItem " + (isActive ? "active" : "")}
        >
          <span className="navIcon" aria-hidden="true">📍</span>
          Region
        </NavLink>

        {/* ✅ Bottom quick links (NOW WORKING) */}
        <div className="navBottom">
          <NavLink
            to="/contacts"
            onClick={rememberPrev}
            className={({ isActive }) => "navMini " + (isActive ? "active" : "")}
          >
            <span aria-hidden="true">✉️</span>
            <span>Contacts</span>
          </NavLink>

          <NavLink
            to="/policy"
            onClick={rememberPrev}
            className={({ isActive }) => "navMini " + (isActive ? "active" : "")}
          >
            <span aria-hidden="true">🛡️</span>
            <span>Policy</span>
          </NavLink>

          <NavLink
            to="/settings"
            onClick={rememberPrev}
            className={({ isActive }) => "navMini " + (isActive ? "active" : "")}
          >
            <span aria-hidden="true">⚙️</span>
            <span>Settings</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
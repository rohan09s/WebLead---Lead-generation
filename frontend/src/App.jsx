import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import BusinessDetail from "./pages/BusinessDetail";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LeadsAdmin from "./pages/LeadsAdmin";
import AdminBusinesses from "./pages/AdminBusinesses";
import Unauthorized from "./pages/Unauthorized";
import CustomerOnboarding from "./pages/CustomerOnboarding";
import SubmitInquiry from "./pages/SubmitInquiry";
import ProtectedRoute from "./components/ProtectedRoute";
import BusinessProducts from "./pages/BusinessProducts";
import AddProduct from "./pages/AddProduct";
import webleads_logo from "../assets/webleads_logo.svg";

export default function App() {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch (_) {
      setUser(null);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <BrowserRouter>
      <header className="app-header">
        <div className="app-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NavLink to="/" className="brand"><img src={webleads_logo} alt="WebLeads logo" className="site-logo" /></NavLink>

            <button
              className="mobile-hamburger"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((s) => !s)}
            >
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </button>

            <nav className={`nav-links ${mobileOpen ? 'open' : ''}`} aria-label="Main navigation">
              <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
              <NavLink to="/dashboard" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
              {user && <NavLink to="/submit" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Send Inquiry</NavLink>}
              {user?.role === 'business' && (
                <>
                  <NavLink to="/business/products" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>My Products</NavLink>
                </>
              )}
              {user?.role === "admin" && (
                <>
                  <NavLink to="/admin/leads" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Admin: Leads</NavLink>
                  <NavLink to="/admin/businesses" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Manage Businesses</NavLink>
                </>
              )}
            </nav>
          </div>

          <div className="nav-actions">
            {!user ? (
              <>
                <NavLink to="/login" className={({isActive})=>`nav-link btn-link ${isActive?'active':''}`}>Login</NavLink>
                <NavLink to="/register" className={({isActive})=>`nav-link btn-primary ${isActive?'active':''}`}>Register</NavLink>
              </>
            ) : (
              <>
                <span className="nav-user">{user.name}</span>
                <button onClick={logout} className="btn-logout">Logout</button>
              </>
            )}
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/business/:id" element={<BusinessDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/leads" element={<LeadsAdmin />} />
        <Route path="/admin/businesses" element={<AdminBusinesses />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<CustomerOnboarding />} />
        <Route path="/submit" element={<ProtectedRoute><SubmitInquiry /></ProtectedRoute>} />
        <Route path="/business/products" element={<ProtectedRoute role="business"><BusinessProducts/></ProtectedRoute>} />
        <Route path="/business/products/new" element={<ProtectedRoute role="business"><AddProduct/></ProtectedRoute>} />
        <Route path="/business/products/:id/edit" element={<ProtectedRoute role="business"><AddProduct/></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
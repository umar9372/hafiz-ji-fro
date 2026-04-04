import React, { useEffect, useState } from "react";
import { WorkshopContext } from "../Context";
import { AppProperties } from "../../AppProperties";
import axios from "axios";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import {
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
  TrendingUp,
  Settings,
  UserCircle,
  Users,
  Box,
  History,
  Menu,
  X,
  LogIn,
  Zap
} from "lucide-react";

import LoginPage from "../Pages/LoginPage";
import ReloadPrompt from "../Components/ReloadPrompt";

export default function WebWrapper() {
  const { loca } = AppProperties;
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Auth state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Close sidebar on route change for mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: "Overview", path: "/", icon: <LayoutDashboard size={18} /> },
    { name: "Warehouse", path: "/inventory", icon: <PackageSearch size={18} /> },
    { name: "Intake", path: "/purchase", icon: <ShoppingCart size={18} /> },
    { name: "Production", path: "/production", icon: <Zap size={18} /> },
    { name: "Sales", path: "/sales", icon: <TrendingUp size={18} /> },
    { name: "Clients", path: "/accounts", icon: <Users size={18} /> },
    { name: "Materials", path: "/materials", icon: <Box size={18} /> },
    { name: "Rates", path: "/settings", icon: <Settings size={18} /> },
    { name: "History", path: "/history", icon: <History size={18} /> },
  ];

  const bottomNavLinks = [
    { name: "Home", path: "/", icon: <LayoutDashboard size={20} /> },
    { name: "Stock", path: "/inventory", icon: <PackageSearch size={20} /> },
    { name: "Bill", path: "/purchase", icon: <ShoppingCart size={20} /> },
    { name: "Sales", path: "/sales", icon: <TrendingUp size={20} /> },
  ];

  // If not logged in, show ONLY the login page
  if (!user) {
    return (
      <WorkshopContext.Provider value={{ ...AppProperties, user, setUser }}>
        <Toaster position="top-center" reverseOrder={false} />
        <LoginPage />
      </WorkshopContext.Provider>
    );
  }

  return (
    <WorkshopContext.Provider value={{ ...AppProperties, user, setUser, logout }}>
      <Toaster position="top-center" reverseOrder={false} />
      <ReloadPrompt />
      
      <div className="d-flex" style={{ height: "100vh", overflow: "hidden" }}>
        
        {/* MOBILE OVERLAY */}
        {isSidebarOpen && (
          <div className="sidebar-overlay mobile-only" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        {/* RESPONSIVE SIDEBAR */}
        <aside className={`sidebar-responsive p-3 text-white ${isSidebarOpen ? "open" : ""}`}>
          <div className="d-flex align-items-center justify-content-between mb-4 mt-2 px-2">
            <Link to="/" className="text-white text-decoration-none text-uppercase">
              <span className="fs-4 fw-bold">Hafiz <span className="text-success">JI</span></span>
            </Link>
            <button className="btn btn-dark mobile-only border-0 rounded-circle p-2" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="nav flex-column gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link-premium ${isActive ? "active" : ""}`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              );
            })}
          </div>

        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-grow-1 d-flex flex-column" style={{ overflow: "hidden" }}>
          
          {/* TOP HEADER */}
          <header className="bg-white border-bottom py-3 px-3 d-flex justify-content-between align-items-center sticky-top z-3">
            <div className="d-flex align-items-center gap-2">
              <button 
                className="btn btn-light mobile-only border-0 rounded-circle p-2 shadow-sm" 
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={22} className="text-dark" />
              </button>
              <h5 className="fw-bold m-0 text-dark">
                {navLinks.find(l => l.path === location.pathname)?.name || "Workshop"}
              </h5>
            </div>

            <div className="d-flex align-items-center gap-3">
               <div className="desktop-only text-end me-1">
                  <div className="fw-bold text-dark small" style={{ lineHeight: 1 }}>{user?.username}</div>
                  <small className="text-success fw-bold" style={{ fontSize: '0.65rem' }}>Authorized</small>
               </div>
               
               <div className="dropdown">
                  <div className="bg-light p-2 rounded-circle cursor-pointer border" data-bs-toggle="dropdown">
                     <UserCircle size={20} className="text-muted" />
                  </div>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0 p-2">
                     <li>
                        <div className="dropdown-item-text border-bottom mb-2 pb-2">
                           <div className="fw-bold small">{user?.username}</div>
                           <small className="text-muted text-uppercase" style={{ fontSize: '0.6rem' }}>{user?.role}</small>
                        </div>
                     </li>
                     <li>
                        <button className="dropdown-item text-danger fw-bold d-flex align-items-center gap-2 rounded" onClick={logout}>
                           <LogIn size={14} className="rotate-180" /> Logout
                        </button>
                     </li>
                  </ul>
               </div>
            </div>
          </header>

          {/* PAGE INNER CONTENT */}
          <div className="flex-grow-1 overflow-y-auto overflow-x-hidden px-2 py-3 p-md-4 bg-light">
            <div className="container-fluid p-0 pb-5 pb-md-0">
              <Outlet />
            </div>
          </div>

          {/* MOBILE BOTTOM NAVIGATION (Google Style) */}
          <nav className="mobile-only d-md-none bg-white border-top fixed-bottom d-flex justify-content-around py-2 shadow-lg" style={{ zIndex: 1060 }}>
            {bottomNavLinks.map(link => {
              const isActive = location.pathname === link.path;
              return (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  className={`d-flex flex-column align-items-center text-decoration-none transition-all ${isActive ? "text-success fw-bold" : "text-muted"}`}
                  style={{ fontSize: '0.75rem' }}
                >
                  <div className={`p-1 px-3 rounded-pill transition-all ${isActive ? "bg-success bg-opacity-10" : ""}`}>
                    {link.icon}
                  </div>
                  <span className="mt-1">{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </main>
      </div>
    </WorkshopContext.Provider>
  );
}

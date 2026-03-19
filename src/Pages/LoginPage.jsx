import React, { useState, useContext } from "react";
import { WorkshopContext } from "../Context";
import axios from "axios";
import toast from "react-hot-toast";
import { LogIn, Lock, User, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const { loca, setUser } = useContext(WorkshopContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter both credentials");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${loca}/auth/login`, { username, password });
      if (res.data.status === "success") {
        const userData = res.data.user;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        toast.success("Welcome back, " + userData.username);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error("Login error", err);
      toast.error("Connection error. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center bg-light" style={{ minHeight: "100vh" }}>
      <div className="card shadow-lg border-0 rounded-4 overflow-hidden" style={{ maxWidth: "400px", width: "100%" }}>
        <div className="bg-success py-4 text-center text-white">
          <div className="bg-white bg-opacity-25 rounded-circle d-inline-flex p-3 mb-3">
            <ShieldCheck size={40} />
          </div>
          <h3 className="fw-bold m-0 text-uppercase">Hafiz JI</h3>
          <p className="small opacity-75 m-0 text-uppercase">Management Terminal</p>
        </div>
        
        <div className="card-body p-4 p-md-5 bg-white">
          <h5 className="text-center fw-bold mb-4 text-dark">Authorized Personnel Only</h5>
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="form-label small fw-bold text-muted text-uppercase">Username</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><User size={18} className="text-muted" /></span>
                <input
                  type="text"
                  className="form-control border-0 bg-light py-2"
                  placeholder="Enter your ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-bold text-muted text-uppercase">Access Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><Lock size={18} className="text-muted" /></span>
                <input
                  type="password"
                  className="form-control border-0 bg-light py-2"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button className="btn btn-success w-100 fw-bold py-3 shadow-sm rounded-3 mt-2" disabled={loading}>
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2"></span>
              ) : (
                <LogIn size={20} className="me-2" />
              )}
              {loading ? "Authenticating..." : "Step Inside"}
            </button>
          </form>

          <div className="mt-5 text-center text-muted small">
            <p className="mb-0 fst-italic">“Helping the planet, one entry at a time.”</p>
          </div>
        </div>
      </div>
    </div>
  );
}

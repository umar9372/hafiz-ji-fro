import React, { useContext, useEffect, useState } from "react";
import { WorkshopContext } from "../Context";
import axios from "axios";
import { Search, Package, BarChart3, ArrowRight, Activity, RefreshCw, AlertTriangle, TrendingUp, History as HistoryIcon } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "../Components/ConfirmModal";
import InventoryHistoryModal from "../Components/InventoryHistoryModal";

export default function InventoryPage() {
  const [list, setList] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [materialHistory, setMaterialHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { loca } = useContext(WorkshopContext);

  const getInventory = () => {
    setLoading(true);
    axios
      .get(`${loca}/inventories`)
      .then((res) => {
        setList(res.data.data || []);
        setError("");
      })
      .catch((err) => {
        console.error("Error: ", err.message);
        setError(err.response?.data?.message || err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSync = () => {
    const toastId = toast.loading("Syncing inventory...");
    axios.post(`${loca}/inventories/sync`)
      .then(() => {
        toast.success("Sync complete!", { id: toastId });
        getInventory();
      })
      .catch(err => {
        toast.error("Sync failed: " + err.message, { id: toastId });
      });
  };

  const fetchMaterialHistory = async (materialId, materialName, materialNameHindi) => {
    setHistoryLoading(true);
    setSelectedMaterial(materialNameHindi ? `${materialName} (${materialNameHindi})` : materialName);
    try {
      const res = await axios.get(`${loca}/inventories/history?materialId=${materialId}`);
      setMaterialHistory(res.data.data || []);
      setShowHistoryModal(true);
    } catch (err) {
      toast.error("Could not fetch history: " + err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    getInventory();
  }, [loca]);

  // Calculate total warehouse worth
  const totalWorth = list.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.rate)), 0);

  const filteredList = list.filter(item => 
    (item.materialName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="warehouse-terminal-container">
      {/* PROFESSIONAL ASSET HEADER */}
      <div className="row g-4 mb-4 align-items-center">
        <div className="col-12 col-md-6">
          <div className="d-flex align-items-center gap-3 mb-2">
            <span className="badge bg-secondary bg-opacity-10 text-secondary px-2 py-1 rounded-1 fw-bold smaller tracking-widest text-uppercase">Operational Ledger</span>
            <span className="d-flex align-items-center gap-1 text-success fw-bold smaller">
              <Activity size={14} /> LIVE RECKONING
            </span>
          </div>
          <h2 className="fw-black text-slate-800 m-0 ls-tight">Asset Repository</h2>
          <p className="text-slate-500 small m-0 mt-1">Enterprise-grade inventory tracking and valuation terminal.</p>
        </div>
        
        <div className="col-12 col-md-6 text-md-end">
          <div className="d-inline-flex flex-column align-items-md-end p-3 bg-white shadow-sm rounded-4 border border-light">
            <div className="text-slate-400 smaller fw-black text-uppercase tracking-wider mb-1">Cumulative Portfolio Value</div>
            <div className="d-flex align-items-center gap-2">
              <h3 className="fw-black text-primary m-0 ls-tight">₹{totalWorth.toLocaleString('en-IN')}</h3>
              <div className="bg-success bg-opacity-10 p-2 rounded-circle text-success">
                <TrendingUp size={18} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI QUICK STATS */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="text-muted smaller fw-bold text-uppercase mb-2">Active SKUs</div>
            <div className="h4 fw-black text-dark m-0">{list.length}</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="text-muted smaller fw-bold text-uppercase mb-2">Total Bulk (kg)</div>
            <div className="h4 fw-black text-dark m-0">{list.reduce((s, i) => s + (parseFloat(i.quantity) || 0), 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="text-muted smaller fw-bold text-uppercase mb-2">Low Stock Alerts</div>
            <div className="h4 fw-black text-danger m-0">{list.filter(i => parseFloat(i.quantity) < 100).length}</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-primary text-white h-100">
            <div className="text-white text-opacity-75 smaller fw-bold text-uppercase mb-2">Liquidity Status</div>
            <div className="h4 fw-black m-0">HEALTHY</div>
          </div>
        </div>
      </div>

      {/* SEARCH & ACTIONS */}
      <div className="bg-white p-2 p-md-3 rounded-4 shadow-sm border border-light mb-4 d-flex flex-column flex-md-row gap-3">
        <div className="position-relative flex-grow-1">
          <Search className="position-absolute head-icon text-slate-300" size={18} style={{ left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            className="form-control border-0 bg-light bg-opacity-50 ps-5 py-2 py-md-3 rounded-3 fw-medium" 
            placeholder="Search material assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-secondary px-4 py-2 py-md-0 rounded-3 d-flex align-items-center justify-content-center gap-2 fw-bold text-uppercase smaller tracking-wide shadow-sm"
          onClick={() => setShowSyncConfirm(true)}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Sync Records
        </button>
      </div>

      {error ? (
        <div className="p-5 bg-white rounded-4 shadow-sm text-center border-0">
           <AlertTriangle size={48} className="text-danger mb-3 opacity-50" />
           <h4 className="fw-black text-slate-800">Connection Interrupted</h4>
           <p className="text-slate-500 mb-0">{error}</p>
        </div>
      ) : loading ? (
        <div className="text-center py-5">
           <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}></div>
           <h6 className="fw-bold text-slate-400 text-uppercase tracking-widest animate-pulse">Accessing Secure Vault...</h6>
        </div>
      ) : (
        <div className="row g-3">
          {/* DESKTOP HEADER (Hidden on mobile) */}
          <div className="col-12 d-none d-md-block">
            <div className="px-4 py-2 border-bottom d-flex align-items-center text-muted fw-bold smaller text-uppercase">
              <div style={{ width: '30%' }}>Asset Description</div>
              <div className="text-center" style={{ width: '20%' }}>Unit Valuation</div>
              <div className="text-center" style={{ width: '20%' }}>Current Balance</div>
              <div className="text-center" style={{ width: '20%' }}>Net Worth</div>
              <div className="text-end" style={{ width: '10%' }}>Actions</div>
            </div>
          </div>

          {filteredList.map((item) => {
            const weight = parseFloat(item.quantity) || 0;
            const rate = parseFloat(item.rate) || 0;
            const value = weight * rate;
            const isLowStock = weight < 100;
            
            return (
              <div key={item.materialId} className="col-12">
                <div 
                  className="bg-white p-3 p-md-4 rounded-4 shadow-sm border border-light transition-all hover-rise pointer"
                  onClick={() => fetchMaterialHistory(item.materialId, item.materialName, item.materialNameHindi)}
                >
                  <div className="row g-2 g-md-0 align-items-center">
                    {/* ASSET NAME */}
                    <div className="col-12 col-md-4 col-lg-3 mb-2 mb-md-0">
                      <div className="d-flex align-items-center gap-3">
                        <div className={`p-2 rounded-3 ${isLowStock ? 'bg-danger bg-opacity-10 text-danger' : 'bg-primary bg-opacity-10 text-primary'}`}>
                          <Package size={20} />
                        </div>
                        <div>
                          <h6 className="fw-black text-slate-900 m-0 text-capitalize">{item.materialName}</h6>
                          <div className="d-flex align-items-center gap-2">
                             <span className="text-slate-400 smaller fw-bold">{item.materialNameHindi || "General"}</span>
                             <span className="badge bg-light text-muted border px-2 py-0 fw-normal smaller">#{item.materialId}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* MARKET RATE */}
                    <div className="col-4 col-md-2 text-md-center">
                      <div className="d-md-none text-muted smaller tracking-wider text-uppercase fw-bold mb-1">Rate</div>
                      <div className="fw-bold text-slate-800">₹{rate.toLocaleString('en-IN')}</div>
                    </div>

                    {/* WEIGHT */}
                    <div className="col-4 col-md-2 text-md-center">
                      <div className="d-md-none text-muted smaller tracking-wider text-uppercase fw-bold mb-1">Balance</div>
                      <div className={`fw-black ${isLowStock ? 'text-danger' : 'text-slate-900'}`}>
                        {weight.toLocaleString()} <span className="small text-muted fw-medium">kg</span>
                      </div>
                      {isLowStock && <div className="smaller-xs text-danger fw-bold mt-1 d-none d-md-block">REPLENISH REQ.</div>}
                    </div>

                    {/* VALUATION */}
                    <div className="col-4 col-md-3 text-end text-md-center">
                      <div className="d-md-none text-muted smaller tracking-wider text-uppercase fw-bold mb-1">Worth</div>
                      <div className="fw-black text-primary">₹{Math.floor(value).toLocaleString('en-IN')}</div>
                    </div>

                    {/* AUDIT ICON */}
                    <div className="col-12 col-md-1 text-end d-none d-md-block">
                      <div className="bg-light p-2 rounded-circle text-slate-400 transition-all hover-primary">
                        <HistoryIcon size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredList.length === 0 && (
            <div className="col-12 text-center py-5 bg-white rounded-4 shadow-sm border border-dashed">
              <Package size={40} className="text-slate-200 mb-2" />
              <h6 className="fw-bold text-slate-400 m-0">NO MATCHING ASSETS FOUND</h6>
            </div>
          )}
        </div>
      )}

      {/* ANIMATION STYLES */}
      <style>{`
        .warehouse-terminal-container { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .hover-rise:hover { transform: translateY(-4px); box-shadow: 0 10px 20px -5px rgba(0,0,0,0.05) !important; border-color: var(--primary) !important; }
        .hover-primary:hover { background-color: var(--primary) !important; color: white !important; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
      `}</style>

      <ConfirmModal 
        isOpen={showSyncConfirm}
        onClose={() => setShowSyncConfirm(false)}
        onConfirm={handleSync}
        title="Administrative Re-Sync?"
        message="This action re-calculates the entire global ledger for this location. Proceed with audit synchronization?"
        type="warning"
      />

      <InventoryHistoryModal 
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={materialHistory}
        materialName={selectedMaterial}
      />
    </div>
  );
}

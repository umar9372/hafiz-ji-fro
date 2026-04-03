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
    <div className="warehouse-prime-dashboard">
      {/* PRIME ASSET HEADER */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-4 mb-5">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
             <div className="prime-accent-dot ripple-pulse"></div>
             <span className="text-secondary fw-black text-uppercase tracking-widest smaller">System Operational</span>
          </div>
          <h1 className="display-6 fw-black text-slate-900 tracking-tightest m-0">Warehouse Assets</h1>
          <p className="text-slate-400 fw-medium m-0">Institutional inventory management & real-time valuation.</p>
        </div>
        <div className="text-md-end w-100 w-md-auto">
           <div className="asset-pulse-box p-3 p-md-4 bg-white border-0 shadow-premium rounded-4 d-block d-md-inline-block">
              <div className="d-flex align-items-center justify-content-between justify-content-md-center gap-4">
                 <div className="text-start">
                    <div className="text-slate-400 smaller fw-black text-uppercase tracking-wider mb-1">Portfolio Value</div>
                    <div className="h2 fw-black text-indigo-600 m-0 ls-tight">₹{totalWorth.toLocaleString('en-IN')}</div>
                 </div>
                 <div className="bg-indigo-50 p-3 rounded-circle text-indigo-600">
                    <TrendingUp size={24} />
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* FILTER & SYNC ACTION BAR */}
      <div className="row g-3 mb-5">
         <div className="col-lg-8">
            <div className="search-box-premium position-relative h-100">
               <Search className="position-absolute head-icon text-slate-300" size={20} />
               <input 
                 type="text" 
                 className="form-control premium-input px-5 h-100 py-3 rounded-4 border-0 shadow-sm" 
                 placeholder="Search by asset name or material ID..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
         </div>
         <div className="col-lg-4">
            <button 
              className="btn btn-indigo w-100 h-100 rounded-4 shadow-indigo py-3 d-flex align-items-center justify-content-center gap-2 border-0"
              onClick={() => setShowSyncConfirm(true)}
            >
               <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
               <span className="fw-black text-uppercase tracking-wide smaller">Refresh Global Ledger</span>
            </button>
         </div>
      </div>

      {error ? (
        <div className="prime-error-state p-5 bg-white rounded-4 border-0 shadow-premium text-center">
           <AlertTriangle size={64} className="text-slate-200 mb-3" />
           <h3 className="fw-black text-slate-900">Synchronization Error</h3>
           <p className="text-slate-500 mb-0">{error}</p>
        </div>
      ) : loading ? (
        <div className="text-center py-5">
           <div className="prime-loader mx-auto mb-4"></div>
           <h5 className="fw-black text-slate-400 text-uppercase tracking-wider animate-pulse">Scanning Warehouse Modules...</h5>
        </div>
      ) : (
        <div className="row g-4">
           {filteredList.map((item) => {
              const weight = parseFloat(item.quantity) || 0;
              const rate = parseFloat(item.rate) || 0;
              const value = weight * rate;
              
              return (
                <div key={item.materialId} className="col-12" onClick={() => fetchMaterialHistory(item.materialId, item.materialName, item.materialNameHindi)}>
                    <div className="asset-card-horizontal bg-white p-3 p-md-4 rounded-4 shadow-premium border-0 position-relative overflow-hidden hover-rise pointer">
                       <div className="row g-3 align-items-center">
                          <div className="col-12 col-md-3 border-end-md pb-2 pb-md-0">
                             <div className="d-flex align-items-center gap-3">
                                <div className={`asset-status-indicator ${weight > 0 ? 'bg-success' : 'bg-slate-300'}`}></div>
                                <div>
                                   <h5 className="fw-black text-slate-900 m-0 text-capitalize ls-tight">{item.materialName}</h5>
                                   <div className="d-flex align-items-center gap-2">
                                      <span className="text-slate-400 smaller fw-bold">{item.materialNameHindi || "REGULAR"}</span>
                                      <span className="badge-prime px-2">ID_{item.materialId}</span>
                                   </div>
                                </div>
                             </div>
                          </div>
                          <div className="col-6 col-md-2 text-md-center border-end-md py-1 py-md-0">
                             <div className="text-slate-400 smaller fw-black text-uppercase tracking-wider mb-1">Market Rate</div>
                             <div className="fw-black text-slate-900 m-0">₹{rate.toLocaleString('en-IN')}</div>
                             <div className="smaller text-slate-300 fw-bold">Per Kilogram</div>
                          </div>
                          <div className="col-6 col-md-3 text-end text-md-center border-end-md py-1 py-md-0">
                             <div className="text-slate-400 smaller fw-black text-uppercase tracking-wider mb-1">Current Balance</div>
                             <div className="h4 fw-black text-slate-900 m-0 tracking-tightest">{weight.toLocaleString()} <small className="text-slate-400 fw-medium smaller">kg</small></div>
                          </div>
                          <div className="col-12 col-md-3 text-center text-md-center py-2 py-md-0 bg-light bg-opacity-10 rounded-3">
                             <div className="text-slate-400 smaller fw-black text-uppercase tracking-wider mb-1">Calculated Worth</div>
                             <div className="h4 fw-black text-indigo-600 m-0">₹{Math.floor(value).toLocaleString('en-IN')}</div>
                          </div>
                          <div className="col-12 col-md-1 text-end d-none d-md-block">
                             <div className="bg-slate-50 p-2 rounded-circle text-slate-400 d-inline-block hover-indigo transition-all">
                                <ArrowRight size={20} />
                             </div>
                          </div>
                       </div>
                    </div>
                </div>
              );
           })}
           {filteredList.length === 0 && (
             <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                <Package size={48} className="text-slate-100 mb-3" />
                <h5 className="fw-black text-slate-400">0 RECORDS DETECTED</h5>
             </div>
           )}
        </div>
      )}

      {/* LUXURY PRIME STYLE INJECTOR */}
      <style>{`
        .hover-lift:hover { 
          transform: translateY(-8px) scale(1.01); 
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important; 
        }
        
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
      `}</style>

      <ConfirmModal 
        isOpen={showSyncConfirm}
        onClose={() => setShowSyncConfirm(false)}
        onConfirm={handleSync}
        title="Refresh Inventory Assets?"
        message="This will re-calculate every material balance against your entire transaction history. This is an administrative process."
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

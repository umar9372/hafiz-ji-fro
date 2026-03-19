import React, { useContext, useEffect, useState } from "react";
import { WorkshopContext } from "../Context";
import axios from "axios";
import { Search } from "lucide-react";
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

  const fetchMaterialHistory = async (materialId, materialName) => {
    setHistoryLoading(true);
    setSelectedMaterial(materialName);
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
    <div className="container py-5 mt-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark m-0">Warehouse Inventory</h2>
          <p className="text-muted m-0 small">Real-time tracking of available stock</p>
        </div>
        <div className="d-flex align-items-center justify-content-between justify-content-md-end gap-3 p-3 bg-white rounded-3 shadow-sm border">
          <button 
            className="btn btn-outline-primary btn-sm fw-bold shadow-sm px-3"
            onClick={() => setShowSyncConfirm(true)}
          >
            🔄 Sync
          </button>
          <div className="text-end">
            <h6 className="text-muted m-0 small fw-bold">Estimated Value</h6>
            <h4 className="fw-bold text-success m-0">₹{totalWorth.toLocaleString(undefined, { minimumFractionDigits: 0 })}</h4>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="input-group shadow-sm" style={{ maxWidth: '400px' }}>
          <span className="input-group-text bg-white border-end-0">
            <Search size={18} className="text-muted" />
          </span>
          <input
            type="text"
            className="form-control border-start-0 ps-0"
            placeholder="Search material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger shadow-sm">
          <strong>Failed to load inventory:</strong> {error}
        </div>
      ) : loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
          <p className="mt-2 text-muted fw-bold">Scanning Warehouse...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="alert alert-warning text-center shadow-sm py-4">
          <h4 className="fw-bold">No Materials Found!</h4>
          <p className="m-0">No materials in the warehouse match your search choice.</p>
        </div>
      ) : (
        <div className="row g-4">
          {filteredList.map((item) => (
            <div key={item.materialId} className="col-12 col-md-6 col-lg-4" onClick={() => fetchMaterialHistory(item.materialId, item.materialName)}>
              <div className="card shadow-sm h-100 border-0 border-start border-4 border-primary hover-scale cursor-pointer" style={{ transition: "transform 0.2s" }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title fw-bold m-0 text-primary fs-4 text-capitalize">
                      {item.materialName}
                    </h5>
                    <span className="badge bg-light text-dark shadow-sm">ID: {item.materialId}</span>
                  </div>
                  
                  <div className="d-flex align-items-end justify-content-between mt-4">
                    <div>
                      <h6 className="text-muted m-0 fw-bold">Stock Weight</h6>
                      <h2 className="fw-bold m-0 text-dark">{item.quantity} <span className="fs-6 text-muted">kg</span></h2>
                    </div>
                    <div className="text-end">
                      <h6 className="text-muted m-0 fw-bold">Market Rate</h6>
                      <h4 className="fw-bold m-0 text-success">₹{item.rate} <span className="fs-6 text-muted">/kg</span></h4>
                    </div>
                  </div>
                  
                  <hr className="my-2 text-muted" />
                  
                  <div className="d-flex justify-content-between align-items-center text-muted fs-6 mb-2">
                    <small>Worth: <strong className="text-dark">₹{(parseFloat(item.quantity) * parseFloat(item.rate)).toFixed(2)}</strong></small>
                    <small>Updated: {item.updatedAt !== "N/A" ? new Date(item.updatedAt).toLocaleDateString() : "Never"}</small>
                  </div>

                  <div className="text-center pt-2 border-top">
                    <span className="text-primary small fw-bold d-flex align-items-center justify-content-center gap-1">
                      {historyLoading && selectedMaterial === item.materialName ? (
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                      ) : (
                        <>📜 View Registry</>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Adding some simple CSS for hover effect */}
      <style>{`
        .hover-scale:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
      `}</style>
      <ConfirmModal 
        isOpen={showSyncConfirm}
        onClose={() => setShowSyncConfirm(false)}
        onConfirm={handleSync}
        title="Recalculate Stock?"
        message="This will update all inventory levels based on your entire purchase and sales history. It may take a moment."
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

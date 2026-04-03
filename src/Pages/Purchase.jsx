import React, { useState, useEffect, useContext } from "react";
import { Receipt, Trash2, PlusCircle, CheckCircle } from "lucide-react";
import axios from "axios";
import { WorkshopContext } from "../Context";
import toast from "react-hot-toast";
import ConfirmModal from "../Components/ConfirmModal";
import { useLocation, useNavigate } from "react-router-dom";

function Purchase() {
  const { loca, user } = useContext(WorkshopContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierDetails, setSupplierDetails] = useState(null);
  const [materialsData, setMaterialsData] = useState([]);

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [recordMonth, setRecordMonth] = useState(currentMonthStr);
  const [deleteId, setDeleteId] = useState(null);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);

  useEffect(() => {
    fetchSuppliers();
    fetchPurchases();

    // Check for URL params
    const params = new URLSearchParams(location.search);
    const urlId = params.get("id");
    const urlMonth = params.get("month");

    if (urlMonth) setRecordMonth(urlMonth);
    if (urlId) {
      setSelectedSupplierId(urlId);
    }
  }, [location]);

  useEffect(() => {
    if (selectedSupplierId) {
      loadSupplierDetails(selectedSupplierId, recordMonth);
    }
  }, [selectedSupplierId, recordMonth]);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${loca}/suppliers`);
      setSuppliers(res.data.data);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };

  const fetchPurchases = async () => {
    try {
      const res = await axios.get(`${loca}/purchases`);
      setPurchases(res.data.data);
    } catch (err) {
      console.error("Error fetching purchases:", err);
    }
  };

  const loadSupplierDetails = async (sId, month) => {
    try {
      const res = await axios.get(`${loca}/suppliers/${sId}/details?month=${month}&mappedOnly=true`);
      setSupplierDetails(res.data);

      const mapped = res.data.materials.map(m => {
          const initialRate = m.smartRate || m.customRate || m.defaultRate;
          return {
            ...m,
            inputWeight: "",
            inputRate: initialRate,
            isSubmitting: false
          };
        });
      setMaterialsData(mapped);
    } catch (err) {
      console.error("Error fetching supplier details:", err);
    }
  };

  const formatMonthName = (monthStr) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-");
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const handleSupplierChange = (e) => {
    setSelectedSupplierId(e.target.value);
  };

  const handleRowChange = (materialId, field, value) => {
    setMaterialsData(prev => prev.map(m => {
      if (m.materialId === materialId) {
        return { ...m, [field]: value };
      }
      return m;
    }));
  };

  const handleSubmitRow = async (m) => {
    if (!m.inputWeight || m.inputWeight <= 0) return;

    setMaterialsData(prev => prev.map(item => item.materialId === m.materialId ? { ...item, isSubmitting: true } : item));

    try {
      const payload = {
        supplierId: parseInt(selectedSupplierId),
        materialId: parseInt(m.materialId),
        weight: parseFloat(m.inputWeight),
        rate: parseFloat(m.inputRate),
        recordMonth: recordMonth,
        userName: user?.username || "system"
      };

      await axios.post(`${loca}/purchases`, payload, {
        headers: { "Content-Type": "application/json" }
      });

      toast.success(`Recorded ${m.inputWeight}kg for ${m.materialName}`);
      
      setMaterialsData(prev => prev.map(item => {
        if (item.materialId === m.materialId) {
          return { ...item, inputWeight: "", isSubmitting: false };
        }
        return item;
      }));

      fetchPurchases();
    } catch (err) {
      toast.error("Error: " + (err.response?.data?.message || err.message));
      setMaterialsData(prev => prev.map(item => item.materialId === m.materialId ? { ...item, isSubmitting: false } : item));
    }
  };

  const handleConfirmAll = async () => {
    const itemsToSubmit = materialsData.filter(m => m.inputWeight && m.inputWeight > 0);
    if (itemsToSubmit.length === 0) return;

    setIsSubmittingAll(true);
    const toastId = toast.loading(`Uploading ${itemsToSubmit.length} items...`);

    try {
      const payload = itemsToSubmit.map(m => ({
        supplierId: parseInt(selectedSupplierId),
        materialId: parseInt(m.materialId),
        weight: parseFloat(m.inputWeight),
        rate: parseFloat(m.inputRate),
        recordMonth: recordMonth,
        userName: user?.username || "system"
      }));

      await axios.post(`${loca}/purchases/bulk`, payload);
      
      toast.success(`Succesfully added ${itemsToSubmit.length} items!`, { id: toastId });
      
      setMaterialsData(prev => prev.map(item => ({ ...item, inputWeight: "" })));
      fetchPurchases();
    } catch (err) {
      toast.error("Bulk upload failed: " + (err.response?.data?.message || err.message), { id: toastId });
    } finally {
      setIsSubmittingAll(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${loca}/purchases/${deleteId}`);
      toast.success("Record deleted successfully.");
      fetchPurchases();
    } catch (err) {
      toast.error("Error deleting record: " + (err.response?.data?.message || err.message));
    } finally {
      setDeleteId(null);
    }
  };

  const handleDeleteRecord = (purchaseId) => {
    setDeleteId(purchaseId);
  };

  const supplierPurchases = purchases.filter(p => p.supplierId?.toString() === selectedSupplierId?.toString());
  const monthsInHistory = [...new Set(supplierPurchases.map(p => p.recordMonth))].sort().reverse();

  return (
    <div className="container py-4 mt-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-danger">Inventory Intake logs</h2>
          <small className="text-muted">Register material receipts from suppliers</small>
        </div>
        <div className="d-flex align-items-center gap-2">
          <label className="fw-bold text-muted small">Billing Month:</label>
          <input
            type="month"
            className="form-control border-danger fw-bold"
            value={recordMonth}
            onChange={(e) => setRecordMonth(e.target.value)}
          />
        </div>
      </div>

      {/* SUPPLIER SELECTION */}
      <div className="card shadow-sm mb-4 border-0 border-top border-4 border-danger">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-5">
              <label className="form-label fw-bold text-muted small text-uppercase">Supplier / Vendor Account</label>
              <select className="form-select border-danger bg-light fw-bold" value={selectedSupplierId} onChange={handleSupplierChange}>
                <option value="">-- Select Active Account --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {supplierDetails && (
              <div className="col-md-7 border-start ps-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="fw-bold m-0">{supplierDetails.supplierName}</h5>
                    <small className="text-muted d-block">{supplierDetails.address || "No Address"}</small>
                    <small className="badge bg-light text-dark border mt-1">{supplierDetails.mobile || "No Contact"}</small>
                  </div>
                  <div className="text-end">
                    <small className="text-muted d-block">Monthly Total</small>
                    <h4 className="fw-bold text-danger m-0">₹{supplierPurchases.filter(p => p.recordMonth === recordMonth).reduce((a, c) => a + c.amount, 0).toLocaleString()}</h4>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedSupplierId && (
        <div className="row g-4">
          {/* ADD ENTRIES SECTION */}
          <div className="col-12">
            <div className="card shadow border-0 overflow-hidden">
              <div className="card-header bg-dark text-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="m-0 fw-bold d-flex align-items-center gap-2">
                  <PlusCircle size={20} /> Register Loads
                </h5>
                <div className="d-flex align-items-center gap-3">
                    {materialsData.some(m => m.inputWeight > 0) && (
                        <button 
                          className="btn btn-warning btn-sm fw-bold px-3 shadow-sm border-white"
                          onClick={handleConfirmAll}
                          disabled={isSubmittingAll}
                        >
                          {isSubmittingAll ? "Saving..." : "Confirm All Entries"}
                        </button>
                    )}
                    <span className="badge bg-danger px-3">{formatMonthName(recordMonth)}</span>
                </div>
              </div>

              {/* DESKTOP TABLE VIEW */}
              <div className="table-responsive desktop-only">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr className="small text-uppercase text-muted">
                      <th className="ps-4" style={{ width: "25%" }}>Material</th>
                      <th style={{ width: "20%" }}>Weight (kg)</th>
                      <th style={{ width: "20%" }}>Rate (₹/kg)</th>
                      <th className="text-end" style={{ width: "20%" }}>Subtotal</th>
                      <th className="text-center" style={{ width: "15%" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialsData.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-4 text-muted">No materials available.</td></tr>
                    ) : (
                      materialsData.map(m => {
                        const totalCost = (parseFloat(m.inputWeight || 0) * parseFloat(m.inputRate || 0)).toFixed(2);
                        const hasWeight = m.inputWeight && m.inputWeight > 0;
                        return (
                          <tr key={m.materialId} className={hasWeight ? "table-danger bg-opacity-10" : ""}>
                            <td className="ps-4 fw-bold text-dark text-capitalize">
                              <div>{m.materialName}</div>
                              {m.materialNameHindi && <div className="text-secondary small fw-normal">{m.materialNameHindi}</div>}
                              <div style={{ fontSize: "0.7rem" }} className="text-muted fw-normal">Smart Rate: ₹{m.inputRate}</div>
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm fw-bold border-danger"
                                value={m.inputWeight}
                                onChange={(e) => handleRowChange(m.materialId, "inputWeight", e.target.value)}
                                placeholder="0.00"
                              />
                            </td>
                            <td>
                              <div className="input-group input-group-sm">
                                <span className="input-group-text bg-white opacity-50">₹</span>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={m.inputRate}
                                  onChange={(e) => handleRowChange(m.materialId, "inputRate", e.target.value)}
                                />
                              </div>
                            </td>
                            <td className="text-end fw-bold text-danger">₹{totalCost}</td>
                            <td className="text-center">
                              <button
                                className={`btn btn-sm w-75 fw-bold shadow-sm ${hasWeight ? "btn-danger" : "btn-light text-muted border"}`}
                                disabled={!hasWeight || m.isSubmitting}
                                onClick={() => handleSubmitRow(m)}
                              >
                                {m.isSubmitting ? "..." : "Add"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD VIEW */}
              <div className="mobile-only p-2 bg-light">
                {materialsData.map(m => {
                  const totalCost = (parseFloat(m.inputWeight || 0) * parseFloat(m.inputRate || 0)).toFixed(2);
                  const hasWeight = m.inputWeight && m.inputWeight > 0;
                  return (
                    <div key={m.materialId} className="mobile-card-entry">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="fw-bold text-dark text-capitalize m-0">{m.materialName}</h6>
                        {m.materialNameHindi && <span className="text-secondary small">{m.materialNameHindi}</span>}
                      </div>
                      <div className="row g-2 align-items-center mb-1">
                         <div className="col-4">
                            <label className="small text-muted mb-1 d-block">Weight</label>
                            <input 
                              type="number" 
                              className="form-control form-control-sm fw-bold border-danger" 
                              placeholder="0.0"
                              value={m.inputWeight || ""}
                              onChange={(e) => handleRowChange(m.materialId, "inputWeight", e.target.value)}
                            />
                         </div>
                         <div className="col-4">
                            <label className="small text-muted mb-1 d-block">Rate</label>
                            <input 
                              type="number" 
                              className="form-control form-control-sm fw-bold border-danger" 
                              placeholder="0.0"
                              value={m.inputRate || ""}
                              onChange={(e) => handleRowChange(m.materialId, "inputRate", e.target.value)}
                            />
                         </div>
                         <div className="col-4">
                            <label className="small text-muted mb-1 d-block text-end">Amount</label>
                            <div className="h6 fw-bold text-danger mb-0 mt-1 text-end">₹{totalCost}</div>
                         </div>
                      </div>

                      <button 
                        className={`btn w-100 fw-bold py-2 ${hasWeight ? "btn-danger shadow" : "btn-light border text-muted"}`}
                        disabled={!hasWeight || m.isSubmitting}
                        onClick={() => handleSubmitRow(m)}
                      >
                         {m.isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <PlusCircle size={18} className="me-2"/>}
                         {hasWeight ? "Confirm Intake" : "Enter Weight"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* MONTHLY SUMMARY CARD (Compact) */}
          <div className="col-12">
            <div className="card shadow-sm border-0 border-start border-4 border-danger">
                <div className="card-body py-3 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="m-0 fw-bold text-muted small uppercase">Quick Summary - {formatMonthName(recordMonth)}</h6>
                        <small className="text-muted">Currently viewing all recorded logs for this supplier and month</small>
                    </div>
                    <div className="text-end">
                        <button className="btn btn-dark btn-sm fw-bold px-4" onClick={() => navigate(`/bill-details/purchase/${selectedSupplierId}/${recordMonth}`)}>
                            <Receipt size={16} className="me-2" /> View & Print Complete Bill
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* ITEMIZED BREAKDOWN (History) */}
      {selectedSupplierId && (
        <div className="card shadow border-0 mt-4 mb-5 overflow-hidden">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="m-0 fw-bold text-dark text-uppercase small">Recent Records for {formatMonthName(recordMonth)}</h6>
            </div>
            
            {/* DESKTOP TABLE */}
            <div className="table-responsive desktop-only">
                <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small text-uppercase text-muted">
                        <tr>
                            <th className="ps-4" style={{width: '20%'}}>Date</th>
                            <th style={{width: '25%'}}>Material</th>
                            <th className="text-center" style={{width: '15%'}}>Weight</th>
                            <th className="text-end" style={{width: '20%'}}>Amount</th>
                            <th className="text-center" style={{width: '10%'}}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            const filtered = supplierPurchases.filter(p => p.recordMonth === recordMonth);
                            if (filtered.length === 0) return <tr><td colSpan="5" className="text-center py-4 text-muted">No records found.</td></tr>;
                            return filtered.map((p, idx) => (
                                <tr key={idx}>
                                    <td className="ps-4">
                                        <div className="fw-bold text-dark small">{new Date(p.purchaseDate).toLocaleDateString()}</div>
                                        <small className="text-muted">ID: #{p.id}</small>
                                    </td>
                                    <td>
                                        <div className="badge bg-light text-dark border fw-bold text-capitalize px-3">
                                            {p.materialName}
                                            {p.materialNameHindi && <div className="text-secondary x-small fw-normal">{p.materialNameHindi}</div>}
                                        </div>
                                    </td>
                                    <td className="text-center fw-bold text-danger">{p.weight.toFixed(2)} kg</td>
                                    <td className="text-end fw-bold text-dark">₹{p.amount.toLocaleString()}</td>
                                    <td className="text-center">
                                        <button className="btn btn-sm btn-outline-danger border-0 rounded-circle" onClick={() => handleDeleteRecord(p.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ));
                        })()}
                    </tbody>
                </table>
            </div>

            {/* MOBILE LIST */}
            <div className="mobile-only">
                {(() => {
                    const filtered = supplierPurchases.filter(p => p.recordMonth === recordMonth);
                    if (filtered.length === 0) return <div className="p-4 text-center text-muted">No logs recorded.</div>;
                    return filtered.map((p, idx) => (
                        <div key={idx} className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white shadow-sm mb-1">
                            <div>
                                <div className="fw-bold text-dark text-capitalize">
                                    {p.materialName} {p.materialNameHindi && <span className="text-secondary small ms-1">({p.materialNameHindi})</span>}
                                </div>
                                <div className="text-danger fw-bold small">₹{p.amount.toLocaleString()}</div>
                            </div>
                            <div className="text-end">
                                <div className="fw-bold text-dark mb-1">{p.weight.toFixed(2)} kg</div>
                                <button className="btn btn-sm btn-outline-danger border-0 p-1" onClick={() => handleDeleteRecord(p.id)}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ));
                })()}
            </div>
        </div>
      )}

      {/* GLOBAL VIEW SUMMARY */}
      {!selectedSupplierId && (
        <div className="card shadow-sm border-0 mt-2">
          <div className="card-header bg-dark text-white py-3">
            <h6 className="m-0 fw-bold">Recent Multi-Item Receipts</h6>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-uppercase text-muted">
                <tr>
                  <th className="ps-4">Period</th>
                  <th>Supplier / Vendor</th>
                  <th className="text-center">Total Net Weight</th>
                  <th className="text-end pe-4">Statement Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(purchases.reduce((acc, p) => {
                  const key = `${p.recordMonth}-${p.supplierName}`;
                  if (!acc[key]) acc[key] = { month: p.recordMonth, name: p.supplierName, weight: 0, amount: 0, id: p.supplierId };
                  acc[key].weight += p.weight;
                  acc[key].amount += p.amount;
                  return acc;
                }, {})).sort((a, b) => b.month.localeCompare(a.month)).map((bill, idx) => (
                  <tr key={idx} className="cursor-pointer" onClick={() => navigate(`/bill-details/purchase/${bill.id}/${bill.month}`)} title="Click to view full voucher">
                    <td className="ps-4"><span className="badge bg-light text-dark border rounded-pill">{formatMonthName(bill.month)}</span></td>
                    <td className="fw-bold text-dark">{bill.name}</td>
                    <td className="text-center fw-bold">{bill.weight.toFixed(2)} kg</td>
                    <td className="text-end pe-4 fw-bold text-danger">₹{bill.amount.toLocaleString()}</td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr><td colSpan="4" className="text-center py-5 text-muted fst-italic">No receipts found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Record?"
        message="Are you sure you want to permanently remove this purchase entry? This cannot be undone."
        type="danger"
      />
    </div>
  );
}

export default Purchase;

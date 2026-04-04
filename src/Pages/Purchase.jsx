import React, { useState, useEffect, useContext } from "react";
import { Receipt, Trash2, PlusCircle, CheckCircle, Image as ImageIcon, Paperclip, Eye } from "lucide-react";
import axios from "axios";
import { WorkshopContext } from "../Context";
import toast from "react-hot-toast";
import ConfirmModal from "../Components/ConfirmModal";
import MediaModal from "../Components/MediaModal";
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
  const [transactionId, setTransactionId] = useState(crypto.randomUUID());
  const [batchFiles, setBatchFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingTransactionId, setViewingTransactionId] = useState(null);
  const [showMediaModal, setShowMediaModal] = useState(false);

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

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(file => formData.append("files", file));
    formData.append("transactionId", transactionId);
    formData.append("type", "PURCHASE");

    setIsUploading(true);
    const toastId = toast.loading(`Uploading ${files.length} images...`);
    try {
      const res = await axios.post(`${loca}/files/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setBatchFiles(prev => [...prev, ...res.data.fileNames]);
      toast.success("Media attached successfully", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Upload failed", { id: toastId });
    } finally {
      setIsUploading(false);
    }
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
        userName: user?.username || "system",
        transactionId: transactionId
      };

      await axios.post(`${loca}/purchases`, payload);

      toast.success(`Recorded ${m.inputWeight}kg for ${m.materialName}`);

      setMaterialsData(prev => prev.map(item => {
        if (item.materialId === m.materialId) {
          return { ...item, inputWeight: "", isSubmitting: false };
        }
        return item;
      }));

      // After single submit, if they want each row to be a transaction, we'd reset UUID.
      // But usually they can keep adding to same load. Let's keep it same for now.
      // Resetting only after manual clear or confirm all might be better.

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
        userName: user?.username || "system",
        transactionId: transactionId
      }));

      await axios.post(`${loca}/purchases/bulk`, payload);

      toast.success(`Succesfully added ${itemsToSubmit.length} items!`, { id: toastId });

      setMaterialsData(prev => prev.map(item => ({ ...item, inputWeight: "" })));
      setBatchFiles([]);
      setTransactionId(crypto.randomUUID());
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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold m-0 text-danger">Inventory Intake Logs</h2>
          <small className="text-muted">Register material receipts from suppliers</small>
        </div>
        <div className="d-flex align-items-center gap-2 bg-white px-3 py-2 rounded-4 shadow-sm border border-danger border-opacity-10">
          <label className="fw-bold text-muted small text-nowrap">Billing Month:</label>
          <input
            type="month"
            className="form-control border-0 bg-transparent fw-bold p-0"
            style={{ width: '130px', boxShadow: 'none' }}
            value={recordMonth}
            onChange={(e) => setRecordMonth(e.target.value)}
          />
        </div>
      </div>

      {/* SUPPLIER SELECTION */}
      <div className="card shadow-sm mb-4 border-0 border-top border-4 border-danger">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-5 mb-3 mb-md-0">
              <label className="form-label fw-bold text-muted small text-uppercase">Supplier / Vendor Account</label>
              <select className="form-select border-danger bg-light fw-bold py-2" value={selectedSupplierId} onChange={handleSupplierChange}>
                <option value="">-- Select Active Account --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {supplierDetails && (
              <div className="col-md-7 border-start-md ps-md-4">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-start gap-3">
                  <div>
                    <h5 className="fw-bold m-0">{supplierDetails.supplierName}</h5>
                    <small className="text-muted d-block">{supplierDetails.address || "No Address"}</small>
                    <small className="badge bg-light text-dark border mt-1">{supplierDetails.mobile || "No Contact"}</small>
                  </div>
                  <div className="text-sm-end bg-danger bg-opacity-10 p-2 rounded-3">
                    <small className="text-muted d-block smaller">Monthly Total</small>
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
                      <th className="ps-4" style={{ width: "30%" }}>Material</th>
                      <th style={{ width: "25%" }}>Weight (kg)</th>
                      <th style={{ width: "25%" }}>Rate (₹/kg)</th>
                      <th className="text-end" style={{ width: "20%" }}>Subtotal</th>
                      <th className="text-center" style={{ width: "15%" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialsData.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-4 text-muted">No materials available.</td></tr>
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

              {/* BATCH MEDIA SECTION */}
              <div className="bg-light p-3 border-top d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                  <label className="btn btn-outline-dark btn-sm fw-bold px-3 d-flex align-items-center gap-2">
                    <input type="file" multiple hidden accept="image/*" onChange={handleFileUpload} />
                    <Paperclip size={16} /> Attach Media (Receipts / Photos)
                  </label>
                  <div className="d-flex gap-2">
                    {batchFiles.map((f, i) => (
                      <div key={i} className="position-relative">
                        <img src={`${loca}/uploads/${f}`} alt="proof" className="rounded shadow-sm border" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success p-1">
                          <CheckCircle size={8} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {batchFiles.length > 0 && <small className="text-success fw-bold">{batchFiles.length} files attached to this load</small>}
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
                        {m.isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <PlusCircle size={18} className="me-2" />}
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
            {supplierPurchases.filter(p => p.recordMonth === recordMonth && p.transactionId).length > 0 && (
              <button
                onClick={() => {
                  const ids = [...new Set(supplierPurchases.filter(p => p.recordMonth === recordMonth).map(p => p.transactionId).filter(Boolean))];
                  setViewingTransactionId(ids);
                  setShowMediaModal(true);
                }}
                className="btn btn-sm btn-primary d-flex align-items-center gap-2 px-3 fw-bold shadow-sm"
              >
                <ImageIcon size={16} /> View All Media
              </button>
            )}
          </div>

          {/* DESKTOP TABLE */}
          <div className="table-responsive desktop-only">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-uppercase text-muted">
                <tr className="smaller text-uppercase fw-bold bg-light">
                  <th className="ps-4 py-3" style={{ width: '90px' }}>Date</th>
                  <th className="py-3">Strategic Material</th>
                  <th className="text-center py-3" style={{ width: '120px' }}>Weight (kg)</th>
                  <th className="text-end py-3" style={{ width: '150px' }}>Amount</th>
                  <th className="text-center py-3" style={{ width: '110px' }}>Status</th>
                  <th className="text-center py-3" style={{ width: '60px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filtered = supplierPurchases.filter(p => p.recordMonth === recordMonth);
                  if (filtered.length === 0) return <tr><td colSpan="6" className="text-center py-4 text-muted">No records found.</td></tr>;
                  return filtered.map((p, idx) => (
                    <tr key={idx}>
                      <td className="ps-4 py-2">
                        <div className="fw-bold text-dark smaller">{new Date(p.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                        <small className="text-muted smaller opacity-75">ID: #{p.id}</small>
                      </td>
                      <td className="py-2">
                        <div className="fw-bold text-dark text-capitalize smaller mb-0 lh-1">{p.materialName}</div>
                        {p.materialNameHindi && <small className="text-muted smaller lh-1">{p.materialNameHindi}</small>}
                      </td>
                      <td className="text-center py-2 fw-bold text-danger smaller">{p.weight.toFixed(2)} <span className="opacity-50 smaller">kg</span></td>
                      <td className="text-end py-2 fw-bold text-dark smaller">₹{p.amount.toLocaleString()}</td>
                      <td className="text-center py-2">
                        <span className={`badge rounded-pill smaller tracking-tighter ${p.status === 'PAID' ? 'bg-soft-success text-success border border-success border-opacity-25' : p.status === 'PARTIAL' ? 'bg-soft-warning text-warning border border-warning border-opacity-25' : 'bg-soft-danger text-danger border border-danger border-opacity-25'}`} style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem' }}>
                          {p.status || "PENDING"}
                        </span>
                      </td>
                      <td className="text-center py-2">
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
          <div className="mobile-only bg-light">
            {(() => {
              const filtered = supplierPurchases.filter(p => p.recordMonth === recordMonth);
              if (filtered.length === 0) return <div className="p-4 text-center text-muted">No logs recorded.</div>;
              return filtered.map((p, idx) => (
                <div key={idx} className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white mb-1">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-black text-dark text-uppercase smaller tracking-tight">{p.materialName}</span>
                      <span className={`badge rounded-pill tracking-tighter ${p.status === 'PAID' ? 'bg-soft-success text-success' : p.status === 'PARTIAL' ? 'bg-soft-warning text-warning' : 'bg-soft-danger text-danger'}`} style={{ fontSize: '0.6rem', padding: '0.2rem 0.4rem' }}>
                        {p.status || "PENDING"}
                      </span>
                    </div>
                    <div className="smaller text-muted lh-1 mb-1">{p.materialNameHindi}</div>
                    <div className="smaller text-secondary opacity-75">{new Date(p.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • ID: #{p.id}</div>
                  </div>
                  <div className="text-end">
                    <div className="fw-black text-danger smaller mb-0 lh-1">{p.weight.toFixed(2)} kg</div>
                    <div className="fw-bold text-dark smaller mb-2">₹{p.amount.toLocaleString()}</div>
                    <button className="btn btn-sm btn-outline-danger border-0 p-1 rounded-circle" onClick={() => handleDeleteRecord(p.id)}>
                      <Trash2 size={16} />
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
          <div className="table-responsive border-0">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-uppercase fw-bold text-muted bg-light">
                <tr className="bg-light">
                  <th className="ps-4 py-3" style={{ width: '15%' }}>Period</th>
                  <th className="py-3" style={{ width: '35%' }}>Supplier Partner</th>
                  <th className="text-center py-3" style={{ width: '20%' }}>Weight</th>
                  <th className="text-center py-3" style={{ width: '15%' }}>Status</th>
                  <th className="text-end pe-4 py-3" style={{ width: '15%' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(purchases.reduce((acc, p) => {
                  const key = `${p.recordMonth}-${p.supplierName}`;
                  const status = (p.status || "PENDING").toUpperCase();
                  if (!acc[key]) {
                    acc[key] = { month: p.recordMonth, name: p.supplierName, weight: 0, amount: 0, id: p.supplierId, statuses: [] };
                  }
                  acc[key].weight += p.weight;
                  acc[key].amount += p.amount;
                  acc[key].statuses.push(status);
                  return acc;
                }, {})).map(bill => {
                  const unique = [...new Set(bill.statuses)];
                  let finalStatus = "PENDING";
                  if (unique.length === 1 && unique[0] === "PAID") finalStatus = "PAID";
                  else if (unique.includes("PAID") || unique.includes("PARTIAL")) finalStatus = "PARTIAL";
                  return { ...bill, finalStatus };
                }).sort((a, b) => b.month.localeCompare(a.month)).map((bill, idx) => (
                  <tr key={idx} className="cursor-pointer border-bottom border-light" onClick={() => navigate(`/bill-details/purchase/${bill.id}/${bill.month}`)} title="Click to view full voucher">
                    <td className="ps-4 py-3"><span className="badge bg-light text-dark border rounded-pill">{formatMonthName(bill.month)}</span></td>
                    <td className="fw-bold text-dark py-3">{bill.name}</td>
                    <td className="text-center fw-bold text-secondary py-3">{bill.weight.toFixed(2)} kg</td>
                    <td className="text-center py-3">
                      <span className={`badge rounded-pill smaller px-3 py-2 fw-bold ${bill.finalStatus === 'PAID' ? 'bg-soft-success text-success' : bill.finalStatus === 'PARTIAL' ? 'bg-soft-warning text-warning' : 'bg-soft-danger text-danger'}`}>
                        {bill.finalStatus}
                      </span>
                    </td>
                    <td className="text-end pe-4 fw-bold text-danger py-3 fs-6">₹{bill.amount.toLocaleString()}</td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr><td colSpan="5" className="text-center py-5 text-muted fst-italic">No receipts found</td></tr>
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
      <style>{`
          .smaller { font-size: 0.75rem !important; }
          .bg-soft-success { background-color: #dcfce7; }
          .bg-soft-warning { background-color: #fef9c3; }
          .bg-soft-danger { background-color: #fee2e2; }
      `}</style>
      <MediaModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        transactionId={viewingTransactionId}
        loca={loca}
      />
    </div>
  );
}

export default Purchase;

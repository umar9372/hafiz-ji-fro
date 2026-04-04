import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { WorkshopContext } from "../Context";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ConfirmModal from "../Components/ConfirmModal";
import MediaModal from "../Components/MediaModal";
import { Receipt, Trash2, PlusCircle, CheckCircle, Image as ImageIcon, Paperclip, Eye } from "lucide-react";

function Sales() {
  const { loca, user } = useContext(WorkshopContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [vendorDetails, setVendorDetails] = useState(null);
  const [materialsData, setMaterialsData] = useState([]);

  const [sales, setSales] = useState([]);
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
    fetchVendors();
    fetchSales();

    // Check for URL params
    const params = new URLSearchParams(location.search);
    const urlId = params.get("id");
    const urlMonth = params.get("month");

    if (urlMonth) setRecordMonth(urlMonth);
    if (urlId) {
      setSelectedVendorId(urlId);
    }
  }, [location]);

  useEffect(() => {
    if (selectedVendorId) {
      loadVendorDetails(selectedVendorId, recordMonth);
    }
  }, [selectedVendorId, recordMonth]);

  const fetchVendors = async () => {
    try {
      const res = await axios.get(`${loca}/vendors`);
      setVendors(res.data.data);
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await axios.get(`${loca}/sales`);
      setSales(res.data.data);
    } catch (err) {
      console.error("Error fetching sales:", err);
    }
  };

  const loadVendorDetails = async (vId, month) => {
    try {
      const res = await axios.get(`${loca}/vendors/${vId}/details?month=${month}&mappedOnly=true`);
      setVendorDetails(res.data);

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
      console.error("Error fetching vendor details:", err);
    }
  };

  const formatMonthName = (monthStr) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-");
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const handleVendorChange = (e) => {
    setSelectedVendorId(e.target.value);
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
    formData.append("type", "SALE");

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
        vendorId: parseInt(selectedVendorId),
        materialId: parseInt(m.materialId),
        weight: parseFloat(m.inputWeight),
        rate: parseFloat(m.inputRate),
        recordMonth: recordMonth,
        userName: user?.username || "system",
        transactionId: transactionId
      };

      await axios.post(`${loca}/sales`, payload);

      toast.success(`Sold ${m.inputWeight}kg of ${m.materialName}`);

      setMaterialsData(prev => prev.map(item => {
        if (item.materialId === m.materialId) {
          return { ...item, inputWeight: "", isSubmitting: false };
        }
        return item;
      }));

      fetchSales();
    } catch (err) {
      const errBody = err.response?.data?.message || err.response?.data || err.message;
      toast.error("Error: " + errBody);
      setMaterialsData(prev => prev.map(item => item.materialId === m.materialId ? { ...item, isSubmitting: false } : item));
    }
  };

  const handleConfirmAll = async () => {
    const itemsToSubmit = materialsData.filter(m => m.inputWeight && m.inputWeight > 0);
    if (itemsToSubmit.length === 0) return;

    setIsSubmittingAll(true);
    const toastId = toast.loading(`Processing ${itemsToSubmit.length} shipments...`);

    try {
      const payload = itemsToSubmit.map(m => ({
        vendorId: parseInt(selectedVendorId),
        materialId: parseInt(m.materialId),
        weight: parseFloat(m.inputWeight),
        rate: parseFloat(m.inputRate),
        recordMonth: recordMonth,
        userName: user?.username || "system",
        transactionId: transactionId
      }));

      await axios.post(`${loca}/sales/bulk`, payload);

      toast.success(`Succesfully shipped ${itemsToSubmit.length} items!`, { id: toastId });

      setMaterialsData(prev => prev.map(item => ({ ...item, inputWeight: "" })));
      setBatchFiles([]);
      setTransactionId(crypto.randomUUID());
      fetchSales();
    } catch (err) {
      toast.error("Bulk shipment failed: " + (err.response?.data?.message || err.message), { id: toastId });
    } finally {
      setIsSubmittingAll(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${loca}/sales/${deleteId}`);
      toast.success("Sale entry removed");
      fetchSales();
    } catch (err) {
      toast.error("Error deleting: " + err.message);
    } finally {
      setDeleteId(null);
    }
  };

  const handleDeleteRecord = (id) => {
    setDeleteId(id);
  };

  const vendorSales = sales.filter(s => s.vendorId?.toString() === selectedVendorId?.toString());
  const monthsInHistory = [...new Set(vendorSales.map(s => s.recordMonth))].sort().reverse();

  return (
    <div className="container py-4 mt-2">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold m-0 text-success">Outbound Sales Logs</h2>
          <small className="text-muted">Register shipments sent to customers</small>
        </div>
        <div className="d-flex align-items-center gap-2 bg-white px-3 py-2 rounded-4 shadow-sm border border-success border-opacity-10">
          <label className="fw-bold text-muted small text-nowrap">Sales Month:</label>
          <input
            type="month"
            className="form-control border-0 bg-transparent fw-bold p-0"
            style={{ width: '130px', boxShadow: 'none' }}
            value={recordMonth}
            onChange={(e) => setRecordMonth(e.target.value)}
          />
        </div>
      </div>

      {/* VENDOR SELECTION */}
      <div className="card shadow-sm mb-4 border-0 border-top border-4 border-success">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-5">
              <label className="form-label fw-bold text-muted small text-uppercase">Buyer / Customer Account</label>
              <select className="form-select border-success bg-light fw-bold" value={selectedVendorId} onChange={handleVendorChange}>
                <option value="">-- Select Active Account --</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            {vendorDetails && (
              <div className="col-md-7 border-start ps-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="fw-bold m-0">{vendorDetails.vendorName}</h5>
                    <small className="text-muted d-block">{vendorDetails.address || "No Address"}</small>
                    <small className="badge bg-light text-dark border mt-1">{vendorDetails.mobile || "No Contact"}</small>
                  </div>
                  <div className="text-end">
                    <small className="text-muted d-block">Monthly Revenue</small>
                    <h4 className="fw-bold text-success m-0">₹{vendorSales.filter(s => s.recordMonth === recordMonth).reduce((a, c) => a + c.amount, 0).toLocaleString()}</h4>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedVendorId && (
        <div className="row g-4">
          {/* ADD ENTRIES SECTION */}
          <div className="col-12">
            <div className="card shadow border-0 overflow-hidden">
              <div className="card-header bg-dark text-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="m-0 fw-bold d-flex align-items-center gap-2">
                  <PlusCircle size={20} /> Sales Dispatch Register
                </h5>
                <div className="d-flex align-items-center gap-3">
                  {materialsData.some(m => m.inputWeight > 0) && (
                    <button
                      className="btn btn-warning btn-sm fw-bold px-3 shadow-sm border-white"
                      onClick={handleConfirmAll}
                      disabled={isSubmittingAll}
                    >
                      {isSubmittingAll ? "Processing..." : "Ship All Items"}
                    </button>
                  )}
                  <span className="badge bg-success px-3">{formatMonthName(recordMonth)}</span>
                </div>
              </div>
              {/* DESKTOP VIEW */}
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
                      <tr><td colSpan="5" className="text-center py-4 text-muted">No materials available.</td></tr>
                    ) : (
                      materialsData.map(m => {
                        const totalCost = (parseFloat(m.inputWeight || 0) * parseFloat(m.inputRate || 0)).toFixed(2);
                        const hasWeight = m.inputWeight && m.inputWeight > 0;
                        return (
                          <tr key={m.materialId} className={hasWeight ? "table-success bg-opacity-10" : ""}>
                            <td className="ps-4 fw-bold text-dark text-capitalize">
                              <div>{m.materialName}</div>
                              {m.materialNameHindi && <div className="text-secondary small fw-normal">{m.materialNameHindi}</div>}
                              <div style={{ fontSize: "0.7rem" }} className="text-muted fw-normal">Rate: ₹{m.inputRate}</div>
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm fw-bold border-success"
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
                            <td className="text-end fw-bold text-success">₹{totalCost}</td>
                            <td className="text-center">
                              <button
                                className={`btn btn-sm w-75 fw-bold shadow-sm ${hasWeight ? "btn-success" : "btn-light text-muted border"}`}
                                disabled={!hasWeight || m.isSubmitting}
                                onClick={() => handleSubmitRow(m)}
                              >
                                {m.isSubmitting ? "..." : "Ship"}
                              </button>
                            </td>
                          </tr>
                        )
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
                    <Paperclip size={16} /> Attach Shipment Media (Photos / Signatures)
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
                {batchFiles.length > 0 && <small className="text-success fw-bold">{batchFiles.length} files attached</small>}
              </div>

              {/* MOBILE VIEW */}
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
                            className="form-control form-control-sm fw-bold border-success"
                            placeholder="0.0"
                            value={m.inputWeight || ""}
                            onChange={(e) => handleRowChange(m.materialId, "inputWeight", e.target.value)}
                          />
                        </div>
                        <div className="col-4">
                          <label className="small text-muted mb-1 d-block">Rate</label>
                          <input
                            type="number"
                            className="form-control form-control-sm fw-bold border-success"
                            placeholder="0.0"
                            value={m.inputRate || ""}
                            onChange={(e) => handleRowChange(m.materialId, "inputRate", e.target.value)}
                          />
                        </div>
                        <div className="col-4">
                          <label className="small text-muted mb-1 d-block text-end">Amount</label>
                          <div className="h6 fw-bold text-success mb-0 mt-1 text-end">₹{totalCost}</div>
                        </div>
                      </div>

                      <button
                        className={`btn w-100 fw-bold py-2 ${hasWeight ? "btn-success shadow" : "btn-light border text-muted"}`}
                        disabled={!hasWeight || m.isSubmitting}
                        onClick={() => handleSubmitRow(m)}
                      >
                        {m.isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <PlusCircle size={18} className="me-2" />}
                        {hasWeight ? "Confirm Sale" : "Enter Weight"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card shadow-sm border-0 border-start border-4 border-success">
              <div className="card-body py-3 d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="m-0 fw-bold text-muted small uppercase">Quick Summary - {formatMonthName(recordMonth)}</h6>
                  <small className="text-muted">Viewing outbound dispatch logs for this customer</small>
                </div>
                <div className="text-end">
                  <button className="btn btn-dark btn-sm fw-bold px-4" onClick={() => navigate(`/bill-details/sales/${selectedVendorId}/${recordMonth}`)}>
                    <Receipt size={16} className="me-2" /> Generate Statement / Print Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MONTH-WISE REVENUE SUMMARY (Moved and modified) */}
      {selectedVendorId && (
        <div className="card shadow border-0 mt-4 mb-5 overflow-hidden">
          <div className="card-header bg-white py-3 border-bottom">
            <h6 className="m-0 fw-bold text-muted text-uppercase small">Sales History</h6>
          </div>
          <div className="card-body p-0" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {monthsInHistory.length === 0 ? (
              <div className="text-center py-5 text-muted fst-italic">No sales logged yet</div>
            ) : (
              monthsInHistory.map(month => {
                const monthData = vendorSales.filter(s => s.recordMonth === month);
                const totalRevenue = monthData.reduce((acc, curr) => acc + curr.amount, 0);
                const totalQty = monthData.reduce((acc, curr) => acc + curr.weight, 0);

                return (
                  <div key={month} className={`p-3 border-bottom hover-bg-light transition-all cursor-pointer ${recordMonth === month ? 'bg-success bg-opacity-10 border-start border-4 border-success' : ''}`}
                    onClick={() => setRecordMonth(month)}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="badge bg-success-subtle text-success mb-1">{formatMonthName(month)}</div>
                        <div className="fw-bold text-dark small">Monthly Dispatch Total</div>
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>{monthData.length} categories • {totalQty.toFixed(2)} kg</small>
                      </div>
                      <div className="text-end">
                        <h6 className="fw-bold text-success m-0">₹{totalRevenue.toLocaleString()}</h6>
                        <small className="text-muted" style={{ fontSize: '0.65rem' }}>Payment: Pending</small>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ITEMIZED BREAKDOWN (History) */}
      {selectedVendorId && (
        <div className="card shadow border-0 mt-4 mb-5 overflow-hidden">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="m-0 fw-bold text-dark text-uppercase small">Recent Dispatch Records for {formatMonthName(recordMonth)}</h6>
            {vendorSales.filter(s => s.recordMonth === recordMonth && s.transactionId).length > 0 && (
              <button
                onClick={() => {
                  const ids = [...new Set(vendorSales.filter(s => s.recordMonth === recordMonth).map(s => s.transactionId).filter(Boolean))];
                  setViewingTransactionId(ids);
                  setShowMediaModal(true);
                }}
                className="btn btn-sm btn-primary d-flex align-items-center gap-2 px-3 fw-bold shadow-sm"
              >
                <ImageIcon size={16} /> View All Media
              </button>
            )}
          </div>

          {/* SCROLLABLE TABLE (WORKS FOR BOTH DESKTOP & MOBILE) */}
          <div className="table-responsive border-0" style={{ overflowX: 'auto' }}>
            <table className="table table-hover align-middle mb-0" style={{ minWidth: window.innerWidth < 768 ? '850px' : 'auto' }}>
              <thead className="table-dark">
                <tr className="smaller text-uppercase fw-black bg-dark">
                  <th className="ps-4 py-3" style={{ width: '90px' }}>Date</th>
                  <th className="py-3">Customer & Sales Details</th>
                  <th className="text-center py-3" style={{ width: '120px' }}>Dispatch (kg)</th>
                  <th className="text-end py-3" style={{ width: '150px' }}>Total Amount</th>
                  <th className="text-center py-3" style={{ width: '120px' }}>Payment Status</th>
                  <th className="text-center py-3" style={{ width: '60px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {vendorSales.filter(s => s.recordMonth === recordMonth).length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-5 text-muted fst-italic">No records found.</td></tr>
                ) : (
                  vendorSales.filter(s => s.recordMonth === recordMonth).map((s, idx) => (
                    <tr key={idx} className="border-bottom border-light">
                      <td className="ps-4 py-3">
                        <div className="fw-black text-dark smaller">{new Date(s.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                        <small className="text-muted smaller opacity-75">ID: #{s.id}</small>
                      </td>
                      <td className="py-3">
                        <div className="fw-black text-dark text-capitalize smaller mb-0 lh-1">{s.materialName}</div>
                        {s.materialNameHindi && <small className="text-muted smaller lh-1 opacity-75">{s.materialNameHindi}</small>}
                      </td>
                      <td className="text-center py-3 fw-bold text-success smaller">{s.weight.toFixed(2)} <span className="smaller opacity-50 fs-6">kg</span></td>
                      <td className="text-end py-3 fw-black text-dark fs-5">₹{s.amount.toLocaleString()}</td>
                      <td className="text-center py-3">
                        <span className={`badge rounded-pill smaller fw-bold tracking-tighter ${s.status === 'PAID' ? 'bg-soft-success text-success border border-success border-opacity-25' : s.status === 'PARTIAL' ? 'bg-soft-warning text-warning border border-warning border-opacity-25' : 'bg-soft-danger text-danger border border-danger border-opacity-25'}`} style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem' }}>
                          {s.status || "PENDING"}
                        </span>
                      </td>
                      <td className="text-center py-3">
                        <button className="btn btn-sm btn-outline-danger border-0 rounded-circle shadow-sm" onClick={() => handleDeleteRecord(s.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* MASTER LOG SUMMARY */}
      {!selectedVendorId && (
        <div className="card shadow-sm border-0 mt-2">
          <div className="card-header bg-dark text-white py-3">
            <h6 className="m-0 fw-bold">Outbound Sales Ledger</h6>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-uppercase fw-bold text-muted bg-light">
                <tr>
                  <th className="ps-4">Cycle</th>
                  <th>Buyer / Partner</th>
                  <th className="text-center">Total Dispatch (kg)</th>
                  <th className="text-center">Payment Status</th>
                  <th className="text-end pe-4">Revenue Collected</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(sales.reduce((acc, s) => {
                  const key = `${s.recordMonth}-${s.vendorName}`;
                  const status = (s.status || "PENDING").toUpperCase();
                  if (!acc[key]) {
                    acc[key] = { month: s.recordMonth, name: s.vendorName, weight: 0, amount: 0, id: s.vendorId, statuses: [] };
                  }
                  acc[key].weight += s.weight;
                  acc[key].amount += s.amount;
                  acc[key].statuses.push(status);
                  return acc;
                }, {})).map(bill => {
                  const unique = [...new Set(bill.statuses)];
                  let finalStatus = "PENDING";
                  if (unique.length === 1 && unique[0] === "PAID") finalStatus = "PAID";
                  else if (unique.includes("PAID") || unique.includes("PARTIAL")) finalStatus = "PARTIAL";
                  return { ...bill, finalStatus };
                }).sort((a, b) => b.month.localeCompare(a.month)).map((bill, idx) => (
                  <tr key={idx} className="cursor-pointer border-bottom border-light" onClick={() => navigate(`/bill-details/sales/${bill.id}/${bill.month}`)} title="Click to view full invoice">
                    <td className="ps-4 py-3"><span className="badge bg-light text-dark border rounded-pill">{formatMonthName(bill.month)}</span></td>
                    <td className="fw-bold text-dark py-3">{bill.name}</td>
                    <td className="text-center fw-bold text-secondary py-3">{bill.weight.toFixed(2)} kg</td>
                    <td className="text-center py-3">
                      <span className={`badge rounded-pill smaller px-3 py-2 fw-bold ${bill.finalStatus === 'PAID' ? 'bg-soft-success text-success' : bill.finalStatus === 'PARTIAL' ? 'bg-soft-warning text-warning' : 'bg-soft-danger text-danger'}`}>
                        {bill.finalStatus}
                      </span>
                    </td>
                    <td className="text-end pe-4 fw-bold text-success py-3 fs-6">₹{bill.amount.toLocaleString()}</td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr><td colSpan="5" className="text-center py-5 text-muted fst-italic">No outbound records found</td></tr>
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
        title="Delete Sale Record?"
        message="Are you sure you want to remove this sales entry? This will update your inventory."
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

export default Sales;

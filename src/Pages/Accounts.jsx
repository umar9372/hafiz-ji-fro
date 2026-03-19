import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { WorkshopContext } from "../Context";
import { Trash2, Edit3, UserPlus, X, Save, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../Components/ConfirmModal";

export default function Accounts() {
  const { loca, user } = useContext(WorkshopContext);
  const navigate = useNavigate();

  const [type, setType] = useState("VENDORS"); // VENDORS or SUPPLIERS
  const [list, setList] = useState([]);

  // Form states
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [collectionDate, setCollectionDate] = useState("");

  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchList();
    cancelEdit();
  }, [type]);

  const fetchList = async () => {
    try {
      const endpoint = type === "VENDORS" ? "/vendors" : "/suppliers";
      const res = await axios.get(`${loca}${endpoint}`);
      setList(res.data.data);
    } catch (err) {
      console.error("Error fetching accounts", err);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setAddress("");
    setMobile("");
    setCollectionDate("");
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setName(item.name);
    setAddress(item.address === "N/A" ? "" : item.address);
    setMobile(item.mobile === "N/A" ? "" : item.mobile);
    setCollectionDate(item.collectionDate || "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    try {
      const endpoint = type === "VENDORS" ? "/vendors" : "/suppliers";
      let payloadWithUser = { name, address, mobile, userName: user?.username || "system" };
      if (type === "SUPPLIERS") {
        payloadWithUser.collectionDate = collectionDate ? parseInt(collectionDate) : null;
      }
      if (editingId) {
        await axios.put(`${loca}${endpoint}/${editingId}`, payloadWithUser);
        toast.success("Account updated successfully!");
      } else {
        await axios.post(`${loca}${endpoint}`, payloadWithUser);
        toast.success("Account registered successfully!");
      }

      cancelEdit();
      fetchList();
    } catch (err) {
      toast.error("Error saving account: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const endpoint = type === "VENDORS" ? "/vendors" : "/suppliers";
      await axios.delete(`${loca}${endpoint}/${deleteId}`);
      toast.success("Account moved to archives.");
      fetchList();
    } catch (err) {
      toast.error("Error deleting account: " + err.message);
    } finally {
      setDeleteId(null);
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const handleRedirect = (id) => {
    const path = type === "VENDORS" ? "/sales" : "/purchase";
    navigate(`${path}?id=${id}`);
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">Partner Ledger</h2>
          <p className="text-muted small m-0">Manage your Sales Customers and Purchase Suppliers</p>
        </div>
        <div className="btn-group shadow-sm bg-white p-1 rounded-3">
          <button
            className={`btn px-4 fw-bold rounded-2 transition-all ${type === "VENDORS" ? "btn-primary" : "btn-light text-muted"}`}
            onClick={() => setType("VENDORS")}
          >
            Sales Accounts
          </button>
          <button
            className={`btn px-4 fw-bold rounded-2 transition-all ${type === "SUPPLIERS" ? "btn-danger" : "btn-light text-muted"}`}
            onClick={() => setType("SUPPLIERS")}
          >
            Purchase Accounts
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* FORM SECTION */}
        <div className="col-md-4">
          <div className={`card shadow-sm border-0 border-top border-4 ${editingId ? 'border-warning' : 'border-primary'}`}>
            <div className="card-header bg-white pt-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold m-0 d-flex align-items-center gap-2">
                {editingId ? <Edit3 size={18} /> : <UserPlus size={18} />}
                {editingId ? "Edit Account" : `Register New ${type === "VENDORS" ? "Buyer" : "Supplier"}`}
              </h5>
              {editingId && (
                <button className="btn btn-sm btn-light rounded-circle" onClick={cancelEdit}>
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted text-uppercase">Legal Name / Firm Name</label>
                  <input
                    type="text"
                    className="form-control border-secondary-subtle"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Al-Abbas Steel"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted text-uppercase">Contact Number</label>
                  <input
                    type="text"
                    className="form-control border-secondary-subtle"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted text-uppercase">Principal Address</label>
                  <textarea
                    className="form-control border-secondary-subtle"
                    rows="3"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter full address details..."
                  ></textarea>
                </div>
                {type === "SUPPLIERS" && (
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted text-uppercase">Stock Collection Day</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      className="form-control border-secondary-subtle"
                      value={collectionDate}
                      onChange={(e) => setCollectionDate(e.target.value)}
                      placeholder="e.g. 15 (Day of month)"
                    />
                  </div>
                )}
                <button className={`btn w-100 fw-bold py-2 mt-2 shadow-sm ${editingId ? 'btn-warning' : (type === "VENDORS" ? 'btn-primary' : 'btn-danger')}`} disabled={loading}>
                  {loading ? "Processing..." : (editingId ? "Save Changes" : "Create Account")}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* LIST SECTION */}
        <div className="col-md-8">
          <div className="card shadow-sm border-0 bg-white">
            <div className="card-header bg-dark text-white py-3">
              <h6 className="m-0 fw-bold">Active {type === "VENDORS" ? "Sales / Customer" : "Purchase / Vendor"} Portfolio</h6>
            </div>

            {/* DESKTOP VIEW */}
            <div className="table-responsive desktop-only">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr className="small text-muted text-uppercase">
                    <th className="ps-4">Partner Details</th>
                    <th>Contact</th>
                    <th>Address</th>
                    {type === "SUPPLIERS" && <th>Collection Day</th>}
                    <th className="text-end pe-4">Management</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-5 text-muted fst-italic">No active accounts found.</td></tr>
                  ) : (
                    list.map(item => (
                      <tr key={item.id} className="cursor-pointer" onClick={() => handleRedirect(item.id)}>
                        <td className="ps-4 py-3">
                          <div className="d-flex align-items-center gap-2">
                            <div className={`p-2 rounded-circle bg-opacity-10 text-white d-flex align-items-center justify-content-center ${type === "VENDORS" ? 'bg-primary' : 'bg-danger'}`} style={{ width: '32px', height: '32px' }}>
                              <span className={`fw-bold small ${type === "VENDORS" ? 'text-primary' : 'text-danger'}`}>{item.name.charAt(0)}</span>
                            </div>
                            <div>
                              <div className="fw-bold text-dark">{item.name}</div>
                              <small className="text-muted">ID: #{item.id}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge rounded-pill bg-light text-dark border px-2 py-1">{item.mobile || "N/A"}</span>
                        </td>
                        <td>
                          <div className="text-truncate small text-muted" style={{ maxWidth: '150px' }} title={item.address}>
                            {item.address || "No address"}
                          </div>
                        </td>
                        {type === "SUPPLIERS" && (
                          <td>
                            {item.collectionDate ? <span className="badge bg-warning text-dark border">Day {item.collectionDate}</span> : <span className="text-muted small">Not Set</span>}
                          </td>
                        )}
                        <td className="text-end pe-4">
                          <div className="d-flex justify-content-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button className="btn btn-outline-info btn-sm border-0 rounded-circle p-2" onClick={() => handleRedirect(item.id)}><ExternalLink size={16} /></button>
                            <button className="btn btn-outline-primary btn-sm border-0 rounded-circle p-2" onClick={() => startEdit(item)}><Edit3 size={16} /></button>
                            <button className="btn btn-outline-danger btn-sm border-0 rounded-circle p-2" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW */}
            <div className="mobile-only">
              {list.length === 0 ? (
                <div className="text-center py-4 text-muted fst-italic">No accounts found.</div>
              ) : (
                list.map(item => (
                  <div key={item.id} className="p-3 border-bottom bg-white d-flex justify-content-between align-items-start" onClick={() => handleRedirect(item.id)}>
                    <div className="d-flex gap-3">
                       <div className={`p-2 rounded bg-opacity-10 text-white d-flex align-items-center justify-content-center ${type === "VENDORS" ? 'bg-primary' : 'bg-danger'}`} style={{ width: '40px', height: '40px' }}>
                         <span className={`fw-bold ${type === "VENDORS" ? 'text-primary' : 'text-danger'}`}>{item.name.charAt(0)}</span>
                       </div>
                       <div>
                          <div className="fw-bold text-dark">{item.name}</div>
                          <div className="small text-muted">
                            {item.mobile || "No Contact"}
                            {type === "SUPPLIERS" && item.collectionDate && ` • Day ${item.collectionDate}`}
                          </div>
                       </div>
                    </div>
                    <div className="d-flex gap-1" onClick={e => e.stopPropagation()}>
                       <button className="btn btn-light btn-sm p-2 border" onClick={() => startEdit(item)}><Edit3 size={16}/></button>
                       <button className="btn btn-light btn-sm p-2 border text-danger" onClick={() => handleDelete(item.id)}><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="mt-3 bg-light p-3 rounded-3 border border-dashed text-center">
            <small className="text-muted">Tip: Click on any row to jump directly to that person's bill entry page.</small>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Deactivate Account?"
        message="Are you sure? This will hide the account from active lists but keep all historical transaction data safe."
        type="warning"
      />
    </div>
  );
}

import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { WorkshopContext } from "../Context";
import toast from "react-hot-toast";
import ConfirmModal from "../Components/ConfirmModal";
import { Package, Plus, Trash2, Edit2, Check, X } from "lucide-react";

export default function MaterialsManagement() {
  const { loca, user } = useContext(WorkshopContext);

  const [materials, setMaterials] = useState([]);
  const [name, setName] = useState("");
  const [defaultRate, setDefaultRate] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRate, setEditRate] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await axios.get(`${loca}/materials`);
      setMaterials(res.data.data);
    } catch (err) {
      console.error("Error fetching materials", err);
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!name || !defaultRate) return;

    setLoading(true);
    try {
      await axios.post(`${loca}/materials`, {
        name: name.toLowerCase(),
        defaultRate: parseInt(defaultRate),
        userName: user?.username || "system"
      });
      toast.success("Material added successfully!");
      setName("");
      setDefaultRate("");
      fetchMaterials();
    } catch (err) {
      toast.error("Error adding material: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (m) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditRate(m.defaultRate);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditRate("");
  };

  const handleSaveEdit = async (id) => {
    try {
      await axios.put(`${loca}/materials/${id}`, {
        name: editName.toLowerCase(),
        defaultRate: parseInt(editRate),
        userName: user?.username || "system"
      });
      toast.success("Material updated!");
      setEditingId(null);
      fetchMaterials();
    } catch (err) {
      toast.error("Error updating material: " + err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${loca}/materials/${deleteId}`);
      toast.success("Material deleted!");
      fetchMaterials();
    } catch (err) {
      toast.error("Error deleting material: " + err.message);
    } finally {
      setDeleteId(null);
    }
  };

  const handleDeleteMaterial = (id) => {
    setDeleteId(id);
  };

  return (
    <div className="container py-4">
      <div className="mb-4 d-flex align-items-center gap-3">
        <Package size={32} className="text-primary" />
        <h2 className="fw-bold m-0 text-dark">Material Marketplace Settings</h2>
      </div>

      <div className="row g-4">
        {/* ADD MATERIAL FORM */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 border-top border-4 border-primary">
            <div className="card-header bg-white pt-3">
              <h5 className="fw-bold m-0">Add New Category</h5>
            </div>
            <div className="card-body">

              <form onSubmit={handleAddMaterial}>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted uppercase tracking-wider">Material Name</label>
                  <input
                    type="text"
                    className="form-control border-secondary shadow-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Copper Wire"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted uppercase tracking-wider">Global Default Rate (₹/kg)</label>
                  <div className="input-group shadow-sm">
                    <span className="input-group-text bg-light text-muted border-secondary">₹</span>
                    <input
                      type="number"
                      className="form-control border-secondary"
                      value={defaultRate}
                      onChange={(e) => setDefaultRate(e.target.value)}
                      placeholder="e.g. 450"
                      required
                    />
                  </div>
                </div>
                <button className="btn btn-primary w-100 fw-bold d-flex align-items-center justify-content-center gap-2 py-2 shadow-sm" disabled={loading}>
                  <Plus size={18} />
                  {loading ? "Saving..." : "Create Material"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* MATERIALS LIST GRID */}
        <div className="col-md-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-dark text-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="m-0 fw-bold">Current Material Portfolio</h5>
              <span className="badge bg-primary px-3">{materials.length} Items</span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4">No.</th>
                    <th>Material Categorization</th>
                    <th className="text-center">Global Default Price</th>
                    <th className="text-end pe-4">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-5 text-muted fst-italic">
                        No materials defined. Start by adding one.
                      </td>
                    </tr>
                  ) : (
                    materials.map((m, index) => (
                      <tr key={m.id}>
                        <td className="ps-4 text-muted small">#{index + 1}</td>
                        <td>
                          {editingId === m.id ? (
                            <input 
                              type="text" 
                              className="form-control form-control-sm border-primary" 
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          ) : (
                            <div className="fw-bold text-capitalize text-dark fs-6">{m.name}</div>
                          )}
                        </td>
                        <td className="text-center">
                          {editingId === m.id ? (
                            <div className="input-group input-group-sm w-75 mx-auto">
                              <span className="input-group-text">₹</span>
                              <input 
                                type="number" 
                                className="form-control border-primary" 
                                value={editRate}
                                onChange={(e) => setEditRate(e.target.value)}
                              />
                            </div>
                          ) : (
                            <>
                              <span className="fw-bold text-success">₹{m.defaultRate}</span>
                              <span className="text-muted small ms-1">/kg</span>
                            </>
                          )}
                        </td>
                        <td className="text-end pe-4">
                          <div className="d-flex justify-content-end gap-2">
                            {editingId === m.id ? (
                              <>
                                <button className="btn btn-sm btn-success rounded-circle p-2" onClick={() => handleSaveEdit(m.id)}>
                                  <Check size={16} />
                                </button>
                                <button className="btn btn-sm btn-light rounded-circle p-2" onClick={handleCancelEdit}>
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button className="btn btn-outline-primary btn-sm border-0 rounded-circle p-2" onClick={() => handleStartEdit(m)}>
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  className="btn btn-outline-danger btn-sm border-0 rounded-circle p-2"
                                  onClick={() => handleDeleteMaterial(m.id)}
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Material?"
        message="Are you sure? This might affect existing mappings and historical data view."
        type="danger"
      />
    </div>
  );
}

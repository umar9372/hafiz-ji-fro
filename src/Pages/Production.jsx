import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { WorkshopContext } from "../Context";
import toast from "react-hot-toast";
import { Zap, Plus, History, Layers, ClipboardList, Trash2, Calendar, FileText, Edit2 } from "lucide-react";

export default function Production() {
  const { loca } = useContext(WorkshopContext);
  const [materials, setMaterials] = useState([]);
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    materialId: "",
    sourceMaterialId: "",
    weight: "",
    date: new Date().toISOString().split(".")[0], // YYYY-MM-DDTHH:mm:ss
    notes: ""
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchMaterials();
    fetchProductions();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await axios.get(`${loca}/materials`);
      setMaterials(res.data.data);
    } catch (err) {
      console.error("Error fetching materials", err);
    }
  };

  const fetchProductions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${loca}/productions`);
      setProductions(res.data.data);
    } catch (err) {
      console.error("Error fetching productions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (prod) => {
    setEditId(prod.id);
    setForm({
      materialId: prod.materialId,
      sourceMaterialId: prod.sourceMaterialId || "",
      weight: prod.weight,
      date: prod.date,
      notes: prod.notes
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this production record?")) return;
    
    const toastId = toast.loading("Deleting record...");
    try {
      await axios.delete(`${loca}/productions/${id}`);
      toast.success("Record deleted", { id: toastId });
      fetchProductions();
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete record", { id: toastId });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.materialId || !form.weight) {
      toast.error("Please fill required fields");
      return;
    }

    const toastId = toast.loading(editId ? "Updating record..." : "Recording production...");
    try {
      const params = new URLSearchParams();
      params.append("materialId", form.materialId);
      if (form.sourceMaterialId) params.append("sourceMaterialId", form.sourceMaterialId);
      params.append("weight", form.weight);
      params.append("date", form.date);
      params.append("notes", form.notes);

      if (editId) {
        await axios.put(`${loca}/productions/${editId}`, params);
      } else {
        await axios.post(`${loca}/productions`, params);
      }
      
      toast.success(editId ? "Log updated successfully" : "Production logged successfully", { id: toastId });
      setShowModal(false);
      setEditId(null);
      setForm({
        materialId: "",
        sourceMaterialId: "",
        weight: "",
        date: new Date().toISOString().split(".")[0],
        notes: ""
      });
      fetchProductions();
    } catch (err) {
      console.error("Submit failed", err);
      toast.error("Failed to log production", { id: toastId });
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold m-0 text-dark">Production Hub</h4>
          <p className="text-muted small m-0">Log materials produced internally at the warehouse</p>
        </div>
        <button 
          className="btn btn-dark d-flex align-items-center gap-2 px-4 shadow-sm fw-bold border-0" 
          onClick={() => setShowModal(true)}
          style={{ borderRadius: '10px' }}
        >
          <Plus size={18} /> Log Production
        </button>
      </div>

      <div className="row g-4">
        {/* STATS SUMMARY */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm p-4 bg-white rounded-4 h-100">
             <div className="d-flex align-items-center gap-2 mb-4">
                <div className="bg-warning bg-opacity-10 p-2 rounded-3">
                   <Zap size={20} className="text-warning-emphasis" />
                </div>
                <h6 className="fw-bold m-0">Why use Production?</h6>
             </div>
             <p className="text-muted small mb-4">
                Use this section to record inventory that you generate internally through scrap processing, assembly, or warehouse gains. 
                <strong> No financial transactions</strong> will be recorded for these items.
             </p>
             <div className="list-group list-group-flush gap-2">
                <div className="d-flex gap-3 align-items-start mb-2">
                   <div className="bg-light p-2 rounded-circle"><Layers size={14} /></div>
                   <div className="small"><span className="fw-bold d-block">Increases Inventory</span> Directly adds weight to your warehouse stock.</div>
                </div>
                <div className="d-flex gap-3 align-items-start">
                   <div className="bg-light p-2 rounded-circle"><History size={14} /></div>
                   <div className="small"><span className="fw-bold d-block">Auditable History</span> All production logs are tracked in material history.</div>
                </div>
             </div>
          </div>
        </div>

        {/* LOGS TABLE */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm bg-white rounded-4 overflow-hidden">
             <div className="card-header bg-white border-bottom py-3">
                <h6 className="fw-bold m-0 d-flex align-items-center gap-2">
                   <ClipboardList size={18} className="text-primary" /> Recent Production Logs
                </h6>
             </div>
             <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                   <thead className="bg-light">
                      <tr className="small text-muted text-uppercase fw-bold">
                         <th className="ps-4">Production Details</th>
                         <th className="text-center">Weight</th>
                         <th className="text-center">Record Date</th>
                         <th className="ps-3">Notes</th>
                         <th className="text-end pe-4">Actions</th>
                      </tr>
                   </thead>
                   <tbody>
                      {productions.map((p) => (
                          <tr key={p.id}>
                             <td className="ps-4">
                                <div className="d-flex align-items-center gap-2">
                                    {p.sourceMaterialName ? (
                                        <>
                                            <span className="text-muted small">From:</span>
                                            <span className="fw-bold text-danger text-decoration-line-through">{p.sourceMaterialName}</span>
                                            <Zap size={14} className="text-warning" />
                                            <span className="text-muted small">To:</span>
                                            <span className="fw-bold text-success">{p.materialName}</span>
                                        </>
                                    ) : (
                                        <div className="fw-bold text-dark">{p.materialName}</div>
                                    )}
                                </div>
                                <small className="text-muted">ID: #PROD-{p.id}</small>
                             </td>
                             <td className="text-center fw-black text-success fs-6">
                                {p.sourceMaterialName ? "" : "+"} {p.weight.toLocaleString()} kg
                             </td>
                            <td className="text-center small text-muted">
                               {new Date(p.date).toLocaleDateString()}
                            </td>
                            <td className="ps-3 text-muted smaller">
                               {p.notes || <span className="opacity-50">No notes</span>}
                            </td>
                            <td className="text-end pe-4">
                               <div className="d-flex justify-content-end gap-2">
                                  <button onClick={() => handleEdit(p)} className="btn btn-light btn-sm p-2 rounded-circle border-0 text-primary shadow-sm"><Edit2 size={14}/></button>
                                  <button onClick={() => handleDelete(p.id)} className="btn btn-light btn-sm p-2 rounded-circle border-0 text-danger shadow-sm"><Trash2 size={14}/></button>
                               </div>
                            </td>
                         </tr>
                      ))}
                      {!loading && productions.length === 0 && (
                        <tr>
                           <td colSpan="4" className="text-center py-5 text-muted">
                              <History size={40} className="mb-2 opacity-25 d-block mx-auto" />
                              No production records found.
                           </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>

      {/* PRODUCTION MODAL */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
              <div className="modal-header border-bottom py-3">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <Zap className="text-warning-emphasis" size={20} /> {editId ? "Update Log" : "Log Internal Production"}
                </h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); setEditId(null); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3 mb-4">
                    <div className="col-6">
                        <label className="form-label small fw-bold text-muted text-uppercase">From Material (Source)</label>
                        <select 
                            className="form-select bg-light border-0 shadow-sm" 
                            style={{ borderRadius: '10px' }}
                            value={form.sourceMaterialId} 
                            onChange={(e) => setForm({...form, sourceMaterialId: e.target.value})}
                        >
                            <option value="">No Source (Internal Gain)</option>
                            {materials.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
                        </select>
                        <div className="form-text smaller">Reduces stock of this material</div>
                    </div>
                    <div className="col-6">
                        <label className="form-label small fw-bold text-muted text-uppercase">To Material (Target)</label>
                        <select 
                            className="form-select bg-light border-0 shadow-sm" 
                            required 
                            style={{ borderRadius: '10px' }}
                            value={form.materialId} 
                            onChange={(e) => setForm({...form, materialId: e.target.value})}
                        >
                            <option value="">Choose material...</option>
                            {materials.map(m => (
                                <option key={m.id} value={m.id} disabled={m.id == form.sourceMaterialId}>
                                    {m.name.toUpperCase()}
                                </option>
                            ))}
                        </select>
                        <div className="form-text smaller">Increases stock of this material</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-bold text-muted text-uppercase">Quantity (kg)</label>
                    <div className="input-group">
                       <span className="input-group-text bg-light border-end-0"><Plus size={18} /></span>
                       <input 
                        type="number" 
                        step="0.01" 
                        className="form-control bg-light border-start-0" 
                        required 
                        value={form.weight} 
                        onChange={(e) => setForm({...form, weight: e.target.value})}
                        placeholder="0.00"
                       />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-bold text-muted text-uppercase">Production Date & Time</label>
                    <div className="input-group">
                       <span className="input-group-text bg-light border-end-0"><Calendar size={18} /></span>
                       <input 
                        type="datetime-local" 
                        className="form-control bg-light border-start-0" 
                        required 
                        value={form.date} 
                        onChange={(e) => setForm({...form, date: e.target.value})}
                       />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted text-uppercase">Internal Notes (Optional)</label>
                    <div className="input-group">
                       <span className="input-group-text bg-light border-end-0"><FileText size={18} /></span>
                       <textarea 
                        className="form-control bg-light border-start-0" 
                        rows="2" 
                        value={form.notes} 
                        onChange={(e) => setForm({...form, notes: e.target.value})}
                        placeholder="Ref code, reason, etc."
                       />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0">
                  <button type="button" className="btn btn-light px-4 fw-bold" onClick={() => { setShowModal(false); setEditId(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-dark px-4 fw-bold shadow-sm border-0" style={{ borderRadius: '10px' }}>{editId ? "Update Record" : "Save Log"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

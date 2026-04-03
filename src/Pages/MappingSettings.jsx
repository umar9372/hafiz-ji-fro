import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { WorkshopContext } from "../Context";
import toast from "react-hot-toast";
import { Save, Plus, Minus, Search, User, Filter, AlertCircle, Info, CheckCircle } from "lucide-react";

export default function MappingSettings() {
  const { loca } = useContext(WorkshopContext);

  const [mappingType, setMappingType] = useState("VENDORS"); 
  const [entities, setEntities] = useState([]);
  const [selectedEntityId, setSelectedEntityId] = useState("");
  
  const [materialsData, setMaterialsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch entities (Vendors/Suppliers)
  useEffect(() => {
    setSelectedEntityId("");
    setMaterialsData([]);
    if (mappingType === "SUPPLIERS") {
      fetchSuppliers();
    } else {
      fetchVendors();
    }
  }, [mappingType]);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${loca}/suppliers`);
      setEntities(res.data.data);
    } catch (err) {
      console.error("Error fetching suppliers", err);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await axios.get(`${loca}/vendors`);
      setEntities(res.data.data);
    } catch (err) {
      console.error("Error fetching vendors", err);
    }
  };

  const handleEntityChange = async (e) => {
    const id = e.target.value;
    setSelectedEntityId(id);
    setMaterialsData([]);
    if (id) {
       fetchEntityMaterialRates(id);
    }
  };

  const fetchEntityMaterialRates = async (id) => {
     setLoading(true);
     try {
         const endpoint = mappingType === "SUPPLIERS" ? `/suppliers/${id}/details` : `/vendors/${id}/details`;
         const res = await axios.get(`${loca}${endpoint}`);
         
         const mergedData = res.data.materials.map(m => ({
             ...m,
             currentInputRate: m.customRate ? m.customRate : m.defaultRate,
             isDirty: false,
             isProcessing: false,
             isMapped: m.customRate !== undefined && m.customRate !== null
         }));

         setMaterialsData(mergedData);
     } catch (error) {
         console.error("Error fetching mapping", error);
     } finally {
         setLoading(false);
     }
  };

  const handleRateInputChange = (materialId, newValue) => {
      setMaterialsData(prev => prev.map(m => {
          if (m.materialId === materialId) {
             return { ...m, currentInputRate: newValue, isDirty: true };
          }
          return m;
      }));
  };

  const handleToggleMap = async (materialObj) => {
      setMaterialsData(prev => prev.map(m => m.materialId === materialObj.materialId ? { ...m, isProcessing: true } : m));

      const isCurrentlyMapped = materialObj.isMapped;
      const endpoint = isCurrentlyMapped ? `${loca}/material-rates/unmap` : `${loca}/material-rates/map`;
      
      const payload = {
        type: mappingType === "SUPPLIERS" ? "SUPPLIER" : "VENDOR",
        entityId: parseInt(selectedEntityId),
        materialId: parseInt(materialObj.materialId)
      };

      if (!isCurrentlyMapped) {
          payload.rate = parseFloat(materialObj.currentInputRate);
      }

      try {
        await axios.post(endpoint, payload);
        
        setMaterialsData(prev => prev.map(m => {
            if (m.materialId === materialObj.materialId) {
                return { 
                    ...m, 
                    isDirty: false, 
                    isProcessing: false, 
                    isMapped: !isCurrentlyMapped,
                    customRate: !isCurrentlyMapped ? m.currentInputRate : null,
                    currentInputRate: !isCurrentlyMapped ? m.currentInputRate : m.defaultRate
                };
            }
            return m;
        }));
        
        toast.success(`${materialObj.materialName} ${isCurrentlyMapped ? 'unmapped' : 'mapped'} successfully!`);
      } catch (err) {
        setMaterialsData(prev => prev.map(m => m.materialId === materialObj.materialId ? { ...m, isProcessing: false } : m));
        toast.error("Operation failed: " + err.message);
      }
  };

  const handleUpdateRate = async (materialObj) => {
      setMaterialsData(prev => prev.map(m => m.materialId === materialObj.materialId ? { ...m, isProcessing: true } : m));

      const payload = {
        type: mappingType === "SUPPLIERS" ? "SUPPLIER" : "VENDOR",
        entityId: parseInt(selectedEntityId),
        materialId: parseInt(materialObj.materialId),
        rate: parseFloat(materialObj.currentInputRate)
      };

      try {
        await axios.post(`${loca}/material-rates/map`, payload);
        setMaterialsData(prev => prev.map(m => {
            if (m.materialId === materialObj.materialId) {
                return { ...m, isDirty: false, isProcessing: false, customRate: m.currentInputRate };
            }
            return m;
        }));
        toast.success("Rate updated successfully!");
      } catch (err) {
        setMaterialsData(prev => prev.map(m => m.materialId === materialObj.materialId ? { ...m, isProcessing: false } : m));
        toast.error("Update failed: " + err.message);
      }
  };

  const filteredMaterials = materialsData.filter(m => 
    m.materialName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="fw-bold d-flex align-items-center gap-2 text-dark">
          <Filter className="text-primary" />
          Individual Pricing Setup
        </h2>
        <p className="text-muted">Personalize the material list and rates for each partner.</p>
      </div>

      <div className="card shadow-sm border-0 mb-4 bg-white rounded-4 overflow-hidden">
        <div className="card-body p-4 bg-light border-bottom">
          <div className="row g-4 align-items-end">
            <div className="col-md-4">
                <label className="form-label fw-bold text-muted small text-uppercase mb-2">Account Type</label>
                <div className="btn-group w-100 p-1 bg-white border rounded-pill shadow-sm">
                  <button 
                    className={`btn rounded-pill px-4 fw-bold ${mappingType === 'VENDORS' ? 'btn-primary shadow-sm' : 'btn-link text-muted text-decoration-none'}`}
                    onClick={() => setMappingType("VENDORS")}
                  >Sales Accounts</button>
                  <button 
                    className={`btn rounded-pill px-4 fw-bold ${mappingType === 'SUPPLIERS' ? 'btn-danger shadow-sm' : 'btn-link text-muted text-decoration-none'}`}
                    onClick={() => setMappingType("SUPPLIERS")}
                  >Purchase Accounts</button>
                </div>
            </div>
            <div className="col-md-5">
                <label className="form-label fw-bold text-muted small text-uppercase mb-2">Account Registry</label>
                <div className="input-group input-group-lg shadow-sm">
                  <span className="input-group-text bg-white border-end-0 border-secondary-subtle">
                    <User size={20} className="text-primary" />
                  </span>
                  <select className="form-select border-start-0 border-secondary-subtle fw-bold" value={selectedEntityId} onChange={handleEntityChange}>
                    <option value="">-- Choose Account --</option>
                    {entities.map(en => <option key={en.id} value={en.id}>{en.name}</option>)}
                  </select>
                </div>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold text-muted small text-uppercase mb-2">Quick Find</label>
              <div className="input-group shadow-sm">
                <span className="input-group-text bg-white border-end-0"><Search size={16}/></span>
                <input 
                  type="text" 
                  className="form-control border-start-0" 
                  placeholder="Material name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card-body p-0">


          {!selectedEntityId ? (
            <div className="text-center py-5 bg-white">
              <div className="mb-3 text-muted opacity-50">
                <Search size={48} />
              </div>
              <h5 className="text-muted fw-bold">Select a user above to start mapping</h5>
              <p className="text-muted small">You will be able to include/exclude materials and set custom rates.</p>
            </div>
          ) : (
            <div className="p-4">
              {/* SECTION 1: ADDED / MAPPED MATERIALS */}
              <div className="mb-5">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="bg-success bg-opacity-10 p-2 rounded-circle">
                    <CheckCircle size={20} className="text-success" />
                  </div>
                  <h5 className="fw-bold m-0 text-dark">Proprietary List (Added Items)</h5>
                  <span className="badge bg-success rounded-pill px-3">{filteredMaterials.filter(m => m.isMapped).length} Items</span>
                </div>
                
                <div className="table-responsive border rounded-4 shadow-sm bg-white">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr className="small text-uppercase text-muted fw-bold">
                        <th className="ps-4 py-3" style={{width: '60px'}}></th>
                        <th>Material Category</th>
                        <th className="text-center">Market Price</th>
                        <th>Your Custom Rate (₹/kg)</th>
                        <th className="text-end pe-4">Sync Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMaterials.filter(m => m.isMapped).length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-4 text-muted fst-italic">No materials added to this person's list yet.</td></tr>
                      ) : (
                        filteredMaterials.filter(m => m.isMapped).map(m => (
                          <tr key={m.materialId} className="table-success bg-opacity-10">
                            <td className="ps-4">
                              <button 
                                className="btn btn-outline-danger rounded-circle p-1 d-flex align-items-center justify-content-center border-2 transition-all"
                                style={{width: '32px', height: '32px'}}
                                onClick={() => handleToggleMap(m)}
                                disabled={m.isProcessing}
                                title="Remove Material"
                              >
                                <Minus size={18} />
                              </button>
                            </td>
                            <td>
                              <div className="fw-bold text-capitalize fs-6 text-dark">{m.materialName}</div>
                              <small className="text-muted">ID: MAT-{m.materialId}</small>
                            </td>
                            <td className="text-center fw-bold text-muted">₹{m.defaultRate}</td>
                            <td>
                              <div className="input-group input-group-sm w-75 shadow-sm">
                                 <span className="input-group-text bg-light">₹</span>
                                 <input 
                                   type="number" 
                                   className={`form-control fw-bold ${m.isDirty ? 'border-primary bg-primary-subtle' : ''}`}
                                   value={m.currentInputRate}
                                   onChange={(e) => handleRateInputChange(m.materialId, e.target.value)}
                                   disabled={m.isProcessing}
                                 />
                              </div>
                            </td>
                            <td className="text-end pe-4">
                              {m.isDirty ? (
                                <button className="btn btn-sm btn-primary px-3 shadow-sm rounded-pill fw-bold" onClick={() => handleUpdateRate(m)}>
                                  <Save size={14} className="me-1" /> Save Price
                                </button>
                              ) : (
                                <span className="badge rounded-pill bg-success-subtle text-success px-3 py-2 fw-bold">
                                  <CheckCircle size={12} className="me-1" /> Active
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2: AVAILABLE TO ADD */}
              <div>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
                    <Plus size={20} className="text-primary" />
                  </div>
                  <h5 className="fw-bold m-0 text-dark">Global Catalog (Available to Add)</h5>
                  <span className="badge bg-primary rounded-pill px-3">{filteredMaterials.filter(m => !m.isMapped).length} Items</span>
                </div>

                <div className="table-responsive border rounded-4 shadow-sm bg-white">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr className="small text-uppercase text-muted fw-bold">
                        <th className="ps-4 py-3" style={{width: '60px'}}></th>
                        <th>Material Category</th>
                        <th className="text-center">Market Price</th>
                        <th>Set Opening Rate (₹/kg)</th>
                        <th className="text-end pe-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMaterials.filter(m => !m.isMapped).length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-4 text-muted fst-italic">No more materials available in global catalog.</td></tr>
                      ) : (
                        filteredMaterials.filter(m => !m.isMapped).map(m => (
                          <tr key={m.materialId} className="opacity-75">
                            <td className="ps-4">
                              <button 
                                className="btn btn-primary rounded-circle p-1 d-flex align-items-center justify-content-center border-2 shadow-sm transition-all"
                                style={{width: '32px', height: '32px'}}
                                onClick={() => handleToggleMap(m)}
                                disabled={m.isProcessing}
                                title="Add to Proprietary List"
                              >
                                <Plus size={18} />
                              </button>
                            </td>
                            <td>
                              <div className="fw-bold text-capitalize fs-6 text-dark">{m.materialName}</div>
                              <small className="text-muted">ID: MAT-{m.materialId}</small>
                            </td>
                            <td className="text-center fw-bold text-muted">₹{m.defaultRate}</td>
                            <td>
                              <div className="input-group input-group-sm w-75 shadow-sm">
                                 <span className="input-group-text bg-white">₹</span>
                                 <input 
                                   type="number" 
                                   className="form-control"
                                   value={m.currentInputRate}
                                   onChange={(e) => handleRateInputChange(m.materialId, e.target.value)}
                                   disabled={m.isProcessing}
                                 />
                              </div>
                            </td>
                            <td className="text-end pe-4">
                               <button className="btn btn-sm btn-outline-primary px-3 rounded-pill fw-bold" onClick={() => handleToggleMap(m)}>
                                 Invite Item
                               </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-primary bg-opacity-10 rounded-4 border border-primary border-opacity-25 shadow-sm">
        <div className="d-flex gap-3">
          <AlertCircle className="text-primary flex-shrink-0" />
          <div>
            <h6 className="fw-bold text-primary mb-1">Mapping Logic Help</h6>
            <p className="small text-dark mb-0 opacity-75">
              Click the <Plus size={14} className="fw-bold"/> button to include a material for this person. Once included, it will appear in their Purchase/Sales grid. 
              Use the <Minus size={14} className="fw-bold"/> button to exclude items and simplify your workflow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


